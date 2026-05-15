/**
 * Field Edit Drawer
 * 
 * Shows missing fields for a document with options to:
 * - Fill fields manually via form
 * - Ask AI to help fill fields
 */

import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { Badge } from "src/components/ui/badge";
import { DynamicArrayInput } from "./DynamicArrayInput";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "src/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "src/components/ui/tooltip";
import { Progress } from "src/components/ui/progress";
import { toast } from "src/hooks/use-toast";

interface FieldValidationResult {
  field: string;           // masterJson path (e.g., 'sdm.trainer')
  templateField: string;   // template placeholder (e.g., 'trainer')
  displayName: string;
  status: 'complete' | 'incomplete' | 'partial';
  currentValue?: any;
  message?: string;
  aiPrompt?: string;
}

interface DocumentValidationResult {
  templateName: string;
  displayName: string;
  category: string;
  canGenerate: boolean;
  completionPercent: number;
  totalFields: number;
  completedFields: number;
  missingFields: FieldValidationResult[];
  allFields: FieldValidationResult[];
}

interface FieldEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentValidationResult | null;
  onAskAI: (prompt: string) => void;
  onSave?: (fields: Record<string, any>) => Promise<void>;
  onGenerate?: (templateName: string) => Promise<void>;
}

export const FieldEditDrawer: React.FC<FieldEditDrawerProps> = ({
  isOpen,
  onClose,
  document,
  onAskAI,
  onSave,
  onGenerate,
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [arrayValues, setArrayValues] = useState<Record<string, any[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  // Reset form when document changes
  useEffect(() => {
    if (document) {
      const initialStringValues: Record<string, string> = {};
      const initialArrayValues: Record<string, any[]> = {};
      
      document.allFields.forEach((field) => {
        if (typeof field.currentValue === 'string') {
          initialStringValues[field.field] = field.currentValue;
        } else if (field.currentValue && typeof field.currentValue === 'object' && field.currentValue._type === 'array') {
          // Array field - use _data if available
          initialArrayValues[field.field] = field.currentValue._data || [];
        } else if (field.currentValue && typeof field.currentValue === 'object') {
          // Other object - might be a non-array object value
          initialStringValues[field.field] = '';
        } else {
          initialStringValues[field.field] = '';
        }
      });
      
      setFieldValues(initialStringValues);
      setArrayValues(initialArrayValues);
      
      // Auto-expand first 3 incomplete fields
      const incompleteFields = document.allFields
        .filter((f) => f.status !== 'complete')
        .slice(0, 3)
        .map((f) => f.field);
      setExpandedFields(new Set(incompleteFields));
    }
  }, [document]);

  if (!document) return null;

  // Check if field is an array type (needs AI to fill)
  const isArrayField = (field: FieldValidationResult): boolean => {
    // Check if currentValue indicates array type
    if (field.currentValue && typeof field.currentValue === 'object' && field.currentValue._type === 'array') {
      return true;
    }
    // Check common array field paths
    const arrayPaths = [
      'elements', 'items', 'questions', 'modules', 'materials', 'equipment',
      'functions', 'sections', 'trainer', 'material'
    ];
    return arrayPaths.some(p => field.field.toLowerCase().includes(p));
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleArrayChange = (fieldKey: string, value: any[]) => {
    setArrayValues((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleAskAI = (field: FieldValidationResult) => {
    const prompt = field.aiPrompt || `Saya ingin mengisi ${field.displayName} untuk dokumen ${document.displayName}`;
    onAskAI(prompt);
    onClose();
  };

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      const fieldsToSave: Record<string, any> = {};
      
      // Add string fields
      for (const [key, value] of Object.entries(fieldValues)) {
        // Skip empty values (value might not be a string in some cases)
        if (!value || (typeof value === 'string' && value.trim() === '')) continue;
        
        // Skip array/object summary values (from sanitizeValue)
        if (typeof value === 'string' && (value.includes(' item(s)') || value.includes(' field(s)'))) continue;
        
        // Find the field definition
        const fieldDef = document?.allFields.find(f => f.field === key);
        
        // Skip if this is an array field (handled separately)
        if (fieldDef && isArrayField(fieldDef)) continue;
        
        fieldsToSave[key] = value;
      }

      // Add array fields
      for (const [key, value] of Object.entries(arrayValues)) {
        // Skip empty arrays
        if (!value || value.length === 0) continue;
        
        // Filter out empty items
        const nonEmptyItems = value.filter(item => {
          if (typeof item === 'string') return item.trim() !== '';
          if (item && typeof item === 'object') {
            return Object.values(item).some(v => v != null && String(v).trim() !== '');
          }
          return item != null;
        });
        
        if (nonEmptyItems.length > 0) {
          fieldsToSave[key] = nonEmptyItems;
        }
      }

      if (Object.keys(fieldsToSave).length === 0) {
        toast({
          title: 'Tidak ada perubahan',
          description: 'Tidak ada data yang perlu disimpan.',
        });
        return;
      }

      await onSave(fieldsToSave);
      toast({
        title: 'Berhasil disimpan',
        description: 'Data berhasil disimpan.',
      });
      onClose();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Gagal menyimpan',
        description: 'Tidak dapat menyimpan data. Silakan coba lagi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleFieldExpanded = (field: string) => {
    setExpandedFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  };

  const getStatusBadge = (status: 'complete' | 'incomplete' | 'partial') => {
    switch (status) {
      case 'complete':
        return <Badge variant="default" className="bg-green-100 text-green-700 text-[10px]">Lengkap</Badge>;
      case 'partial':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-700 text-[10px]">Sebagian</Badge>;
      case 'incomplete':
        return <Badge variant="outline" className="text-[10px]">Belum diisi</Badge>;
    }
  };

  const incompleteFields = document.allFields.filter((f) => f.status !== 'complete');
  const completeFields = document.allFields.filter((f) => f.status === 'complete');

  const handleGenerate = async () => {
    if (!onGenerate || !document.canGenerate) return;
    setIsGenerating(true);
    try {
      await onGenerate(document.templateName);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-white border-b px-5 py-4">
          <SheetHeader className="space-y-1">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Icon icon="solar:document-text-bold" height={18} className="text-primary" />
              {document.displayName}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {document.canGenerate ? (
                <span className="text-green-600 flex items-center gap-1">
                  <Icon icon="solar:check-circle-bold" height={12} />
                  Siap di-generate
                </span>
              ) : (
                <span className="text-bodytext">
                  {incompleteFields.length} field belum lengkap
                </span>
              )}
            </SheetDescription>
          </SheetHeader>
          
          {/* Progress & Generate Button */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1">
              <div className="flex items-center justify-between text-[10px] text-bodytext mb-1">
                <span>{document.completedFields}/{document.totalFields} field</span>
                <span>{document.completionPercent}%</span>
              </div>
              <Progress 
                value={document.completionPercent} 
                variant={document.canGenerate ? 'success' : 'warning'}
                className="h-1.5" 
              />
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      size="sm"
                      className="gap-1 text-xs"
                      disabled={!document.canGenerate || isGenerating}
                      onClick={handleGenerate}
                    >
                      {isGenerating ? (
                        <Icon icon="svg-spinners:ring-resize" height={12} />
                      ) : (
                        <Icon icon="solar:download-bold" height={12} />
                      )}
                      Generate
                    </Button>
                  </span>
                </TooltipTrigger>
                {!document.canGenerate && (
                  <TooltipContent side="bottom">
                    <p className="text-xs">Lengkapi {incompleteFields.length} field dulu</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Incomplete Fields */}
          {incompleteFields.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-dark flex items-center gap-2">
                <Icon icon="solar:danger-triangle-bold" height={14} className="text-warning" />
                Perlu Dilengkapi ({incompleteFields.length})
              </h4>

              {incompleteFields.map((field) => (
                <div
                  key={field.field}
                  className="border border-yellow-200 bg-yellow-50/50 rounded-lg p-3"
                >
                  <button
                    onClick={() => toggleFieldExpanded(field.field)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{field.displayName}</span>
                      {getStatusBadge(field.status)}
                    </div>
                    <Icon
                      icon={expandedFields.has(field.field) ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'}
                      height={14}
                      className="text-gray-400"
                    />
                  </button>

                  {expandedFields.has(field.field) && (
                    <div className="mt-3 space-y-3">
                      {field.message && (
                        <p className="text-xs text-bodytext">{field.message}</p>
                      )}

                      {/* Check if this is an array/object field */}
                      {isArrayField(field) ? (
                        // Array fields - show dynamic list form
                        <div className="space-y-3">
                          <DynamicArrayInput
                            fieldPath={field.field}
                            displayName={field.displayName}
                            value={arrayValues[field.field] || []}
                            onChange={(value) => handleArrayChange(field.field, value)}
                          />
                          
                          {/* Or use AI */}
                          <div className="border-t pt-3">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-1 text-xs"
                              onClick={() => handleAskAI(field)}
                            >
                              <Icon icon="solar:magic-stick-3-bold" height={14} />
                              Atau minta AI untuk mengisi otomatis
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Simple string fields can be edited manually
                        <>
                          <div className="space-y-1">
                            <Label htmlFor={field.field} className="text-xs">
                              {field.displayName}
                            </Label>
                            <Input
                              id={field.field}
                              value={fieldValues[field.field] || ''}
                              onChange={(e) => handleFieldChange(field.field, e.target.value)}
                              placeholder={`Masukkan ${field.displayName}...`}
                              className="text-sm"
                            />
                          </div>

                          {/* Ask AI Button */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-1 text-xs"
                            onClick={() => handleAskAI(field)}
                          >
                            <Icon icon="solar:magic-stick-3-bold" height={14} />
                            Atau tanya AI untuk mengisi
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Complete Fields (Collapsed by default) */}
          {completeFields.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-dark flex items-center gap-2">
                <Icon icon="solar:check-circle-bold" height={14} className="text-success" />
                Sudah Lengkap ({completeFields.length})
              </h4>

              <div className="space-y-1">
                {completeFields.map((field) => (
                  <div
                    key={field.field}
                    className="border border-green-200 bg-green-50/50 rounded-lg p-3"
                  >
                    <button
                      onClick={() => toggleFieldExpanded(field.field)}
                      className="w-full flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon="solar:check-circle-bold" height={12} className="text-green-500" />
                        <span className="text-sm font-medium text-green-700">{field.displayName}</span>
                      </div>
                      <span className="text-xs text-green-600 hover:text-green-800">
                        {expandedFields.has(field.field) ? 'Tutup' : 'Edit'}
                      </span>
                    </button>

                    {expandedFields.has(field.field) && (
                      <div className="mt-3 space-y-3">
                        {/* Show current value summary */}
                        {field.currentValue && (
                          <div className="text-xs text-bodytext bg-white p-2 rounded border border-green-100">
                            <span className="font-medium">Nilai saat ini: </span>
                            {typeof field.currentValue === 'object' && field.currentValue._type === 'array'
                              ? `${field.currentValue._count} item`
                              : typeof field.currentValue === 'object'
                                ? `${Object.keys(field.currentValue).length} field`
                                : String(field.currentValue)}
                          </div>
                        )}

                        {/* Check if this is an array/object field */}
                        {isArrayField(field) ? (
                          // Array fields - show dynamic list form
                          <div className="space-y-3">
                            <DynamicArrayInput
                              fieldPath={field.field}
                              displayName={field.displayName}
                              value={arrayValues[field.field] || []}
                              onChange={(value) => handleArrayChange(field.field, value)}
                            />
                            
                            {/* Or use AI */}
                            <div className="border-t pt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full gap-1 text-xs"
                                onClick={() => handleAskAI(field)}
                              >
                                <Icon icon="solar:magic-stick-3-bold" height={14} />
                                Atau minta AI untuk mengubah
                              </Button>
                            </div>
                          </div>
                        ) : (
                          // Simple string fields can be edited manually
                          <>
                            <div className="space-y-1">
                              <Label htmlFor={field.field} className="text-xs">
                                {field.displayName}
                              </Label>
                              <Input
                                id={field.field}
                                value={fieldValues[field.field] || ''}
                                onChange={(e) => handleFieldChange(field.field, e.target.value)}
                                placeholder={`Ubah ${field.displayName}...`}
                                className="text-sm"
                              />
                            </div>

                            {/* Ask AI Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-1 text-xs"
                              onClick={() => handleAskAI(field)}
                            >
                              <Icon icon="solar:magic-stick-3-bold" height={14} />
                              Atau tanya AI untuk mengubah
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-5 py-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Tutup
          </Button>
          {onSave && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" height={12} className="mr-1" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Icon icon="solar:diskette-bold" height={12} className="mr-1" />
                  Simpan
                </>
              )}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
