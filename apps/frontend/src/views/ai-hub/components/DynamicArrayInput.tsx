/**
 * Dynamic Array Input Component
 * 
 * Provides a user-friendly interface for editing array fields.
 * Supports simple string arrays and object arrays with nested fields.
 */

import { Icon } from "@iconify/react";
import { useState, useEffect, useMemo } from "react";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Textarea } from "src/components/ui/textarea";
import { Label } from "src/components/ui/label";

interface DynamicArrayInputProps {
  fieldPath: string;
  displayName: string;
  value: any[];
  onChange: (value: any[]) => void;
  placeholder?: string;
}

// Define known array field structures
const ARRAY_FIELD_SCHEMAS: Record<string, { fields: { key: string; label: string; type: 'text' | 'textarea' }[] }> = {
  'unit.elements': {
    fields: [
      { key: 'element_text', label: 'Nama Elemen', type: 'text' },
      { key: 'kuk', label: 'Kriteria Unjuk Kerja (pisahkan dengan enter)', type: 'textarea' },
    ],
  },
  'competency_map.key_functions': {
    fields: [
      { key: 'name', label: 'Fungsi Kunci', type: 'text' },
    ],
  },
  'competency_map.main_functions': {
    fields: [
      { key: 'name', label: 'Fungsi Utama', type: 'text' },
    ],
  },
  'competency_map.basic_functions': {
    fields: [
      { key: 'name', label: 'Fungsi Dasar', type: 'text' },
    ],
  },
  'curriculum.modules': {
    fields: [
      { key: 'name', label: 'Nama Modul', type: 'text' },
      { key: 'description', label: 'Deskripsi', type: 'textarea' },
    ],
  },
  'resources.materials': {
    fields: [
      { key: 'name', label: 'Nama Bahan', type: 'text' },
      { key: 'quantity', label: 'Jumlah', type: 'text' },
      { key: 'unit', label: 'Satuan', type: 'text' },
    ],
  },
  'resources.equipment': {
    fields: [
      { key: 'name', label: 'Nama Peralatan', type: 'text' },
      { key: 'quantity', label: 'Jumlah', type: 'text' },
      { key: 'specification', label: 'Spesifikasi', type: 'text' },
    ],
  },
  'safety.jsa.items': {
    fields: [
      { key: 'activity', label: 'Kegiatan', type: 'text' },
      { key: 'hazard', label: 'Potensi Bahaya', type: 'text' },
      { key: 'control', label: 'Pengendalian', type: 'text' },
    ],
  },
  'pretest.questions': {
    fields: [
      { key: 'question', label: 'Pertanyaan', type: 'textarea' },
      { key: 'options', label: 'Pilihan Jawaban (pisahkan dengan enter)', type: 'textarea' },
      { key: 'answer', label: 'Jawaban Benar', type: 'text' },
    ],
  },
  'posttest.questions': {
    fields: [
      { key: 'question', label: 'Pertanyaan', type: 'textarea' },
      { key: 'options', label: 'Pilihan Jawaban (pisahkan dengan enter)', type: 'textarea' },
      { key: 'answer', label: 'Jawaban Benar', type: 'text' },
    ],
  },
  'training_needs.items': {
    fields: [
      { key: 'work_issues', label: 'Permasalahan dalam Bekerja', type: 'textarea' },
      { key: 'training_solution', label: 'Solusi Pelatihan', type: 'text' },
    ],
  },
  'evaluations.trainer': {
    fields: [
      { key: 'question', label: 'Pertanyaan Evaluasi', type: 'text' },
    ],
  },
  'evaluations.material': {
    fields: [
      { key: 'question', label: 'Pertanyaan Evaluasi', type: 'text' },
    ],
  },
  'lesson_plan.sections': {
    fields: [
      { key: 'title', label: 'Judul Sesi', type: 'text' },
      { key: 'duration', label: 'Durasi (menit)', type: 'text' },
      { key: 'activities', label: 'Kegiatan (pisahkan dengan enter)', type: 'textarea' },
    ],
  },
  'assessment.observation.elements': {
    fields: [
      { key: 'element', label: 'Elemen', type: 'text' },
      { key: 'criteria', label: 'Kriteria Penilaian', type: 'textarea' },
    ],
  },
  'assessment.oral.questions': {
    fields: [
      { key: 'question', label: 'Pertanyaan', type: 'textarea' },
      { key: 'expected_answer', label: 'Jawaban yang Diharapkan', type: 'textarea' },
    ],
  },
  'assessment.pretest_scoring.items': {
    fields: [
      { key: 'criteria', label: 'Kriteria Penilaian', type: 'text' },
      { key: 'max_score', label: 'Skor Maksimal', type: 'text' },
    ],
  },
};

// Default schema for unknown array fields (simple string list)
const DEFAULT_SCHEMA = {
  fields: [
    { key: 'value', label: 'Item', type: 'text' as const },
  ],
};

type DynamicArrayRow = Record<string, any> & { __rowId: string };

