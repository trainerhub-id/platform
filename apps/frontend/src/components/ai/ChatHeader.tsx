/**
 * Chat Header Component - Floating Action Buttons
 * Displays floating buttons for New Chat, History, and Reset Operations
 */

import { Icon } from "@iconify/react";
import { useState } from "react";
import { Button } from "src/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "src/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "src/components/ui/dropdown-menu";
import { useUser } from "src/lib/better-auth";
import { deleteDocument, clearSection } from "src/api/document-actions.api";
import { toast } from "sonner";
import { DocumentManagerDialog } from "./DocumentManagerDialog";

interface ChatHeaderProps {
  agentId: string;
  agentTitle: string;
  agentColor: string;
  onNewChat: () => void;
  onOpenHistory: () => void;
  documentId?: string;
  onResetComplete?: () => void;
  onCreateDocument?: (documentName: string) => Promise<void>;
  onSwitchDocument?: (documentId: string) => Promise<void>;
  onDeleteDocument?: (documentId: string) => Promise<void>;
  existingDocCount?: number;
}

const SECTIONS = [
  { value: 'training', label: 'Training' },
  { value: 'organizer', label: 'Organizer' },
  { value: 'unit', label: 'Unit Kompetensi' },
  { value: 'curriculum', label: 'Curriculum' },
  { value: 'resources', label: 'Resources' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'people', label: 'People' },
];

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  agentId,
  agentTitle,
  agentColor,
  onNewChat,
  onOpenHistory,
  documentId,
  onResetComplete,
  onCreateDocument,
  onSwitchDocument,
  onDeleteDocument,
  existingDocCount = 0,
}) => {
  const { user } = useUser();
  const [isResetting, setIsResetting] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);

  const handleDeleteAll = async () => {
    if (!documentId || !user?.id) {
      toast.error('Document ID atau User ID tidak tersedia');
      return;
    }

    const confirmed = window.confirm(
      '⚠️ Yakin ingin menghapus SELURUH dokumen? Tindakan ini TIDAK DAPAT dibatalkan!'
    );

    if (!confirmed) return;

    setIsResetting(true);
    try {
      await deleteDocument({
        documentId,
        userId: user.id,
      });
      toast.success('✅ Dokumen berhasil dihapus');
      onResetComplete?.();
    } catch (error: any) {
      console.error('Failed to delete document:', error);
      toast.error(error.response?.data?.message || 'Gagal menghapus dokumen');
    } finally {
      setIsResetting(false);
    }
  };

  const handleClearSection = async (section: string, sectionLabel: string) => {
    if (!documentId || !user?.id) {
      toast.error('Document ID atau User ID tidak tersedia');
      return;
    }

    const confirmed = window.confirm(
      `Yakin ingin reset section "${sectionLabel}"? Data akan dikosongkan.`
    );

    if (!confirmed) return;

    setIsResetting(true);
    try {
      await clearSection({
        documentId,
        userId: user.id,
        section,
      });
      toast.success(`✅ Section "${sectionLabel}" berhasil di-reset`);
      onResetComplete?.();
    } catch (error: any) {
      console.error('Failed to clear section:', error);
      toast.error(error.response?.data?.message || 'Gagal reset section');
    } finally {
      setIsResetting(false);
    }
  };

  const handleCreateDocument = async (documentName: string) => {
    if (!onCreateDocument) {
      toast.error('Create document handler not provided');
      return;
    }

    setIsCreatingDoc(true);
    try {
      await onCreateDocument(documentName);
      toast.success(`✅ Dokumen "${documentName}" berhasil dibuat`);
    } catch (error: any) {
      console.error('Failed to create document:', error);
      toast.error(error.response?.data?.message || 'Gagal membuat dokumen');
      throw error; // Re-throw to prevent dialog from closing
    } finally {
      setIsCreatingDoc(false);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-[100] flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              className="h-9 w-9 rounded-lg bg-white shadow-sm hover:bg-gray-50"
            >
              <Icon icon="solar:add-circle-bold" height={20} className="text-gray-700" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Chat Baru</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenHistory}
              className="h-9 w-9 rounded-lg bg-white shadow-sm hover:bg-gray-50"
            >
              <Icon icon="solar:history-bold" height={20} className="text-gray-700" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Riwayat Chat</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Document Manager Dialog */}
      {onCreateDocument && onSwitchDocument && onDeleteDocument && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <DocumentManagerDialog
                  agentId={agentId}
                  currentDocumentId={documentId}
                  onCreateDocument={handleCreateDocument}
                  onSwitchDocument={onSwitchDocument}
                  onDeleteDocument={onDeleteDocument}
                  existingDocCount={existingDocCount}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Kelola Dokumen</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Hidden: Reset Operations - Replaced with New Document feature */}
    </div>
  );
};

export default ChatHeader;
