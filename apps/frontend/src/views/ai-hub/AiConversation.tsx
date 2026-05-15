import { Icon } from "@iconify/react";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import { Button } from "src/components/ui/button";
import { Alert, AlertDescription } from "src/components/ui/alert";
import api from "src/api/axios";
import { ConversationalAssistantProvider, useConversationalAssistant } from "src/context/ConversationalAssistantContext";
import { ConversationalThread } from "src/components/ai/ConversationalThread";
import { ChatHeader } from "src/components/ai/ChatHeader";
import { ChatHistoryPanel } from "src/components/ai/ChatHistoryPanel";
import { AiTrailerPromotion, shouldShowTrailer } from "./components/AiTrailerPromotion";
import { DocumentProgressSidebar } from "./components/DocumentProgressSidebar";
import { buildMasterSectionPatchValue } from "./components/master-sidebar.helpers";
import type { MasterSidebarSectionId } from "./components/master-sidebar.config";
import { useAiAccess } from "src/hooks/useAiAccess";

const categoryConfig: Record<string, {
  title: string;
  description: string;
  color: string;
  documentTypes: string[];
}> = {
  trainer: {
    title: "AI for Trainer",
    description: "AI Assistant untuk membantu pembuatan materi training",
    color: "#4F75FF",
    documentTypes: ["lesson-plan", "assessment", "syllabus"]
  },
  master: {
    title: "AI for Master",
    description: "AI Assistant untuk analisis dan coaching trainer",
    color: "#AA8D55",
    documentTypes: ["bukti-1", "bukti-2", "bukti-3", "bukti-4", "bukti-5", "bukti-6", "bukti-7", "bukti-8"]
  },
  branding: {
    title: "AI for Branding",
    description: "AI Assistant untuk content creation dan branding",
    color: "#10B981",
    documentTypes: ["personal-branding", "content-assistant"]
  }
};

