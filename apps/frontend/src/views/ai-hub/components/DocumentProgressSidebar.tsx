/**
 * Document Progress Sidebar
 * 
 * Shows document types grouped by category with completion status.
 * Each document shows progress percentage based on template field requirements.
 */

import { Icon } from "@iconify/react";
import { useState, useEffect } from "react";
import { Button } from "src/components/ui/button";
import { Progress } from "src/components/ui/progress";
import api from "src/api/axios";
import { toast } from "src/hooks/use-toast";
import { FieldEditDrawer } from "./FieldEditDrawer";
import { GenerateAllProgress } from "./GenerateAllProgress";
import type { MasterSidebarSectionId } from "./master-sidebar.config";
import { MasterFieldEditDrawer } from "./MasterFieldEditDrawer";
import {
  buildMasterDocumentOverview,
  buildMasterSidebarOverview,
  buildMasterSidebarSections,
  type MasterDocumentProgressItem,
  type MasterSidebarSectionState,
} from "./master-sidebar.helpers";

// Types matching backend response
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

interface AllDocumentsValidationResult {
  documents: DocumentValidationResult[];
  byCategory: Record<string, DocumentValidationResult[]>;
  summary: {
    totalDocuments: number;
    readyToGenerate: number;
    inProgress: number;
    notStarted: number;
  };
}

interface ProgressReadinessResponse {
  phase?: string;
  masterJson?: any;
  generationReady?: boolean;
  missingFields?: string[];
  miniMasterData?: Record<string, unknown>;
  masterDocumentProgress?: Array<{
    documentType: string;
    label: string;
    canGenerate: boolean;
    completionPercent: number;
    missingFields: string[];
  }>;
}

interface DocumentGenerationLog {
  id: string;
  documentType: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  progressPercent: number;
  errorMessage?: string | null;
  filename?: string | null;
  startedAt: string;
  completedAt?: string | null;
  createdAt: string;
}

interface GenerationStatusItem {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  errorMessage?: string | null;
  progressPercent?: number;
  downloadLogId?: string | null;
  readyForDownload?: boolean;
  fallbackFilename: string;
  onGenerate?: () => void;
  generating?: boolean;
}

const MASTER_GENERATE_ALL_DOCUMENT_TYPES = [
  'bukti-1',
  'bukti-2',
  'bukti-3',
  'bukti-4',
  'bukti-5',
  'bukti-6',
  'bukti-7',
  'bukti-8',
] as const;

const MASTER_DOCUMENT_LABELS: Record<(typeof MASTER_GENERATE_ALL_DOCUMENT_TYPES)[number], string> = {
  'bukti-1': 'Bukti 1',
  'bukti-2': 'Bukti 2',
  'bukti-3': 'Bukti 3',
  'bukti-4': 'Bukti 4',
  'bukti-5': 'Bukti 5',
  'bukti-6': 'Bukti 6',
  'bukti-7': 'Bukti 7',
  'bukti-8': 'Bukti 8',
};

interface DocumentProgressSidebarProps {
  documentId: string | null;
  category?: string;
  onDocumentClick?: (templateName: string, document: DocumentValidationResult) => void;
  onGenerateClick?: (templateName: string) => void;
  onRefresh?: () => void;
  onAskAI?: (prompt: string) => void;
  /** External trigger to refresh validation data */
  refreshTrigger?: number;
  onSaveMasterSection?: (sectionId: MasterSidebarSectionId, values: Record<string, string>) => Promise<void>;
}

const CATEGORY_CONFIG: Record<string, { title: string; icon: string; emoji: string }> = {
  basic: { title: 'Program Dasar', icon: 'solar:document-bold', emoji: '📁' },
  curriculum: { title: 'Kurikulum & Materi', icon: 'solar:book-bold', emoji: '📚' },
  assessment: { title: 'Asesmen & Evaluasi', icon: 'solar:clipboard-check-bold', emoji: '📝' },
  admin: { title: 'Administrasi', icon: 'solar:folder-bold', emoji: '📋' },
};

const CATEGORY_ORDER = ['basic', 'curriculum', 'assessment', 'admin'];

