import { useState } from 'react';
import { Icon } from '@iconify/react';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Badge } from 'src/components/ui/badge';
import { useTierTemplates, type TierTemplate } from './useTierTemplates';
import { TierTemplateModal } from './TierTemplateModal';
import { Loading } from 'src/components/ui/loading';
import { AI_FEATURES } from 'src/constants/aiFeatures';

const TierManagement = () => {
  const { templates, loading, refetch, deleteTemplate, getUsageStats } = useTierTemplates();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TierTemplate | null>(null);
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsModalOpen(true);
  };

  const handleEdit = (template: TierTemplate) => {
    setSelectedTemplate(template);
    setIsModalOpen(true);
  };

  const handleDelete = async (template: TierTemplate) => {
    const stats = usageStats[template.id] ?? (await loadUsageStats(template.id));
    
    if (stats > 0) {
      if (!confirm(`Tier "${template.name}" digunakan di ${stats} batch. Akan di-soft delete. Lanjutkan?`)) {
        return;
      }
    } else {
      if (!confirm(`Yakin ingin menghapus tier "${template.name}"?`)) {
        return;
      }
    }

    try {
      await deleteTemplate(template.id);
    } catch (error) {
      alert('Gagal menghapus tier template');
    }
  };

  const loadUsageStats = async (id: string): Promise<number> => {
    try {
      const stats = await getUsageStats(id);
      setUsageStats(prev => ({ ...prev, [id]: stats.batchCount }));
      return stats.batchCount;
    } catch {
      return 0;
    }
  };

  if (loading) {
    return <Loading fullPage />;
  }

  const getAiFeatureName = (id: string) => {
    return AI_FEATURES.find(f => f.id === id)?.name || id;
  };

  return (
    <div className="space-y-6">
      {/* Tier List */}
      <CardBox className="p-0">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-dark">Daftar Tier Templates</h3>
          <Button
            className="bg-primary hover:bg-primary/90 text-white rounded-xl shadow-md shrink-0"
            onClick={handleCreate}
          >
            <Icon icon="solar:add-circle-linear" className="mr-2" height={18} />
            Buat Tier Template
          </Button>
        </div>
        <div className="p-4">
          {templates.length === 0 ? (
            <div className="py-20 text-center">
              <div className="flex flex-col items-center opacity-40">
                <Icon icon="solar:box-minimalistic-linear" height={64} />
                <p className="mt-2 font-medium">Belum ada tier template</p>
                <p className="text-sm text-bodytext mt-1">
                  Buat tier template untuk mengatur akses course dan fitur AI
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map(template => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-bold text-dark">{template.name}</h4>
                        {template.isActive ? (
                          <Badge className="bg-green-100 text-green-700 border-none">Aktif</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-none">Nonaktif</Badge>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-bodytext mb-4">{template.description}</p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Course Access */}
                        <div>
                          <h5 className="text-xs font-semibold text-bodytext uppercase mb-2 flex items-center gap-1">
                            <Icon icon="solar:book-linear" height={14} />
                            Akses Kelas
                          </h5>
                          {template.defaultCourseIds.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Tidak ada kelas</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {template.defaultCourseIds.slice(0, 3).map((courseId, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  Course {idx + 1}
                                </Badge>
                              ))}
                              {template.defaultCourseIds.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.defaultCourseIds.length - 3} lagi
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        {/* AI Features */}
                        <div>
                          <h5 className="text-xs font-semibold text-bodytext uppercase mb-2 flex items-center gap-1">
                            <Icon icon="solar:star-linear" height={14} />
                            Fitur AI
                          </h5>
                          {template.defaultAiFeatures.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Tidak ada fitur AI</p>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {template.defaultAiFeatures.slice(0, 2).map((featureId, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  {getAiFeatureName(featureId)}
                                </Badge>
                              ))}
                              {template.defaultAiFeatures.length > 2 && (
                                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                  +{template.defaultAiFeatures.length - 2} lagi
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Benefits */}
                      {template.defaultBenefits && template.defaultBenefits.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <h5 className="text-xs font-semibold text-bodytext uppercase mb-2">Default Benefits</h5>
                          <ul className="text-sm text-bodytext space-y-1">
                            {template.defaultBenefits.slice(0, 3).map((benefit, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <Icon icon="solar:check-circle-bold" className="text-primary mt-0.5 shrink-0" height={16} />
                                <span>{benefit}</span>
                              </li>
                            ))}
                            {template.defaultBenefits.length > 3 && (
                              <li className="text-xs text-gray-400 italic">
                                +{template.defaultBenefits.length - 3} benefit lainnya
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {/* Usage Stats */}
                      {usageStats[template.id] !== undefined && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs text-bodytext">
                            Digunakan di <span className="font-semibold">{usageStats[template.id]} batch</span>
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        className="h-9 rounded-xl hover:bg-blue-50 text-blue-600 transition-all"
                        onClick={() => handleEdit(template)}
                        title="Edit Tier"
                      >
                        <Icon icon="solar:pen-linear" height={18} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-9 rounded-xl hover:bg-red-50 text-red-600 transition-all"
                        onClick={() => handleDelete(template)}
                        title="Hapus Tier"
                      >
                        <Icon icon="solar:trash-bin-trash-linear" height={18} className="mr-1" />
                        Hapus Tier
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardBox>

      <TierTemplateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={refetch}
        templateToEdit={selectedTemplate}
      />
    </div>
  );
};

export default TierManagement;
