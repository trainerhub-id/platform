/**
 * New Document Dialog Component
 * Modal dialog untuk create dokumen baru dengan nama custom
 */

import { useState } from "react";
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
import { Label } from "src/components/ui/label";

interface NewDocumentDialogProps {
  onCreateDocument: (documentName: string) => Promise<void>;
  isCreating: boolean;
  existingDocCount: number; // Untuk auto-generate nama
  agentId?: string;
}

export const NewDocumentDialog: React.FC<NewDocumentDialogProps> = ({
  onCreateDocument,
  isCreating,
  existingDocCount,
  agentId,
}) => {
  const [open, setOpen] = useState(false);
  const [documentName, setDocumentName] = useState("");

  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    // Auto-generate nama jika kosong
    const fallbackName = agentId === 'master'
      ? `Master ${existingDocCount + 1}`
      : `Pelatihan ${existingDocCount + 1}`;
    const finalName = documentName.trim() || fallbackName;
    
    setError(null);
    try {
      await onCreateDocument(finalName);
      setOpen(false);
      setDocumentName(""); // Reset form
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal membuat dokumen';
      setError(message);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setDocumentName(""); // Reset saat dialog ditutup
      setError(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg bg-white shadow-sm hover:bg-gray-50"
          disabled={isCreating}
        >
          <Icon 
            icon={isCreating ? "svg-spinners:ring-resize" : "solar:document-add-bold"} 
            height={20} 
            className="text-gray-700" 
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Dokumen Baru</DialogTitle>
          <DialogDescription>
            Buat dokumen pelatihan baru. Kosongkan nama untuk auto-generate.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="documentName">
              Nama Dokumen <span className="text-muted-foreground text-sm">(opsional)</span>
            </Label>
            <Input
              id="documentName"
              placeholder={agentId === 'master' ? `Master ${existingDocCount + 1}` : `Pelatihan ${existingDocCount + 1}`}
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isCreating) {
                  handleCreate();
                }
              }}
              disabled={isCreating}
              autoFocus
            />
            <p className="text-sm text-muted-foreground">
              Kosongkan untuk otomatis: "{agentId === 'master' ? 'Master' : 'Pelatihan'} {existingDocCount + 1}"
            </p>
          </div>
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Batal
          </Button>
          <Button
            type="submit"
            onClick={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Icon icon="svg-spinners:ring-resize" className="mr-2 h-4 w-4" />
                Membuat...
              </>
            ) : (
              <>
                <Icon icon="solar:document-add-bold" className="mr-2 h-4 w-4" />
                Buat Dokumen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewDocumentDialog;
