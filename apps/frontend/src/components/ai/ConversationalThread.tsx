/**
 * Conversational Thread Component
 * Chat UI using Assistant UI primitives with Grok-style pattern
 */

import { Icon } from "@iconify/react";
import {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
  useMessage,
  useComposer,
  useThread,
} from "@assistant-ui/react";
import ReactMarkdown from "react-markdown";
import type { ComponentType, PropsWithChildren } from "react";
import remarkGfm from "remark-gfm";
import { DataTable } from "../tool-ui/data-table";
import { SkkniInlineProgress, SkkniSearchInlineProgress } from "./SkkniProgressUI";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  extractEmbeddedSkkniData,
  formatAssistantTextForMarkdown,
  isActiveAssistantMessageStatus,
  shouldHandleLiveToolUiForMessage,
} from "./ConversationalThread.helpers";

interface ConversationalThreadProps {
  agentColor?: string;
  onSendMessage?: (message: string) => void;
  onDataSaved?: () => void; // Callback when AI saves data to trigger progress refresh
}

// Typing Animation Component
const TypingText: React.FC<{ text: string; delay?: number; startDelay?: number }> = ({ text, delay = 0, startDelay = 0 }) => {
  const [displayedText, setDisplayedText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [started, setStarted] = useState(startDelay === 0);

  useEffect(() => {
    if (startDelay > 0) {
      const startTimeout = setTimeout(() => {
        setStarted(true);
      }, startDelay);
      return () => clearTimeout(startTimeout);
    }
  }, [startDelay]);

  useEffect(() => {
    if (started && currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, delay || 30);
      return () => clearTimeout(timeout);
    }
  }, [started, currentIndex, text, delay]);

  return <span>{displayedText}</span>;
};

// Spinner Icon Component (Lucide Loader)
const SpinnerIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("animate-spin", className)}
    aria-hidden="true"
  >
    <path d="M12 2v4" />
    <path d="m16.2 7.8 2.9-2.9" />
    <path d="M18 12h4" />
    <path d="m16.2 16.2 2.9 2.9" />
    <path d="M12 18v4" />
    <path d="m4.9 19.1 2.9-2.9" />
    <path d="M2 12h4" />
    <path d="m4.9 4.9 2.9 2.9" />
  </svg>
);

// Thinking Animation Component with shimmer effect (using tw-shimmer)
const ThinkingDots: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <SpinnerIcon className="h-4 w-4 text-gray-400" />
      <span className="text-sm text-gray-500 shimmer">
        Sedang berpikir...
      </span>
    </div>
  );
};

// Typing Indicator Component
const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <SpinnerIcon className="h-4 w-4 text-primary" />
      <span className="text-sm text-gray-600 italic">Mengetik...</span>
    </div>
  );
};

