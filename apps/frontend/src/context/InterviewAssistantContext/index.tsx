/**
 * Interview Assistant Context
 *
 * Provides Assistant UI runtime configuration for the interview-based
 * document generation flow. Integrates with the Zustand document store
 * for state management.
 *
 * Requirements: 2.1
 */

import React, { createContext, useContext, useCallback, useMemo, useState } from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from '@assistant-ui/react';
import { useDocumentStore, type InterviewQuestion } from '../../stores';

// ============================================
// Types
// ============================================

interface InterviewMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  questionId?: string;
  timestamp: Date;
}

interface InterviewAssistantContextType {
  /** Current question index */
  currentQuestionIndex: number;
  /** Current question being asked */
  currentQuestion: InterviewQuestion | null;
  /** All interview messages */
  messages: InterviewMessage[];
  /** Whether the interview is complete */
  isComplete: boolean;
  /** Whether the interview is in progress */
  isInterviewing: boolean;
  /** Start the interview */
  startInterview: () => void;
  /** End the interview */
  endInterview: () => void;
  /** Move to next question */
  nextQuestion: () => void;
  /** Move to previous question */
  previousQuestion: () => void;
  /** Submit answer for current question */
  submitAnswer: (answer: string) => void;
  /** Reset the interview */
  resetInterview: () => void;
  /** Get progress percentage */
  progressPercent: number;
}

// ============================================
// Context
// ============================================

const InterviewAssistantContext = createContext<InterviewAssistantContextType | undefined>(
  undefined
);

// ============================================
// Custom Model Adapter for Interview Flow
// ============================================

const createInterviewModelAdapter = (
  questions: InterviewQuestion[],
  currentIndex: number,
  onAnswer: (questionId: string, answer: string) => void,
  onComplete: () => void
): ChatModelAdapter => {
  return {
    async run({ messages }) {
      // Get the last user message
      const lastUserMessage = messages.filter((m) => m.role === 'user').pop();
      const userAnswer = lastUserMessage?.content?.[0]?.type === 'text'
        ? lastUserMessage.content[0].text
        : '';

      // If we have a current question and user provided an answer
      if (currentIndex < questions.length && userAnswer) {
        const currentQuestion = questions[currentIndex];
        onAnswer(currentQuestion.id, userAnswer);
      }

      // Determine the next response
      const nextIndex = currentIndex + 1;
      let responseText = '';

      if (nextIndex < questions.length) {
        // Ask the next question
        const nextQuestion = questions[nextIndex];
        responseText = formatQuestionMessage(nextQuestion, nextIndex + 1, questions.length);
      } else {
        // Interview complete
        responseText = '✅ Terima kasih! Semua pertanyaan telah dijawab. Klik tombol "Generate Dokumen" untuk membuat dokumen Anda.';
        onComplete();
      }

      return {
        content: [{ type: 'text' as const, text: responseText }],
      };
    },
  };
};

// ============================================
// Helper Functions
// ============================================

function formatQuestionMessage(
  question: InterviewQuestion,
  questionNumber: number,
  totalQuestions: number
): string {
  let message = `**Pertanyaan ${questionNumber}/${totalQuestions}**\n\n`;
  message += `${question.question}`;

  if (question.helpText) {
    message += `\n\n💡 *${question.helpText}*`;
  }

  if (question.options && question.options.length > 0) {
    message += '\n\nPilihan:\n';
    question.options.forEach((option, index) => {
      message += `${index + 1}. ${option}\n`;
    });
  }

  if (question.required) {
    message += '\n\n⚠️ *Pertanyaan ini wajib dijawab*';
  }

  return message;
}

function getWelcomeMessage(agentName: string, totalQuestions: number): string {
  return `👋 Selamat datang! Saya akan membantu Anda membuat **${agentName}**.

Saya akan mengajukan ${totalQuestions} pertanyaan untuk mengumpulkan informasi yang diperlukan. Jawab setiap pertanyaan dengan lengkap untuk hasil terbaik.

Mari kita mulai! 🚀`;
}

// ============================================
// Provider Component
// ============================================

interface InterviewAssistantProviderProps {
  children: React.ReactNode;
  agentName?: string;
}

