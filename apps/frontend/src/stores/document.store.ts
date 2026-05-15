/**
 * Document Store - Zustand State Management
 *
 * Manages state for the extensible agent system including:
 * - Document type selection
 * - Available agents
 * - Interview flow (questions, answers, progress)
 * - Document generation
 * - Export functionality
 *
 * Requirements: 2.1, 2.3, 6.1
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import api from '../api/axios';

// ============================================
// Type Definitions (matching backend interfaces)
// ============================================

/**
 * Validation rule for interview questions
 */
export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max';
  value?: any;
  message?: string;
}

/**
 * Interview question definition
 */
export interface InterviewQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'date';
  question: string;
  required: boolean;
  options?: string[];
  validation?: ValidationRule[];
  placeholder?: string;
  helpText?: string;
}

/**
 * Interview response from user
 */
export interface InterviewResponse {
  questionId: string;
  value: any;
  answeredAt: Date;
}

/**
 * Document section structure
 */
export interface DocumentSection {
  id: string;
  title: string;
  content: string;
  order: number;
  subsections?: DocumentSection[];
}

/**
 * Document metadata
 */
export interface DocumentMetadata {
  title: string;
  author?: string;
  createdAt: Date;
  documentType: string;
  version?: string;
  tags?: string[];
}

/**
 * Generated document structure
 */
export interface GeneratedDocument {
  title: string;
  sections: DocumentSection[];
  metadata: DocumentMetadata;
}

/**
 * Agent information for registry
 */
export interface AgentInfo {
  type: string;
  name: string;
  description: string;
  category: string;
}

/**
 * Interview progress information
 */
export interface InterviewProgress {
  totalQuestions: number;
  answeredQuestions: number;
  requiredQuestions: number;
  answeredRequiredQuestions: number;
  percentComplete: number;
  canGenerate: boolean;
}

/**
 * Validation result for responses
 */
export interface ValidationResult {
  isValid: boolean;
  errors: {
    questionId: string;
    message: string;
  }[];
}

/**
 * Export format options
 */
export type ExportFormat = 'docx' | 'pdf';

/**
 * Export options
 */
export interface ExportOptions {
  includeMetadata?: boolean;
  includeTableOfContents?: boolean;
  pageSize?: 'A4' | 'Letter';
  margins?: {
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
}

// ============================================
// Store State Interface
// ============================================

interface DocumentState {
  // Document Type Selection
  documentType: string | null;
  availableAgents: AgentInfo[];
  isLoadingAgents: boolean;
  agentsError: string | null;

  // Interview Phase
  interviewQuestions: InterviewQuestion[];
  interviewAnswers: Record<string, any>;
  interviewProgress: InterviewProgress;
  isLoadingQuestions: boolean;
  questionsError: string | null;
  isInterviewing: boolean;

  // Document Generation
  generatedDocument: GeneratedDocument | null;
  isGenerating: boolean;
  generationError: string | null;

  // Editor Phase
  editorContent: string;
  isDirty: boolean;

  // Export
  isExporting: boolean;
  exportError: string | null;
  exportFormat: ExportFormat | null;
}

// ============================================
// Store Actions Interface
// ============================================

interface DocumentActions {
  // Agent Actions
  setDocumentType: (type: string | null) => void;
  fetchAgents: () => Promise<void>;
  clearAgentsError: () => void;

  // Interview Actions
  fetchInterviewQuestions: (documentType: string) => Promise<void>;
  updateInterviewAnswer: (questionId: string, value: any) => void;
  clearInterviewAnswers: () => void;
  startInterview: () => void;
  endInterview: () => void;
  clearQuestionsError: () => void;

  // Generation Actions
  generateDocument: () => Promise<void>;
  validateResponses: () => Promise<ValidationResult>;
  clearGeneratedDocument: () => void;
  clearGenerationError: () => void;

  // Editor Actions
  updateEditorContent: (content: string) => void;
  markAsSaved: () => void;

  // Export Actions
  exportDocument: (format: ExportFormat, options?: ExportOptions) => Promise<Blob>;
  getHtmlPreview: (options?: ExportOptions) => Promise<string>;
  clearExportError: () => void;

