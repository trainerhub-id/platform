/**
 * Document Manager Dialog Component
 * Modal dialog for managing documents: switch, delete, create new, rename
 */

import { useState, useEffect, useRef } from "react";
import { Icon } from "@iconify/react";
import { Button } from "src/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "src/components/ui/dialog";
import { Input } from "src/components/ui/input";
import { Badge } from "src/components/ui/badge";
import { ScrollArea } from "src/components/ui/scroll-area";
import api from "src/api/axios";
import { toast } from "sonner";

interface DocumentItem {
    id: string;
    name: string;
    createdAt: string;
    state: string;
}

interface DocumentManagerDialogProps {
    agentId: string;
    currentDocumentId?: string;
    onSwitchDocument: (documentId: string) => Promise<void>;
    onCreateDocument: (documentName: string) => Promise<void>;
    onDeleteDocument: (documentId: string) => Promise<void>;
    existingDocCount?: number;
}

export const DocumentManagerDialog: React.FC<DocumentManagerDialogProps> = ({
    agentId,
    currentDocumentId,
    onSwitchDocument,
    onCreateDocument,
    onDeleteDocument,
}) => {
    const [open, setOpen] = useState(false);
    const [documents, setDocuments] = useState<DocumentItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isSwitching, setIsSwitching] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const [showCreateInput, setShowCreateInput] = useState(false);
    const [documentName, setDocumentName] = useState("");

    // Rename state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState("");
    const [isRenaming, setIsRenaming] = useState(false);
    const renameInputRef = useRef<HTMLInputElement>(null);

    const hasNonEmptyString = (value: unknown): boolean =>
        typeof value === 'string' && value.trim().length > 0;

    const isDocumentCompatibleWithAgent = (masterJson: any): boolean => {
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

    // Fetch documents when dialog opens
    useEffect(() => {
        if (open) {
            fetchDocuments();
            setShowCreateInput(false);
            setDocumentName("");
            setEditingId(null);
        }
    }, [open]);

    // Focus rename input when editing starts
    useEffect(() => {
        if (editingId && renameInputRef.current) {
            renameInputRef.current.focus();
            renameInputRef.current.select();
        }
    }, [editingId]);

    const fetchDocuments = async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get('/ai/document/list');
            if (!Array.isArray(data)) {
                setDocuments([]);
                return;
            }

            const filteredDocs = await Promise.all(
                data.map(async (doc: DocumentItem) => {
                    try {
                        const { data: progressData } = await api.get(`/ai/document/progress/${doc.id}`);
                        return isDocumentCompatibleWithAgent(progressData?.masterJson) ? doc : null;
                    } catch (error) {
                        console.warn('[DocumentManagerDialog] Failed to inspect document compatibility:', doc.id, error);
                        return null;
                    }
                })
            );

            setDocuments(filteredDocs.filter(Boolean) as DocumentItem[]);
        } catch (error) {
            console.error('Failed to fetch documents:', error);
            toast.error('Gagal memuat daftar dokumen');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitch = async (docId: string) => {
        if (docId === currentDocumentId || editingId) return;

        setIsSwitching(docId);
        try {
            await onSwitchDocument(docId);
            toast.success('Beralih ke dokumen');
            setOpen(false);
        } catch (error) {
            console.error('Failed to switch document:', error);
            toast.error('Gagal beralih dokumen');
        } finally {
            setIsSwitching(null);
        }
    };

    const handleDelete = async (docId: string, docName: string) => {
        const confirmed = window.confirm(
            `Yakin ingin menghapus "${docName}"?\n\nTindakan ini TIDAK DAPAT dibatalkan!`
        );
        if (!confirmed) return;

        setIsDeleting(docId);
        try {
            await onDeleteDocument(docId);
            toast.success(`Dokumen "${docName}" berhasil dihapus`);
            await fetchDocuments();
            if (docId === currentDocumentId) {
                setOpen(false);
            }
        } catch (error) {
            console.error('Failed to delete document:', error);
            toast.error('Gagal menghapus dokumen');
        } finally {
            setIsDeleting(null);
        }
    };

    const handleCreate = async () => {
        const fallbackName = agentId === 'master'
            ? `Master ${documents.length + 1}`
            : `Pelatihan ${documents.length + 1}`;
        const finalName = documentName.trim() || fallbackName;

        setIsCreating(true);
        try {
            await onCreateDocument(finalName);
            toast.success(`Dokumen "${finalName}" berhasil dibuat`);
            setOpen(false);
            setDocumentName("");
            setShowCreateInput(false);
        } catch (error) {
            console.error('Failed to create document:', error);
            toast.error('Gagal membuat dokumen');
        } finally {
            setIsCreating(false);
        }
    };

    const startRename = (doc: DocumentItem) => {
        setEditingId(doc.id);
        setEditingName(doc.name);
    };

    const cancelRename = () => {
        setEditingId(null);
        setEditingName("");
    };

    const handleRename = async () => {
        if (!editingId || !editingName.trim()) {
            cancelRename();
            return;
        }

        setIsRenaming(true);
        try {
            await api.post(`/ai/document/${editingId}/rename`, { name: editingName.trim() });
            toast.success('Nama dokumen berhasil diubah');
            await fetchDocuments();
            cancelRename();
        } catch (error) {
            console.error('Failed to rename document:', error);
            toast.error('Gagal mengubah nama dokumen');
        } finally {
            setIsRenaming(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const getStateBadge = (state: string) => {
        switch (state) {
            case 'ready':
                return <Badge variant="default" className="bg-green-500 text-[10px]">Selesai</Badge>;
            case 'in_progress':
                return <Badge variant="secondary" className="text-[10px]">Progress</Badge>;
            default:
                return <Badge variant="outline" className="text-[10px]">Draft</Badge>;
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg bg-white shadow-sm hover:bg-gray-50"
                >
                    <Icon icon="solar:folder-with-files-bold" height={20} className="text-gray-700" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]" hideCloseButton>
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <Icon icon="solar:folder-with-files-bold" height={20} />
                            Dokumen Saya
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCreateInput(!showCreateInput)}
                            disabled={isCreating}
                            className="h-8"
                        >
                            <Icon icon="solar:add-circle-bold" height={16} className="mr-1" />
                            Baru
                        </Button>
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Kelola dokumen pelatihan Anda
                    </DialogDescription>
                </DialogHeader>

                {/* Inline Create Form */}
                {showCreateInput && (
                    <div className="flex gap-2 p-3 rounded-md bg-muted/50 border border-dashed">
                        <Input
                            placeholder={`Pelatihan ${documents.length + 1}`}
                            value={documentName}
                            onChange={(e) => setDocumentName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !isCreating) handleCreate();
                                if (e.key === "Escape") {
                                    setShowCreateInput(false);
                                    setDocumentName("");
                                }
                            }}
                            disabled={isCreating}
                            autoFocus
                            className="flex-1"
                        />
                        <Button onClick={handleCreate} disabled={isCreating} size="sm">
                            {isCreating ? <Icon icon="svg-spinners:ring-resize" height={16} /> : "Buat"}
                        </Button>
                    </div>
                )}

                {/* Document List */}
                <div className="mt-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Icon icon="svg-spinners:ring-resize" height={32} className="text-primary" />
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Icon icon="solar:document-bold" height={48} className="mx-auto mb-2 opacity-50" />
                            <p>Belum ada dokumen</p>
                            <Button variant="link" onClick={() => setShowCreateInput(true)} className="mt-2">
                                Buat dokumen pertama
                            </Button>
                        </div>
                    ) : (
                        <ScrollArea className="h-[280px] pr-2">
                            <div className="space-y-1.5">
                                {documents.map((doc) => {
                                    const isActive = doc.id === currentDocumentId;
                                    const isCurrentSwitching = isSwitching === doc.id;
                                    const isCurrentDeleting = isDeleting === doc.id;
                                    const isEditing = editingId === doc.id;

                                    return (
                                        <div
                                            key={doc.id}
                                            className={`p-2.5 rounded-md border transition-all group ${isActive
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer'
                                                }`}
                                            onClick={() => !isActive && !isEditing && handleSwitch(doc.id)}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex-1 min-w-0">
                                                    {isEditing ? (
                                                        <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                            <Input
                                                                ref={renameInputRef}
                                                                value={editingName}
                                                                onChange={(e) => setEditingName(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === "Enter") handleRename();
                                                                    if (e.key === "Escape") cancelRename();
                                                                }}
                                                                disabled={isRenaming}
                                                                className="h-7 text-sm"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                className="h-7 px-2"
                                                                onClick={handleRename}
                                                                disabled={isRenaming}
                                                            >
                                                                {isRenaming ? (
                                                                    <Icon icon="svg-spinners:ring-resize" height={12} />
                                                                ) : (
                                                                    <Icon icon="solar:check-circle-bold" height={14} />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-7 px-2"
                                                                onClick={cancelRename}
                                                                disabled={isRenaming}
                                                            >
                                                                <Icon icon="solar:close-circle-bold" height={14} />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <Icon
                                                                    icon="solar:document-bold"
                                                                    height={14}
                                                                    className={isActive ? 'text-primary flex-shrink-0' : 'text-muted-foreground flex-shrink-0'}
                                                                />
                                                                <span className="font-medium truncate text-sm flex-1">{doc.name}</span>
                                                                {isActive && (
                                                                    <Badge variant="default" className="bg-primary text-[10px] px-1.5 flex-shrink-0">
                                                                        Aktif
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground ml-5 mt-0.5">
                                                                <span>{formatDate(doc.createdAt)}</span>
                                                                {!isActive && (
                                                                    <>
                                                                        <span>•</span>
                                                                        {getStateBadge(doc.state)}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>

                                                {!isEditing && (
                                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {isCurrentSwitching && (
                                                            <Icon icon="svg-spinners:ring-resize" height={14} className="text-primary" />
                                                        )}
                                                        {/* Rename button */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                startRename(doc);
                                                            }}
                                                            disabled={isCurrentSwitching || isCurrentDeleting}
                                                            className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <Icon icon="solar:pen-bold" height={12} />
                                                        </Button>
                                                        {/* Delete button */}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(doc.id, doc.name);
                                                            }}
                                                            disabled={isCurrentSwitching || isCurrentDeleting}
                                                            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            {isCurrentDeleting ? (
                                                                <Icon icon="svg-spinners:ring-resize" height={12} />
                                                            ) : (
                                                                <Icon icon="solar:trash-bin-trash-bold" height={12} />
                                                            )}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentManagerDialog;