const TEMPLATE_LOG_ALIASES: Record<string, string[]> = {
  program_pelatihan: ['program_pelatihan', 'training_program'],
  training_program: ['training_program', 'program_pelatihan'],
  peta_kompetensi: ['peta_kompetensi', 'competency_map'],
  competency_map: ['competency_map', 'peta_kompetensi'],
  daftar_bahan: ['daftar_bahan', 'material_list'],
  material_list: ['material_list', 'daftar_bahan'],
  daftar_peralatan: ['daftar_peralatan', 'equipment_list'],
  equipment_list: ['equipment_list', 'daftar_peralatan'],
  evaluasi_pelatihan: ['evaluasi_pelatihan', 'training_evaluation'],
  training_evaluation: ['training_evaluation', 'evaluasi_pelatihan'],
  fr_ia_01: ['fr_ia_01', 'fr_ia_01_observation'],
  fr_ia_01_observation: ['fr_ia_01_observation', 'fr_ia_01'],
  fr_ia_02: ['fr_ia_02', 'fr_ia_02_demonstration'],
  fr_ia_02_demonstration: ['fr_ia_02_demonstration', 'fr_ia_02'],
  fr_ia_03: ['fr_ia_03', 'fr_ia_03_oral'],
  fr_ia_03_oral: ['fr_ia_03_oral', 'fr_ia_03'],
};

