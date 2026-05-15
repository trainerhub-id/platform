/**
 * InterviewPhase Component
 *
 * Main component for the interview-based document generation flow.
 * Integrates Assistant UI Thread component with Zustand store for state management.
 * Implements question flow based on agent type and handles interview completion.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Progress } from '../ui/progress';
import { ButtonLoading } from 'src/components/ui/loading';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import {
  useDocumentStore,
  useInterviewQuestions,
  useInterviewAnswers,
  useInterviewProgress,
  useIsInterviewing,
  useIsGenerating,
  type InterviewQuestion,
} from '../../stores';

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

interface InterviewPhaseProps {
  /** Agent name for display */
  agentName?: string;
  /** Callback when interview is complete and user wants to generate */
  onGenerate?: () => void;
  /** Callback when user wants to go back */
  onBack?: () => void;
  /** Custom class name */
  className?: string;
}

// ============================================
// Helper Functions
// ============================================

function formatQuestionMessage(
  question: InterviewQuestion,
  questionNumber: number,
  totalQuestions: number
): string {
  let message = `**Pertanyaan ${questionNumber}/${totalQuestions}**\n\n`;
  message += question.question;

  if (question.helpText) {
    message += `\n\n💡 *${question.helpText}*`;
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

function parseMarkdown(text: string): React.ReactNode {
  // Simple markdown parsing for bold, italic, and line breaks
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|\n)/g);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part === '\n') {
      return <br key={index} />;
    }
    return part;
  });
}

// ============================================
// Sub-Components
// ============================================

interface MessageBubbleProps {
  message: InterviewMessage;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'interview-message',
        isUser ? 'interview-message--user' : 'interview-message--assistant'
      )}
    >
      <div
        className={cn(
          'interview-message__avatar',
          isUser ? 'interview-message__avatar--user' : 'interview-message__avatar--assistant'
        )}
      >
        <Icon
          icon={isUser ? 'solar:user-bold' : 'solar:cpu-bolt-bold-duotone'}
          width={18}
          height={18}
        />
      </div>
      <div
        className={cn(
          'interview-message__content',
          isUser ? 'interview-message__content--user' : 'interview-message__content--assistant'
        )}
      >
        {parseMarkdown(message.content)}
      </div>
    </div>
  );
};

interface ProgressBarProps {
  current: number;
  total: number;
  percent: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total, percent }) => {
  return (
    <div className="interview-progress">
      <div className="interview-progress__header">
        <span className="interview-progress__label">Progress Interview</span>
        <span className="interview-progress__count">
          {current}/{total} pertanyaan
        </span>
      </div>
      <Progress value={percent} className="h-1.5" />
    </div>
  );
};

interface WelcomeScreenProps {
  agentName: string;
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ agentName, onStart }) => {
  return (
    <div className="interview-welcome">
      <div className="interview-welcome__icon">
        <Icon icon="solar:document-text-bold-duotone" width={32} height={32} />
      </div>
      <h2 className="interview-welcome__title">Buat {agentName}</h2>
      <p className="interview-welcome__description">
        Saya akan memandu Anda melalui serangkaian pertanyaan untuk mengumpulkan informasi yang
        diperlukan. Jawaban Anda akan digunakan untuk menghasilkan dokumen yang terstruktur dan
        profesional.
      </p>
      <Button onClick={onStart} className="interview-welcome__button">
        <Icon icon="solar:play-bold" className="mr-2" />
        Mulai Interview
      </Button>
    </div>
  );
};

interface CompletionScreenProps {
  onGenerate: () => void;
  isGenerating: boolean;
}

const CompletionScreen: React.FC<CompletionScreenProps> = ({ onGenerate, isGenerating }) => {
  return (
    <div className="interview-complete">
      <div className="interview-complete__icon">
        <Icon icon="solar:check-circle-bold" width={24} height={24} />
      </div>
      <h3 className="interview-complete__title">Interview Selesai!</h3>
      <p className="interview-complete__description">
        Semua pertanyaan telah dijawab. Klik tombol di bawah untuk menghasilkan dokumen Anda.
      </p>
      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="mt-4"
        variant="success"
      >
        {isGenerating ? (
          <>
            <ButtonLoading />
            Generating...
          </>
        ) : (
          <>
            <Icon icon="solar:document-add-bold" className="mr-2" />
            Generate Dokumen
          </>
        )}
      </Button>
    </div>
  );
};

interface OptionsListProps {
  options: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}