  // Reset Actions
  resetStore: () => void;
  resetInterview: () => void;
}

// ============================================
// Initial State
// ============================================

const initialProgress: InterviewProgress = {
  totalQuestions: 0,
  answeredQuestions: 0,
  requiredQuestions: 0,
  answeredRequiredQuestions: 0,
  percentComplete: 0,
  canGenerate: false,
};

const initialState: DocumentState = {
  // Document Type Selection
  documentType: null,
  availableAgents: [],
  isLoadingAgents: false,
  agentsError: null,

  // Interview Phase
  interviewQuestions: [],
  interviewAnswers: {},
  interviewProgress: initialProgress,
  isLoadingQuestions: false,
  questionsError: null,
  isInterviewing: false,

  // Document Generation
  generatedDocument: null,
  isGenerating: false,
  generationError: null,

  // Editor Phase
  editorContent: '',
  isDirty: false,

  // Export
  isExporting: false,
  exportError: null,
  exportFormat: null,
};

// ============================================
// Helper Functions
// ============================================

/**
 * Calculate interview progress based on questions and answers
 */
const calculateProgress = (
  questions: InterviewQuestion[],
  answers: Record<string, any>
): InterviewProgress => {
  const totalQuestions = questions.length;
  const requiredQuestions = questions.filter((q) => q.required).length;

  const answeredQuestions = Object.keys(answers).filter((key) => {
    const value = answers[key];
    return value !== undefined && value !== null && value !== '';
  }).length;

  const answeredRequiredQuestions = questions.filter(
    (q) => q.required && answers[q.id] !== undefined && answers[q.id] !== null && answers[q.id] !== ''
  ).length;

  const percentComplete =
    requiredQuestions > 0
      ? Math.round((answeredRequiredQuestions / requiredQuestions) * 100)
      : 100;

  const canGenerate = answeredRequiredQuestions >= requiredQuestions;

  return {
    totalQuestions,
    answeredQuestions,
    requiredQuestions,
    answeredRequiredQuestions,
    percentComplete,
    canGenerate,
  };
};

// ============================================
// Zustand Store
// ============================================

export const useDocumentStore = create<DocumentState & DocumentActions>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ============================================
      // Agent Actions
      // ============================================

      setDocumentType: (type) => {
        set({ documentType: type }, false, 'setDocumentType');
      },

      fetchAgents: async () => {
        set({ isLoadingAgents: true, agentsError: null }, false, 'fetchAgents/start');
        try {
          const response = await api.get<AgentInfo[]>('/ai/documents/agents');
          set(
            { availableAgents: response.data, isLoadingAgents: false },
            false,
            'fetchAgents/success'
          );
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to fetch agents';
          set(
            { agentsError: errorMessage, isLoadingAgents: false },
            false,
            'fetchAgents/error'
          );
        }
      },

      clearAgentsError: () => {
        set({ agentsError: null }, false, 'clearAgentsError');
      },

      // ============================================
      // Interview Actions
      // ============================================

      fetchInterviewQuestions: async (documentType) => {
        set(
          { isLoadingQuestions: true, questionsError: null },
          false,
          'fetchInterviewQuestions/start'
        );
        try {
          const response = await api.post<{
            questions: InterviewQuestion[];
            metadata: { type: string; name: string };
          }>(`/ai/documents/interview-questions/${documentType}`);

          const questions = response.data.questions;
          const progress = calculateProgress(questions, {});

          set(
            {
              interviewQuestions: questions,
              interviewProgress: progress,
              isLoadingQuestions: false,
              documentType,
            },
            false,
            'fetchInterviewQuestions/success'
          );
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to fetch interview questions';
          set(
            { questionsError: errorMessage, isLoadingQuestions: false },
            false,
            'fetchInterviewQuestions/error'
          );
        }
      },

      updateInterviewAnswer: (questionId, value) => {
        const { interviewQuestions, interviewAnswers } = get();
        const newAnswers = { ...interviewAnswers, [questionId]: value };
        const progress = calculateProgress(interviewQuestions, newAnswers);

        set(
          { interviewAnswers: newAnswers, interviewProgress: progress },
          false,
          'updateInterviewAnswer'
        );
      },

      clearInterviewAnswers: () => {
        const { interviewQuestions } = get();
        const progress = calculateProgress(interviewQuestions, {});
        set(
          { interviewAnswers: {}, interviewProgress: progress },
          false,
          'clearInterviewAnswers'
        );
      },

      startInterview: () => {
        set({ isInterviewing: true }, false, 'startInterview');
      },

      endInterview: () => {
        set({ isInterviewing: false }, false, 'endInterview');
      },

      clearQuestionsError: () => {
        set({ questionsError: null }, false, 'clearQuestionsError');
      },

      // ============================================
      // Generation Actions
      // ============================================

