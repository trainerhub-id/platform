import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from 'src/components/ui/dialog';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Alert, AlertDescription } from 'src/components/ui/alert';
import { certificateTemplateApi } from 'src/api/certificate-template.api';
import { Loader2, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface UploadTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UploadTemplateModal: React.FC<UploadTemplateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [templateName, setTemplateName] = useState('');
  const [htmlFile, setHtmlFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.html')) {
      setErrors(['File harus berformat .html']);
      setIsValid(false);
      return;
    }

    setHtmlFile(file);
    setErrors([]);
    setIsValid(false);

    // Read file content
    const content = await file.text();
    setHtmlContent(content);

    // Validate
    setIsValidating(true);
    try {
      const validation = await certificateTemplateApi.validateTemplate(content);
      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsValid(false);
      } else {
        setIsValid(true);
      }
    } catch (error) {
      setErrors(['Gagal memvalidasi template']);
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpload = async () => {
    if (!htmlFile || !htmlContent || !templateName || !isValid) {
      return;
    }

    setIsUploading(true);
    try {
      await certificateTemplateApi.uploadTemplate({
        name: templateName,
        htmlContent,
      });
      onSuccess();
      // Reset form
      setTemplateName('');
      setHtmlFile(null);
      setHtmlContent('');
      setErrors([]);
      setIsValid(false);
      onClose();
    } catch (error: any) {
      setErrors([error?.response?.data?.message || 'Gagal mengupload template']);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Template Sertifikat</DialogTitle>
          <DialogDescription>
            Upload template HTML untuk sertifikat. Template harus mengandung semua variabel yang
            diperlukan.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Nama Template</Label>
            <Input
              id="template-name"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Contoh: Template Modern 2026"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="html-file">File HTML</Label>
            <Input id="html-file" type="file" accept=".html" onChange={handleFileChange} />
          </div>

          {isValidating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Memvalidasi template...
            </div>
          )}

          {isValid && errors.length === 0 && htmlFile && (
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Template valid dan siap diupload
              </AlertDescription>
            </Alert>
          )}

          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Batal
          </Button>
          <Button onClick={handleUpload} disabled={!isValid || !templateName || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Mengupload...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