const OptionsList: React.FC<OptionsListProps> = ({ options, selectedValue, onSelect }) => {
  return (
    <div className="interview-options">
      {options.map((option, index) => (
        <button
          key={index}
          type="button"
          className={cn(
            'interview-option',
            selectedValue === option && 'interview-option--selected'
          )}
          onClick={() => onSelect(option)}
        >
          <div
            className={cn(
              'interview-option__radio',
              selectedValue === option && 'interview-option__radio--selected'
            )}
          />
          <span className="interview-option__label">{option}</span>
        </button>
      ))}
    </div>
  );
};

interface LoadingDotsProps {
  className?: string;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ className }) => {
  return (
    <div className={cn('interview-loading', className)}>
      <div className="interview-loading__dots">
        <div className="interview-loading__dot" />
        <div className="interview-loading__dot" />
        <div className="interview-loading__dot" />
      </div>
    </div>
  );
};

// ============================================
// Main Component
// ============================================

export const InterviewPhase: React.FC<InterviewPhaseProps> = ({
  agentName = 'Dokumen',
  onGenerate,
  onBack,
  className,
}) => {
  // Zustand store
  const questions = useInterviewQuestions();
  const answers = useInterviewAnswers();
  const progress = useInterviewProgress();
  const isInterviewing = useIsInterviewing();
  const isGenerating = useIsGenerating();

  const updateInterviewAnswer = useDocumentStore((state) => state.updateInterviewAnswer);
  const startInterview = useDocumentStore((state) => state.startInterview);
  const endInterview = useDocumentStore((state) => state.endInterview);
  const generateDocument = useDocumentStore((state) => state.generateDocument);

  // Local state
  const [messages, setMessages] = useState<InterviewMessage[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(-1);
  const [inputValue, setInputValue] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Current question
  const currentQuestion =
    currentQuestionIndex >= 0 && currentQuestionIndex < questions.length
      ? questions[currentQuestionIndex]
      : null;

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when question changes
  useEffect(() => {
    if (currentQuestion && !currentQuestion.options) {
      inputRef.current?.focus();
    }
  }, [currentQuestion]);

  // Handle start interview
  const handleStartInterview = useCallback(() => {
    startInterview();
    setCurrentQuestionIndex(0);
    setIsComplete(false);
    setMessages([]);

    if (questions.length > 0) {
      // Add welcome message
      const welcomeMsg: InterviewMessage = {
        id: 'welcome',
        role: 'assistant',
        content: getWelcomeMessage(agentName, questions.length),
        timestamp: new Date(),
      };

      // Add first question after a short delay
      setTimeout(() => {
        const firstQuestionMsg: InterviewMessage = {
          id: 'q-0',
          role: 'assistant',
          content: formatQuestionMessage(questions[0], 1, questions.length),
          questionId: questions[0].id,
          timestamp: new Date(),
        };
        setMessages([welcomeMsg, firstQuestionMsg]);

        // Pre-fill input if answer exists
        const existingAnswer = answers[questions[0].id];
        if (existingAnswer) {
          setInputValue(String(existingAnswer));
        }
      }, 500);

      setMessages([welcomeMsg]);
    }
  }, [startInterview, questions, agentName, answers]);

  // Validate answer against question rules
  const validateAnswer = useCallback(
    (question: InterviewQuestion, answer: string): string | null => {
      const trimmedAnswer = answer.trim();

      // Check required
      if (question.required && !trimmedAnswer) {
        return 'Jawaban ini wajib diisi';
      }

      // Skip validation for empty optional answers
      if (!trimmedAnswer) return null;

      // Type-specific validation
      if (question.type === 'number') {
        const numValue = parseFloat(trimmedAnswer);
        if (isNaN(numValue)) {
          return 'Masukkan angka yang valid';
        }
      }

      // Custom validation rules
      if (question.validation) {
        for (const rule of question.validation) {
          switch (rule.type) {
            case 'minLength':
              if (trimmedAnswer.length < (rule.value as number)) {
                return rule.message || `Minimal ${rule.value} karakter`;
              }
              break;
            case 'maxLength':
              if (trimmedAnswer.length > (rule.value as number)) {
                return rule.message || `Maksimal ${rule.value} karakter`;
              }
              break;
            case 'min': {
              const minNum = parseFloat(trimmedAnswer);
              if (!isNaN(minNum) && minNum < (rule.value as number)) {
                return rule.message || `Minimal ${rule.value}`;
              }
              break;
            }
            case 'max': {
              const maxNum = parseFloat(trimmedAnswer);
              if (!isNaN(maxNum) && maxNum > (rule.value as number)) {
                return rule.message || `Maksimal ${rule.value}`;
              }
              break;
            }
          }
        }
      }

      return null;
    },
    []
  );

  // Handle submit answer
  const handleSubmitAnswer = useCallback(
    (answer: string) => {
      if (!currentQuestion) return;

      // Validate answer
      const validationError = validateAnswer(currentQuestion, answer);
      if (validationError) {
        // Show validation error as assistant message
        const errorMsg: InterviewMessage = {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ ${validationError}\n\nSilakan coba lagi.`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
        return;
      }

      // Skip empty optional answers
      if (!answer.trim() && !currentQuestion.required) {
        // Move to next question without saving
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const nextIndex = currentQuestionIndex + 1;
          if (nextIndex < questions.length) {
            setCurrentQuestionIndex(nextIndex);
            const nextQuestionMsg: InterviewMessage = {
              id: `q-${nextIndex}`,
              role: 'assistant',
              content: formatQuestionMessage(questions[nextIndex], nextIndex + 1, questions.length),
              questionId: questions[nextIndex].id,
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, nextQuestionMsg]);
          }
        }, 500);
        return;
      }

      // Convert to appropriate type based on question type
      let processedAnswer: string | number = answer.trim();
      if (currentQuestion.type === 'number') {
        const numValue = parseFloat(answer.trim());
        if (!isNaN(numValue)) {
          processedAnswer = numValue;
        }
      }

      // Save answer to store
      updateInterviewAnswer(currentQuestion.id, processedAnswer);

      // Add user message
      const userMsg: InterviewMessage = {
        id: `user-${currentQuestionIndex}`,
        role: 'user',
        content: answer.trim(),
        questionId: currentQuestion.id,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      setIsTyping(true);

      // Move to next question after a short delay
      setTimeout(() => {
        setIsTyping(false);
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

          // Pre-fill input if answer exists
          const existingAnswer = answers[questions[nextIndex].id];
          if (existingAnswer) {
            setInputValue(String(existingAnswer));
          }
        } else {
          // Interview complete
          setIsComplete(true);
          const completeMsg: InterviewMessage = {
            id: 'complete',
            role: 'assistant',
            content:
              '✅ Terima kasih! Semua pertanyaan telah dijawab. Dokumen Anda siap untuk di-generate.',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, completeMsg]);
        }
      }, 800);
    },
    [currentQuestion, currentQuestionIndex, questions, updateInterviewAnswer, answers, validateAnswer]
  );

  // Handle form submit
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmitAnswer(inputValue);
  };

  // Handle option select
  const handleOptionSelect = (option: string) => {
    setInputValue(option);
    handleSubmitAnswer(option);
  };

  // Handle generate
  const handleGenerate = async () => {
    await generateDocument();
    onGenerate?.();
  };

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmitAnswer(inputValue);
    }
  };

  // Handle back
  const handleBack = () => {
    endInterview();
    onBack?.();
  };

  // Render welcome screen if not interviewing
  if (!isInterviewing && !isComplete) {
    return (
      <Card className={cn('interview-assistant-container', className)}>
        <WelcomeScreen agentName={agentName} onStart={handleStartInterview} />
      </Card>
    );
  }

  return (
    <Card className={cn('interview-assistant-container h-[600px]', className)}>
      {/* Header with progress */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ld">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <Icon icon="solar:arrow-left-linear" width={20} />
            </Button>
          )}
          <div>
            <h3 className="font-semibold text-ld">{agentName}</h3>
            <p className="text-xs text-bodytext">Interview Mode</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-bodytext">
            {progress.answeredRequiredQuestions}/{progress.requiredQuestions} wajib
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <ProgressBar
        current={currentQuestionIndex + 1}
        total={questions.length}
        percent={progress.percentComplete}
      />

      {/* Messages area */}
      <div className="interview-thread flex-1 overflow-y-auto">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isTyping && <LoadingDots />}

        {isComplete && (
          <CompletionScreen onGenerate={handleGenerate} isGenerating={isGenerating} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {!isComplete && currentQuestion && (
        <div className="interview-input-area">
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div>
              <p className="text-sm text-bodytext mb-2">Pilih salah satu:</p>
              <OptionsList
                options={currentQuestion.options}
                selectedValue={inputValue}
                onSelect={handleOptionSelect}
              />
            </div>
          ) : (
            <form onSubmit={handleFormSubmit} className="interview-input-form">
              <div className="interview-input-wrapper">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={currentQuestion.placeholder || 'Ketik jawaban Anda...'}
                  className="interview-input resize-none"
                  rows={2}
                  disabled={isTyping}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="interview-send-button"
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Icon icon="solar:arrow-up-bold" width={16} />
                </Button>
              </div>
            </form>
          )}

          {/* Skip button for optional questions */}
          {!currentQuestion.required && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-bodytext"
              onClick={() => handleSubmitAnswer('-')}
            >
              Lewati pertanyaan ini
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

export default InterviewPhase;
