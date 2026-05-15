/**
 * Stores Index
 *
 * Central export point for all Zustand stores
 */

export {
  useDocumentStore,
  // Selector hooks
  useDocumentType,
  useAvailableAgents,
  useInterviewQuestions,
  useInterviewAnswers,
  useInterviewProgress,
  useGeneratedDocument,
  useEditorContent,
  useIsDirty,
  // Loading states
  useIsLoadingAgents,
  useIsLoadingQuestions,
  useIsGenerating,
  useIsExporting,
  useIsInterviewing,
  // Error states
  useAgentsError,
  useQuestionsError,
  useGenerationError,
  useExportError,
  // Types
  type ValidationRule,
  type InterviewQuestion,
  type InterviewResponse,
  type DocumentSection,
  type DocumentMetadata,
  type GeneratedDocument,
  type AgentInfo,
  type InterviewProgress,
  type ValidationResult,
  type ExportFormat,
  type ExportOptions,
} from './document.store';
