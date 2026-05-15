/**
 * Chat History Panel Component
 * Modal/popup that displays chat session history
 */

import { Icon } from "@iconify/react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "src/components/ui/dialog";
import { Button } from "src/components/ui/button";
import { ScrollArea } from "src/components/ui/scroll-area";
import { useState } from "react";

export interface ChatSessionSummary {
  id: string;
  title: string | null;
  agentType: string;
  messageCount: number;
  lastMessagePreview: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

interface ChatHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSessionSummary[];
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading: boolean;
  currentSessionId?: string | null;
}

export const ChatHistoryPanel: React.FC<ChatHistoryPanelProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
  isLoading,
  currentSessionId,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleSelectSession = (sessionId: string) => {
    onSelectSession(sessionId);
  };

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setDeleteConfirmId(sessionId);
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmId) {
      onDeleteSession(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === "string" ? new Date(date) : date;
    return format(d, "d MMM yyyy, HH:mm", { locale: id });
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="solar:history-bold" height={20} className="text-primary" />
              Riwayat Chat
            </DialogTitle>
            <DialogDescription>
              Pilih percakapan sebelumnya untuk melanjutkan
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon icon="svg-spinners:ring-resize" height={32} className="text-primary" />
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Icon icon="solar:chat-line-bold-duotone" height={48} className="text-gray-300 mb-3" />
                <p className="text-sm text-bodytext">Belum ada riwayat chat</p>
                <p className="text-xs text-gray-400 mt-1">Mulai percakapan baru untuk melihat riwayat</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm group ${
                      currentSessionId === session.id
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-primary/30 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-dark truncate">
                          {session.title || "Percakapan Baru"}
                        </h4>
                        {session.lastMessagePreview && (
                          <p className="text-xs text-bodytext mt-1 line-clamp-2">
                            {session.lastMessagePreview}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Icon icon="solar:chat-round-dots-linear" height={12} />
                            {session.messageCount} pesan
                          </span>
                          <span>{formatDate(session.updatedAt)}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={(e) => handleDeleteClick(e, session.id)}
                      >
                        <Icon icon="solar:trash-bin-trash-bold" height={16} className="text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Percakapan?</DialogTitle>
            <DialogDescription>
              Percakapan ini akan dihapus secara permanen dan tidak dapat dikembalikan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ChatHistoryPanel;
