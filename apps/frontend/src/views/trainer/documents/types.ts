/**
 * Types for Trainer Documents page
 */

export interface DocumentType {
  key: string;
  displayName: string;
  description: string;
  status: 'active' | 'draft' | 'deprecated';
  requiredSections: string[];
}

export interface DocumentGenerationLog {
  id: string;
  aiDocumentId: string;
  documentType: string;
  status: 'pending' | 'processing' | 'success' | 'failed';
  progressPercent: number;
  errorMessage: string | null;
  retryCount: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  filename?: string | null;
  filePath?: string | null;
}

export interface DocumentListItem {
  key: string;
  displayName: string;
  description: string;
  templateStatus: 'available';
  lastGeneratedDate: string | null;
  lastStatus: 'pending' | 'processing' | 'success' | 'failed' | null;
  lastLogId: string | null;
  /** Progress percentage (0-100) from the latest log */
  progressPercent: number;
  /** Last error message (if any) from the latest log */
  lastErrorMessage: string | null;
  /** Retry count from the latest log */
  retryCount: number;
}

/** Status filter options for the documents table */
export type StatusFilter = 'all' | 'pending' | 'processing' | 'success' | 'failed';

export interface LatestDocumentResponse {
  documentId: string;
  progress: Record<string, string>;
  state: 'draft' | 'in_progress' | 'ready';
  isNew: boolean;
}