export const InterviewAssistantProvider: React.FC<InterviewAssistantProviderProps> = ({
  children,
  agentName = 'Dokumen',
}) => {
  // Zustand store
  const questions = useDocumentStore((state) => state.interviewQuestions);
  const updateInterviewAnswer = useDocumentStore((state) => state.updateInterviewAnswer);
  const storeStartInterview = useDocumentStore((state) => state.startInterview);
  const storeEndInterview = useDocumentStore((state) => state.endInterview);
  const isInterviewing = useDocumentStore((state) => state.isInterviewing);

  // Local state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // Current question
  const currentQuestion = useMemo(() => {
    if (currentQuestionIndex >= 0 && currentQuestionIndex < questions.length) {
      return questions[currentQuestionIndex];
    }
    return null;
  }, [questions, currentQuestionIndex]);

  // Progress percentage
  const progressPercent = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round(((currentQuestionIndex + 1) / questions.length) * 100);
  }, [currentQuestionIndex, questions.length]);

  // Handle answer submission
  const handleAnswer = useCallback(
    (questionId: string, answer: string) => {
      updateInterviewAnswer(questionId, answer);
    },
    [updateInterviewAnswer]
  );

  // Handle interview completion
  const handleComplete = useCallback(() => {
    setIsComplete(true);
  }, []);

  // Model adapter
  const modelAdapter = useMemo(
    () =>
      createInterviewModelAdapter(
        questions,
        currentQuestionIndex,
        handleAnswer,
        handleComplete
      ),
    [questions, currentQuestionIndex, handleAnswer, handleComplete]
  );

  // Assistant runtime
  const runtime = useLocalRuntime(modelAdapter);

  // Start interview
  const startInterview = useCallback(() => {
    storeStartInterview();
    setCurrentQuestionIndex(0);
    setIsComplete(false);
    setMessages([]);

    // Add welcome message
    if (questions.length > 0) {
      const welcomeMsg: InterviewMessage = {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(agentName, questions.length),
        timestamp: new Date(),
      };

      const firstQuestionMsg: InterviewMessage = {
        id: 'q-0',
        role: 'assistant',
        content: formatQuestionMessage(questions[0], 1, questions.length),
        questionId: questions[0].id,
        timestamp: new Date(),
      };

      setMessages([welcomeMsg, firstQuestionMsg]);
    }
  }, [storeStartInterview, questions, agentName]);

  // End interview
  const endInterview = useCallback(() => {
    storeEndInterview();
    setCurrentQuestionIndex(-1);
    setIsComplete(false);
  }, [storeEndInterview]);

  // Submit answer
  const submitAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;

      // Save answer
      handleAnswer(currentQuestion.id, answer);

      // Add user message
      const userMsg: InterviewMessage = {
        id: `user-${currentQuestionIndex}`,
        role: 'user',
        content: answer,
        questionId: currentQuestion.id,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);

      // Move to next question
      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentQuestionIndex(nextIndex);

        // Add next question message
        const nextQuestionMsg: InterviewMessage = {
          id: `q-${nextIndex}`,
          role: 'assistant',
          content: formatQuestionMessage(questions[nextIndex], nextIndex + 1, questions.length),
          questionId: questions[nextIndex].id,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, nextQuestionMsg]);
      } else {
        // Interview complete
        setIsComplete(true);
        const completeMsg: InterviewMessage = {
          id: 'complete',
          role: 'assistant',
          content:
            '✅ Terima kasih! Semua pertanyaan telah dijawab. Klik tombol "Generate Dokumen" untuk membuat dokumen Anda.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, completeMsg]);
      }
    },
    [currentQuestion, currentQuestionIndex, questions, handleAnswer]
  );

  // Next question
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  // Previous question
  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Reset interview
  const resetInterview = useCallback(() => {
    setCurrentQuestionIndex(-1);
    setMessages([]);
    setIsComplete(false);
  }, []);

  // Context value
  const contextValue = useMemo(
    () => ({
      currentQuestionIndex,
      currentQuestion,
      messages,
      isComplete,
      isInterviewing,
      startInterview,
      endInterview,
      nextQuestion,
      previousQuestion,
      submitAnswer,
      resetInterview,
      progressPercent,
    }),
    [
      currentQuestionIndex,
      currentQuestion,
      messages,
      isComplete,
      isInterviewing,
      startInterview,
      endInterview,
      nextQuestion,
      previousQuestion,
      submitAnswer,
      resetInterview,
      progressPercent,
    ]
  );

  return (
    <InterviewAssistantContext.Provider value={contextValue}>
      <AssistantRuntimeProvider runtime={runtime}>{children}</AssistantRuntimeProvider>
    </InterviewAssistantContext.Provider>
  );
};

// ============================================
// Hook
// ============================================

export function useInterviewAssistant(): InterviewAssistantContextType {
  const context = useContext(InterviewAssistantContext);
  if (!context) {
    throw new Error('useInterviewAssistant must be used within InterviewAssistantProvider');
  }
  return context;
}

export default InterviewAssistantProvider;