const AutosaveStatusCard: React.FC<{
  status: 'success' | 'error';
  message: string;
}> = ({ status, message }) => {
  const isError = status === 'error';

  return (
    <div
      className={cn(
        'mb-3 rounded-lg border p-3',
        isError
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-emerald-300 bg-emerald-50 text-emerald-800'
      )}
    >
      <div className="flex items-start gap-2">
        <Icon
          icon={isError ? 'solar:danger-triangle-bold' : 'solar:check-circle-bold'}
          className="mt-0.5 h-4 w-4 flex-shrink-0"
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold">
            {isError ? 'Status Autosave: Gagal' : 'Status Autosave: Berhasil'}
          </p>
          <p className="text-xs leading-relaxed opacity-90">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Helper: Convert JSON object to human-readable key-value text
// Maps technical field names to Indonesian labels
const FIELD_LABEL_MAP: Record<string, string> = {
  assessment_rules: 'Aturan Penilaian',
  pretest_scoring: 'Penilaian Pre-Test',
  observation: 'Observasi/Pengamatan',
  demonstration: 'Demonstrasi/Praktik',
  oral: 'Tanya Jawab Lisan',
  duration_hours: 'Durasi',
  delivery_method: 'Metode Penyampaian',
  program_type: 'Jenis Program',
  name: 'Nama',
  field: 'Bidang',
  objective: 'Tujuan',
  title: 'Judul',
  duration: 'Durasi',
  total_jp: 'Jam Pelajaran',
  description: 'Deskripsi',
  document_id: '',     // Hide technical fields
  user_id: '',
  section: '',         // Hide technical fields
  value: '',           // Flatten into parent
  toolName: '',
  toolCallId: '',
  _sourcetool: '',
  args: '',
  argsText: '',
  id: '',
};

const SECTION_LABEL_MAP: Record<string, string> = {
  brainstorming: 'data awal',
  unit: 'pilihan materi',
  training: 'rancangan pelatihan',
  lesson_plan: 'rencana sesi',
  assessment: 'rencana penilaian',
};

type AutosaveStatus = {
  status: 'success' | 'error';
  message: string;
};

function extractAutosaveStatus(text: string): {
  cleanedText: string;
  autosaveStatus: AutosaveStatus | null;
} {
  const autosaveLinePattern =
    /(?:^|\n)[^\n]*Catatan sistem:\s*(?:autosave unit berhasil|penyimpanan otomatis belum berhasil)[^\n]*/gi;

  const matches = Array.from(text.matchAll(autosaveLinePattern));
  let autosaveStatus: AutosaveStatus | null = null;

  if (matches.length > 0) {
    const latestLine = matches[matches.length - 1][0].replace(/^\n/, '').trim();
    autosaveStatus = {
      status: latestLine.toLowerCase().includes('belum berhasil') ? 'error' : 'success',
      message: latestLine,
    };
  }

  const cleanedText = text
    .replace(autosaveLinePattern, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return { cleanedText, autosaveStatus };
}

function looksLikeInjectedHtmlDocument(text: string): boolean {
  const normalized = text.toLowerCase();
  return (
    (normalized.includes('<html') && normalized.includes('</html>')) ||
    normalized.includes('<!doctype html') ||
    normalized.includes('chrome-extension://') ||
    (normalized.includes('<script') && normalized.includes('</script>') && normalized.includes('<head'))
  );
}

function getToolBadgeLabel(toolCall: any): string {
  const toolName = toolCall?.toolName;
  const section = toolCall?.args?.section;
  const unitCode = toolCall?.args?.unitCode || toolCall?.args?.unit_code;

  if (toolName === 'skkni_search') {
    return 'Mencari referensi materi';
  }
  if (toolName === 'fetch_skkni_unit_details') {
    return unitCode
      ? `Menyiapkan detail materi ${unitCode}`
      : 'Menyiapkan detail materi';
  }
  if (toolName === 'fetch_competency_map') {
    return unitCode
      ? `Memetakan kompetensi ${unitCode}`
      : 'Memetakan kompetensi unit';
  }
  if (toolName === 'patch_master_json') {
    const sectionLabel = SECTION_LABEL_MAP[section] || 'dokumen';
    return `Menyimpan ${sectionLabel}`;
  }
  if (toolName === 'get_section') {
    const sectionLabel = SECTION_LABEL_MAP[section] || 'bagian dokumen';
    return `Membaca ${sectionLabel}`;
  }
  if (toolName === 'show_plan') {
    return 'Menampilkan rencana kerja';
  }
  return 'Menyiapkan langkah berikutnya';
}

function formatJsonAsHumanText(obj: Record<string, any>, indent = 0): string {
  const lines: string[] = [];
  for (const [key, val] of Object.entries(obj)) {
    const label = FIELD_LABEL_MAP[key];
    // Skip hidden technical fields
    if (label === '') continue;
    // If "value" key, flatten its contents
    if (key === 'value' && typeof val === 'object' && val !== null) {
      lines.push(formatJsonAsHumanText(val, indent));
      continue;
    }
    const displayLabel = label || key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      lines.push(`${'  '.repeat(indent)}**${displayLabel}:**`);
      lines.push(formatJsonAsHumanText(val, indent + 1));
    } else if (Array.isArray(val)) {
      lines.push(`${'  '.repeat(indent)}**${displayLabel}:** ${val.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(', ')}`);
    } else {
      lines.push(`${'  '.repeat(indent)}- **${displayLabel}:** ${val}`);
    }
  }
  return lines.filter(Boolean).join('\n');
}

function cleanAssistantText(rawText: string): {
  textContent: string;
  autosaveStatus: AutosaveStatus | null;
} {
  let cleaned = rawText
    .replace(/\[USER_CONTEXT:[^\]]*\]/g, '')
    .replace(/<!--SKKNI_DATA:.*?:SKKNI_DATA-->/gs, '')
    .trim();

  // JSON SANITIZER: Convert leaked JSON blocks into human-readable key-value lists.
  cleaned = cleaned.replace(/```(?:json)?\s*\n?\{[\s\S]*?\}\s*\n?```/g, (match) => {
    try {
      const jsonStr = match.replace(/```(?:json)?\s*\n?/g, '').replace(/\s*```$/g, '').trim();
      const obj = JSON.parse(jsonStr);
      return formatJsonAsHumanText(obj);
    } catch { return ''; }
  });

  cleaned = cleaned.replace(/\{[\s]*"[^"]+"\s*:\s*(?:"[^"]*"|[0-9]+|true|false|null|\{[\s\S]*?\}|\[[\s\S]*?\])[\s\S]*?\}/g, (match) => {
    const technicalKeys = ['assessment_rules', 'pretest_scoring', 'duration_hours', 'delivery_method', 'program_type', 'document_id', 'user_id', 'section', 'value', 'unitCode', 'toolName', 'toolCallId', '_sourcetool', 'args', 'argsText'];
    const hasTechnicalKey = technicalKeys.some(k => match.includes(`"${k}"`));
    if (!hasTechnicalKey) return match;

    try {
      const obj = JSON.parse(match);
      return formatJsonAsHumanText(obj);
    } catch { return match; }
  });

  const extractedAutosave = extractAutosaveStatus(cleaned);

  return {
    textContent: formatAssistantTextForMarkdown(extractedAutosave.cleanedText),
    autosaveStatus: extractedAutosave.autosaveStatus,
  };
}

function removeKeywordSuggestionTable(text: string): string {
  return text
    .replace(
      /\|[^\n]*Keyword\s*Alternatif[^\n]*\|\s*\n\|[-|\s]+\|\s*\n((?:\|[^\n]+\|\s*\n?)+)/gi,
      '',
    )
    .replace(/Silakan pilih salah satu dari tabel di atas[^\n]*/gi, '')
    .trim();
}

const MarkdownRenderer = ReactMarkdown as ComponentType<
  PropsWithChildren<{ remarkPlugins?: unknown[]; className?: string }>
>;