      generateDocument: async () => {
        const { documentType, interviewAnswers, interviewQuestions } = get();

        if (!documentType) {
          set({ generationError: 'No document type selected' }, false, 'generateDocument/error');
          return;
        }

        set({ isGenerating: true, generationError: null }, false, 'generateDocument/start');

        try {
          // Convert answers to InterviewResponse format
          const responses: InterviewResponse[] = interviewQuestions
            .filter((q) => interviewAnswers[q.id] !== undefined && interviewAnswers[q.id] !== '')
            .map((q) => ({
              questionId: q.id,
              value: interviewAnswers[q.id],
              answeredAt: new Date(),
            }));

          const response = await api.post<{
            success: boolean;
            document: GeneratedDocument;
            generatedAt: string;
            agentType: string;
          }>(
            `/ai/documents/generate/${documentType}`,
            { responses }
          );

          // Extract document from response
          const generatedDoc = response.data.document;

          // Convert sections to HTML for editor
          const editorContent = sectionsToHtml(generatedDoc.sections);

          set(
            {
              generatedDocument: generatedDoc,
              editorContent,
              isGenerating: false,
              isInterviewing: false,
            },
            false,
            'generateDocument/success'
          );
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || 'Failed to generate document';
          set(
            { generationError: errorMessage, isGenerating: false },
            false,
            'generateDocument/error'
          );
        }
      },

      validateResponses: async () => {
        const { documentType, interviewAnswers, interviewQuestions } = get();

        if (!documentType) {
          return { isValid: false, errors: [{ questionId: '', message: 'No document type selected' }] };
        }

        try {
          // Convert answers to InterviewResponse format
          const responses: InterviewResponse[] = interviewQuestions
            .filter((q) => interviewAnswers[q.id] !== undefined && interviewAnswers[q.id] !== '')
            .map((q) => ({
              questionId: q.id,
              value: interviewAnswers[q.id],
              answeredAt: new Date(),
            }));

          const response = await api.post<ValidationResult>(
            `/ai/documents/validate/${documentType}`,
            { responses }
          );

          return response.data;
        } catch (error: any) {
          return {
            isValid: false,
            errors: [
              {
                questionId: '',
                message: error.response?.data?.message || error.message || 'Validation failed',
              },
            ],
          };
        }
      },

      clearGeneratedDocument: () => {
        set(
          { generatedDocument: null, editorContent: '', isDirty: false },
          false,
          'clearGeneratedDocument'
        );
      },

      clearGenerationError: () => {
        set({ generationError: null }, false, 'clearGenerationError');
      },

      // ============================================
      // Editor Actions
      // ============================================

      updateEditorContent: (content) => {
        set({ editorContent: content, isDirty: true }, false, 'updateEditorContent');
      },

      markAsSaved: () => {
        set({ isDirty: false }, false, 'markAsSaved');
      },

      // ============================================
      // Export Actions
      // ============================================

      exportDocument: async (format, options) => {
        const { generatedDocument, editorContent } = get();

        if (!generatedDocument) {
          throw new Error('No document to export');
        }

        set({ isExporting: true, exportError: null, exportFormat: format }, false, 'exportDocument/start');

        try {
          // Create document with current editor content
          const documentToExport = {
            ...generatedDocument,
            // If editor content has been modified, use it
            editorHtml: editorContent,
          };

          const response = await api.post(
            `/ai/documents/export/${format}`,
            { document: documentToExport, options },
            { responseType: 'blob' }
          );

          set({ isExporting: false }, false, 'exportDocument/success');
          return response.data;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || error.message || `Failed to export as ${format.toUpperCase()}`;
          set(
            { exportError: errorMessage, isExporting: false },
            false,
            'exportDocument/error'
          );
          throw new Error(errorMessage);
        }
      },

      getHtmlPreview: async (options) => {
        const { generatedDocument, editorContent } = get();

        if (!generatedDocument) {
          throw new Error('No document to preview');
        }

        try {
          const documentToPreview = {
            ...generatedDocument,
            editorHtml: editorContent,
          };

          const response = await api.post<{ html: string }>(
            '/ai/documents/export/preview',
            { document: documentToPreview, options }
          );

          return response.data.html;
        } catch (error: any) {
          throw new Error(
            error.response?.data?.message || error.message || 'Failed to get preview'
          );
        }
      },

      clearExportError: () => {
        set({ exportError: null }, false, 'clearExportError');
      },

      // ============================================
      // Reset Actions
      // ============================================

      resetStore: () => {
        set(initialState, false, 'resetStore');
      },

      resetInterview: () => {
        set(
          {
            interviewQuestions: [],
            interviewAnswers: {},
            interviewProgress: initialProgress,
            isInterviewing: false,
            questionsError: null,
            generatedDocument: null,
            editorContent: '',
            isDirty: false,
            generationError: null,
          },
          false,
          'resetInterview'
        );
      },
    }),
    { name: 'document-store' }
  )
);

// ============================================
// Helper: Convert sections to HTML
// ============================================