export const DocumentProgressSidebar: React.FC<DocumentProgressSidebarProps> = ({
  documentId,
  category,
  onDocumentClick,
  onGenerateClick,
  onRefresh,
  onAskAI,
  refreshTrigger,
  onSaveMasterSection,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validationData, setValidationData] = useState<AllDocumentsValidationResult | null>(null);
  const [documentPhase, setDocumentPhase] = useState<string | null>(null);
  const [documentMasterJson, setDocumentMasterJson] = useState<any>(null);
  const [miniMasterData, setMiniMasterData] = useState<Record<string, unknown> | null>(null);
  const [generationReady, setGenerationReady] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [masterDocumentProgress, setMasterDocumentProgress] = useState<ProgressReadinessResponse["masterDocumentProgress"]>([]);
  const [generatingDoc, setGeneratingDoc] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<DocumentValidationResult | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isGenerateAllOpen, setIsGenerateAllOpen] = useState(false);
  const [selectedMasterSection, setSelectedMasterSection] = useState<MasterSidebarSectionState | null>(null);
  const [isMasterDrawerOpen, setIsMasterDrawerOpen] = useState(false);
  const [isGeneratingMasterBatch, setIsGeneratingMasterBatch] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [documentLogs, setDocumentLogs] = useState<DocumentGenerationLog[]>([]);

  useEffect(() => {
    if (documentId) {
      fetchValidation();
    }
  }, [documentId, refreshTrigger]);

  const fetchValidation = async () => {
    if (!documentId) return;

    try {
      setIsLoading(true);
      const [validationRes, progressRes, logsRes] = await Promise.all([
        api.get(`/ai/document/${documentId}/validation`),
        api.get(`/ai/document/progress/${documentId}`).catch(() => null),
        api.get(`/ai/ai-document/${documentId}/logs`).catch(() => null),
      ]);
      setValidationData(validationRes.data);
      const progressData = (progressRes?.data || null) as ProgressReadinessResponse | null;
      const logsData = (logsRes?.data || []) as DocumentGenerationLog[];
      if (progressData?.phase) {
        setDocumentPhase(progressData.phase);
      }
      if (progressData?.masterJson) {
        setDocumentMasterJson(progressData.masterJson);
      }
      setMiniMasterData(progressData?.miniMasterData || null);
      setGenerationReady(!!progressData?.generationReady);
      setMissingFields(Array.isArray(progressData?.missingFields) ? progressData!.missingFields! : []);
      setMasterDocumentProgress(Array.isArray(progressData?.masterDocumentProgress) ? progressData.masterDocumentProgress : []);
      setDocumentLogs(Array.isArray(logsData) ? logsData : []);
    } catch (error) {
      console.error('[DocumentProgressSidebar] Failed to fetch validation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!documentId) return;
    setIsRefreshing(true);
    try {
      await fetchValidation();
      onRefresh?.();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const triggerDownloadFromResponse = async (response: any, fallbackFilename: string) => {
    const contentDisposition = response.headers['content-disposition'];
    const contentType = String(response.headers['content-type'] || '').toLowerCase();
    const inferredExt =
      contentType.includes('zip') ? 'zip'
      : contentType.includes('pdf') ? 'pdf'
      : contentType.includes('wordprocessingml') || contentType.includes('docx') ? 'docx'
      : 'bin';
    let filename = `${fallbackFilename}.${inferredExt}`;

    if (contentDisposition) {
      const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;\n]+)/i);
      if (filenameStarMatch?.[1]) {
        filename = decodeURIComponent(filenameStarMatch[1]);
      } else {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
        if (filenameMatch?.[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
    }

    const blob = new Blob([response.data], { type: response.headers['content-type'] });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const getStatusMeta = (status?: string | null, progressPercent?: number, errorMessage?: string | null) => {
    const safeStatus = (status || 'pending') as 'pending' | 'processing' | 'success' | 'failed';
    const icon =
      safeStatus === 'success' ? 'solar:check-circle-bold'
      : safeStatus === 'failed' ? 'solar:close-circle-bold'
      : safeStatus === 'processing' ? 'svg-spinners:ring-resize'
      : 'solar:clock-circle-bold';
    const className =
      safeStatus === 'success' ? 'text-green-600'
      : safeStatus === 'failed' ? 'text-red-600'
      : safeStatus === 'processing' ? 'text-blue-600'
      : 'text-amber-500';
    const text =
      safeStatus === 'success' ? 'Siap diunduh'
      : safeStatus === 'failed' ? (errorMessage || 'Gagal generate')
      : safeStatus === 'processing' ? `Sedang diproses ${progressPercent || 0}%`
      : 'Belum digenerate';

    return { icon, className, text, safeStatus };
  };

  const handleGenerate = async (templateName: string, docDisplayName: string) => {
    if (!documentId) return;

    setGeneratingDoc(templateName);
    try {
      const { data } = await api.post(`/ai/ai-document/${documentId}/generate`, {
        documentType: templateName,
      });

      if (data.status === 'success') {
        // Download file with auth token
        try {
          const response = await api.get(
            `/ai/ai-document/${documentId}/download/${data.logId}`,
            { responseType: 'blob' }
          );
          await triggerDownloadFromResponse(response, `${templateName}_${new Date().toISOString().split('T')[0]}`);
        } catch (downloadError) {
          console.error('[DocumentProgressSidebar] Download failed:', downloadError);
        }

        toast({
          title: 'Dokumen berhasil dibuat',
          description: `${docDisplayName} sedang diunduh.`,
        });
      } else if (data.status === 'failed' || data.validationError) {
        const validationMessage = data.validationError?.summaryMessage;
        const failureMessage =
          validationMessage ||
          data.error ||
          data.message ||
          'Dokumen gagal dibuat. Silakan coba lagi.';
        toast({
          variant: 'destructive',
          title: validationMessage ? 'Data belum lengkap' : 'Gagal membuat dokumen',
          description: failureMessage,
        });
      }

      onGenerateClick?.(templateName);
    } catch (error: any) {
      console.error('[DocumentProgressSidebar] Generate failed:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal membuat dokumen',
        description: error?.response?.data?.message || 'Silakan coba lagi.',
      });
    } finally {
      setGeneratingDoc(null);
    }
  };

  const downloadGeneratedLog = async (logId: string, fallbackFilename: string) => {
    if (!documentId) return;

    try {
      const response = await api.get(
        `/ai/ai-document/${documentId}/download/${logId}`,
        { responseType: 'blob' }
      );
      await triggerDownloadFromResponse(response, fallbackFilename);
    } catch (error) {
      console.error('[DocumentProgressSidebar] Download generated log failed:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal mengunduh dokumen',
        description: 'Silakan coba lagi.',
      });
    }
  };

  const downloadAllGeneratedDocuments = async () => {
    if (!documentId) return;

    setIsDownloadingAll(true);
    try {
      const response = await api.get(
        `/ai/ai-document/${documentId}/download-all`,
        { responseType: 'blob' }
      );
      await triggerDownloadFromResponse(response, `documents_${documentId}`);
    } catch (error) {
      console.error('[DocumentProgressSidebar] Download all documents failed:', error);
      toast({
        variant: 'destructive',
        title: 'Gagal mengunduh semua dokumen',
        description: 'Silakan coba lagi.',
      });
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const latestMasterLogsByType = MASTER_GENERATE_ALL_DOCUMENT_TYPES.map((documentType) => {
    const latestLog = [...documentLogs]
      .filter((log) => log.documentType === documentType)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;

    return { documentType, log: latestLog };
  });

  const latestTrainerLogsByType = new Map<string, DocumentGenerationLog | null>(
    (validationData?.documents || []).map((doc) => {
      const acceptedTypes = TEMPLATE_LOG_ALIASES[doc.templateName] || [doc.templateName];
      const latestLog = [...documentLogs]
        .filter((log) => acceptedTypes.includes(log.documentType) && log.status === 'success')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] || null;
      return [doc.templateName, latestLog];
    }),
  );

  const trainerOverview = (() => {
    const docs = validationData?.documents || [];
    const totalFields = docs.reduce((sum, doc) => sum + doc.totalFields, 0);
    const completedFields = docs.reduce((sum, doc) => sum + doc.completedFields, 0);
    const completionPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

    return {
      totalFields,
      completedFields,
      completionPercent,
    };
  })();

  const trainerGenerationStatusItems: GenerationStatusItem[] = (validationData?.documents || []).map((doc) => {
    const latestLog = latestTrainerLogsByType.get(doc.templateName);
    const readyForDownload =
      !!latestLog?.id && latestLog.status === 'success'
        ? true
        : doc.canGenerate && latestLog?.status !== 'processing' && latestLog?.status !== 'failed';

    return {
      id: doc.templateName,
      label: doc.displayName,
      status: (latestLog?.status || (readyForDownload ? 'success' : 'pending')) as GenerationStatusItem['status'],
      errorMessage: latestLog?.errorMessage,
      progressPercent: latestLog?.progressPercent,
      downloadLogId: latestLog?.status === 'success' ? latestLog.id : null,
      readyForDownload,
      fallbackFilename: doc.templateName,
      onGenerate: doc.canGenerate ? () => handleGenerate(doc.templateName, doc.displayName) : undefined,
      generating: generatingDoc === doc.templateName,
    };
  });

  const masterGenerationStatusItems: GenerationStatusItem[] = latestMasterLogsByType.map(({ documentType, log }) => {
    const progressItem = masterDocumentProgress?.find((item) => item.documentType === documentType);
    const readyToGenerate = progressItem?.canGenerate === true;
    const isGenerating = generatingDoc === documentType || log?.status === 'processing';
    const readyForDownload =
      !!log?.id && log.status === 'success'
        ? true
        : readyToGenerate && log?.status !== 'processing' && log?.status !== 'failed';

    return {
      id: documentType,
      label: MASTER_DOCUMENT_LABELS[documentType],
      status: (log?.status || (isGenerating ? 'processing' : readyForDownload ? 'success' : 'pending')) as GenerationStatusItem['status'],
      errorMessage: log?.errorMessage || (progressItem && progressItem.missingFields.length > 0
        ? `Kurang: ${progressItem.missingFields.slice(0, 2).join(', ')}${progressItem.missingFields.length > 2 ? ` +${progressItem.missingFields.length - 2}` : ''}`
        : null),
      progressPercent: log?.progressPercent ?? progressItem?.completionPercent ?? 0,
      downloadLogId: log?.status === 'success' ? log.id : null,
      readyForDownload,
      fallbackFilename: documentType,
      onGenerate: readyToGenerate ? () => handleGenerate(documentType, MASTER_DOCUMENT_LABELS[documentType]) : undefined,
      generating: generatingDoc === documentType,
    };
  });

  const masterDocumentOverview = buildMasterDocumentOverview(
    (masterDocumentProgress || []) as MasterDocumentProgressItem[],
  );
  const masterSidebarSource = (() => {
    if (documentMasterJson && typeof documentMasterJson === 'object' && Object.keys(documentMasterJson).length > 0) {
      return documentMasterJson;
    }
    if (miniMasterData && typeof miniMasterData === 'object' && Object.keys(miniMasterData).length > 0) {
      return miniMasterData;
    }
    return {};
  })();
  const masterSidebarSections = buildMasterSidebarSections(masterSidebarSource);
  const masterSidebarOverview = buildMasterSidebarOverview(masterSidebarSections);
  const normalizedMasterDocumentOverview = masterDocumentOverview.total > 0
    ? masterDocumentOverview
    : {
        total: MASTER_GENERATE_ALL_DOCUMENT_TYPES.length,
        completed: masterGenerationStatusItems.filter((item) => item.readyForDownload).length,
        completionPercent:
          MASTER_GENERATE_ALL_DOCUMENT_TYPES.length > 0
            ? Math.round(
                masterGenerationStatusItems.reduce(
                  (sum, item) => sum + Math.max(0, Math.min(100, Number(item.progressPercent || 0))),
                  0,
                ) / MASTER_GENERATE_ALL_DOCUMENT_TYPES.length,
              )
            : 0,
      };
  const trainerSuccessfulDownloadCount = trainerGenerationStatusItems.filter((item) => !!item.downloadLogId).length;
  const masterSuccessfulDownloadCount = masterGenerationStatusItems.filter((item) => !!item.downloadLogId).length;
  const masterMissingFields = (() => {
    if (masterDocumentProgress && masterDocumentProgress.length > 0) {
      return Array.from(
        new Set(
          masterDocumentProgress.flatMap((item) => Array.isArray(item.missingFields) ? item.missingFields : []),
        ),
      );
    }

    const brainstormingMaster = (masterSidebarSource as any)?.brainstorming_master || {};
    const unit = (masterSidebarSource as any)?.unit || {};
    const competencyMap = (masterSidebarSource as any)?.skkni_map || (masterSidebarSource as any)?.competency_map || {};
    const derivedMissing: string[] = [];

    [
      'organization_name',
      'organization_city',
      'trainer_name',
      'program_name',
      'program_goal',
      'target_participants',
      'industry_problem',
      'training_location',
      'training_duration',
    ].forEach((field) => {
      const value = brainstormingMaster?.[field];
      if (typeof value !== 'string' || value.trim().length === 0) {
        derivedMissing.push(field);
      }
    });

    if (typeof unit?.code !== 'string' || unit.code.trim().length === 0) {
      derivedMissing.push('selected_unit_code');
    }

    if (!competencyMap || typeof competencyMap !== 'object' || Object.keys(competencyMap).length === 0) {
      derivedMissing.push('skkni_map');
    }

    const hasUnitDetail =
      typeof unit?.code === 'string' &&
      unit.code.trim().length > 0 &&
      (
        (Array.isArray(unit?.elements) && unit.elements.length > 0) ||
        (typeof unit === 'object' && Object.keys(unit).length > 0)
      );
    if (!hasUnitDetail) {
      derivedMissing.push('skkni_unit_detail');
    }

    return derivedMissing.length > 0 ? derivedMissing : missingFields;
  })();

  const getStatusColor = (doc: DocumentValidationResult): string => {
    if (doc.canGenerate) return 'text-green-600';
    if (doc.completionPercent > 0) return 'text-yellow-600';
    return 'text-gray-400';
  };

  const getProgressVariant = (doc: DocumentValidationResult): 'default' | 'success' | 'warning' => {
    if (doc.canGenerate) return 'success';
    if (doc.completionPercent > 0) return 'warning';
    return 'default';
  };

  const handleDocumentClick = (doc: DocumentValidationResult) => {
    setSelectedDocument(doc);
    setIsDrawerOpen(true);
    onDocumentClick?.(doc.templateName, doc);
  };

  const handleAskAI = (prompt: string) => {
    if (onAskAI) {
      onAskAI(prompt);
    } else if ((window as any).__sendChatMessage) {
      (window as any).__sendChatMessage(prompt);
    }
    setIsDrawerOpen(false);
  };

  const renderGenerationStatusList = (
    title: string,
    items: GenerationStatusItem[],
    completedLabel?: string,
  ) => (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-2">
        <h5 className="text-sm font-semibold text-dark">{title}</h5>
        {completedLabel ? (
          <span className="text-[11px] text-bodytext">{completedLabel}</span>
        ) : null}
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const meta = getStatusMeta(item.status, item.progressPercent, item.errorMessage);
          const actionLabel = item.downloadLogId ? 'Unduh Dokumen' : item.onGenerate ? 'Generate Dokumen' : null;
          const actionIcon = item.downloadLogId ? 'solar:download-bold' : 'solar:magic-stick-3-bold';

          return (
            <div
              key={item.id}
              className="rounded-md border border-gray-200 bg-white p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-dark">{item.label}</div>
                  <div className={`text-[11px] mt-0.5 ${meta.className}`}>
                    {meta.text}
                  </div>
                </div>
                <Icon icon={meta.icon} height={16} className={meta.className} />
              </div>

              {actionLabel && (
                <Button
                  size="sm"
                  variant="outline"
                  className={`w-full mt-2 h-7 text-xs gap-1 ${item.downloadLogId ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-primary/30 text-primary hover:bg-primary/5'}`}
                  onClick={() => {
                    if (item.downloadLogId) {
                      void downloadGeneratedLog(item.downloadLogId, item.fallbackFilename);
                      return;
                    }
                    item.onGenerate?.();
                  }}
                  disabled={item.generating}
                >
                  {item.generating ? (
                    <>
                      <Icon icon="svg-spinners:ring-resize" height={12} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon icon={actionIcon} height={12} />
                      {actionLabel}
                    </>
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderGenerationCardList = (items: GenerationStatusItem[]) => (
    <div className="space-y-2">
      {items.map((item) => {
        const meta = getStatusMeta(item.status, item.progressPercent, item.errorMessage);
        const actionLabel = item.downloadLogId ? 'Unduh Dokumen' : item.onGenerate ? 'Generate Dokumen' : null;
        const actionIcon = item.downloadLogId ? 'solar:download-bold' : 'solar:magic-stick-3-bold';

        return (
          <div
            key={item.id}
            className="rounded-md border border-gray-200 bg-white p-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-dark">{item.label}</div>
                <div className={`text-[11px] mt-0.5 ${meta.className}`}>
                  {meta.text}
                </div>
              </div>
              <Icon icon={meta.icon} height={16} className={meta.className} />
            </div>

            {actionLabel && (
              <Button
                size="sm"
                variant="outline"
                className={`w-full mt-2 h-7 text-xs gap-1 ${item.downloadLogId ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-primary/30 text-primary hover:bg-primary/5'}`}
                onClick={() => {
                  if (item.downloadLogId) {
                    void downloadGeneratedLog(item.downloadLogId, item.fallbackFilename);
                    return;
                  }
                  item.onGenerate?.();
                }}
                disabled={item.generating}
              >
                {item.generating ? (
                  <>
                    <Icon icon="svg-spinners:ring-resize" height={12} />
                    Generating...
                  </>
                ) : (
                  <>
                    <Icon icon={actionIcon} height={12} />
                    {actionLabel}
                  </>
                )}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderUnifiedDocumentCard = (params: {
    label: string;
    summary: string;
    completionPercent: number;
    completedLabel: string;
    status: 'pending' | 'processing' | 'success' | 'failed';
    errorMessage?: string | null;
    downloadLogId?: string | null;
    readyForDownload?: boolean;
    fallbackFilename: string;
    onGenerate?: () => void;
    generating?: boolean;
    onOpenDetails?: () => void;
  }) => {
    const meta = getStatusMeta(params.status, undefined, params.errorMessage);
    const actionLabel = params.readyForDownload ? 'Unduh Dokumen' : params.onGenerate ? 'Generate Dokumen' : null;
    const actionIcon = params.readyForDownload ? 'solar:download-bold' : 'solar:magic-stick-3-bold';

    return (
      <div className="rounded-md border border-gray-200 bg-white p-3">
        <button
          type="button"
          className="w-full text-left"
          onClick={params.onOpenDetails}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-dark">{params.label}</div>
              <div className={`text-xs mt-0.5 truncate ${params.downloadLogId ? meta.className : 'text-bodytext'}`}>
                {params.readyForDownload ? 'Siap diunduh' : params.summary}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-bodytext">{params.completionPercent}%</span>
              <Icon
                icon={params.readyForDownload ? 'solar:check-circle-bold' : params.status === 'processing' ? 'svg-spinners:ring-resize' : 'solar:clock-circle-bold'}
                height={16}
                className={params.readyForDownload ? 'text-green-500' : params.status === 'processing' ? 'text-blue-500' : 'text-amber-500'}
              />
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Progress
              value={params.completionPercent}
              className="h-1.5 flex-1"
            />
            <span className="text-[10px] text-bodytext w-10 text-right">
              {params.completedLabel}
            </span>
          </div>
        </button>

        {actionLabel && (
          <Button
            size="sm"
            variant="outline"
            className={`w-full mt-2 h-7 text-xs gap-1 ${params.readyForDownload ? 'border-green-200 text-green-700 hover:bg-green-50' : 'border-primary/30 text-primary hover:bg-primary/5'}`}
            onClick={() => {
              if (params.downloadLogId) {
                void downloadGeneratedLog(params.downloadLogId, params.fallbackFilename);
                return;
              }
              params.onGenerate?.();
            }}
            disabled={params.generating}
          >
            {params.generating ? (
              <>
                <Icon icon="svg-spinners:ring-resize" height={12} />
                Generating...
              </>
            ) : (
              <>
                <Icon icon={actionIcon} height={12} />
                {actionLabel}
              </>
            )}
          </Button>
        )}
      </div>
    );
  };

  const renderMasterSidebar = () => {
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-base font-bold text-dark">Progress Dokumen</h4>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <Icon
                icon="solar:refresh-linear"
                height={16}
                className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
          <p className="text-xs text-bodytext">
            Fase saat ini: {documentPhase || 'brainstorming'}
          </p>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-bodytext">
              <span>
                {masterSidebarOverview.completedFields}/{masterSidebarOverview.totalFields} field
              </span>
              <span>{masterSidebarOverview.completionPercent}%</span>
            </div>
            <Progress value={masterSidebarOverview.completionPercent} className="h-1.5" />
          </div>
        </div>

        {documentId && (
          <div className="mb-2 space-y-1.5">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
              onClick={() => setIsGenerateAllOpen(true)}
              disabled={!generationReady || isGeneratingMasterBatch}
            >
              {isGeneratingMasterBatch ? (
                <>
                  <Icon icon="svg-spinners:ring-resize" height={14} />
                  Generating...
                </>
              ) : (
                <>
                  <Icon icon="solar:magic-stick-3-bold" height={14} />
                  Generate Semua Dokumen
                </>
              )}
            </Button>

            {masterSuccessfulDownloadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                onClick={() => {
                  void downloadAllGeneratedDocuments();
                }}
                disabled={isDownloadingAll}
              >
                {isDownloadingAll ? (
                  <>
                    <Icon icon="svg-spinners:ring-resize" height={14} />
                    Menyiapkan ZIP...
                  </>
                ) : (
                  <>
                    <Icon icon="solar:download-bold" height={14} />
                    Download Semua Dokumen
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {!generationReady && masterMissingFields.length > 0 && (
          <p className="text-[11px] text-bodytext">
            Belum siap generate. Data yang masih kurang: {masterMissingFields.join(", ")}
          </p>
        )}

        <div className="flex items-center justify-between">
          <h5 className="text-sm font-semibold text-dark">Dokumen Master</h5>
          <span className="text-[11px] text-bodytext">
            {normalizedMasterDocumentOverview.completed}/{normalizedMasterDocumentOverview.total} selesai
          </span>
        </div>
        <div className="space-y-2">
          {masterGenerationStatusItems.map((item) =>
            renderUnifiedDocumentCard({
              label: item.label,
              summary: item.downloadLogId ? 'Siap diunduh' : item.errorMessage || 'Belum digenerate',
              completionPercent: item.downloadLogId ? 100 : Number(item.progressPercent || 0),
              completedLabel: item.downloadLogId ? '1/1' : `${Math.round(Number(item.progressPercent || 0))}%`,
              status: item.status,
              errorMessage: item.errorMessage,
              downloadLogId: item.downloadLogId,
              readyForDownload: item.readyForDownload,
              fallbackFilename: item.fallbackFilename,
              onGenerate: item.onGenerate,
              generating: item.generating,
            })
          )}
        </div>
      </div>
    );
  };

  if (isLoading && !validationData) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h4 className="text-base font-bold text-dark">Dokumen</h4>
          <p className="text-xs text-bodytext">Memuat...</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Icon icon="svg-spinners:ring-resize" height={24} className="text-gray-400" />
        </div>
      </div>
    );
  }

  if (!validationData) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h4 className="text-base font-bold text-dark">Dokumen</h4>
          <p className="text-xs text-bodytext">Tidak dapat memuat data</p>
        </div>
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
          <Icon icon="solar:folder-error-bold-duotone" height={40} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-bodytext mb-3">Gagal memuat dokumen</p>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <Icon icon="solar:refresh-bold" height={14} className="mr-1" />
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (validationData.documents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h4 className="text-base font-bold text-dark">Dokumen</h4>
          <p className="text-xs text-bodytext">Belum ada template tersedia</p>
        </div>
        <div className="text-center py-8 border border-dashed border-gray-200 rounded-lg">
          <Icon icon="solar:document-add-bold-duotone" height={40} className="text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-bodytext">Template dokumen tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const isMasterCategory = category === 'master';

  return (
    <div className="space-y-4">
      {isMasterCategory ? (
        renderMasterSidebar()
      ) : (
        <>
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-base font-bold text-dark">Progress Dokumen</h4>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <Icon
                  icon="solar:refresh-linear"
                  height={16}
                  className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
            <p className="text-xs text-bodytext">
              Fase saat ini: {documentPhase || 'lesson_plan'}
            </p>

            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-bodytext">
                <span>
                  {trainerOverview.completedFields}/{trainerOverview.totalFields} field
                </span>
                <span>{trainerOverview.completionPercent}%</span>
              </div>
              <Progress value={trainerOverview.completionPercent} className="h-1.5" />
            </div>
          </div>

          {documentId && (
            <div className="mb-2 space-y-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                onClick={() => setIsGenerateAllOpen(true)}
                disabled={!generationReady}
              >
                <Icon icon="solar:magic-stick-3-bold" height={14} />
                Generate Semua Dokumen
              </Button>
              {trainerSuccessfulDownloadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-8 text-xs gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    void downloadAllGeneratedDocuments();
                  }}
                  disabled={isDownloadingAll}
                >
                  {isDownloadingAll ? (
                    <>
                      <Icon icon="svg-spinners:ring-resize" height={14} />
                      Menyiapkan ZIP...
                    </>
                  ) : (
                    <>
                      <Icon icon="solar:download-bold" height={14} />
                      Download Semua Dokumen
                    </>
                  )}
                </Button>
              )}
              {!generationReady && missingFields.length > 0 && (
                <p className="text-[11px] text-bodytext">
                  Belum siap generate. Data yang masih kurang: {missingFields.join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="space-y-3">
            {CATEGORY_ORDER.map((categoryKey) => {
              const docs = validationData.byCategory[categoryKey] || [];
              if (docs.length === 0) return null;

              const config = CATEGORY_CONFIG[categoryKey];
              const readyCount = docs.filter((d) => d.canGenerate).length;

              return (
                <div key={categoryKey} className="space-y-2">
                  <div className="flex items-center gap-2 px-1 py-1">
                    <span className="text-sm">{config.emoji}</span>
                    <span className="text-sm font-semibold text-dark">{config.title}</span>
                    <span className="text-xs text-bodytext">
                      ({readyCount}/{docs.length})
                    </span>
                  </div>

                  {docs.map((doc) => {
                    const latestLog = latestTrainerLogsByType.get(doc.templateName);
                    const docStatusItem: GenerationStatusItem = {
                      id: doc.templateName,
                      label: doc.displayName,
                      status: (latestLog?.status || (doc.canGenerate ? 'success' : 'pending')) as GenerationStatusItem['status'],
                      errorMessage: latestLog?.errorMessage,
                      progressPercent: latestLog?.progressPercent,
                      downloadLogId: latestLog?.status === 'success' ? latestLog.id : null,
                      readyForDownload:
                        !!latestLog?.id && latestLog.status === 'success'
                          ? true
                          : doc.canGenerate && latestLog?.status !== 'processing' && latestLog?.status !== 'failed',
                      fallbackFilename: doc.templateName,
                      onGenerate: doc.canGenerate ? () => handleGenerate(doc.templateName, doc.displayName) : undefined,
                      generating: generatingDoc === doc.templateName,
                    };

                    return renderUnifiedDocumentCard({
                      label: doc.displayName,
                      summary:
                        docStatusItem.readyForDownload
                          ? 'Siap diunduh'
                          : doc.missingFields.length > 0
                          ? `Kurang: ${doc.missingFields.slice(0, 2).map((f) => f.displayName).join(', ')}${doc.missingFields.length > 2 ? ` +${doc.missingFields.length - 2}` : ''}`
                          : 'Belum digenerate',
                      completionPercent: doc.completionPercent,
                      completedLabel: `${doc.completedFields}/${doc.totalFields}`,
                      status: docStatusItem.status,
                      errorMessage: docStatusItem.errorMessage,
                      downloadLogId: docStatusItem.downloadLogId,
                      readyForDownload: docStatusItem.readyForDownload,
                      fallbackFilename: docStatusItem.fallbackFilename,
                      onGenerate: docStatusItem.onGenerate,
                      generating: docStatusItem.generating,
                      onOpenDetails: () => handleDocumentClick(doc),
                    });
                  })}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Field Edit Drawer */}
      <FieldEditDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedDocument(null);
        }}
        document={selectedDocument}
        onAskAI={handleAskAI}
        onSave={async (fields) => {
          if (!documentId) return;
          try {
            await api.post(`/ai/document/${documentId}/fields`, { fields });
            // Refresh validation
            fetchValidation();
            toast({
              title: 'Berhasil disimpan',
              description: 'Data field telah disimpan.',
            });
          } catch (error: any) {
            console.error('[DocumentProgressSidebar] Save fields failed:', error);
            throw error;
          }
        }}
        onGenerate={async (templateName) => {
          if (!documentId || !selectedDocument) return;
          await handleGenerate(templateName, selectedDocument.displayName);
        }}
      />

      <MasterFieldEditDrawer
        isOpen={isMasterDrawerOpen}
        onClose={() => {
          setIsMasterDrawerOpen(false);
          setSelectedMasterSection(null);
        }}
        section={selectedMasterSection}
        onAskAI={(prompt) => {
          if (onAskAI) {
            onAskAI(prompt);
          } else if ((window as any).__sendChatMessage) {
            (window as any).__sendChatMessage(prompt);
          }
          setIsMasterDrawerOpen(false);
        }}
        onSave={
          selectedMasterSection && !selectedMasterSection.readOnly && onSaveMasterSection
            ? async (values) => {
                await onSaveMasterSection(selectedMasterSection.id, values);
                await fetchValidation();
                toast({
                  title: 'Berhasil disimpan',
                  description: 'Data master telah disimpan.',
                });
              }
            : undefined
        }
      />

      {/* Generate All Progress Modal */}
      {documentId && (
        <GenerateAllProgress
          documentId={documentId}
          isOpen={isGenerateAllOpen}
          onClose={() => setIsGenerateAllOpen(false)}
          onComplete={() => {
            fetchValidation();
            onRefresh?.();
          }}
          mode={isMasterCategory ? "master" : "trainer"}
        />
      )}
    </div>
  );
};