const AssistantMarkdownText: React.FC<{
  text: string;
  muted?: boolean;
}> = ({ text, muted = false }) => (
  <MarkdownRenderer
    remarkPlugins={[remarkGfm]}
    className={cn(
      "aui-md text-sm leading-relaxed",
      muted && "opacity-70",
      "[&_p]:mb-2 [&_p:last-child]:mb-0",
      "[&_ul]:my-2 [&_ul]:ml-4 [&_ul]:list-disc",
      "[&_ol]:my-2 [&_ol]:ml-4 [&_ol]:list-decimal",
      "[&_li]:mb-1",
      "[&_strong]:font-semibold [&_strong]:text-gray-900",
      "[&_h1]:mb-2 [&_h1]:text-base [&_h1]:font-bold",
      "[&_h2]:mb-1.5 [&_h2]:text-sm [&_h2]:font-bold",
      "[&_h3]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold",
      "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap",
      "[&_code]:break-words",
    )}
  >
    {text}
  </MarkdownRenderer>
);

// Assistant Message with loading state detection and Tool UI rendering
const AssistantMessageContent: React.FC = () => {
  const message = useMessage();
  const thread = useThread();
  const content = message.content;
  const [toolUiData, setToolUiData] = useState<any>(null);
  const [fetchProgress, setFetchProgress] = useState<{
    active: boolean;
    unitCode: string;
    step: "confirm" | "fetch" | "transform" | "save" | "complete" | "error";
    startTime: number;
  } | null>(null);
  const [searchProgress, setSearchProgress] = useState<{
    active: boolean;
    keyword: string;
    stage: "analyze" | "retrieve" | "rank" | "complete" | "error";
  } | null>(null);
  const clearFetchProgressTimerRef = useRef<number | null>(null);

  const clearPendingFetchProgressTimer = useCallback(() => {
    if (clearFetchProgressTimerRef.current === null) return;

    window.clearTimeout(clearFetchProgressTimerRef.current);
    clearFetchProgressTimerRef.current = null;
  }, []);

  const scheduleClearFetchProgress = useCallback((delay: number) => {
    clearPendingFetchProgressTimer();
    clearFetchProgressTimerRef.current = window.setTimeout(() => {
      setFetchProgress((prev) => (prev?.active ? prev : null));
      clearFetchProgressTimerRef.current = null;
    }, delay);
  }, [clearPendingFetchProgressTimer]);

  useEffect(() => clearPendingFetchProgressTimer, [clearPendingFetchProgressTimer]);
  
  // Helper to create table data from SKKNI result
  const createTableData = useCallback((result: any) => {
    if (!result?.documents || !Array.isArray(result.documents)) return null;
    
    const tableData = result.documents.flatMap((doc: any, docIndex: number) =>
      (doc.units || []).map((unit: any, unitIndex: number) => ({
        id: unit.id,
        rowNumber: docIndex * 100 + unitIndex + 1,
        unitCode: unit.code,
        unitTitle: unit.title,
        documentTitle: doc.title,
        sector: doc.sector,
        _documentId: doc.id,
        _unitId: unit.id,
      }))
    );

    return {
      type: 'data-table',
      rowIdKey: 'id',
      columns: [
        { key: 'unitCode', label: 'Kode Unit', width: '160px', nowrap: true },
        { key: 'unitTitle', label: 'Nama Unit Kompetensi', width: 'auto' },
      ],
      data: tableData,
      defaultSort: { key: 'unitCode', direction: 'asc' },
    };
  }, []);

  const messageStatus = (message as any).status;

  const isLatestAssistantMessage = useMemo(() => {
    const latestAssistant = [...(thread.messages || [])]
      .reverse()
      .find((m: any) => m?.role === 'assistant');
    return latestAssistant?.id === (message as any).id;
  }, [thread.messages, message]);

  const shouldHandleLiveToolUi = useMemo(
    () =>
      shouldHandleLiveToolUiForMessage({
        isLatestAssistantMessage,
        messageStatus,
        threadIsRunning: thread.isRunning,
      }),
    [isLatestAssistantMessage, messageStatus, thread.isRunning],
  );

  // Parse embedded SKKNI data from message text (for reload persistence)
  useEffect(() => {
    if (toolUiData) return; // Already have data
    
    const rawText = content
      ?.filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n') || '';
    
    const result = extractEmbeddedSkkniData(rawText);
    if (result) {
      const tableData = createTableData(result);
      if (tableData) {
        console.log('[AssistantMessage] 📦 Loaded SKKNI data from embedded JSON');
        setToolUiData(tableData);
      }
    }
  }, [content, toolUiData, createTableData]);

  // Listen for SKKNI result event from adapter (for live updates)
  // IMPORTANT: Only listen if this message is currently streaming (not a historical message)
  const isStreaming = isActiveAssistantMessageStatus(messageStatus);
  const toolBadgeIconClass = isStreaming ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5';
  
  useEffect(() => {
    // Only attach listener for messages that are currently streaming
    // Historical/complete messages should get their data from embedded JSON, not from events
    if (!shouldHandleLiveToolUi) {
      // Not streaming = historical message, don't listen to events
      return;
    }
    
    const handleSkkniResult = (event: CustomEvent) => {
      // Double-check: only set table if this message is actively streaming
      const currentStatus = (message as any).status;
      const stillStreaming = isActiveAssistantMessageStatus(currentStatus);
      
      if (!stillStreaming) {
        console.log('[AssistantMessage] Ignoring SKKNI event - message no longer streaming');
        return;
      }
      
      const tableData = createTableData(event.detail);
      if (tableData && !toolUiData) {
        console.log('[AssistantMessage] 🎯 Setting SKKNI table from event (streaming message)');
        setToolUiData(tableData);
      }
    };

    window.addEventListener('skkni-result', handleSkkniResult as EventListener);
    return () => window.removeEventListener('skkni-result', handleSkkniResult as EventListener);
  }, [createTableData, toolUiData, shouldHandleLiveToolUi, message]);

  // Listen for fetch_skkni_unit_details progress events
  useEffect(() => {
    if (!shouldHandleLiveToolUi) {
      return;
    }

    const handleFetchProgress = (event: CustomEvent<{ 
      type: 'start' | 'step' | 'complete' | 'error';
      unitCode?: string;
      step?: string;
      error?: string;
    }>) => {
      const { type, unitCode, step, error } = event.detail;
      
      if (type === 'start' && unitCode) {
        clearPendingFetchProgressTimer();
        setFetchProgress({
          active: true,
          unitCode,
          step: 'fetch',
          startTime: Date.now(),
        });
      } else if (type === 'step' && step) {
        setFetchProgress(prev => prev ? {
          ...prev,
          step: step as any,
        } : null);
      } else if (type === 'complete') {
        setFetchProgress(prev => prev ? {
          ...prev,
          step: 'complete',
          active: false,
        } : null);
        // Clear after animation
        scheduleClearFetchProgress(2000);
      } else if (type === 'error') {
        setFetchProgress(prev => prev ? {
          ...prev,
          step: 'error',
          active: false,
        } : null);
      }
    };

    window.addEventListener('skkni-fetch-progress', handleFetchProgress as EventListener);
    return () => window.removeEventListener('skkni-fetch-progress', handleFetchProgress as EventListener);
  }, [clearPendingFetchProgressTimer, scheduleClearFetchProgress, shouldHandleLiveToolUi]);

  useEffect(() => {
    if (!shouldHandleLiveToolUi) {
      return;
    }

    const handleSearchProgress = (event: CustomEvent<{ type: string; keyword?: string }>) => {
      const { type, keyword } = event.detail;

      if (type === "start" && keyword) {
        setSearchProgress({
          active: true,
          keyword,
          stage: "retrieve",
        });
        return;
      }

      if (type === "complete") {
        setSearchProgress((prev) => prev ? { ...prev, stage: "complete", active: false } : prev);
        return;
      }

      if (type === "error") {
        setSearchProgress((prev) => prev ? { ...prev, stage: "error", active: false } : prev);
      }
    };

    window.addEventListener("skkni-search-progress", handleSearchProgress as EventListener);
    return () => window.removeEventListener("skkni-search-progress", handleSearchProgress as EventListener);
  }, [shouldHandleLiveToolUi]);

  // Detect tool-call for fetch_skkni_unit_details and show progress
  useEffect(() => {
    const toolCalls = content?.filter((c: any) => c.type === 'tool-call');
    const fetchCall: any = toolCalls?.find((tc: any) => 
      tc.toolName === 'fetch_skkni_unit_details' || 
      tc.toolName?.includes('fetch_skkni') ||
      ((tc.args?.unitCode || tc.args?.unit_code) && !tc.args?.area) // Has unitCode/unit_code but not area = fetch details
    );
    
    if (fetchCall && !fetchProgress && shouldHandleLiveToolUi) {
      // Handle both camelCase and snake_case
      const unitCode = fetchCall.args?.unitCode || fetchCall.args?.unit_code || 'unknown';
      console.log('[AssistantMessage] 🔄 Detected fetch_skkni_unit_details call for:', unitCode);
      clearPendingFetchProgressTimer();
      setFetchProgress({
        active: true,
        unitCode,
        step: 'fetch',
        startTime: Date.now(),
      });
    }
  }, [clearPendingFetchProgressTimer, content, fetchProgress, shouldHandleLiveToolUi]);

  // Detect tool-result for fetch_skkni_unit_details to update progress
  useEffect(() => {
    if (!fetchProgress) return;
    
    // Check if there's a tool-result in content or metadata
    const toolResults = (message as any).metadata?.custom?.toolInvocations;
    const fetchResult = toolResults?.find((tr: any) => 
      tr.toolName === 'fetch_skkni_unit_details' || 
      tr.toolName?.includes('fetch_skkni') ||
      tr.result?.data?.unitCode
    );
    
    if (fetchResult?.result?.success) {
      setFetchProgress(prev => prev ? { ...prev, step: 'complete', active: false } : null);
      scheduleClearFetchProgress(1500);
    } else if (fetchResult?.result?.success === false) {
      setFetchProgress(prev => prev ? { ...prev, step: 'error', active: false } : null);
    }
  }, [fetchProgress, message, scheduleClearFetchProgress]);

  // Extract text content and filter out metadata
  const { textContent, autosaveStatus } = useMemo(() => {
    const rawText = content
      ?.filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n') || '';

    return cleanAssistantText(rawText);
  }, [content]);

  // Parse keyword alternatif from markdown table in AI response
  const suggestedKeywords = useMemo(() => {
    if (!textContent) return [];
    // Match markdown table with "Keyword Alternatif" header
    // Format: | Keyword Alternatif | Deskripsi |
    //         |-------------------|-----------|
    //         | Pemasaran         | Untuk ... |
    const tableRegex = /\|[^\n]*Keyword\s*Alternatif[^\n]*\|\s*\n\|[-|\s]+\|\s*\n((?:\|[^\n]+\|\s*\n?)+)/gi;
    const match = tableRegex.exec(textContent);
    if (!match || !match[1]) return [];

    const rows = match[1].trim().split('\n');
    const keywords: { keyword: string; description: string }[] = [];
    for (const row of rows) {
      const cells = row.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length >= 2 && cells[0] && cells[0] !== '---') {
        keywords.push({ keyword: cells[0], description: cells[1] });
      }
    }
    return keywords;
  }, [textContent]);

  // Remove keyword table from markdown to avoid double rendering
  const textContentWithoutKeywordTable = useMemo(() => {
    if (suggestedKeywords.length === 0) return textContent;
    // Remove the entire keyword table block (header row + separator + data rows)
    return textContent.replace(
      /\|[^\n]*Keyword\s*Alternatif[^\n]*\|\s*\n\|[-|\s]+\|\s*\n((?:\|[^\n]+\|\s*\n?)+)/gi,
      ''
    ).trim();
  }, [textContent, suggestedKeywords]);

  // Also remove "Silakan pilih salah satu dari tabel di atas" line when we have keyword buttons
  const finalTextContent = useMemo(() => {
    if (suggestedKeywords.length === 0) return textContentWithoutKeywordTable;
    return removeKeywordSuggestionTable(textContentWithoutKeywordTable);
  }, [textContentWithoutKeywordTable, suggestedKeywords]);

  const hasInjectedHtmlPayload = useMemo(
    () => looksLikeInjectedHtmlDocument(finalTextContent),
    [finalTextContent],
  );

  const hasActiveStatus =
    messageStatus === 'loading' ||
    messageStatus === 'running' ||
    messageStatus === 'streaming' ||
    messageStatus === 'in_progress';

  const isActivelyStreamingForThisMessage =
    hasActiveStatus || (thread.isRunning && isLatestAssistantMessage);

  // Status can be undefined in assistant-ui; only treat as streaming for latest assistant message.
  const isComplete =
    !isActivelyStreamingForThisMessage &&
    (messageStatus === 'done' || messageStatus === 'complete' || messageStatus === undefined);

  // Has valid text content?
  const hasContent = content && content.length > 0 && content.some((c: any) => c.type === 'text' && c.text);

  // Loading: Status is active but no content yet, AND not already complete
  const isLoading =
    !isComplete &&
    isActivelyStreamingForThisMessage &&
    (!hasContent || hasInjectedHtmlPayload);

  // Typing: Status is active AND has content (streaming text), AND not already complete
  const isTyping =
    !isComplete &&
    isActivelyStreamingForThisMessage &&
    hasContent &&
    !hasInjectedHtmlPayload;

  // Extract tool-call items from content for rendering
  // NOTE: This must be called before any conditional returns to comply with Rules of Hooks
  const toolCalls = useMemo(() => {
    return content?.filter((c: any) => c.type === 'tool-call') || [];
  }, [content]);

  const renderToolStatus = () => (
    <>
      {toolCalls.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {toolCalls.map((tc: any, index: number) => (
            <div
              key={tc.toolCallId || index}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border border-blue-200 bg-blue-50 text-blue-700"
            >
              <Icon icon={isStreaming ? 'solar:settings-linear' : 'solar:check-circle-linear'} className={toolBadgeIconClass} />
              <span>{getToolBadgeLabel(tc)}</span>
            </div>
          ))}
        </div>
      )}
      {shouldHandleLiveToolUi && fetchProgress && (
        <div className="mb-4">
          <SkkniInlineProgress
            currentStep={fetchProgress.step}
            unitCode={fetchProgress.unitCode}
          />
        </div>
      )}
      {shouldHandleLiveToolUi && searchProgress && (searchProgress.active || searchProgress.stage === 'complete') && (
        <div className="mb-4">
          <SkkniSearchInlineProgress
            keyword={searchProgress.keyword}
            stage={searchProgress.stage}
          />
        </div>
      )}
    </>
  );

  // Extract tool UI data from message metadata
  useEffect(() => {
    // Check if message has custom data with tool invocations
    const messageData = (message as any).metadata || (message as any).data;

    // CRITICAL: Tool invocations are in metadata.custom, not at top level
    const toolInvocations = messageData?.custom?.toolInvocations;

    if (toolInvocations && toolInvocations.length > 0) {

      // Find SKKNI search tool result
      // Note: Mastra may use different tool names like "_3" instead of "skkniSearchTool"
      const skkniTool = toolInvocations.find(
        (inv: any) => {
          const toolName = inv.payload?.toolName || inv.toolName;
          // Match skkniSearchTool, skkni_search, _2, _3, or any tool name containing skkni
          return (
            toolName === 'skkni_search' ||
            toolName === 'skkniSearchTool' ||
            toolName === '_2' ||
            toolName === '_3' ||
            (typeof toolName === 'string' && toolName.toLowerCase().includes('skkni'))
          );
        }
      );

      // Extract result from payload structure
      const result = skkniTool?.payload?.result || skkniTool?.result;

      if (result) {

        if (result.documents && Array.isArray(result.documents)) {
          const tableData = result.documents.flatMap((doc: any, docIndex: number) =>
            (doc.units || []).map((unit: any, unitIndex: number) => ({
              id: unit.id,
              rowNumber: docIndex * 100 + unitIndex + 1,
              unitCode: unit.code,
              unitTitle: unit.title,
              documentTitle: doc.title,
              sector: doc.sector,
              _documentId: doc.id,
              _unitId: unit.id,
            }))
          );

          setToolUiData({
            type: 'data-table',
            rowIdKey: 'id',
            columns: [
              { key: 'unitCode', label: 'Kode Unit', width: '160px', nowrap: true },
              { key: 'unitTitle', label: 'Nama Unit Kompetensi', width: 'auto' },
            ],
            data: tableData,
            defaultSort: { key: 'unitCode', direction: 'asc' },
          });
        }
      }
    }
  }, [message]);

  // Show thinking dots when loading
  if (isLoading) {
    return (
      <>
        {renderToolStatus()}
        <ThinkingDots />
      </>
    );
  }

  // Show typing indicator when just started receiving text
  if (isTyping) {
    return (
      <>
        {autosaveStatus && (
          <AutosaveStatusCard
            status={autosaveStatus.status}
            message={autosaveStatus.message}
          />
        )}
        {renderToolStatus()}
        <TypingIndicator />
        {finalTextContent && !hasInjectedHtmlPayload && (
          <AssistantMarkdownText text={finalTextContent} muted />
        )}
      </>
    );
  }

  // Extract tool-call items from content for rendering (moved to before conditional returns above)

  return (
    <>
      {autosaveStatus && (
        <AutosaveStatusCard
          status={autosaveStatus.status}
          message={autosaveStatus.message}
        />
      )}

      {/* Render tool calls as action badges */}
      {renderToolStatus()}

      {/* Render Tool UI if present */}
      {toolUiData && (
        <div className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-200 mb-4">
          <DataTable
            rowIdKey={toolUiData.rowIdKey}
            columns={toolUiData.columns}
            data={toolUiData.data}
            defaultSort={toolUiData.defaultSort}
            onRowClick={(row) => {
              console.log('Row clicked:', row);
              // Send message to select this unit
              const message = `Pilih unit dengan kode ${row.unitCode}`;
              if ((window as any).__sendChatMessage) {
                (window as any).__sendChatMessage(message);
              }
            }}
          />
        </div>
      )}

      {/* Render text content with markdown support */}
      {finalTextContent && !hasInjectedHtmlPayload && (
        <AssistantMarkdownText text={finalTextContent} />
      )}

      {isComplete && hasInjectedHtmlPayload && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
          Respons AI tidak valid. Silakan kirim ulang pesan terakhir.
        </div>
      )}

      {/* Render keyword alternatif as interactive buttons */}
      {suggestedKeywords.length > 0 && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">Coba keyword berikut:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedKeywords.map((kw) => (
              <button
                key={kw.keyword}
                onClick={() => {
                  if ((window as any).__sendChatMessage) {
                    // Send only the keyword, AI will understand it's a SKKNI search request
                    (window as any).__sendChatMessage(kw.keyword);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary/50 transition-all cursor-pointer"
                title={kw.description}
              >
                <Icon icon="solar:magnifer-linear" className="h-3.5 w-3.5" />
                {kw.keyword}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// Message Error Component with Retry button
const MessageError: React.FC = () => {
  const message = useMessage();
  const error = (message as any).error;
  
  // Don't render if no error
  if (!error) return null;
  
  return (
    <div className="mt-2 rounded-lg border border-red-300 bg-red-50 p-4 text-red-700">
      <div className="flex items-start gap-3">
        <Icon icon="solar:danger-triangle-bold" className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium mb-1">Terjadi kesalahan</p>
          <p className="text-sm text-red-600 mb-3">
            {error?.message || 'AI gagal menghasilkan respons. Silakan coba lagi.'}
          </p>
          <ActionBarPrimitive.Reload asChild>
            <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-100 hover:bg-red-200 text-red-700 transition-colors">
              <Icon icon="solar:refresh-linear" className="h-4 w-4" />
              Coba Lagi
            </button>
          </ActionBarPrimitive.Reload>
        </div>
      </div>
    </div>
  );
};

// Branch Picker Component
const BranchPicker: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "inline-flex items-center text-xs text-gray-500",
        className
      )}
    >
      <BranchPickerPrimitive.Previous asChild>
        <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <Icon icon="solar:alt-arrow-left-linear" className="h-4 w-4" />
        </button>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium mx-1">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <button className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          <Icon icon="solar:alt-arrow-right-linear" className="h-4 w-4" />
        </button>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  );
};