const AiConversationContent = () => {
  const { category } = useParams<{ category: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const { hasAccess, getUpgradeMessage, isLoading: isAccessLoading, hasTier } = useAiAccess();
  const promptHandledRef = useRef(false);

  // Trailer state
  const [showTrailer, setShowTrailer] = useState(true);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const [trailerData, setTrailerData] = useState<{
    title: string;
    description?: string;
    muxPlaybackId?: string;
    playbackToken?: string;
    thumbnailUrl?: string;
    buyUrl?: string;
    upgradeUrl?: string;
    isActive: boolean;
  } | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(true);

  // Get context values
  const {
    currentSessionId,
    sessions,
    isLoadingSessions,
    isInitialized,
    createNewSession,
    loadSession,
    deleteSession,
    fetchSessions,
    documentId,
    documentProgress,
    fetchDocumentProgress,
    onDataSaved,
    switchDocument,
    deleteDocument: contextDeleteDocument,
    createDocument,
  } = useConversationalAssistant();

  const config = category ? categoryConfig[category] : null;

  // Access Control Check - but allow viewing trailer
  const hasFeatureAccess = category ? hasAccess(category) : false;

  // Hide body scrollbar on this page
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Fetch trailer data
  useEffect(() => {
    const fetchTrailer = async () => {
      if (!category) return;

      // Check localStorage first - did user already skip this category's trailer?
      if (!shouldShowTrailer(category)) {
        console.log('⏭️ [Trailer] User already skipped trailer for', category);
        setShowTrailer(false);
        setTrailerLoading(false);
        return;
      }

      try {
        const { data } = await api.get(`/ai-trailer/${category}`);
        console.log('🎬 [Trailer] Fetched data:', data);
        console.log('🎬 [Trailer] Checks:', {
          hasData: !!data,
          isActive: data?.isActive,
          hasMuxPlaybackId: !!data?.muxPlaybackId,
          muxPlaybackId: data?.muxPlaybackId,
        });

        if (data && data.isActive && data.muxPlaybackId) {
          console.log('✅ [Trailer] Showing trailer');
          setTrailerData(data);
          setShowTrailer(true);
        } else {
          console.log('⏭️ [Trailer] Skipping trailer - missing video or not active');
          setShowTrailer(false);
        }
      } catch (error) {
        console.error('❌ [Trailer] Failed to fetch:', error);
        setShowTrailer(false);
      } finally {
        setTrailerLoading(false);
      }
    };

    fetchTrailer();
  }, [category]);

  // Event-based progress updates - no more polling!
  useEffect(() => {
    if (!currentSessionId) return;

    // Initial fetch
    fetchDocumentProgress();

    // Subscribe to data save events
    const unsubscribe = onDataSaved(() => {
      console.log('[AiConversation] 🎯 Data saved event received, refreshing progress...');
      // Wait a bit for backend to finish processing
      setTimeout(() => {
        fetchDocumentProgress();
        // Trigger sidebar refresh
        setSidebarRefreshKey((k) => k + 1);
      }, 500);
    });

    // Cleanup on unmount or session change
    return unsubscribe;
  }, [currentSessionId, fetchDocumentProgress, onDataSaved]);

  // Handle ?prompt= query parameter for deep linking from documents page
  useEffect(() => {
    const promptParam = searchParams.get('prompt');

    if (promptParam && isInitialized && !promptHandledRef.current) {
      console.log('[AiConversation] 🚀 Deep link detected, prompt:', promptParam);
      promptHandledRef.current = true;

      // Clear the prompt from URL to prevent re-sending on refresh
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('prompt');
      setSearchParams(newSearchParams, { replace: true });

      // Send the message after a short delay to ensure chat is ready
      setTimeout(() => {
        if ((window as any).__sendChatMessage) {
          console.log('[AiConversation] 📨 Sending deep-linked message...');
          (window as any).__sendChatMessage(decodeURIComponent(promptParam));
        } else {
          console.warn('[AiConversation] ⚠️ __sendChatMessage not available yet');
        }
      }, 500);
    }
  }, [searchParams, isInitialized, setSearchParams]);

  const handleNewChat = async () => {
    await createNewSession();
    // Runtime will re-mount automatically via runtimeKey change
    setIsHistoryOpen(false);
  };

  const handleOpenHistory = () => {
    fetchSessions();
    setIsHistoryOpen(true);
  };

  const handleSelectSession = async (sessionId: string) => {
    if (isLoadingSession) return; // Prevent multiple clicks

    setIsLoadingSession(true);
    setIsHistoryOpen(false);

    try {
      await loadSession(sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
    } finally {
      setIsLoadingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    await deleteSession(sessionId);
  };

  const handleCreateDocument = async (documentName: string) => {
    await createDocument(documentName);
    console.log('[AiConversation] Created new document:', documentName);
  };

  const handleSwitchDocument = async (docId: string) => {
    await switchDocument(docId);
    console.log('[AiConversation] Switched to document:', docId);
  };

  const handleDeleteDocument = async (docId: string) => {
    await contextDeleteDocument(docId);
    console.log('[AiConversation] Deleted document:', docId);
  };

  const handleSaveMasterSection = useCallback(
    async (sectionId: MasterSidebarSectionId, values: Record<string, string>) => {
      if (!documentId) {
        throw new Error('Document ID is required to save master sections');
      }

      const { section, value } = buildMasterSectionPatchValue(sectionId, values);
      if (!value || Object.keys(value).length === 0) {
        console.log('[AiConversation] No values provided for master section save, skipping.');
        return;
      }

      const fields: Record<string, string> = {};
      Object.entries(value).forEach(([key, entryValue]) => {
        fields[`${section}.${key}`] = entryValue;
      });

      try {
        await api.post(`/ai/document/${documentId}/fields`, { fields });
        await fetchDocumentProgress();
        setSidebarRefreshKey((k) => k + 1);
        console.log('[AiConversation] Master section saved and progress refreshed:', sectionId);
      } catch (error) {
        console.error('[AiConversation] Failed to save master section:', error);
        throw error;
      }
    },
    [documentId, fetchDocumentProgress],
  );

  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Icon icon="solar:danger-triangle-bold" className="text-error" height={48} />
        <h3 className="text-lg font-semibold text-dark">Kategori tidak ditemukan</h3>
        <Button onClick={() => navigate('/user/ai-hub')} variant="outline">
          <Icon icon="solar:arrow-left-outline" className="mr-2" height={16} />
          Kembali ke AI Mentor
        </Button>
      </div>
    );
  }

  // Block chat access if no permission (after trailer is closed/skipped)
  if (!isAccessLoading && !showTrailer && category && !hasFeatureAccess) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="max-w-md w-full space-y-6">
          <Alert className="border-error bg-error/5">
            <Icon icon="solar:lock-bold-duotone" className="text-error" height={24} />
            <div className="ml-3">
              <h3 className="text-lg font-bold text-dark mb-2">Akses Ditolak</h3>
              <AlertDescription className="text-sm text-bodytext">
                {getUpgradeMessage(category!)}
              </AlertDescription>
            </div>
          </Alert>

          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/user/ai-hub')}
              className="flex-1"
              variant="outline"
            >
              <Icon icon="solar:arrow-left-outline" height={18} className="mr-2" />
              Kembali ke AI Mentor
            </Button>
            <Button
              onClick={() => navigate('/user/upgrade')}
              className="flex-1"
            >
              <Icon icon="solar:crown-bold" height={18} className="mr-2" />
              Upgrade
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while checking trailer
  if (trailerLoading) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-3">
          <Icon icon="svg-spinners:ring-resize" height={48} className="text-primary" />
          <span className="text-sm text-gray-500">Memuat...</span>
        </div>
      </div>
    );
  }

  // Show trailer promotion if applicable
  if (showTrailer && trailerData) {
    return (
      <AiTrailerPromotion
        category={category!}
        title={trailerData.title}
        description={trailerData.description}
        muxPlaybackId={trailerData.muxPlaybackId}
        playbackToken={trailerData.playbackToken}
        thumbnailUrl={trailerData.thumbnailUrl}
        buyUrl={trailerData.buyUrl}
        upgradeUrl={trailerData.upgradeUrl}
        hasAccess={hasFeatureAccess}
        hasTier={hasTier}
        onContinue={() => setShowTrailer(false)}
      />
    );
  }

  // No need to check isInitialized here - ConversationalAssistantProvider
  // already shows loading screen when !isInitialized (line 922-929 in context)
  // This component only renders after provider is initialized

  return (
    <div className="flex -mx-5 lg:-mx-8 -my-8" style={{ height: 'calc(100dvh - 70px)' }}>
      {/* Left Panel - Chat with Floating Header */}
      <div className="flex-1 border-r border-ld relative flex flex-col overflow-visible">
        {/* Floating Chat Header */}
        <ChatHeader
          agentId={category || 'trainer'}
          agentTitle={config.title}
          agentColor={config.color}
          onNewChat={handleNewChat}
          onOpenHistory={handleOpenHistory}
          documentId={documentId || undefined}
          onResetComplete={() => {
            fetchDocumentProgress();
          }}
          onCreateDocument={handleCreateDocument}
          onSwitchDocument={handleSwitchDocument}
          onDeleteDocument={handleDeleteDocument}
          existingDocCount={sessions.length}
        />

        {/* Chat Thread - Full Height */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ConversationalThread
            agentColor={config.color}
            onSendMessage={(msg) => console.log('Send message:', msg)}
          />
        </div>
      </div>

      {/* Right Panel - Document Progress Sidebar */}
      <div className="w-80 flex-shrink-0 p-6 overflow-y-auto">
        <DocumentProgressSidebar
          documentId={documentId}
          category={category}
          refreshTrigger={sidebarRefreshKey}
          onRefresh={fetchDocumentProgress}
          onDocumentClick={(templateName, doc) => {
            console.log('Document clicked:', templateName, doc);
          }}
          onGenerateClick={(templateName) => {
            console.log('Generate clicked:', templateName);
            fetchDocumentProgress(); // Refresh after generation
            setSidebarRefreshKey((k) => k + 1);
          }}
          onAskAI={(prompt) => {
            if ((window as any).__sendChatMessage) {
              (window as any).__sendChatMessage(prompt);
            }
          }}
          onSaveMasterSection={handleSaveMasterSection}
        />
      </div>

      {/* History Panel */}
      <ChatHistoryPanel
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        isLoading={isLoadingSessions}
        currentSessionId={currentSessionId}
      />
    </div>
  );
};

// Main wrapper with Provider
const AiConversation = () => {
  const { category } = useParams<{ category: string }>();

  if (!category) {
    return <div>Invalid category</div>;
  }

  // Map category to agentId for backend (trainer, master, branding)
  const agentId = category;

  return (
    <ConversationalAssistantProvider agentId={agentId}>
      <AiConversationContent />
    </ConversationalAssistantProvider>
  );
};

export default AiConversation;
