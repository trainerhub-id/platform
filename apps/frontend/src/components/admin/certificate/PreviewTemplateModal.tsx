import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { certificateTemplateApi } from 'src/api/certificate-template.api';
import { Loader2, Download } from 'lucide-react';
import { Alert, AlertDescription } from 'src/components/ui/alert';

interface PreviewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  htmlContent: string;
}

export const PreviewTemplateModal: React.FC<PreviewTemplateModalProps> = ({
  isOpen,
  onClose,
  htmlContent,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && htmlContent) {
      generatePreview();
    }
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [isOpen, htmlContent]);

  const generatePreview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const pdfBlob = await certificateTemplateApi.previewTemplate(htmlContent);
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal generate preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'preview-certificate.pdf';
      link.click();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Preview Template</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4">
          {isLoading && (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {pdfUrl && !isLoading && (
            <>
              <div className="flex-1 border rounded-md overflow-hidden">
                <iframe src={pdfUrl} className="w-full h-full" title="Certificate Preview" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onClose}>
                  Tutup
                </Button>
                <Button onClick={handleDownload}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Preview
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
