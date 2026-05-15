import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'src/components/ui/button';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Sheet, SheetContent } from 'src/components/ui/sheet';
import { Progress } from 'src/components/ui/progress';

import { MasterSidebarSectionState } from './master-sidebar.helpers';

interface MasterFieldEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  section: MasterSidebarSectionState | null;
  onAskAI: (prompt: string) => void;
  onSave?: (values: Record<string, string>) => Promise<void> | void;
}

const buildInitialValues = (section: MasterSidebarSectionState) =>
  Object.fromEntries(section.fields.map((field) => [field.key, field.value]));

export const MasterFieldEditDrawerContent: React.FC<Omit<MasterFieldEditDrawerProps, 'isOpen'>> = ({
  section,
  onClose,
  onAskAI,
  onSave,
}) => {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const fieldValuesRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (section) {
      const initialValues = buildInitialValues(section);
      setFieldValues(initialValues);
      fieldValuesRef.current = initialValues;
    } else {
      setFieldValues({});
      fieldValuesRef.current = {};
    }
  }, [section]);

  const hasEditableFields = useMemo(
    () => !!section && section.fields.length > 0 && !section.readOnly && !!onSave,
    [section, onSave],
  );

  if (!section) return null;

  const handleFieldChange = (key: string, value: string) => {
    fieldValuesRef.current = {
      ...fieldValuesRef.current,
      [key]: value,
    };
    setFieldValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const canAskAI = Boolean(section.askAiPrompt);

  const handleAskAI = () => {
    if (!section.askAiPrompt) return;
    onAskAI(section.askAiPrompt);
  };

  const handleSave = async () => {
    if (!onSave || section.readOnly) return;
    setIsSaving(true);
    try {
      await Promise.resolve(onSave(fieldValuesRef.current));
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="sticky top-0 z-10 border-b bg-white px-5 py-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{section.label}</h2>
          <p className="text-xs text-bodytext">
            {section.fields.length === 0
              ? section.summary || 'Tidak ada field di bagian ini'
              : `${section.completedFields}/${section.totalFields} field lengkap (${section.completionPercent}%)`}
          </p>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-[10px] text-bodytext">
            <span>
              {section.completedFields}/{section.totalFields} field
            </span>
            <span>{section.completionPercent}%</span>
          </div>
          <Progress value={section.completionPercent} className="h-1.5" />
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {section.fields.length === 0 ? (
          <p className="text-sm text-bodytext">
            Semua informasi di bagian ini dibangun dari ringkasan profil.
          </p>
        ) : (
          <div className="space-y-4">
            {section.fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label htmlFor={field.key} className="text-xs">
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  value={fieldValues[field.key] ?? ''}
                  onChange={(event) => handleFieldChange(field.key, event.target.value)}
                  placeholder={`Masukkan ${field.label}`}
                  className="text-sm"
                  disabled={section.readOnly}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
        <Button variant="outline" size="sm" onClick={onClose}>
          Tutup
        </Button>
        {canAskAI && (
          <Button size="sm" onClick={handleAskAI}>
            Isi dengan AI
          </Button>
        )}
        {hasEditableFields && (
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </Button>
        )}
      </div>
    </div>
  );
};

export const MasterFieldEditDrawer: React.FC<MasterFieldEditDrawerProps> = ({
  isOpen,
  onClose,
  section,
  onAskAI,
  onSave,
}) => {
  if (!section) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <MasterFieldEditDrawerContent
          section={section}
          onAskAI={onAskAI}
          onClose={onClose}
          onSave={onSave}
        />
      </SheetContent>
    </Sheet>
  );
};
