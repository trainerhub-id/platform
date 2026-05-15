import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'src/components/ui/select';
import { Checkbox } from 'src/components/ui/checkbox';
import api from 'src/api/axios';
import { ButtonLoading } from 'src/components/ui/loading';
import { AI_FEATURES } from 'src/constants/aiFeatures';
import { toast } from 'react-toastify';

interface TierTemplate {
  id: string;
  name: string;
  defaultCourseIds: string[];
  defaultAiFeatures: string[];
  defaultBenefits: string[];
}

interface BatchTier {
  id: string;
  tierTemplateId: string;
  name: string;
  slug: string;
  price: number;
  description?: string | null;
  maxParticipants: number | null;
  courseIds: string[] | null;
  aiFeatures: string[] | null;
  benefits: string[] | null;
  scalevStoreUniqueId?: string | null;
  scalevVariantUniqueId?: string | null;
  tierTemplate?: TierTemplate;
}

interface Course {
  id: string;
  title: string;
}

interface ScalevStore {
  id: number;
  unique_id: string;
  name: string;
  payment_methods?: string[];
  sub_payment_methods?: string[];
}

interface BatchTierSectionProps {
  batchId?: string;
  batchSlug?: string;
}

export const BatchTierSection = ({ batchId, batchSlug: batchSlugProp }: BatchTierSectionProps) => {
  const [tiers, setTiers] = useState<BatchTier[]>([]);
  const [templates, setTemplates] = useState<TierTemplate[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [stores, setStores] = useState<ScalevStore[]>([]);
  const [batchSlug, setBatchSlug] = useState<string>(batchSlugProp || '');
  const [loading, setLoading] = useState(false);
  const [resyncingTierId, setResyncingTierId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<BatchTier | null>(null);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateFormData, setTemplateFormData] = useState({
    name: '',
    courseIds: [] as string[],
    aiFeatures: [] as string[],
    benefits: '',
  });

  const [formData, setFormData] = useState({
    tierTemplateId: '',
    price: '',
    maxParticipants: '',
    overrideCourses: false,
    courseIds: [] as string[],
    overrideAiFeatures: false,
    aiFeatures: [] as string[],
    overrideBenefits: false,
    benefits: '',
    scalevStoreUniqueId: '',
  });

  useEffect(() => {
    if (batchId) {
      fetchBatchTiers();
    }
    fetchTierTemplates();
    fetchCourses();
    fetchScalevStores();
  }, [batchId]);

  useEffect(() => {
    if (batchSlugProp) {
      setBatchSlug(batchSlugProp);
    }
  }, [batchSlugProp]);

  const fetchBatchTiers = async () => {
    if (!batchId) return;
    try {
      const res = await api.get(`/admin/batches/${batchId}/tiers`);
      setTiers(res.data);
    } catch (error) {
      console.error('Error fetching batch tiers:', error);
    }
  };

  const fetchTierTemplates = async () => {
    try {
      const res = await api.get('/admin/tier-templates');
      setTemplates(res.data);
    } catch (error) {
      console.error('Error fetching tier templates:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const res = await api.get('/kelas');
      setCourses(res.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchScalevStores = async () => {
    try {
      const res = await api.get('/admin/scalev/stores');
      const fetchedStores = Array.isArray(res.data) ? res.data : [];
      setStores(fetchedStores);
      setFormData((prev) => ({
        ...prev,
        scalevStoreUniqueId:
          prev.scalevStoreUniqueId || fetchedStores[0]?.unique_id || '',
      }));
    } catch (error) {
      console.error('Error fetching Scalev stores:', error);
    }
  };

  const openAddModal = () => {
    setEditingTier(null);
    setFormData({
      tierTemplateId: '',
      price: '',
      maxParticipants: '',
      overrideCourses: false,
      courseIds: [],
      overrideAiFeatures: false,
      aiFeatures: [],
      overrideBenefits: false,
      benefits: '',
      scalevStoreUniqueId: stores[0]?.unique_id || '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (tier: BatchTier) => {
    setEditingTier(tier);
    setFormData({
      tierTemplateId: tier.tierTemplateId,
      price: tier.price.toString(),
      maxParticipants: tier.maxParticipants?.toString() || '',
      overrideCourses: tier.courseIds !== null,
      courseIds: tier.courseIds || [],
      overrideAiFeatures: tier.aiFeatures !== null,
      aiFeatures: tier.aiFeatures || [],
      overrideBenefits: tier.benefits !== null,
      benefits: tier.benefits?.join('\n') || '',
      scalevStoreUniqueId: tier.scalevStoreUniqueId || stores[0]?.unique_id || '',
    });
    setIsModalOpen(true);
  };

  const handleTemplateChange = (templateId: string) => {
    if (templateId === 'create-new') {
      setIsCreatingTemplate(true);
      return;
    }
    
    const template = templates.find(t => t.id === templateId);
    if (template && !editingTier) {
      // Pre-fill with template defaults for new tiers
      setFormData(prev => ({
        ...prev,
        tierTemplateId: templateId,
        courseIds: template.defaultCourseIds,
        aiFeatures: template.defaultAiFeatures,
        benefits: template.defaultBenefits.join('\n'),
      }));
    } else {
      setFormData(prev => ({ ...prev, tierTemplateId: templateId }));
    }
  };

  const handleTemplateCourseToggle = (courseId: string) => {
    setTemplateFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  const handleTemplateAiFeatureToggle = (featureId: string) => {
    setTemplateFormData(prev => ({
      ...prev,
      aiFeatures: prev.aiFeatures.includes(featureId)
        ? prev.aiFeatures.filter(id => id !== featureId)
        : [...prev.aiFeatures, featureId],
    }));
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: templateFormData.name,
        defaultCourseIds: templateFormData.courseIds,
        defaultAiFeatures: templateFormData.aiFeatures,
        defaultBenefits: templateFormData.benefits.split('\n').filter(Boolean),
      };

      const res = await api.post('/admin/tier-templates', payload);
      const newTemplate = res.data;
      
      // Refresh templates
      await fetchTierTemplates();
      
      // Auto-select the newly created template
      setFormData(prev => ({
        ...prev,
        tierTemplateId: newTemplate.id,
        courseIds: newTemplate.defaultCourseIds,
        aiFeatures: newTemplate.defaultAiFeatures,
        benefits: newTemplate.defaultBenefits.join('\n'),
      }));
      
      // Reset template form
      setTemplateFormData({
        name: '',
        courseIds: [],
        aiFeatures: [],
        benefits: '',
      });
      
      setIsCreatingTemplate(false);
    } catch (error) {
      console.error('Error creating tier template:', error);
      alert('Gagal membuat tier template');
    } finally {
      setLoading(false);
    }
  };

  const cancelCreateTemplate = () => {
    setIsCreatingTemplate(false);
    setTemplateFormData({
      name: '',
      courseIds: [],
      aiFeatures: [],
      benefits: '',
    });
    setFormData(prev => ({ ...prev, tierTemplateId: '' }));
  };

  const handleCourseToggle = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      courseIds: prev.courseIds.includes(courseId)
        ? prev.courseIds.filter(id => id !== courseId)
        : [...prev.courseIds, courseId],
    }));
  };

  const handleAiFeatureToggle = (featureId: string) => {
    setFormData(prev => ({
      ...prev,
      aiFeatures: prev.aiFeatures.includes(featureId)
        ? prev.aiFeatures.filter(id => id !== featureId)
        : [...prev.aiFeatures, featureId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchId) {
      alert('Simpan batch terlebih dahulu sebelum menambah tier');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        tierTemplateId: formData.tierTemplateId,
        price: parseInt(formData.price),
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        courseIds: formData.overrideCourses ? formData.courseIds : null,
        aiFeatures: formData.overrideAiFeatures ? formData.aiFeatures : null,
        benefits: formData.overrideBenefits 
          ? formData.benefits.split('\n').filter(Boolean) 
          : null,
        scalevStoreUniqueId: formData.scalevStoreUniqueId || null,
      };

      if (editingTier) {
        await api.patch(`/admin/batches/${batchId}/tiers/${editingTier.id}`, payload);
      } else {
        await api.post(`/admin/batches/${batchId}/tiers`, payload);
      }

      await fetchBatchTiers();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving tier:', error);
      alert('Gagal menyimpan tier');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tierId: string) => {
    if (!confirm('Yakin ingin menghapus tier ini dari batch?')) return;

    try {
      await api.delete(`/admin/batches/${batchId}/tiers/${tierId}`);
      await fetchBatchTiers();
    } catch (error) {
      console.error('Error deleting tier:', error);
      alert('Gagal menghapus tier');
    }
  };

  const handleResyncScalev = async (tierId: string) => {
    if (!batchId) return;

    setResyncingTierId(tierId);
    try {
      await api.post(`/admin/batches/${batchId}/tiers/${tierId}/resync-scalev`);
      await fetchBatchTiers();
      toast.success('Tier berhasil di-resync ke Scalev');
    } catch (error) {
      console.error('Error resyncing tier to Scalev:', error);
      toast.error('Gagal resync tier ke Scalev');
    } finally {
      setResyncingTierId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const selectedTemplate = templates.find(t => t.id === formData.tierTemplateId);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Simple notification - could use a toast library
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-[10000]';
      notification.textContent = 'URL copied to clipboard!';
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getCheckoutUrl = (tierSlug: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/register?batch=${batchSlug}&tier=${tierSlug}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-dark">Tier & Pricing</h4>
          <p className="text-xs text-bodytext">
            Tambahkan tier dari template dan set harga untuk batch ini
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={openAddModal}
          disabled={!batchId}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <Icon icon="solar:add-circle-bold" className="mr-2" height={16} />
          Tambah Tier
        </Button>
      </div>

      {!batchId && (
        <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
          <Icon icon="solar:info-circle-bold" className="inline mr-2" height={16} />
          Simpan batch terlebih dahulu sebelum menambahkan tier
        </div>
      )}

      {tiers.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Icon icon="solar:box-minimalistic-linear" height={48} className="mx-auto mb-2" />
          <p className="text-sm">Belum ada tier untuk batch ini</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map(tier => (
            <div
              key={tier.id}
              className="border border-gray-200 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h5 className="font-semibold text-dark">{tier.name}</h5>
                  <p className="text-2xl font-bold text-primary mt-1">{formatPrice(tier.price)}</p>
                  {tier.maxParticipants && (
                    <p className="text-xs text-bodytext mt-1">
                      Maks {tier.maxParticipants} peserta
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="outline" className={tier.scalevVariantUniqueId ? 'border-green-300 text-green-700 bg-green-50' : 'border-amber-300 text-amber-700 bg-amber-50'}>
                      {tier.scalevVariantUniqueId ? 'Scalev synced' : 'Belum sync Scalev'}
                    </Badge>
                    {tier.scalevStoreUniqueId && (
                      <Badge variant="outline" className="border-sky-300 text-sky-700 bg-sky-50">
                        Store: {tier.scalevStoreUniqueId}
                      </Badge>
                    )}
                  </div>
                  {tier.scalevVariantUniqueId && (
                    <div className="mt-2 text-xs text-bodytext space-y-1">
                      <p className="font-mono break-all">Variant: {tier.scalevVariantUniqueId}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleResyncScalev(tier.id)}
                    disabled={resyncingTierId === tier.id}
                    title="Resync ke Scalev"
                  >
                    {resyncingTierId === tier.id ? (
                      <Icon icon="solar:refresh-circle-bold" className="animate-spin" height={16} />
                    ) : (
                      <Icon icon="solar:refresh-linear" height={16} />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(tier)}
                  >
                    <Icon icon="solar:pen-linear" height={16} />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(tier.id)}
                  >
                    <Icon icon="solar:trash-bin-trash-bold" height={16} />
                  </Button>
                </div>
              </div>

              {batchSlug && tier.slug && (
                <div className="bg-gray-50 rounded-lg p-2.5 mt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-bodytext/70 uppercase tracking-wide mb-0.5">Checkout Link</p>
                      <div className="flex items-center gap-1.5">
                        <Icon icon="solar:link-linear" height={14} className="text-gray-400 shrink-0" />
                        <p className="text-xs text-dark/70 font-mono truncate" title={getCheckoutUrl(tier.slug)}>
                          /register?batch={batchSlug.split('-').slice(0, 3).join('-')}...&tier={tier.slug}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(getCheckoutUrl(tier.slug))}
                      className="shrink-0 h-7 px-2 text-xs"
                    >
                      <Icon icon="solar:copy-linear" height={14} className="mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Tier Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[9999]">
          <DialogHeader>
            <DialogTitle>
              {editingTier ? 'Edit Tier' : 'Tambah Tier ke Batch'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isCreatingTemplate ? (
              <>
                <div>
                  <Label htmlFor="tierTemplateId">
                    Pilih Tier Template <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.tierTemplateId}
                    onValueChange={handleTemplateChange}
                    required
                  >
                    <SelectTrigger id="tierTemplateId">
                      <SelectValue placeholder="Pilih tier template..." />
                    </SelectTrigger>
                    <SelectContent className="z-[99999]">
                      <SelectItem value="create-new">
                        <div className="flex items-center gap-2 text-primary font-semibold">
                          <Icon icon="solar:add-circle-bold" height={16} />
                          <span>Create New Template</span>
                        </div>
                      </SelectItem>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTemplate && (
                    <p className="text-xs text-bodytext mt-1">
                      Default: {selectedTemplate.defaultCourseIds.length} courses, {selectedTemplate.defaultAiFeatures.length} AI features
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">
                      Harga (IDR) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="3000000"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxParticipants">Maks Peserta (opsional)</Label>
                    <Input
                      id="maxParticipants"
                      type="number"
                      value={formData.maxParticipants}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxParticipants: e.target.value }))}
                      placeholder="Unlimited"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="scalevStoreUniqueId">
                    Scalev Store <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.scalevStoreUniqueId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, scalevStoreUniqueId: value }))}
                    required
                  >
                    <SelectTrigger id="scalevStoreUniqueId">
                      <SelectValue placeholder="Pilih store Scalev..." />
                    </SelectTrigger>
                    <SelectContent className="z-[99999]">
                      {stores.map((store) => (
                        <SelectItem key={store.unique_id} value={store.unique_id}>
                          {store.name} ({store.unique_id})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-bodytext mt-1">
                    Saat disimpan, TrainerHub akan otomatis create/update produk dan variant di store ini.
                  </p>
                </div>

                {/* Override Course Access */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Akses Kelas</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="overrideCourses"
                        checked={formData.overrideCourses}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, overrideCourses: !!checked }))}
                      />
                      <label htmlFor="overrideCourses" className="text-xs cursor-pointer">
                        Override dari template
                      </label>
                    </div>
                  </div>
                  {formData.overrideCourses ? (
                    <div className="max-h-32 overflow-y-auto space-y-2">
                      {courses.map(course => (
                        <div key={course.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`course-${course.id}`}
                            checked={formData.courseIds.includes(course.id)}
                            onCheckedChange={() => handleCourseToggle(course.id)}
                          />
                          <label htmlFor={`course-${course.id}`} className="text-sm cursor-pointer">
                            {course.title}
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Menggunakan default dari template
                    </p>
                  )}
                </div>

                {/* Override AI Features */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Fitur AI</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="overrideAiFeatures"
                        checked={formData.overrideAiFeatures}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, overrideAiFeatures: !!checked }))}
                      />
                      <label htmlFor="overrideAiFeatures" className="text-xs cursor-pointer">
                        Override dari template
                      </label>
                    </div>
                  </div>
                  {formData.overrideAiFeatures ? (
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {AI_FEATURES.map(feature => (
                        <div key={feature.id} className="flex items-start gap-2">
                          <Checkbox
                            id={`ai-${feature.id}`}
                            checked={formData.aiFeatures.includes(feature.id)}
                            onCheckedChange={() => handleAiFeatureToggle(feature.id)}
                          />
                          <div className="flex-1">
                            <label htmlFor={`ai-${feature.id}`} className="text-sm cursor-pointer">
                              {feature.name}
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Menggunakan default dari template
                    </p>
                  )}
                </div>

                {/* Override Benefits */}
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Benefits</Label>
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="overrideBenefits"
                        checked={formData.overrideBenefits}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, overrideBenefits: !!checked }))}
                      />
                      <label htmlFor="overrideBenefits" className="text-xs cursor-pointer">
                        Override dari template
                      </label>
                    </div>
                  </div>
                  {formData.overrideBenefits ? (
                    <Textarea
                      value={formData.benefits}
                      onChange={(e) => setFormData(prev => ({ ...prev, benefits: e.target.value }))}
                      placeholder="Training 2 hari&#10;Sertifikat digital&#10;Akses course selamanya"
                      rows={4}
                    />
                  ) : (
                    <p className="text-xs text-gray-400 italic">
                      Menggunakan default dari template
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Icon icon="solar:add-circle-bold" height={20} />
                  <h3 className="font-semibold">Buat Tier Template Baru</h3>
                </div>

                <div>
                  <Label htmlFor="templateName">
                    Nama Template <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="templateName"
                    value={templateFormData.name}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Regular, Premium, VIP"
                    required
                  />
                </div>

                <div className="border rounded-lg p-3 space-y-2">
                  <Label>Default Akses Kelas</Label>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {courses.map(course => (
                      <div key={course.id} className="flex items-center gap-2">
                        <Checkbox
                          id={`template-course-${course.id}`}
                          checked={templateFormData.courseIds.includes(course.id)}
                          onCheckedChange={() => handleTemplateCourseToggle(course.id)}
                        />
                        <label htmlFor={`template-course-${course.id}`} className="text-sm cursor-pointer">
                          {course.title}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-3 space-y-2">
                  <Label>Default Fitur AI</Label>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {AI_FEATURES.map(feature => (
                      <div key={feature.id} className="flex items-start gap-2">
                        <Checkbox
                          id={`template-ai-${feature.id}`}
                          checked={templateFormData.aiFeatures.includes(feature.id)}
                          onCheckedChange={() => handleTemplateAiFeatureToggle(feature.id)}
                        />
                        <label htmlFor={`template-ai-${feature.id}`} className="text-sm cursor-pointer">
                          {feature.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="templateBenefits">Default Benefits</Label>
                  <Textarea
                    id="templateBenefits"
                    value={templateFormData.benefits}
                    onChange={(e) => setTemplateFormData(prev => ({ ...prev, benefits: e.target.value }))}
                    placeholder="Training 2 hari&#10;Sertifikat digital&#10;Akses course selamanya"
                    rows={4}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={cancelCreateTemplate}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Icon icon="solar:close-circle-linear" className="mr-2" height={16} />
                    Batal
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateTemplate}
                    disabled={loading || !templateFormData.name}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {loading ? (
                      <>
                        <ButtonLoading />
                        Membuat...
                      </>
                    ) : (
                      <>
                        <Icon icon="solar:check-circle-bold" className="mr-2" height={16} />
                        Buat Template
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white"
                disabled={loading || isCreatingTemplate}
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
    </div>
  );
};
