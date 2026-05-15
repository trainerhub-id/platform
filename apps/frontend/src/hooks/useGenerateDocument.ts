/**
 * useGenerateDocument Hook
 *
 * Custom hook for generating documents using the Hono AI compatibility API.
 * Handles document generation, validation, and state management.
 *
 * Requirements: 2.1, 6.1
 */

import { useCallback } from 'react';
import {
  useDocumentStore,
  useGeneratedDocument,
  useIsGenerating,
  useGenerationError,
  useInterviewProgress,
  useDocumentType,
  type GeneratedDocument,
  type ValidationResult,
} from '../stores';

interface UseGenerateDocumentReturn {
  /**
   * The generated document, or null if not yet generated
   */
  document: GeneratedDocument | null;

  /**
   * Whether document generation is in progress
   */
  isGenerating: boolean;

  /**
   * Error message if generation failed
   */
  error: string | null;

  /**
   * Whether the user can generate a document (all required questions answered)
   */
  canGenerate: boolean;

  /**
   * Current document type being generated
   */
  documentType: string | null;

  /**
   * Generate a document based on current interview answers
   */
  generate: () => Promise<void>;

  /**
   * Validate interview responses before generation
   */
  validate: () => Promise<ValidationResult>;

  /**
   * Clear the generated document
   */
  clearDocument: () => void;

  /**
   * Clear the generation error
   */
  clearError: () => void;

  /**
   * Check if a document has been generated
   */
  hasDocument: boolean;

  /**
   * Get the document title
   */
  documentTitle: string | null;

  /**
   * Get the number of sections in the document
   */
  sectionCount: number;
}

/**
 * Hook for managing document generation
 *
 * @returns Document generation state and actions
 *
 * @example
 * ```tsx
 * const {
 *   document,
 *   isGenerating,
 *   canGenerate,
 *   generate,
 *   validate,
 * } = useGenerateDocument();
 *
 * // Validate before generating
 * const validation = await validate();
 * if (validation.isValid) {
 *   await generate();
 * }
 *
 * // Access generated document
 * if (document) {
 *   console.log(document.title);
 *   document.sections.forEach(section => {
 *     console.log(section.title);
 *   });
 * }
 * ```
 */
export function useGenerateDocument(): UseGenerateDocumentReturn {
  // Store selectors
  const document = useGeneratedDocument();
  const isGenerating = useIsGenerating();
  const error = useGenerationError();
  const progress = useInterviewProgress();
  const documentType = useDocumentType();

  // Store actions
  const generateDocument = useDocumentStore((state) => state.generateDocument);
  const validateResponses = useDocumentStore((state) => state.validateResponses);
  const clearGeneratedDocument = useDocumentStore((state) => state.clearGeneratedDocument);
  const clearGenerationError = useDocumentStore((state) => state.clearGenerationError);

  // Memoized callbacks
  const generate = useCallback(async () => {
    await generateDocument();
  }, [generateDocument]);

  const validate = useCallback(async () => {
    return await validateResponses();
  }, [validateResponses]);

  const clearDocument = useCallback(() => {
    clearGeneratedDocument();
  }, [clearGeneratedDocument]);

  const clearError = useCallback(() => {
    clearGenerationError();
  }, [clearGenerationError]);

  // Computed values
  const canGenerate = progress.canGenerate;
  const hasDocument = document !== null;
  const documentTitle = document?.title ?? null;
  const sectionCount = document?.sections?.length ?? 0;

  return {
    document,
    isGenerating,
    error,
    canGenerate,
    documentType,
    generate,
    validate,
    clearDocument,
    clearError,
    hasDocument,
    documentTitle,
    sectionCount,
  };
}

export default useGenerateDocument;