// User Action Bar Component
const UserActionBar: React.FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    >
      <ActionBarPrimitive.Edit asChild>
        <button
          className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          title="Edit"
        >
          <Icon icon="solar:pen-2-linear" className="h-4 w-4" />
        </button>
      </ActionBarPrimitive.Edit>
    </ActionBarPrimitive.Root>
  );
};

// Assistant Action Bar Component
const AssistantActionBar: React.FC = () => {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!isCopied) return;

    const timer = window.setTimeout(() => setIsCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [isCopied]);

  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      className="flex items-center gap-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
    >
      <ActionBarPrimitive.Copy asChild>
        <button
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors"
          title="Copy"
          onClick={() => setIsCopied(true)}
        >
          {isCopied ? (
            <Icon icon="solar:check-circle-linear" className="h-4 w-4 text-green-500" />
          ) : (
            <Icon icon="solar:copy-linear" className="h-4 w-4" />
          )}
        </button>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <button
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-gray-700 transition-colors"
          title="Regenerate"
        >
          <Icon icon="solar:refresh-linear" className="h-4 w-4" />
        </button>
      </ActionBarPrimitive.Reload>
      <ActionBarPrimitive.FeedbackPositive asChild>
        <button
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-green-600 transition-colors"
          title="Good response"
        >
          <Icon icon="solar:like-linear" className="h-4 w-4" />
        </button>
      </ActionBarPrimitive.FeedbackPositive>
      <ActionBarPrimitive.FeedbackNegative asChild>
        <button
          className="p-1.5 rounded-lg hover:bg-gray-200 hover:text-red-500 transition-colors"
          title="Bad response"
        >
          <Icon icon="solar:dislike-linear" className="h-4 w-4" />
        </button>
      </ActionBarPrimitive.FeedbackNegative>
    </ActionBarPrimitive.Root>
  );
};