function formatContent(content: string): string {
  // Check if content looks like JSON
  if (content.trim().startsWith('{') || content.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(content);
      return formatJsonToHtml(parsed);
    } catch {
      // Not valid JSON, continue with normal formatting
    }
  }

  // Convert numbered lists (1. item, 2. item)
  const lines = content.split('\n');
  let inList = false;
  let html = '';

  for (const line of lines) {
    const trimmed = line.trim();
    const listMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);

    if (listMatch) {
      if (!inList) {
        html += '<ol>\n';
        inList = true;
      }
      html += `<li>${listMatch[2]}</li>\n`;
    } else {
      if (inList) {
        html += '</ol>\n';
        inList = false;
      }
      if (trimmed) {
        // Check for label: value format
        const labelMatch = trimmed.match(/^([^:]+):\s*(.+)$/);
        if (labelMatch) {
          html += `<p><strong>${labelMatch[1]}:</strong> ${labelMatch[2]}</p>\n`;
        } else {
          html += `<p>${trimmed}</p>\n`;
        }
      }
    }
  }

  if (inList) {
    html += '</ol>\n';
  }

  return html || `<p>${content}</p>`;
}

function formatJsonToHtml(obj: unknown): string {
  if (typeof obj === 'string') {
    return `<p>${obj}</p>`;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) return '';
    
    // Check if array of strings
    if (typeof obj[0] === 'string') {
      return '<ul>\n' + obj.map(item => `<li>${item}</li>`).join('\n') + '\n</ul>';
    }
    
    // Array of objects
    return obj.map((item, index) => {
      if (typeof item === 'object' && item !== null) {
        return `<div class="mb-4">\n${formatJsonToHtml(item)}</div>`;
      }
      return `<p>${index + 1}. ${item}</p>`;
    }).join('\n');
  }

  if (typeof obj === 'object' && obj !== null) {
    const entries = Object.entries(obj as Record<string, unknown>);
    return entries.map(([key, value]) => {
      const label = key
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();

      if (Array.isArray(value)) {
        if (value.length === 0) return '';
        if (typeof value[0] === 'string') {
          return `<p><strong>${label}:</strong></p>\n<ul>\n${value.map(v => `<li>${v}</li>`).join('\n')}\n</ul>`;
        }
        return `<p><strong>${label}:</strong></p>\n${formatJsonToHtml(value)}`;
      }

      if (typeof value === 'object' && value !== null) {
        return `<p><strong>${label}:</strong></p>\n${formatJsonToHtml(value)}`;
      }

      return `<p><strong>${label}:</strong> ${value}</p>`;
    }).filter(Boolean).join('\n');
  }

  return `<p>${obj}</p>`;
}

function sectionsToHtml(sections: DocumentSection[]): string {
  return sections
    .sort((a, b) => a.order - b.order)
    .map((section) => {
      let html = `<h2>${section.title}</h2>\n`;
      
      // Format the content properly
      html += formatContent(section.content);

      // Only add subsections if they provide different content than what's in content
      if (section.subsections && section.subsections.length > 0) {
        // Check if subsections are already represented in content
        const contentHasSubsections = section.subsections.some(sub => 
          section.content.includes(sub.title) || section.content.includes(sub.content.substring(0, 20))
        );
        
        if (!contentHasSubsections) {
          html += '\n' + section.subsections
            .sort((a, b) => a.order - b.order)
            .map(sub => `<h3>${sub.title}</h3>\n${formatContent(sub.content)}`)
            .join('\n');
        }
      }

      return html;
    })
    .join('\n\n');
}

// ============================================
// Selector Hooks for Performance
// ============================================

export const useDocumentType = () => useDocumentStore((state) => state.documentType);
export const useAvailableAgents = () => useDocumentStore((state) => state.availableAgents);
export const useInterviewQuestions = () => useDocumentStore((state) => state.interviewQuestions);
export const useInterviewAnswers = () => useDocumentStore((state) => state.interviewAnswers);
export const useInterviewProgress = () => useDocumentStore((state) => state.interviewProgress);
export const useGeneratedDocument = () => useDocumentStore((state) => state.generatedDocument);
export const useEditorContent = () => useDocumentStore((state) => state.editorContent);
export const useIsDirty = () => useDocumentStore((state) => state.isDirty);

// Loading states
export const useIsLoadingAgents = () => useDocumentStore((state) => state.isLoadingAgents);
export const useIsLoadingQuestions = () => useDocumentStore((state) => state.isLoadingQuestions);
export const useIsGenerating = () => useDocumentStore((state) => state.isGenerating);
export const useIsExporting = () => useDocumentStore((state) => state.isExporting);
export const useIsInterviewing = () => useDocumentStore((state) => state.isInterviewing);

// Error states
export const useAgentsError = () => useDocumentStore((state) => state.agentsError);
export const useQuestionsError = () => useDocumentStore((state) => state.questionsError);
export const useGenerationError = () => useDocumentStore((state) => state.generationError);
export const useExportError = () => useDocumentStore((state) => state.exportError);

export default useDocumentStore;