const createRowId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `row-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const stripRowId = ({ __rowId: _rowId, ...item }: DynamicArrayRow) => item;

export const DynamicArrayInput: React.FC<DynamicArrayInputProps> = ({
  fieldPath,
  displayName,
  value,
  onChange,
  placeholder,
}) => {
  // Get schema for this field
  const schema = useMemo(() => ARRAY_FIELD_SCHEMAS[fieldPath] || DEFAULT_SCHEMA, [fieldPath]);
  const isSimpleArray = schema.fields.length === 1 && schema.fields[0].key === 'value';

  // Initialize items from value
  const [items, setItems] = useState<DynamicArrayRow[]>(() => {
    if (!value || !Array.isArray(value) || value.length === 0) {
      // Start with one empty item
      return [createEmptyItem()];
    }
    // Convert simple arrays (strings) to object format if needed
    if (isSimpleArray && typeof value[0] === 'string') {
      return value.map(v => ({ __rowId: createRowId(), value: v }));
    }
    // Map existing data to match schema fields
    return value.map(item => {
      if (typeof item === 'string') {
        return { __rowId: createRowId(), value: item };
      }
      // Ensure all schema fields exist in the item
      const mappedItem: DynamicArrayRow = { __rowId: createRowId() };
      schema.fields.forEach(f => {
        const val = item[f.key];
        // Handle nested arrays like kuk: [{kuk_id, kuk_text}] -> convert to string
        if (Array.isArray(val)) {
          // Convert array of objects to newline-separated string
          mappedItem[f.key] = val.map((v: any) => {
            if (typeof v === 'object' && v !== null) {
              // For kuk objects, extract kuk_text
              return v.kuk_text || v.text || v.description || v.name || JSON.stringify(v);
            }
            return String(v);
          }).join('\n');
        } else {
          mappedItem[f.key] = val || '';
        }
      });
      return mappedItem;
    });
  });

  // Update items when value prop changes (e.g., when document is reloaded)
  useEffect(() => {
    if (!value || !Array.isArray(value) || value.length === 0) {
      return; // Keep current items if no new data
    }
    
    const newItems = value.map(item => {
      if (typeof item === 'string') {
        return { __rowId: createRowId(), value: item };
      }
      const mappedItem: DynamicArrayRow = { __rowId: createRowId() };
      schema.fields.forEach(f => {
        const val = item[f.key];
        // Handle nested arrays like kuk: [{kuk_id, kuk_text}] -> convert to string
        if (Array.isArray(val)) {
          mappedItem[f.key] = val.map((v: any) => {
            if (typeof v === 'object' && v !== null) {
              return v.kuk_text || v.text || v.description || v.name || JSON.stringify(v);
            }
            return String(v);
          }).join('\n');
        } else {
          mappedItem[f.key] = val || '';
        }
      });
      return mappedItem;
    });
    
    setItems(newItems);
  }, [value]);

  function createEmptyItem(): DynamicArrayRow {
    const item: DynamicArrayRow = { __rowId: createRowId() };
    schema.fields.forEach(f => {
      item[f.key] = '';
    });
    return item;
  }

  // Update parent when items change
  useEffect(() => {
    if (isSimpleArray) {
      // Convert back to simple array
      const simpleArray = items
        .map(item => item.value)
        .filter(v => v && typeof v === 'string' && v.trim() !== '');
      onChange(simpleArray);
    } else {
      // Filter out completely empty items
      const filteredItems = items
        .filter(item => 
          schema.fields.some(f => {
            const val = item[f.key];
            return val != null && (typeof val === 'string' ? val.trim() !== '' : true);
          })
        )
        .map(stripRowId);
      onChange(filteredItems);
    }
  }, [items]);

  const handleItemChange = (index: number, key: string, newValue: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: newValue };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return; // Keep at least one item
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;
    
    const newItems = [...items];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium">{displayName}</Label>
        <span className="text-[10px] text-gray-500">{items.length} item</span>
      </div>

      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.__rowId}
            className="border border-gray-200 rounded-md p-3 bg-white relative group"
          >
            {/* Item header with controls */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-gray-500">Item {index + 1}</span>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => moveItem(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="Pindah ke atas"
                >
                  <Icon icon="solar:alt-arrow-up-linear" height={14} className="text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(index, 'down')}
                  disabled={index === items.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                  title="Pindah ke bawah"
                >
                  <Icon icon="solar:alt-arrow-down-linear" height={14} className="text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={items.length <= 1}
                  className="p-1 hover:bg-red-50 rounded disabled:opacity-30"
                  title="Hapus item"
                >
                  <Icon icon="solar:trash-bin-trash-linear" height={14} className="text-red-500" />
                </button>
              </div>
            </div>

            {/* Item fields */}
            <div className="space-y-2">
              {schema.fields.map((field) => (
                <div key={field.key}>
                  {!isSimpleArray && (
                    <Label htmlFor={`${fieldPath}-${index}-${field.key}`} className="text-[10px] text-gray-600 mb-1 block">
                      {field.label}
                    </Label>
                  )}
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={`${fieldPath}-${index}-${field.key}`}
                      value={item[field.key] || ''}
                      onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                      placeholder={placeholder || `Masukkan ${field.label.toLowerCase()}...`}
                      className="text-sm h-16 resize-none"
                    />
                  ) : (
                    <Input
                      id={`${fieldPath}-${index}-${field.key}`}
                      value={item[field.key] || ''}
                      onChange={(e) => handleItemChange(index, field.key, e.target.value)}
                      placeholder={placeholder || `Masukkan ${field.label.toLowerCase()}...`}
                      className="text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add item button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="w-full gap-1 text-xs border-dashed"
        onClick={addItem}
      >
        <Icon icon="solar:add-circle-linear" height={14} />
        Tambah Item
      </Button>
    </div>
  );
};

export default DynamicArrayInput;
