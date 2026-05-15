/**
 * Hook for managing trainer documents page data
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from 'src/lib/better-auth';
import api from 'src/api/axios';
import type {
  DocumentListItem,
  DocumentGenerationLog,
  LatestDocumentResponse,
  StatusFilter,
} from '../types';

// 14 document types matching Carbone template keys
const DOCUMENT_TYPES: Array<{
  key: string;
  displayName: string;
  description: string;
}> = [
    {
      key: 'training_needs_analysis',
      displayName: 'Training Needs Analysis',
      description: 'Analisis kebutuhan pelatihan',
    },
    // Hidden: training_program (uncomment to show)
    // {
    //   key: 'training_program',
    //   displayName: 'Training Program',
    //   description: 'Program pelatihan berbasis kompetensi',
    // },
    {
      key: 'competency_map',
      displayName: 'Competency Map',
      description: 'Peta kompetensi pelatihan',
    },
    {
      key: 'lesson_plan',
      displayName: 'Lesson Plan',
      description: 'Rencana pelaksanaan pembelajaran',
    },
    {
      key: 'material_list',
      displayName: 'Material List',
      description: 'Daftar bahan pelatihan',
    },
    {
      key: 'equipment_list',
      displayName: 'Equipment List',
      description: 'Daftar peralatan pelatihan',
    },
    {
      key: 'job_safety_analysis',
      displayName: 'Job Safety Analysis',
      description: 'Analisis keselamatan kerja',
    },
    {
      key: 'pretest',
      displayName: 'Pre-Test',
      description: 'Soal pre-test peserta',
    },
    {
      key: 'posttest',
      displayName: 'Post-Test',
      description: 'Soal post-test peserta',
    },
    {
      key: 'training_evaluation',
      displayName: 'Training Evaluation',
      description: 'Evaluasi pelatihan',
    },
    {
      key: 'fr_ia_01_observation',
      displayName: 'FR.IA.01 Observasi',
      description: 'Form asesmen observasi BNSP',
    },
    {
      key: 'fr_ia_02_demonstration',
      displayName: 'FR.IA.02 Demonstrasi',
      description: 'Form asesmen demonstrasi BNSP',
    },
    {
      key: 'fr_ia_03_oral',
      displayName: 'FR.IA.03 Lisan',
      description: 'Form asesmen lisan BNSP',
    },
    {
      key: 'pretest_scoring',
      displayName: 'Pre-Test Scoring',
      description: 'Penilaian pre-test',
    },
  ];

interface GenerateDocumentResponse {
  logId: string;
  status: 'success' | 'failed';
  documentType: string;
  filename?: string;
  filePath?: string;
  success?: boolean;
  validationError?: {
    canGenerate: boolean;
    documentName: string;
    summaryMessage: string;
    missingData: Array<{
      section: string;
      sectionName: string;
      friendlyMessage: string;
      aiMentorUrl: string;
    }>;
  };
}

interface RetryDocumentResponse {
  logId: string;
  status: 'success' | 'failed';
  documentType: string;
}

interface BatchGenerateResponse {
  success: boolean;
  totalRequested: number;
  totalSuccess: number;
  totalFailed: number;
  results: GenerateDocumentResponse[];
}

interface UseTrainerDocumentsReturn {
  documents: DocumentListItem[];
  filteredDocuments: DocumentListItem[];
  loading: boolean;
  error: string | null;
  hasAiDocument: boolean;
  aiDocumentId: string | null;
  selectedDocuments: Set<string>;
  generatingDocuments: Set<string>;
  retryingDocuments: Set<string>;
  batchGenerating: boolean;
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  fetchDocuments: () => Promise<void>;
  toggleDocumentSelection: (key: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isAllSelected: boolean;
  generateDocument: (documentType: string) => Promise<GenerateDocumentResponse | null>;
  generateBatch: (documentTypes: string[]) => Promise<BatchGenerateResponse | null>;
  retryDocument: (documentType: string, logId: string) => Promise<RetryDocumentResponse | null>;
  getSelectedDocumentNames: () => string[];
  getDocumentLogs: (documentType: string) => Promise<void>;
  downloadDocument: (logId: string) => Promise<void>;
  documentLogs: Record<string, DocumentGenerationLog[]>;
  loadingLogs: boolean;
}

export function useTrainerDocuments(): UseTrainerDocumentsReturn {
  const { getToken } = useAuth();
  const [documents, setDocuments] = useState<DocumentListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAiDocument, setHasAiDocument] = useState(false);
  const [aiDocumentId, setAiDocumentId] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string>>(
    new Set()
  );
  const [generatingDocuments, setGeneratingDocuments] = useState<Set<string>>(
    new Set()
  );
  const [retryingDocuments, setRetryingDocuments] = useState<Set<string>>(
    new Set()
  );
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [documentLogs, setDocumentLogs] = useState<Record<string, DocumentGenerationLog[]>>({});
  const [loadingLogs, setLoadingLogs] = useState(false);

  // Filter documents based on status filter
  const filteredDocuments = useMemo(() => {
    if (statusFilter === 'all') {
      return documents;
    }
    return documents.filter((doc) => doc.lastStatus === statusFilter);
  }, [documents, statusFilter]);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Get latest ai_document for this trainer
      console.log('[useTrainerDocuments] Fetching latest document...');
      const { data: latestDoc } = await api.get<LatestDocumentResponse>(
        '/ai/document/latest'
      );
      console.log('[useTrainerDocuments] API Response:', latestDoc);

      if (!latestDoc || !latestDoc.documentId) {
        console.log('[useTrainerDocuments] No documentId in response');
        setHasAiDocument(false);
        setDocuments([]);
        return;
      }

      console.log('[useTrainerDocuments] Found documentId:', latestDoc.documentId);
      setHasAiDocument(true);
      setAiDocumentId(latestDoc.documentId);

      // 2. Get generation logs for this document
      console.log('[useTrainerDocuments] Fetching logs...');
      const { data: logs } = await api.get<DocumentGenerationLog[]>(
        `/ai/ai-document/${latestDoc.documentId}/logs`
      );
      console.log('[useTrainerDocuments] Logs count:', logs?.length || 0);

      // 3. Map document types to list items with latest log info
      const documentList: DocumentListItem[] = DOCUMENT_TYPES.map((docType) => {
        // Find the most recent log for this document type
        const typeLog = logs
          .filter((log) => log.documentType === docType.key)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0];

        return {
          key: docType.key,
          displayName: docType.displayName,
          description: docType.description,
          templateStatus: 'available' as const,
          lastGeneratedDate: typeLog?.completedAt || typeLog?.startedAt || null,
          lastStatus: typeLog?.status || null,
          lastLogId: typeLog?.id || null,
          progressPercent: typeLog?.progressPercent ?? 0,
          lastErrorMessage: typeLog?.errorMessage || null,
          retryCount: typeLog?.retryCount ?? 0,
          lastFilename: typeLog?.filename || null,
          lastFilePath: typeLog?.filePath || null,
        };
      });

      setDocuments(documentList);
    } catch (err) {
      console.error('[useTrainerDocuments] Error:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch documents';
      setError(errorMessage);
      setHasAiDocument(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleDocumentSelection = useCallback((key: string) => {
    setSelectedDocuments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedDocuments(new Set(DOCUMENT_TYPES.map((d) => d.key)));
  }, []);

  const deselectAll = useCallback(() => {
    setSelectedDocuments(new Set());
  }, []);

  const isAllSelected =
    selectedDocuments.size === DOCUMENT_TYPES.length &&
    DOCUMENT_TYPES.length > 0;

  const generateDocument = useCallback(
    async (documentType: string): Promise<GenerateDocumentResponse | null> => {
      if (!aiDocumentId) {
        setError('No document ID available. Please refresh the page.');
        return null;
      }

      // Mark as generating
      setGeneratingDocuments((prev) => {
        const newSet = new Set(prev);
        newSet.add(documentType);
        return newSet;
      });
      setError(null);

      try {
        const { data } = await api.post<GenerateDocumentResponse>(
          `/ai/ai-document/${aiDocumentId}/generate`,
          { documentType }
        );

        // Update document status in local state
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc.key === documentType
              ? {
                ...doc,
                lastStatus: data.status || (data.success === false ? 'failed' : 'success'),
                lastGeneratedDate: new Date().toISOString(),
                lastLogId: data.logId,
                progressPercent: data.status === 'success' || data.success === true ? 100 : 0,
                lastErrorMessage: data.validationError ? data.validationError.summaryMessage : null,
                lastFilename: data.filename || null,
                lastFilePath: data.filePath || null,
              }
              : doc
          )
        );

        // Trigger auto-download on success
        if (data.status === 'success') {
          downloadDocument(data.logId);
        }

        return data;
      } catch (err) {
        console.error('[generateDocument] Error:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate document';
        setError(errorMessage);

        // Update document status to failed
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc.key === documentType
              ? {
                ...doc,
                lastStatus: 'failed',
                lastErrorMessage: errorMessage,
                retryCount: doc.retryCount + 1,
              }
              : doc
          )
        );

        return null;
      } finally {
        // Remove from generating set
        setGeneratingDocuments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(documentType);
          return newSet;
        });
      }
    },
    [aiDocumentId]
  );

  const generateBatch = useCallback(
    async (documentTypes: string[]): Promise<BatchGenerateResponse | null> => {
      if (!aiDocumentId) {
        setError('No document ID available. Please refresh the page.');
        return null;
      }

      if (documentTypes.length === 0) {
        setError('No documents selected for batch generation.');
        return null;
      }

      // Mark batch as generating
      setBatchGenerating(true);
      setError(null);

      // Mark all selected documents as generating
      setGeneratingDocuments((prev) => {
        const newSet = new Set(prev);
        documentTypes.forEach((type) => newSet.add(type));
        return newSet;
      });

      try {
        const { data } = await api.post<BatchGenerateResponse>(
          `/ai/ai-document/${aiDocumentId}/generate-batch`,
          { documentTypes }
        );

        // Update document statuses in local state based on results
        setDocuments((prevDocs) =>
          prevDocs.map((doc) => {
            const result = data.results.find((r) => r.documentType === doc.key);
            if (result) {
              return {
                ...doc,
                lastStatus: result.status,
                lastGeneratedDate: new Date().toISOString(),
                lastLogId: result.logId,
                progressPercent: result.status === 'success' ? 100 : 0,
                lastErrorMessage: null,
                lastFilename: result.filename || null,
                lastFilePath: result.filePath || null,
              };
            }
            return doc;
          })
        );

        // Trigger auto-download for all successful ones
        data.results.forEach(res => {
          if (res.status === 'success') {
            downloadDocument(res.logId);
          }
        });

        return data;
      } catch (err) {
        console.error('[generateBatch] Error:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate documents';
        setError(errorMessage);

        // Update document statuses to failed
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            documentTypes.includes(doc.key)
              ? {
                ...doc,
                lastStatus: 'failed',
                lastErrorMessage: errorMessage,
                retryCount: doc.retryCount + 1,
              }
              : doc
          )
        );

        return null;
      } finally {
        // Remove all from generating set and reset batch flag
        setGeneratingDocuments((prev) => {
          const newSet = new Set(prev);
          documentTypes.forEach((type) => newSet.delete(type));
          return newSet;
        });
        setBatchGenerating(false);
      }
    },
    [aiDocumentId]
  );

  const retryDocument = useCallback(
    async (documentType: string, logId: string): Promise<RetryDocumentResponse | null> => {
      if (!aiDocumentId) {
        setError('No document ID available. Please refresh the page.');
        return null;
      }

      // Mark as retrying
      setRetryingDocuments((prev) => {
        const newSet = new Set(prev);
        newSet.add(documentType);
        return newSet;
      });
      setError(null);

      // Update document status to processing immediately
      setDocuments((prevDocs) =>
        prevDocs.map((doc) =>
          doc.key === documentType
            ? {
              ...doc,
              lastStatus: 'processing' as const,
            }
            : doc
        )
      );

      try {
        const { data } = await api.post<RetryDocumentResponse>(
          `/ai/ai-document/${aiDocumentId}/retry/${logId}`
        );

        // Update document status in local state
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc.key === documentType
              ? {
                ...doc,
                lastStatus: data.status,
                lastGeneratedDate: new Date().toISOString(),
                lastLogId: data.logId,
                progressPercent: data.status === 'success' ? 100 : 0,
                lastErrorMessage: null,
                retryCount: doc.retryCount + 1,
              }
              : doc
          )
        );

        return data;
      } catch (err) {
        console.error('[retryDocument] Error:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to retry document generation';
        setError(errorMessage);

        // Update document status to failed with updated error
        setDocuments((prevDocs) =>
          prevDocs.map((doc) =>
            doc.key === documentType
              ? {
                ...doc,
                lastStatus: 'failed' as const,
                lastErrorMessage: errorMessage,
                retryCount: doc.retryCount + 1,
              }
              : doc
          )
        );

        return null;
      } finally {
        // Remove from retrying set
        setRetryingDocuments((prev) => {
          const newSet = new Set(prev);
          newSet.delete(documentType);
          return newSet;
        });
      }
    },
    [aiDocumentId]
  );

  const getSelectedDocumentNames = useCallback((): string[] => {
    return DOCUMENT_TYPES.filter((d) => selectedDocuments.has(d.key)).map(
      (d) => d.displayName
    );
  }, [selectedDocuments]);

  const getDocumentLogs = useCallback(
    async (documentType: string): Promise<void> => {
      if (!aiDocumentId) {
        console.error('[getDocumentLogs] No AI document ID available');
        return;
      }

      setLoadingLogs(true);

      try {
        const { data: logs } = await api.get<DocumentGenerationLog[]>(
          `/ai/ai-document/${aiDocumentId}/logs`
        );

        // Filter logs for this specific document type
        const typeLogs = logs
          .filter((log) => log.documentType === documentType)
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

        setDocumentLogs((prev) => ({
          ...prev,
          [documentType]: typeLogs,
        }));
      } catch (err) {
        console.error('[getDocumentLogs] Error:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch document logs';
        setError(errorMessage);

        // Set empty array on error
        setDocumentLogs((prev) => ({
          ...prev,
          [documentType]: [],
        }));
      } finally {
        setLoadingLogs(false);
      }
    },
    [aiDocumentId]
  );

  const downloadDocument = useCallback(
    async (logId: string): Promise<void> => {
      if (!aiDocumentId) return;

      try {
        const token = await getToken();
        // Use direct link for download matching our new backend endpoint
        const url = `${api.defaults.baseURL}/ai/ai-document/${aiDocumentId}/download/${logId}?token=${token}`;

        // Trigger browser download
        window.open(url, '_blank');
      } catch (err) {
        console.error('[downloadDocument] Error:', err);
        setError('Failed to download document');
      }
    },
    [aiDocumentId, getToken]
  );

  return {
    documents,
    filteredDocuments,
    loading,
    error,
    hasAiDocument,
    aiDocumentId,
    selectedDocuments,
    generatingDocuments,
    retryingDocuments,
    batchGenerating,
    statusFilter,
    setStatusFilter,
    fetchDocuments,
    toggleDocumentSelection,
    selectAll,
    deselectAll,
    isAllSelected,
    generateDocument,
    generateBatch,
    retryDocument,
    getSelectedDocumentNames,
    getDocumentLogs,
    downloadDocument,
    documentLogs,
    loadingLogs,
  };
}