// Edit Composer Component
const EditComposer: React.FC = () => {
  return (
    <MessagePrimitive.Root className="flex justify-end w-full min-w-0 py-3">
      <ComposerPrimitive.Root className="w-full max-w-[70%] flex flex-col rounded-2xl bg-muted">
        <ComposerPrimitive.Input
          className="min-h-14 w-full resize-none bg-transparent p-4 text-foreground text-sm outline-none"
          autoFocus
        />
        <div className="mx-3 mb-3 flex items-center gap-2 self-end">
          <ComposerPrimitive.Cancel asChild>
            <button className="px-3 py-1.5 text-sm rounded-lg hover:bg-gray-200 text-gray-600 transition-colors">
              Cancel
            </button>
          </ComposerPrimitive.Cancel>
          <ComposerPrimitive.Send asChild>
            <button className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:opacity-90 transition-colors">
              Update
            </button>
          </ComposerPrimitive.Send>
        </div>
      </ComposerPrimitive.Root>
    </MessagePrimitive.Root>
  );
};

// Scroll To Bottom Button Component
const ScrollToBottom: React.FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <button
        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 shadow-lg hover:bg-gray-50 transition-colors disabled:invisible z-10"
        title="Scroll to bottom"
      >
        <Icon icon="solar:alt-arrow-down-linear" className="h-5 w-5 text-gray-600" />
      </button>
    </ThreadPrimitive.ScrollToBottom>
  );
};

