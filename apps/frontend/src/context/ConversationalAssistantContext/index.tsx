/**
 * Conversational Assistant Context
 *
 * Provides Assistant UI runtime for AI Hub conversational agents.
 * Integrates with Hono AI streaming endpoint /api/ai/chat
 * Includes chat session persistence
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
  type ThreadMessage,
} from '@assistant-ui/react';
import { useAuth } from 'src/lib/better-auth';
import api from '../../api/axios';
import { toast } from '../../hooks/use-toast';
import type { ChatSessionSummary } from '../../components/ai/ChatHistoryPanel';
import { SkkniSearchUI, SkkniSearchUI_2, SkkniSearchUI_3, SkkniSearchUI_4, SkkniSearchUI_5 } from '../../components/ai/SkkniSearchToolUI';
import { ShowPlanUI } from '../../components/ai/PlanToolUI';
import { buildThreadMessageFromStoredMessage } from '../../components/ai/ConversationalThread.helpers';

const debugLog = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

const debugWarn = (...args: unknown[]) => {
  if (import.meta.env.DEV) console.warn(...args);
};

// ============================================
// Types
// ============================================

interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date | string;
  toolCalls?: unknown[];
}

interface ChatSession {
  id: string;
  pesertaId: string;
  agentType: string;
  title: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ChatSessionWithMessages {
  session: ChatSession;
  messages: ChatMessage[];
}

const hasNonEmptyString = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;

const getDocumentStorageKey = (agentId: string): string => `ai-hub:active-document:${agentId}`;

const persistActiveDocumentId = (agentId: string, documentId: string | null) => {
  if (typeof window === 'undefined') return;

  const storageKey = getDocumentStorageKey(agentId);
  if (documentId && documentId.trim().length > 0) {
    window.localStorage.setItem(storageKey, documentId);
  }
};

const isDocumentCompatibleWithAgent = (agentId: string, masterJson: any): boolean => {
  if (!masterJson || typeof masterJson !== 'object') {
    return true;
  }

  if (agentId === 'master') {
    const hasMasterMarkers =
      !!masterJson.brainstorming_master ||
      !!masterJson.master_profile;
    const hasTrainerMarkers =
      !!masterJson.brainstorming?.completed ||
      hasNonEmptyString(masterJson.training?.name) ||
      hasNonEmptyString(masterJson.organizer?.name);

    return hasMasterMarkers || !hasTrainerMarkers;
  }

  if (agentId === 'trainer') {
    const hasMasterMarkers =
      !!masterJson.brainstorming_master ||
      !!masterJson.master_profile;
    const hasTrainerMarkers =
      !!masterJson.brainstorming ||
      hasNonEmptyString(masterJson.training?.name) ||
      hasNonEmptyString(masterJson.organizer?.name) ||
      hasNonEmptyString(masterJson.unit?.code);

    return hasTrainerMarkers || !hasMasterMarkers;
  }

  return true;
};

const normalizeToolName = (toolName: string): string => {
  const aliases: Record<string, string> = {
    _2: 'skkni_search',
    _3: 'skkni_search',
    _4: 'skkni_search',
    _5: 'skkni_search',
    _7: 'patch_master_json',
    patchMasterJson: 'patch_master_json',
    skkniSearchTool: 'skkni_search',
  };

  return aliases[toolName] || toolName;
};

const looksLikeHtmlDocumentPayload = (text: string): boolean => {
  const normalized = text.toLowerCase();
  return (
    (normalized.includes('<html') && normalized.includes('</html>')) ||
    normalized.includes('<!doctype html') ||
    normalized.includes('chrome-extension://') ||
    (normalized.includes('<script') && normalized.includes('</script>') && normalized.includes('<head'))
  );
};

const mapStreamErrorToUserMessage = (errorMsg: string): string => {
  if (errorMsg.includes('quota') || errorMsg.includes('limit')) {
    return 'Kuota AI habis atau terlalu banyak permintaan. Silakan coba lagi nanti.';
  }
  if (errorMsg.includes('context') || errorMsg.includes('token')) {
    return 'Percakapan terlalu panjang. Silakan mulai chat baru.';
  }
  return `AI Error: ${errorMsg}`;
};

interface ConversationalAssistantContextType {
  agentId: string;
  currentSessionId: string | null;
  sessions: ChatSessionSummary[];
  isLoadingSessions: boolean;
  isInitialized: boolean;

  // Document progress tracking
  documentId: string | null;
  documentProgress: Record<string, string> | null;

  // Actions
  createNewSession: () => Promise<void>;
  loadSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  fetchSessions: () => Promise<void>;
  persistMessage: (role: 'user' | 'assistant', content: string) => Promise<void>;
  fetchDocumentProgress: () => Promise<void>;
  onDataSaved: (callback: () => void) => () => void;

  // Document management
  switchDocument: (documentId: string) => Promise<void>;
  deleteDocument: (documentId: string) => Promise<void>;
  createDocument: (documentName: string) => Promise<void>;
}

// ============================================
// Context
// ============================================

const ConversationalAssistantContext = createContext<
  ConversationalAssistantContextType | undefined
>(undefined);

// ============================================
// Custom Model Adapter for Hono AI Streaming with Persistence
// ============================================

const createHonoAiStreamAdapter = (
  agentId: string,
  getToken: () => Promise<string | null>,
  onUserMessage: (content: string) => Promise<void>,
  onAssistantMessage: (content: string) => Promise<void>,
  getDocumentId: () => string | null,
  getThreadId: () => string | null,
  onToolCall: (toolName: string, args: any) => void
): ChatModelAdapter => {
  return {
    async *run({ messages, abortSignal }) {
      try {
        debugLog('[Hono AI Adapter] Starting chat with agentId:', agentId);

        // Convert Assistant UI messages to API format
        let apiMessages = messages
          .map((msg) => ({
            role: msg.role,
            content:
              msg.content
                ?.map((c) => (c.type === 'text' ? c.text : ''))
                .join(' ') || '',
          }))
          .filter((msg) => {
            const isValid = msg.content.trim().length > 0;
            if (!isValid) {
              debugWarn('[Hono AI Adapter] Dropping empty message from payload:', {
                role: msg.role,
              });
            }
            return isValid;
          });

        // REGENERATE FIX: If last message is from assistant, this is a regenerate request
        // Remove the last assistant message so AI generates a new response
        if (apiMessages.length > 0 && apiMessages[apiMessages.length - 1].role === 'assistant') {
          debugLog('[Hono AI Adapter] 🔄 Regenerate detected - removing last assistant message');
          apiMessages = apiMessages.slice(0, -1);
        }

        if (apiMessages.length === 0) {
          debugWarn('[Hono AI Adapter] ❌ No valid messages left after sanitization, raw messages:', messages);
          throw new Error('Pesan kosong. Silakan ketik pertanyaan Anda terlebih dahulu.');
        }

        // Get the last user message for persistence
        const lastUserMsg = apiMessages.filter((m) => m.role === 'user').pop();
        if (!lastUserMsg) {
          debugWarn('[Hono AI Adapter] No user message found in sanitized payload');
          throw new Error('Tidak ada pertanyaan pengguna yang dapat diproses. Silakan kirim ulang pesan Anda.');
        }

        await onUserMessage(lastUserMsg.content);

        // Get auth token
        const token = await getToken();

        // Use fetch for API call
        const baseURL = api.defaults.baseURL || '/api';
        const url = `${baseURL}/ai/chat`; // Streaming endpoint

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Get current document ID and thread ID (session ID)
        const documentId = getDocumentId();
        const threadId = getThreadId();

        const requestBody = {
          agentName: agentId,
          messages: apiMessages,
          ...(documentId && { documentId }),
          ...(threadId && { threadId }),
        };

        debugLog('[Hono AI Adapter] Sending request to /ai/chat:', {
          url,
          headers: {
            ...headers,
            ...(headers.Authorization ? { Authorization: '[REDACTED]' } : {}),
          },
          bodyKeys: Object.keys(requestBody),
          messagesCount: apiMessages.length,
          firstMessage: apiMessages[0],
          bodyJSON: JSON.stringify(requestBody),
        });

        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: abortSignal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Hono AI Adapter] Error response:', errorText);
          
          // Provide user-friendly error messages based on status code
          let errorMessage = 'Terjadi kesalahan saat menghubungi AI.';
          if (response.status === 429) {
            errorMessage = 'Terlalu banyak permintaan. Silakan tunggu sebentar dan coba lagi.';
          } else if (response.status === 500) {
            errorMessage = 'Server mengalami masalah. Silakan coba lagi dalam beberapa saat.';
          } else if (response.status === 503) {
            errorMessage = 'Layanan AI sedang sibuk. Silakan coba lagi.';
          }
          
          throw new Error(errorMessage);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        // Handle Streaming Logic (SSE-like)
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullResponseText = '';
        let droppedHtmlPayload = false;
        let streamErrorMessage: string | null = null;
        const allToolInvocations: any[] = [];
        let skkniFetchSucceeded = false;
        let skkniAutosaveSuccessSignaled = false;
        let skkniAutosaveFailureSignaled = false;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep partial line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith('data: ')) continue;

              const dataStr = trimmed.slice(6);
              if (dataStr === '[DONE]') continue; // Standard SSE finish

              try {
                const event = JSON.parse(dataStr);
                const type = event.type;
                const payload = event.payload || {};

                // Map Hono AI events to Assistant UI Protocol
                if (type === 'text-delta') {
                  const text = payload.text || payload.delta?.text || '';
                  fullResponseText += text; // Accumulate locally for persistence

                  if (looksLikeHtmlDocumentPayload(fullResponseText)) {
                    droppedHtmlPayload = true;
                    fullResponseText = '';
                  }

                  const normalizedResponse = fullResponseText.toLowerCase();
                  if (!skkniAutosaveSuccessSignaled && normalizedResponse.includes('autosave unit berhasil')) {
                    skkniAutosaveSuccessSignaled = true;
                    debugLog('[Hono AI Adapter] ✅ SKKNI autosave success signal detected, triggering refresh callbacks');
                    window.dispatchEvent(new CustomEvent('skkni-fetch-progress', {
                      detail: { type: 'complete' },
                    }));
                    onToolCall('skkniAutosaveSuccess', {
                      source: 'fetch_skkni_unit_details',
                    });
                  }

                  if (!skkniAutosaveFailureSignaled && normalizedResponse.includes('penyimpanan otomatis belum berhasil')) {
                    skkniAutosaveFailureSignaled = true;
                    debugLog('[Hono AI Adapter] ⚠️ SKKNI autosave failure signal detected');
                    window.dispatchEvent(new CustomEvent('skkni-fetch-progress', {
                      detail: { type: 'error', error: 'Autosave unit belum berhasil' },
                    }));
                  }

                  yield {
                    content: [{ type: 'text', text: fullResponseText }],
                  };
                } else if (type === 'tool-call') {
                  // Yield tool-call for makeAssistantToolUI to render
                  debugLog('[Hono AI Adapter] Tool call:', payload);
                  const toolCallId = payload.toolCallId || `tool-${Date.now()}`;
                  const rawToolName = payload.toolName || 'unknown';
                  const toolName = normalizeToolName(rawToolName);
                  const args = payload.args || {};
                  
                  // Store for later matching with result
                  (window as any).__pendingToolCalls = (window as any).__pendingToolCalls || {};
                  (window as any).__pendingToolCalls[toolCallId] = { toolName, args };
                  
                  // Dispatch progress event for fetch_skkni_unit_details
                  // Handle both camelCase (unitCode) and snake_case (unit_code) from AI
                  const unitCodeValue = args?.unitCode || args?.unit_code;
                  const isFetchSkkniDetails = 
                    toolName === 'fetch_skkni_unit_details' ||
                    toolName.includes('fetch_skkni') ||
                    (unitCodeValue && !args?.area);
                  const isSkkniSearch =
                    toolName === 'skkni_search' ||
                    toolName.includes('skkni_search') ||
                    !!args?.area;
                  if (isFetchSkkniDetails && unitCodeValue) {
                    debugLog('[Hono AI Adapter] 🔄 SKKNI fetch started for:', unitCodeValue);
                    window.dispatchEvent(new CustomEvent('skkni-fetch-progress', { 
                      detail: { type: 'start', unitCode: unitCodeValue } 
                    }));
                  }
                  if (isSkkniSearch && args?.area) {
                    window.dispatchEvent(new CustomEvent('skkni-search-progress', {
                      detail: { type: 'start', keyword: args.area }
                    }));
                  }
                  
                  // Yield tool call content for Assistant UI
                  yield {
                    content: [
                      ...(fullResponseText ? [{ type: 'text' as const, text: fullResponseText }] : []),
                      {
                        type: 'tool-call' as const,
                        toolCallId,
                        toolName,
                        args,
                        argsText: JSON.stringify(args),
                      }
                    ],
                  };
                } else if (type === 'tool-result') {
                  debugLog('[Hono AI Adapter] Tool result RAW payload:', JSON.stringify(payload, null, 2));
                  
                  const toolCallId = payload.toolCallId || `tool-${Date.now()}`;
                  // Handle data saving callbacks
                  const rawToolName = payload.toolName || payload.result?.toolName || 
                    (window as any).__pendingToolCalls?.[toolCallId]?.toolName || 'unknown';
                  const toolName = normalizeToolName(rawToolName);
                  const args = payload.args || payload.result?.args || 
                    (window as any).__pendingToolCalls?.[toolCallId]?.args || {};
                  
                  debugLog('[Hono AI Adapter] Extracted toolName:', toolName);
                  debugLog('[Hono AI Adapter] Extracted result keys:', payload.result ? Object.keys(payload.result) : 'null');

                  const isPatchTool = args?.section || toolName === 'patch_master_json';
                  if (isPatchTool) {
                    debugLog('[Hono AI Adapter] 🎯 Data save detected:', { toolName, section: args?.section });
                    onToolCall('patchMasterJson', args || {});
                  }

                  // Accumulate for final metadata
                  const toolInvocation = {
                    toolName: toolName,
                    result: payload.result,
                    args: args
                  };
                  debugLog('[Hono AI Adapter] Pushing toolInvocation:', JSON.stringify(toolInvocation, null, 2));
                  allToolInvocations.push(toolInvocation);
                  
                  // CRITICAL: Store to global for ConversationalThread to pick up
                  // useLocalRuntime doesn't preserve metadata, so we use this workaround
                  // Check for SKKNI search result by:
                  // 1. toolName === 'skkni_search' (ideal)
                  // 2. result._sourcetool === 'skkni_search' (tagged by backend)
                  // 3. result.documents exists with units (structure-based detection)
                  const isSkkniSearch = 
                    toolName === 'skkni_search' || 
                    payload.result?._sourcetool === 'skkni_search' ||
                    (payload.result?.documents && payload.result?.summary?.totalDocuments !== undefined);
                  
                  if (isSkkniSearch && payload.result?.documents) {
                    debugLog('[Hono AI Adapter] 🎯 Storing SKKNI result to global (detected via:', 
                      toolName === 'skkni_search' ? 'toolName' : 
                      payload.result?._sourcetool ? '_sourcetool' : 'structure', ')');
                    (window as any).__lastSkkniResult = {
                      timestamp: Date.now(),
                      result: payload.result
                    };
                    // Dispatch custom event for React to pick up
                    window.dispatchEvent(new CustomEvent('skkni-result', { detail: payload.result }));
                    window.dispatchEvent(new CustomEvent('skkni-search-progress', {
                      detail: { type: 'complete' }
                    }));
                  }
                  
                  // Dispatch progress event for fetch_skkni_unit_details completion
                  const isFetchSkkniDetails = 
                    toolName === 'fetch_skkni_unit_details' ||
                    toolName.includes('fetch_skkni') ||
                    payload.result?.data?.unitCode;
                  if (isFetchSkkniDetails) {
                    if (payload.result?.success) {
                      skkniFetchSucceeded = true;
                      debugLog('[Hono AI Adapter] ✅ SKKNI fetch completed');
                      window.dispatchEvent(new CustomEvent('skkni-fetch-progress', { 
                        detail: { type: 'step', step: 'save' } 
                      }));
                    } else {
                      debugLog('[Hono AI Adapter] ❌ SKKNI fetch failed:', payload.result?.message);
                      window.dispatchEvent(new CustomEvent('skkni-fetch-progress', { 
                        detail: { type: 'error', error: payload.result?.message } 
                      }));
                    }
                  }
                } else if (type === 'data-saved') {
                  // Handle data-saved events from deterministic autosave (training_details, etc.)
                  debugLog('[Hono AI Adapter] 🎯 Data saved event:', payload);
                  onToolCall('patchMasterJson', payload || {});
                } else if (type === 'error') {
                  console.error('[Hono AI Adapter] Stream error:', payload);
                  const errorMsg = String(payload.error || payload.message || 'Terjadi kesalahan pada stream');
                  streamErrorMessage = mapStreamErrorToUserMessage(errorMsg);
                  continue;
                } else if (type === 'finish') {
                  // Hono AI stream signals finish, but we should continue reading until stream is done
                  // to capture any trailing data (like embedded SKKNI data for persistence)
                  debugLog('[Hono AI Adapter] Received finish event, continuing to read trailing data...');
                }
              } catch (parseError) {
                debugWarn('[Hono AI Adapter] JSON parse error:', parseError, dataStr);
              }
            }
          }
        } finally {
          reader.releaseLock();
        }

        if (skkniFetchSucceeded && !skkniAutosaveSuccessSignaled && !skkniAutosaveFailureSignaled) {
          debugLog('[Hono AI Adapter] ℹ️ SKKNI autosave note not found, triggering fallback refresh callbacks');
          window.dispatchEvent(new CustomEvent('skkni-fetch-progress', {
            detail: { type: 'complete' },
          }));
          onToolCall('skkniAutosaveSuccessFallback', {
            source: 'fetch_skkni_unit_details',
          });
        }

        const visibleResponseText = fullResponseText
          .replace(/<!--SKKNI_DATA:.*?:SKKNI_DATA-->/gs, '')
          .trim();

        // Check if we received any response text
        if (!visibleResponseText) {
          if (droppedHtmlPayload) {
            fullResponseText = 'Terjadi gangguan respons. Silakan kirim ulang pesan terakhir.';
          } else
          if (fullResponseText.includes('<!--SKKNI_DATA:')) {
            const fallbackNotice =
              'Saya sudah memproses data, tapi respons teks belum tersedia. Silakan lanjutkan pertanyaan atau klik Coba Lagi.';
            fullResponseText = `${fallbackNotice}\n\n${fullResponseText}`;
          } else {
            console.error('[Hono AI Adapter] ❌ No response text received - AI might have encountered an error');
            throw new Error(streamErrorMessage || 'AI gagal menghasilkan respons. Silakan coba lagi.');
          }
        }

        const finalVisibleResponseText = fullResponseText
          .replace(/<!--SKKNI_DATA:.*?:SKKNI_DATA-->/gs, '')
          .trim();

        if (!finalVisibleResponseText) {
          console.error('[Hono AI Adapter] ❌ No response text received - AI might have encountered an error');
          throw new Error(streamErrorMessage || 'AI gagal menghasilkan respons. Silakan coba lagi.');
        }

        // Final persistence
        if (fullResponseText) {
          // Debug: Check if embedded data is included
          const hasEmbeddedSkkni = fullResponseText.includes('<!--SKKNI_DATA:');
          debugLog('[Hono AI Adapter] 💾 Persisting message, length:', fullResponseText.length, 'hasEmbeddedSkkni:', hasEmbeddedSkkni);
          if (hasEmbeddedSkkni) {
            debugLog('[Hono AI Adapter] ✅ SKKNI data embedded in message for reload recovery');
          }
          await onAssistantMessage(fullResponseText);
        }

        debugLog('[Hono AI Adapter] FINAL allToolInvocations:', JSON.stringify(allToolInvocations, null, 2));
        debugLog('[Hono AI Adapter] FINAL allToolInvocations count:', allToolInvocations.length);

        // Yield final content with metadata attached (only if we have tool invocations)
        // This replaces the last streaming yield rather than duplicating it
        if (allToolInvocations.length > 0) {
          yield {
            content: [{ type: 'text' as const, text: finalVisibleResponseText }],
            metadata: {
              custom: {
                toolInvocations: allToolInvocations,
                toolCalls: []
              }
            }
          } as any;
        }
        return;

      } catch (error) {
        console.error('[Hono AI Adapter] Fatal error:', error);
        throw error;
      }
    },
  };
};

// ============================================
// Inner Provider with Runtime (re-mounts on key change)
// ============================================

interface RuntimeProviderProps {
  children: React.ReactNode;
  modelAdapter: ChatModelAdapter;
  initialMessages: ThreadMessage[];
  runtimeKey: string;
}

const RuntimeProviderInner: React.FC<RuntimeProviderProps> = ({
  children,
  modelAdapter,
  initialMessages,
}) => {
  // This component re-mounts when runtimeKey changes, resetting the runtime
  const runtime = useLocalRuntime(modelAdapter, { initialMessages });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <SkkniSearchUI />
      <SkkniSearchUI_2 />
      <SkkniSearchUI_3 />
      <SkkniSearchUI_4 />
      <SkkniSearchUI_5 />
      <ShowPlanUI />
      {children}
    </AssistantRuntimeProvider>
  );
};

const RuntimeProvider: React.FC<RuntimeProviderProps> = (props) => {
  // No need for mount delay - parent ConversationalAssistantProvider
  // already waits for isInitialized before rendering this component
  // React 19 hydration is handled by router-level lazy loading
  return <RuntimeProviderInner {...props} />;
};

// ============================================
// Provider Component
// ============================================

interface ConversationalAssistantProviderProps {
  children: React.ReactNode;
  agentId: string;
}

export const ConversationalAssistantProvider: React.FC<
  ConversationalAssistantProviderProps
> = ({ children, agentId }) => {
  const { getToken } = useAuth();

  // Stabilize getToken to prevent adapter recreation
  const getTokenRef = useRef(getToken);
  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  const stableGetToken = useMemo(
    () => () => getTokenRef.current(),
    []
  );

  // Session state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSessionSummary[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialMessages, setInitialMessages] = useState<ThreadMessage[]>([]);

  // Document progress tracking state
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [documentProgress, setDocumentProgress] = useState<Record<string, string> | null>(null);

  // Key to force runtime re-mount when session changes
  const [runtimeKey, setRuntimeKey] = useState<string>(() => `${agentId}-${Date.now()}`);

  // Ref to track if we've persisted the current message
  const lastPersistedUserMsg = useRef<string | null>(null);
  const lastPersistedAssistantMsg = useRef<string | null>(null);

  // Refs for event-based updates
  const dataSaveCallbacks = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    if (!agentId || typeof window === 'undefined') return;

    if (documentId) {
      persistActiveDocumentId(agentId, documentId);
    }
  }, [agentId, documentId]);

  // ============================================
  // API Functions
  // ============================================

  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const { data } = await api.get(`/ai/chat/sessions?agentType=${agentId}`);
      setSessions(data);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat riwayat',
        description: 'Tidak dapat memuat riwayat chat. Silakan coba lagi.',
      });
    } finally {
      setIsLoadingSessions(false);
    }
  }, [agentId]);

  const fetchDocumentProgress = useCallback(async () => {
    if (!documentId) {
      debugLog('[fetchDocumentProgress] No documentId, skipping...');
      return;
    }

    try {
      debugLog('[fetchDocumentProgress] Fetching progress for document:', documentId);
      const { data } = await api.get(`/ai/document/progress/${documentId}`);
      debugLog('[fetchDocumentProgress] Received progress data:', data.progress);
      setDocumentProgress(data.progress);
    } catch (error) {
      console.error('[fetchDocumentProgress] Failed to fetch document progress:', error);
    }
  }, [documentId]);

  const createNewSession = useCallback(async () => {
    try {
      if (!agentId) {
        throw new Error('agentId is not set');
      }
      const { data } = await api.post('/ai/chat/sessions', { agentType: agentId });
      setCurrentSessionId(data.id);
      setInitialMessages([]);
      // Force runtime re-mount with new key
      setRuntimeKey(`${agentId}-${data.id}-${Date.now()}`);
      // Reset persistence refs
      lastPersistedUserMsg.current = null;
      lastPersistedAssistantMsg.current = null;
      // Refresh sessions list
      await fetchSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal membuat chat baru',
        description: 'Tidak dapat membuat sesi chat baru. Silakan coba lagi.',
      });
    }
  }, [agentId]);

  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const { data } = await api.get(`/ai/chat/sessions/${sessionId}`);
      const sessionData = data as ChatSessionWithMessages;

      // Use the sessionId from response to handle any backend transformations
      const actualSessionId = sessionData.session.id;
      setCurrentSessionId(actualSessionId);

      // Convert messages to ThreadMessage format
      const threadMessages: ThreadMessage[] = sessionData.messages.map((msg) =>
        buildThreadMessageFromStoredMessage(msg) as ThreadMessage,
      );

      setInitialMessages(threadMessages);

      // Force runtime re-mount with new key
      setRuntimeKey(`${agentId}-${actualSessionId}-${Date.now()}`);

      // Reset persistence refs
      lastPersistedUserMsg.current = null;
      lastPersistedAssistantMsg.current = null;
    } catch (error) {
      console.error('Failed to load session:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal memuat chat',
        description: 'Tidak dapat memuat percakapan. Silakan coba lagi.',
      });
    }
  }, [agentId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      await api.delete(`/ai/chat/sessions/${sessionId}`);

      // If deleted session was current, create new one
      if (sessionId === currentSessionId) {
        await createNewSession();
      }

      // Refresh sessions list
      await fetchSessions();

      toast({
        title: 'Chat dihapus',
        description: 'Percakapan berhasil dihapus.',
      });
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal menghapus chat',
        description: 'Tidak dapat menghapus percakapan. Silakan coba lagi.',
      });
    }
  }, [currentSessionId, createNewSession, fetchSessions]);

  const persistMessage = useCallback(
    async (role: 'user' | 'assistant', content: string) => {
      const normalizedContent = content.trim();
      if (!currentSessionId || !normalizedContent) return;

      // Prevent duplicate persistence
      if (role === 'user') {
        if (lastPersistedUserMsg.current === normalizedContent) return;
        lastPersistedUserMsg.current = normalizedContent;
      } else {
        if (lastPersistedAssistantMsg.current === normalizedContent) return;
        lastPersistedAssistantMsg.current = normalizedContent;
      }

      // Retry logic for persistence
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          await api.post(`/ai/chat/sessions/${currentSessionId}/messages`, {
            role,
            content: normalizedContent,
          });
          return; // Success, exit
        } catch (error) {
          retryCount++;
          console.error(`Failed to persist message (attempt ${retryCount}):`, error);

          if (retryCount >= maxRetries) {
            toast({
              variant: 'destructive',
              title: 'Gagal menyimpan pesan',
              description: 'Pesan tidak dapat disimpan. Percakapan mungkin tidak tersimpan.',
            });
          } else {
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }
    },
    [currentSessionId]
  );

  // ============================================
  // Initialize on mount
  // ============================================

  useEffect(() => {
    const initialize = async () => {
      const initStart = performance.now();
      
      // Guard: don't initialize without agentId
      if (!agentId) {
        debugWarn('[ConversationalAssistantProvider] Skipping initialization - agentId not provided');
        setIsInitialized(true);
        return;
      }
      
      try {
        let resolvedDocumentId: string | null = null;
        const persistedDocumentId =
          typeof window !== 'undefined'
            ? window.localStorage.getItem(getDocumentStorageKey(agentId))
            : null;

        const [sessionsResult] = await Promise.allSettled([
          api.get(`/ai/chat/sessions?agentType=${agentId}`),
        ]);

        if (sessionsResult.status === 'fulfilled') {
          setSessions(sessionsResult.value.data);
        } else {
          console.error('Failed to initialize sessions:', sessionsResult.reason);
        }

        let compatibleDocumentId: string | null = null;
        let compatibleProgress: Record<string, string> | null = null;

        if (typeof persistedDocumentId === 'string' && persistedDocumentId.trim().length > 0) {
          try {
            const { data: progressData } = await api.get(`/ai/document/progress/${persistedDocumentId}`);
            const isCompatible = isDocumentCompatibleWithAgent(agentId, progressData?.masterJson);

            if (isCompatible) {
              compatibleDocumentId = persistedDocumentId;
              compatibleProgress = progressData?.progress || {};
            }
          } catch (progressError) {
            debugWarn(
              '[ConversationalAssistantProvider] Failed to restore persisted document:',
              persistedDocumentId,
              progressError,
            );
          }
        }

        if (!compatibleDocumentId) {
          const { data: newDoc } = await api.post('/ai/document/create', {
            name: `${agentId === 'master' ? 'Master' : 'Dokumen'} ${new Date().toLocaleDateString('id-ID')}`,
          });
          compatibleDocumentId = newDoc.documentId;
          compatibleProgress = newDoc.progress || {};
        }

        setDocumentId(compatibleDocumentId);
        setDocumentProgress(compatibleProgress);
        persistActiveDocumentId(agentId, compatibleDocumentId);
        resolvedDocumentId = compatibleDocumentId;

        let resolvedSessionId: string | null = null;

        if (resolvedDocumentId) {
          try {
            const { data: transcriptData } = await api.get(
              `/ai/document/${resolvedDocumentId}/chat-transcript`,
              { params: { limit: 200, format: 'json' } },
            );

            const turns = Array.isArray((transcriptData as any)?.turns)
              ? (transcriptData as any).turns
              : [];
            const filteredTurns = turns.filter((turn: any) => {
              const turnAgent = typeof turn?.agentName === 'string' ? turn.agentName.trim() : '';
              return !turnAgent || turnAgent === agentId;
            });

            if (filteredTurns.length > 0) {
              const transcriptMessages: ThreadMessage[] = [];

              filteredTurns.forEach((turn: any, index: number) => {
                const createdAt = turn?.createdAt ? new Date(turn.createdAt) : new Date();
                const userMessage = typeof turn?.userMessage === 'string' ? turn.userMessage.trim() : '';
                const assistantMessage = typeof turn?.assistantMessage === 'string' ? turn.assistantMessage.trim() : '';

                if (userMessage) {
                  transcriptMessages.push(
                    buildThreadMessageFromStoredMessage({
                      id: `${turn?.id || index}-user`,
                      role: 'user',
                      content: userMessage,
                      createdAt,
                    }) as ThreadMessage,
                  );
                }

                if (assistantMessage) {
                  transcriptMessages.push(
                    buildThreadMessageFromStoredMessage({
                      id: `${turn?.id || index}-assistant`,
                      role: 'assistant',
                      content: assistantMessage,
                      createdAt,
                      toolCalls: Array.isArray(turn?.toolCalls) ? turn.toolCalls : [],
                    }) as ThreadMessage,
                  );
                }
              });

              if (transcriptMessages.length > 0) {
                const latestThreadIdFromTranscript = [...filteredTurns]
                  .reverse()
                  .map((turn: any) => (typeof turn?.threadId === 'string' ? turn.threadId.trim() : ''))
                  .find((threadId: string) => threadId.length > 0) || null;

                if (latestThreadIdFromTranscript) {
                  resolvedSessionId = latestThreadIdFromTranscript;
                  setCurrentSessionId(latestThreadIdFromTranscript);
                }

                setInitialMessages(transcriptMessages);

                if (resolvedSessionId) {
                  setRuntimeKey(`${agentId}-${resolvedSessionId}-doc-${resolvedDocumentId}-init`);
                }
              }
            }
          } catch (transcriptError) {
            debugWarn('[ConversationalAssistantProvider] Failed to hydrate transcript:', transcriptError);
          }
        }

        if (!resolvedSessionId) {
          const { data: newSession } = await api.post('/ai/chat/sessions', {
            agentType: agentId,
          });
          resolvedSessionId = newSession.id;
          setCurrentSessionId(newSession.id);
          setInitialMessages([]);
          setRuntimeKey(`${agentId}-${newSession.id}-doc-${resolvedDocumentId}-new`);
        }
      } catch (error) {
        console.error('Failed to initialize:', error);
        // Create new session on error
        try {
          const { data: newSession } = await api.post('/ai/chat/sessions', {
            agentType: agentId,
          });
          setCurrentSessionId(newSession.id);
          setRuntimeKey(`${agentId}-${newSession.id}-fallback`);
        } catch (e) {
          console.error('Failed to create fallback session:', e);
        }
      } finally {
        const initDurationMs = Math.round(performance.now() - initStart);
        debugLog(`[ConversationalAssistantProvider] Initialize completed in ${initDurationMs}ms`);
        setIsInitialized(true);
      }
    };

    initialize();
  }, [agentId]);

  // ============================================
  // Event-based update handlers
  // ============================================

  const handleToolCall = useCallback((toolName: string, args: any) => {
    debugLog('[handleToolCall] Tool called:', toolName, args);

    // Trigger all registered callbacks
    dataSaveCallbacks.current.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('[handleToolCall] Error in callback:', error);
      }
    });
  }, []);

  const onDataSaved = useCallback((callback: () => void) => {
    debugLog('[onDataSaved] Registering callback');
    dataSaveCallbacks.current.add(callback);

    // Return cleanup function
    return () => {
      debugLog('[onDataSaved] Unregistering callback');
      dataSaveCallbacks.current.delete(callback);
    };
  }, []);

  // ============================================
  // Document Management Functions
  // ============================================

  const switchDocument = useCallback(async (newDocumentId: string) => {
    debugLog('[switchDocument] Switching to document:', newDocumentId);
    try {
      // Fetch the document to verify it exists
      const { data } = await api.get(`/ai/document/progress/${newDocumentId}`);
      if (!isDocumentCompatibleWithAgent(agentId, data?.masterJson)) {
        throw new Error('Dokumen tidak cocok untuk agent ini');
      }

      // Update document state
      setDocumentId(newDocumentId);
      setDocumentProgress(data.progress);
      persistActiveDocumentId(agentId, newDocumentId);

      let hydratedFromTranscript = false;

      try {
        const { data: transcriptData } = await api.get(
          `/ai/document/${newDocumentId}/chat-transcript`,
          { params: { limit: 200, format: 'json' } },
        );
        const turns = Array.isArray((transcriptData as any)?.turns)
          ? (transcriptData as any).turns
          : [];

        if (turns.length > 0) {
          const transcriptMessages: ThreadMessage[] = [];
          turns.forEach((turn: any, index: number) => {
            const createdAt = turn?.createdAt ? new Date(turn.createdAt) : new Date();
            const userMessage = typeof turn?.userMessage === 'string' ? turn.userMessage.trim() : '';
            const assistantMessage = typeof turn?.assistantMessage === 'string' ? turn.assistantMessage.trim() : '';

            if (userMessage) {
              transcriptMessages.push(
                buildThreadMessageFromStoredMessage({
                  id: `${turn?.id || index}-user`,
                  role: 'user',
                  content: userMessage,
                  createdAt,
                }) as ThreadMessage,
              );
            }

            if (assistantMessage) {
              transcriptMessages.push(
                buildThreadMessageFromStoredMessage({
                  id: `${turn?.id || index}-assistant`,
                  role: 'assistant',
                  content: assistantMessage,
                  createdAt,
                  toolCalls: Array.isArray(turn?.toolCalls) ? turn.toolCalls : [],
                }) as ThreadMessage,
              );
            }
          });

          const latestThreadIdFromTranscript = [...turns]
            .reverse()
            .map((turn: any) => (typeof turn?.threadId === 'string' ? turn.threadId.trim() : ''))
            .find((threadId: string) => threadId.length > 0) || null;

          if (transcriptMessages.length > 0 && latestThreadIdFromTranscript) {
            setCurrentSessionId(latestThreadIdFromTranscript);
            setInitialMessages(transcriptMessages);
            setRuntimeKey(`${agentId}-doc-${newDocumentId}-${latestThreadIdFromTranscript}-${Date.now()}`);
            hydratedFromTranscript = true;
            debugLog('[switchDocument] Hydrated transcript for document:', newDocumentId);
          }
        }
      } catch (transcriptError) {
        debugWarn('[switchDocument] Transcript hydration failed:', transcriptError);
      }

      if (!hydratedFromTranscript) {
        // Create new chat session if no transcript exists for this document
        const { data: newSession } = await api.post('/ai/chat/sessions', { agentType: agentId });
        setCurrentSessionId(newSession.id);
        debugLog('[switchDocument] Created new chat session:', newSession.id);
        setRuntimeKey(`${agentId}-doc-${newDocumentId}-${newSession.id}-${Date.now()}`);
        setInitialMessages([]);
      }

      // Reset persistence refs
      lastPersistedUserMsg.current = null;
      lastPersistedAssistantMsg.current = null;

      // Refresh sessions list
      await fetchSessions();

      debugLog('[switchDocument] Successfully switched to:', newDocumentId);
    } catch (error) {
      console.error('[switchDocument] Failed:', error);
      throw error;
    }
  }, [agentId, fetchSessions]);

  const deleteDocument = useCallback(async (docId: string) => {
    debugLog('[deleteDocument] Deleting document:', docId);
    try {
      await api.post(`/ai/document/${docId}/delete`);

      // If we deleted the current document, create a fresh replacement document
      if (docId === documentId) {
        const { data: newDoc } = await api.post('/ai/document/create', {
          name: `${agentId === 'master' ? 'Master' : 'Pelatihan'} ${new Date().toLocaleDateString('id-ID')}`,
        });
        setDocumentId(newDoc.documentId);
        setDocumentProgress(newDoc.progress || {});
        persistActiveDocumentId(agentId, newDoc.documentId);

        // Reset runtime
        setRuntimeKey(`${agentId}-doc-${newDoc.documentId}-${Date.now()}`);
        setInitialMessages([]);
      }

      debugLog('[deleteDocument] Successfully deleted:', docId);
    } catch (error) {
      console.error('[deleteDocument] Failed:', error);
      throw error;
    }
  }, [agentId, documentId]);

  const createDocument = useCallback(async (documentName: string) => {
    debugLog('[createDocument] Creating document:', documentName);
      try {
        const { data: newDoc } = await api.post('/ai/document/create', { name: documentName });

      // Switch to the new document
      setDocumentId(newDoc.documentId);
      setDocumentProgress(newDoc.progress || {});
      persistActiveDocumentId(agentId, newDoc.documentId);

      // Create new chat session for the new document
      const { data: newSession } = await api.post('/ai/chat/sessions', { agentType: agentId });
      setCurrentSessionId(newSession.id);
      debugLog('[createDocument] Created new chat session:', newSession.id);

      // Reset runtime for fresh start
      setRuntimeKey(`${agentId}-doc-${newDoc.documentId}-${newSession.id}-${Date.now()}`);
      setInitialMessages([]);

      // Reset persistence refs
      lastPersistedUserMsg.current = null;
      lastPersistedAssistantMsg.current = null;

      // Refresh sessions list
      await fetchSessions();

      debugLog('[createDocument] Successfully created:', newDoc.documentId);
    } catch (error) {
      console.error('[createDocument] Failed:', error);
      throw error;
    }
  }, [agentId, fetchSessions]);

  // ============================================
  // Model Adapter with persistence callbacks
  // ============================================

  // Stabilize callbacks to prevent adapter recreation
  const persistMessageRef = useRef(persistMessage);
  const handleToolCallRef = useRef(handleToolCall);
  const documentIdRef = useRef(documentId);
  const sessionIdRef = useRef(currentSessionId);

  useEffect(() => {
    persistMessageRef.current = persistMessage;
    handleToolCallRef.current = handleToolCall;
    documentIdRef.current = documentId;
    sessionIdRef.current = currentSessionId;
  }, [persistMessage, handleToolCall, documentId, currentSessionId]);

  const modelAdapter = useMemo(
    () =>
      createHonoAiStreamAdapter(
        agentId,
        stableGetToken,
        (content) => persistMessageRef.current('user', content),
        (content) => persistMessageRef.current('assistant', content),
        () => documentIdRef.current, // Use ref instead of direct value
        () => sessionIdRef.current, // Thread ID = Session ID
        (...args) => handleToolCallRef.current(...args)
      ),
    [agentId] // Only agentId - everything else via refs
  );

  // ============================================
  // Context value
  // ============================================

  const contextValue = useMemo(
    () => ({
      agentId,
      currentSessionId,
      sessions,
      isLoadingSessions,
      isInitialized,
      documentId,
      documentProgress,
      createNewSession,
      loadSession,
      deleteSession,
      fetchSessions,
      persistMessage,
      fetchDocumentProgress,
      onDataSaved,
      switchDocument,
      deleteDocument,
      createDocument,
    }),
    [
      agentId,
      currentSessionId,
      sessions,
      isLoadingSessions,
      isInitialized,
      documentId,
      documentProgress,
      createNewSession,
      loadSession,
      deleteSession,
      fetchSessions,
      persistMessage,
      fetchDocumentProgress,
      onDataSaved,
      switchDocument,
      deleteDocument,
      createDocument,
    ]
  );

  // Don't render runtime until initialized
  if (!isInitialized) {
    return (
      <ConversationalAssistantContext.Provider value={contextValue}>
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <span className="text-sm text-gray-500">Memuat percakapan...</span>
          </div>
        </div>
      </ConversationalAssistantContext.Provider>
    );
  }

  return (
    <ConversationalAssistantContext.Provider value={contextValue}>
      <RuntimeProvider
        key={runtimeKey} // Key forces RuntimeProvider to remount when changed
        modelAdapter={modelAdapter}
        initialMessages={initialMessages}
        runtimeKey={runtimeKey}
      >
        {children}
      </RuntimeProvider>
    </ConversationalAssistantContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export function useConversationalAssistant(): ConversationalAssistantContextType {
  const context = useContext(ConversationalAssistantContext);
  if (!context) {
    throw new Error(
      'useConversationalAssistant must be used within ConversationalAssistantProvider'
    );
  }
  return context;
}

export default ConversationalAssistantProvider;
