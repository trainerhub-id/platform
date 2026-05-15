import { useState, useRef } from 'react';
import { Button } from 'src/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from 'src/components/ui/dialog';
import { Icon } from '@iconify/react';
import { useDokumen } from '../hooks/useDokumen';
import { ButtonLoading } from 'src/components/ui/loading';

interface UploadDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    jenisDokumenId: string;
    jenisDokumenName: string;
    onSuccess: () => void;
}

export const UploadDocumentModal = ({
    isOpen,
    onClose,
    jenisDokumenId,
    jenisDokumenName,
    onSuccess,
}: UploadDocumentModalProps) => {
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadDocument } = useDokumen();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        setUploading(true);
        try {
            await uploadDocument(file, jenisDokumenId);
            onSuccess();
            onClose();
            setFile(null);
        } catch (error) {
            console.error('Upload failed', error);
            alert('Gagal mengunggah dokumen. Silakan coba lagi.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Unggah Dokumen</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <p className="text-sm text-gray-500">
                        Unggah dokumen untuk: <span className="font-semibold text-gray-900">{jenisDokumenName}</span>
                    </p>

                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${file ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary'
                            }`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                        />

                        {file ? (
                            <div className="flex flex-col items-center gap-2">
                                <Icon icon="solar:file-check-line-duotone" className="text-4xl text-primary" />
                                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 text-red-500 hover:text-red-600"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setFile(null);
                                    }}
                                >
                                    Hapus
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                <Icon icon="solar:cloud-upload-line-duotone" className="text-4xl" />
                                <span className="text-sm font-medium">Klik atau tarik file ke sini</span>
                                <span className="text-xs">PDF, JPG, PNG (Max 10MB)</span>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={uploading}>
                        Batal
                    </Button>
                    <Button onClick={handleSubmit} disabled={!file || uploading}>
                        {uploading ? (
                            <>
                                <ButtonLoading />
                                Mengunggah...
                            </>
                        ) : (
                            'Unggah'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