// Context Counter Component - shows estimated token usage
const ContextCounter: React.FC = () => {
  const thread = useThread();
  const messages = thread.messages;

  // Simple token estimation: ~4 chars = 1 token (rough estimate for English/Indonesian mix)
  const estimatedTokens = useMemo(() => {
    if (!messages || messages.length === 0) return 0;
    
    let totalChars = 0;
    messages.forEach((msg) => {
      const content = msg.content
        ?.map((c: any) => (c.type === 'text' ? c.text : ''))
        .join(' ') || '';
      totalChars += content.length;
    });
    
    // Rough estimate: 4 chars per token
    return Math.ceil(totalChars / 4);
  }, [messages]);

  // Gemini 2.0 Flash has 1M token context window
  const maxTokens = 1_000_000;
  const percentage = (estimatedTokens / maxTokens) * 100;
  
  // Don't show if no messages
  if (messages.length === 0) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <Icon icon="solar:document-text-linear" className="h-3.5 w-3.5" />
      <span>
        {estimatedTokens.toLocaleString()} / {maxTokens.toLocaleString()} tokens
      </span>
      <span className="text-gray-400">({percentage.toFixed(1)}%)</span>
    </div>
  );
};

// User Message Content Component - filters out context metadata
const UserMessageContent: React.FC = () => {
  const message = useMessage();
  const content = message.content;

  // Extract and clean text content (remove [USER_CONTEXT:...] patterns)
  const cleanedText = useMemo(() => {
    if (!content || content.length === 0) return '';

    const textParts = content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text || '');

    const fullText = textParts.join('\n');

    // Remove [USER_CONTEXT: ...] patterns (including nested content)
    const cleaned = fullText.replace(/\[USER_CONTEXT:[^\]]*\]/g, '').trim();

    return cleaned;
  }, [content]);

  if (!cleanedText) {
    return <MessagePrimitive.Content />;
  }

  return <span>{cleanedText}</span>;
};

