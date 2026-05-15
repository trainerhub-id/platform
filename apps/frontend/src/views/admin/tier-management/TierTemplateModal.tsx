import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from 'src/components/ui/dialog';
import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Textarea } from 'src/components/ui/textarea';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { useTierTemplates, type TierTemplate } from './useTierTemplates';
import { ButtonLoading } from 'src/components/ui/loading';
import { AI_FEATURES } from 'src/constants/aiFeatures';
import api from 'src/api/axios';

interface Course {
  id: string;
  title: string;
}

interface TierTemplateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  templateToEdit?: TierTemplate | null;
}

export const TierTemplateModal = ({
  open,
  onOpenChange,
  onSuccess,
  templateToEdit,
}: TierTemplateModalProps) => {
  const { createTemplate, updateTemplate } = useTierTemplates();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultCourseIds: [] as string[],
    defaultAiFeatures: [] as string[],
    defaultBenefits: '',
  });

  useEffect(() => {
    if (open) {
      fetchCourses();
      if (templateToEdit) {
        setFormData({
          name: templateToEdit.name,
          description: templateToEdit.description || '',
          defaultCourseIds: templateToEdit.defaultCourseIds || [],
          defaultAiFeatures: templateToEdit.defaultAiFeatures || [],
          defaultBenefits: (templateToEdit.defaultBenefits || []).join('\n'),
        });
      } else {
        setFormData({
          name: '',
          description: '',
          defaultCourseIds: [],
          defaultAiFeatures: [],
          defaultBenefits: '',
        });
      }
    }
  }, [open, templateToEdit]);

  const fetchCourses = async () => {
    try {
      const res = await api.get('/kelas');
      setCourses(res.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleCourseToggle = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      defaultCourseIds: prev.defaultCourseIds.includes(courseId)
        ? prev.defaultCourseIds.filter(id => id !== courseId)
        : [...prev.defaultCourseIds, courseId],
    }));
  };

  const handleAiFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      defaultAiFeatures: prev.defaultAiFeatures.includes(featureId)
        ? prev.defaultAiFeatures.filter(id => id !== featureId)
        : [...prev.defaultAiFeatures, featureId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        defaultCourseIds: formData.defaultCourseIds,
        defaultAiFeatures: formData.defaultAiFeatures,
        defaultBenefits: formData.defaultBenefits
          ? formData.defaultBenefits.split('\n').filter(Boolean)
          : [],
      };

      if (templateToEdit) {
        await updateTemplate(templateToEdit.id, payload);
      } else {
        await createTemplate(payload);
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Gagal menyimpan paket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto z-[9999]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon icon="solar:widget-4-bold" className="text-primary" height={24} />
            {templateToEdit ? 'Edit Paket' : 'Tambah Paket'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">
              Nama Paket <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Master, Trainer"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Deskripsi singkat paket"
              rows={2}
            />
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <Label className="flex items-center gap-2">
              <Icon icon="solar:book-linear" height={16} />
              Default Kelas Bonus
            </Label>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {courses.length === 0 ? (
                <p className="text-sm text-gray-400 italic">Tidak ada kelas tersedia</p>
              ) : (
                courses.map(course => (
                  <div key={course.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`course-${course.id}`}
                      checked={formData.defaultCourseIds.includes(course.id)}
                      onCheckedChange={() => handleCourseToggle(course.id)}
                    />
                    <label htmlFor={`course-${course.id}`} className="text-sm cursor-pointer">
                      {course.title}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border rounded-lg p-4 space-y-3">
            <Label className="flex items-center gap-2">
              <Icon icon="solar:star-linear" height={16} />
              Default Akses AI
            </Label>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {AI_FEATURES.map(feature => (
                <div key={feature.id} className="flex items-start gap-2">
                  <Checkbox
                    id={`ai-${feature.id}`}
                    checked={formData.defaultAiFeatures.includes(feature.id)}
                    onCheckedChange={() => handleAiFeatureToggle(feature.id)}
                  />
                  <div className="flex-1">
                    <label htmlFor={`ai-${feature.id}`} className="text-sm font-medium cursor-pointer">
                      {feature.name}
                    </label>
                    <p className="text-xs text-bodytext">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="benefits">Benefit Paket (satu per baris)</Label>
            <Textarea
              id="benefits"
              value={formData.defaultBenefits}
              onChange={(e) => setFormData(prev => ({ ...prev, defaultBenefits: e.target.value }))}
              placeholder={"Training 2 hari\nKelas bonus online\nSertifikat digital"}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <ButtonLoading />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Icon icon="solar:check-circle-bold" className="mr-2" height={18} />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
