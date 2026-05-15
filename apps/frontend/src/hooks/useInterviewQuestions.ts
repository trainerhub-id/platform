/**
 * useInterviewQuestions Hook
 *
 * Custom hook for fetching interview questions for a specific agent type.
 * Integrates with the Zustand document store for state management.
 *
 * Requirements: 2.1, 6.1
 */

import { useCallback, useEffect } from 'react';
import {
  useDocumentStore,
  useInterviewQuestions as useQuestions,
  useIsLoadingQuestions,
  useQuestionsError,
  useInterviewProgress,
  useInterviewAnswers,
  type InterviewQuestion,
  type InterviewProgress,
} from '../stores';

interface UseInterviewQuestionsOptions {
  /**
   * Whether to fetch questions automatically when documentType changes
   * @default true
   */
  autoFetch?: boolean;
}

interface UseInterviewQuestionsReturn {
  /**
   * Array of interview questions for the current agent
   */
  questions: InterviewQuestion[];

  /**
   * Current interview answers keyed by question ID
   */
  answers: Record<string, any>;

  /**
   * Interview progress information
   */
  progress: InterviewProgress;

  /**
   * Whether questions are currently being fetched
   */
  isLoading: boolean;

  /**
   * Error message if fetching failed
   */
  error: string | null;

  /**
   * Fetch interview questions for a specific document type
   */
  fetchQuestions: (documentType: string) => Promise<void>;

  /**
   * Update an answer for a specific question
   */
  updateAnswer: (questionId: string, value: any) => void;

  /**
   * Clear all interview answers
   */
  clearAnswers: () => void;

  /**
   * Clear the error state
   */
  clearError: () => void;

  /**
   * Get a specific question by ID
   */
  getQuestion: (questionId: string) => InterviewQuestion | undefined;

  /**
   * Get the answer for a specific question
   */
  getAnswer: (questionId: string) => any;

  /**
   * Check if a specific question has been answered
   */
  isAnswered: (questionId: string) => boolean;

  /**
   * Get all required questions
   */
  requiredQuestions: InterviewQuestion[];

  /**
   * Get all unanswered required questions
   */
  unansweredRequiredQuestions: InterviewQuestion[];
}

/**
 * Hook for managing interview questions and answers
 *
 * @param documentType - The document type to fetch questions for
 * @param options - Hook configuration options
 * @returns Interview questions state and actions
 *
 * @example
 * ```tsx
 * const {
 *   questions,
 *   answers,
 *   progress,
 *   isLoading,
 *   updateAnswer,
 * } = useInterviewQuestions('lesson-plan');
 *
 * // Update an answer
 * updateAnswer('trainingName', 'My Training');
 *
 * // Check progress
 * console.log(`${progress.percentComplete}% complete`);
 * ```
 */
export function useInterviewQuestions(
  documentType?: string,
  options: UseInterviewQuestionsOptions = {}
): UseInterviewQuestionsReturn {
  const { autoFetch = true } = options;

  // Store selectors
  const questions = useQuestions();
  const answers = useInterviewAnswers();
  const progress = useInterviewProgress();
  const isLoading = useIsLoadingQuestions();
  const error = useQuestionsError();

  // Store actions
  const fetchInterviewQuestions = useDocumentStore((state) => state.fetchInterviewQuestions);
  const updateInterviewAnswer = useDocumentStore((state) => state.updateInterviewAnswer);
  const clearInterviewAnswers = useDocumentStore((state) => state.clearInterviewAnswers);
  const clearQuestionsError = useDocumentStore((state) => state.clearQuestionsError);

  // Fetch questions when documentType changes
  useEffect(() => {
    if (autoFetch && documentType) {
      fetchInterviewQuestions(documentType);
    }
  }, [documentType, autoFetch, fetchInterviewQuestions]);

  // Memoized callbacks
  const fetchQuestions = useCallback(
    async (type: string) => {
      await fetchInterviewQuestions(type);
    },
    [fetchInterviewQuestions]
  );

  const updateAnswer = useCallback(
    (questionId: string, value: any) => {
      updateInterviewAnswer(questionId, value);
    },
    [updateInterviewAnswer]
  );

  const clearAnswers = useCallback(() => {
    clearInterviewAnswers();
  }, [clearInterviewAnswers]);

  const clearError = useCallback(() => {
    clearQuestionsError();
  }, [clearQuestionsError]);

  const getQuestion = useCallback(
    (questionId: string) => {
      return questions.find((q) => q.id === questionId);
    },
    [questions]
  );

  const getAnswer = useCallback(
    (questionId: string) => {
      return answers[questionId];
    },
    [answers]
  );

  const isAnswered = useCallback(
    (questionId: string) => {
      const value = answers[questionId];
      return value !== undefined && value !== null && value !== '';
    },
    [answers]
  );

  // Computed values
  const requiredQuestions = questions.filter((q) => q.required);

  const unansweredRequiredQuestions = requiredQuestions.filter((q) => {
    const value = answers[q.id];
    return value === undefined || value === null || value === '';
  });

  return {
    questions,
    answers,
    progress,
    isLoading,
    error,
    fetchQuestions,
    updateAnswer,
    clearAnswers,
    clearError,
    getQuestion,
    getAnswer,
    isAnswered,
    requiredQuestions,
    unansweredRequiredQuestions,
  };
}

export default useInterviewQuestions;