// User Message Component
const UserMessageComponent: React.FC = () => {
  return (
    <MessagePrimitive.Root className="group flex justify-end w-full min-w-0 py-2">
      <div className="flex items-center gap-2 max-w-[85%] min-w-0">
        <div className="flex-shrink-0 self-end">
          <UserActionBar />
        </div>
        <div className="min-w-0">
          <div className="rounded-2xl px-4 py-3 bg-primary text-white overflow-hidden" style={{ color: 'white', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            <div className="text-white [&_p]:m-0 [&_p]:text-white [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_code]:break-words" style={{ color: 'white' }}>
              <UserMessageContent />
            </div>
          </div>
        </div>
      </div>
      <BranchPicker className="mt-1 mr-2 self-end" />
    </MessagePrimitive.Root>
  );
};


// Assistant Message Component
const AssistantMessageComponent: React.FC<{ agentColor: string }> = ({ agentColor }) => {
  const thread = useThread();
  const message = useMessage();
  const isRunning = thread.isRunning;
  const content = message.content;
  const messageStatus = (message as any).status;
  const messageError = (message as any).error;
  const hasError = messageStatus === 'error' || messageStatus === 'cancelled' || Boolean(messageError);

  const hasRenderableContent = content && content.length > 0 && content.some((c: any) => {
    if (c.type === 'text') {
      const text = c.text?.trim();
      return Boolean(text && text.length > 0);
    }
    return true;
  });

  const shouldRenderBubble = !hasError && (isRunning || hasRenderableContent);
  const showEmptyResponseNotice = !isRunning && !hasError && !hasRenderableContent;

  return (
    <MessagePrimitive.Root className="group flex gap-3 justify-start w-full min-w-0 py-2">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white"
        style={{ backgroundColor: agentColor }}
      >
        <Icon icon="solar:magic-stick-3-bold" height={18} />
      </div>
      <div className="flex-1 max-w-[85%] min-w-0">
        {/* Keep AssistantMessageContent mounted while running to avoid missing fast tool events */}
        {shouldRenderBubble && (
          <div className="rounded-2xl px-4 py-3 bg-gray-100 text-dark overflow-hidden [&_p]:text-dark [&_span]:text-dark [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_code]:break-words [&_pre]:bg-gray-200 [&_pre]:p-2 [&_pre]:rounded" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}>
            <AssistantMessageContent />
          </div>
        )}
        {showEmptyResponseNotice && (
          <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
            Respons AI kosong. Klik <span className="font-semibold">Regenerate</span> untuk mencoba lagi.
          </div>
        )}
        <MessageError />
        <div className="mt-1 flex items-center gap-2">
          <BranchPicker />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
};

// Composer component with Grok-style pattern
const Composer: React.FC<{ agentColor: string; onSendMessage?: (message: string) => void }> = ({
  agentColor,
  onSendMessage
}) => {
  // Use selectors to avoid getSnapshot caching warnings
  const isEmpty = useComposer((state) => state.isEmpty);
  const isRunning = useThread((state) => state.isRunning);

  // Expose programmatic send via window object
  useEffect(() => {
    if (onSendMessage) {
      (window as any).__sendChatMessage = (message: string) => {
        const textarea = document.querySelector('textarea[placeholder="Ketik pesan Anda..."]') as HTMLTextAreaElement;
        if (textarea) {
          // Set value programmatically
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
          )?.set;
          nativeInputValueSetter?.call(textarea, message);

          // Trigger React's onChange
          const inputEvent = new Event('input', { bubbles: true });
          textarea.dispatchEvent(inputEvent);

          // Focus
          textarea.focus();

          // Click send button after short delay
          setTimeout(() => {
            const sendBtn = textarea.closest('form')?.querySelector('button[type="submit"]') as HTMLButtonElement;
            if (sendBtn && !sendBtn.disabled) {
              sendBtn.click();
            }
          }, 100);
        }
      };
    }
    return () => {
      delete (window as any).__sendChatMessage;
    };
  }, [onSendMessage]);

  return (
    <ComposerPrimitive.Root
      className="group/composer mx-auto w-full"
      data-empty={isEmpty}
      data-running={isRunning}
    >
      <div className="flex gap-3 items-center rounded-xl border border-ld bg-white px-3 py-2.5 shadow-sm">
        <ComposerPrimitive.Input
          placeholder="Ketik pesan Anda..."
          className="flex-1 bg-transparent text-sm text-dark outline-none placeholder:text-gray-400 resize-none"
        />

        <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center">
          {/* Empty state icon - visible when input is empty and not running */}
          <div
            className="absolute inset-0 flex items-center justify-center transition-all duration-200 ease-in-out group-data-[empty=false]/composer:scale-0 group-data-[empty=false]/composer:opacity-0 group-data-[running=true]/composer:scale-0 group-data-[running=true]/composer:opacity-0"
          >
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-400 cursor-default"
              disabled
            >
              <Icon icon="solar:plain-2-bold" height={20} />
            </button>
          </div>

          {/* Send button - visible when has text and not running */}
          <ComposerPrimitive.Send
            className="absolute inset-0 transition-all duration-200 ease-in-out group-data-[empty=true]/composer:scale-0 group-data-[empty=true]/composer:opacity-0 group-data-[running=true]/composer:scale-0 group-data-[running=true]/composer:opacity-0"
            asChild
          >
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90"
              style={{ backgroundColor: agentColor }}
            >
              <Icon icon="solar:arrow-up-outline" height={20} />
            </button>
          </ComposerPrimitive.Send>

          {/* Cancel/Stop button - visible when running */}
          <ComposerPrimitive.Cancel
            className="absolute inset-0 transition-all duration-200 ease-in-out group-data-[running=false]/composer:scale-0 group-data-[running=false]/composer:opacity-0"
            asChild
          >
            <button
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-all hover:opacity-90"
              style={{ backgroundColor: agentColor }}
            >
              <Icon icon="solar:square-bold" height={16} />
            </button>
          </ComposerPrimitive.Cancel>
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
};

export const ConversationalThread: React.FC<ConversationalThreadProps> = ({
  agentColor = "#4F75FF",
  onSendMessage,
}) => {
  return (
    <ThreadPrimitive.Root className="flex h-full flex-col bg-white">
      {/* Messages Viewport with Empty State inside */}
      <ThreadPrimitive.Viewport className="flex grow flex-col overflow-y-auto">
        {/* Empty State - centered with animations */}
        <ThreadPrimitive.Empty>
          <div className="mx-auto my-auto flex w-full flex-grow flex-col" style={{ maxWidth: '42rem' }}>
            <div className="flex w-full flex-grow flex-col items-center justify-center">
              <div className="flex size-full flex-col justify-center px-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <div className="text-2xl font-semibold text-dark">
                    Halo! Aku Mika, AI mentor kamu.
                  </div>
                  <div className="text-lg text-muted-foreground mt-1">
                    Aku bisa bantu merapikan ide atau langsung menyusunnya jadi dokumen.
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </ThreadPrimitive.Empty>

        {/* Messages - when not empty */}
        <div className="relative flex grow flex-col space-y-4 px-4 pt-16 pb-6 mx-auto w-full" style={{ maxWidth: '42rem' }}>
          <ThreadPrimitive.Messages
            components={{
              UserMessage: UserMessageComponent,
              EditComposer: EditComposer,
              AssistantMessage: () => <AssistantMessageComponent agentColor={agentColor} />,
            }}
          />
        </div>

        {/* Scroll to bottom button - positioned at bottom of viewport */}
        <ScrollToBottom />
      </ThreadPrimitive.Viewport>

      {/* Composer at bottom - always visible */}
      <div className="flex-shrink-0 border-t border-ld bg-white px-4 pt-4 pb-10">
        <div className="mx-auto w-full" style={{ maxWidth: '42rem' }}>
          {/* Context counter - small text above composer */}
          <div className="mb-2 flex justify-end">
            <ContextCounter />
          </div>
          <Composer agentColor={agentColor} onSendMessage={onSendMessage} />
        </div>
      </div>
    </ThreadPrimitive.Root>
  );
};
