/**
 * AssistantInterviewThread Component
 *
 * Alternative interview component using Assistant UI primitives directly.
 * Provides a more native Assistant UI experience with custom styling.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */

import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Card } from '../ui/card';
import { cn } from '../../lib/utils';
import { ButtonLoading } from 'src/components/ui/loading';
import {
  useDocumentStore,
  useInterviewQuestions,
  useIsGenerating,
} from '../../stores';
import { InterviewAssistantProvider, useInterviewAssistant } from '../../context/InterviewAssistantContext';

// ============================================
// Types
// ============================================

interface AssistantInterviewThreadProps {
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
// Inner Thread Component (uses Assistant UI context)
// ============================================

interface InnerThreadProps {
  agentName: string;
  onGenerate?: () => void;
  onBack?: () => void;
  className?: string;
}

const InnerThread: React.FC<InnerThreadProps> = ({
  agentName,
  onGenerate,
  onBack,
  className,
}) => {
  const {
    currentQuestionIndex,
    currentQuestion,
    messages,
    isComplete,
    isInterviewing,
    startInterview,
    submitAnswer,
    progressPercent,
  } = useInterviewAssistant();

  const questions = useInterviewQuestions();
  const isGenerating = useIsGenerating();
  const generateDocument = useDocumentStore((state) => state.generateDocument);
  const endInterview = useDocumentStore((state) => state.endInterview);

  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      submitAnswer(inputValue.trim());
      setInputValue('');
    }
  };

  // Handle generate
  const handleGenerate = async () => {
    await generateDocument();
    onGenerate?.();
  };

  // Handle back
  const handleBack = () => {
    endInterview();
    onBack?.();
  };

  // Welcome screen
  if (!isInterviewing && messages.length === 0) {
    return (
      <Card className={cn('interview-assistant-container', className)}>
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
          <Button onClick={startInterview} className="interview-welcome__button">
            <Icon icon="solar:play-bold" className="mr-2" />
            Mulai Interview
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('interview-assistant-container h-[600px]', className)}>
      {/* Header */}
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
      </div>

      {/* Progress */}
      <div className="interview-progress">
        <div className="interview-progress__header">
          <span className="interview-progress__label">Progress Interview</span>
          <span className="interview-progress__count">
            {Math.min(currentQuestionIndex + 1, questions.length)}/{questions.length} pertanyaan
          </span>
        </div>
        <Progress value={progressPercent} className="h-1.5" />
      </div>

      {/* Messages */}
      <div className="interview-thread flex-1 overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'interview-message',
              message.role === 'user' ? 'interview-message--user' : 'interview-message--assistant'
            )}
          >
            <div
              className={cn(
                'interview-message__avatar',
                message.role === 'user'
                  ? 'interview-message__avatar--user'
                  : 'interview-message__avatar--assistant'
              )}
            >
              <Icon
                icon={message.role === 'user' ? 'solar:user-bold' : 'solar:cpu-bolt-bold-duotone'}
                width={18}
              />
            </div>
            <div
              className={cn(
                'interview-message__content',
                message.role === 'user'
                  ? 'interview-message__content--user'
                  : 'interview-message__content--assistant'
              )}
            >
              {message.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {isComplete && (
          <div className="interview-complete">
            <div className="interview-complete__icon">
              <Icon icon="solar:check-circle-bold" width={24} />
            </div>
            <h3 className="interview-complete__title">Interview Selesai!</h3>
            <p className="interview-complete__description">
              Semua pertanyaan telah dijawab. Klik tombol di bawah untuk menghasilkan dokumen.
            </p>
            <Button
              onClick={handleGenerate}
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
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && currentQuestion && (
        <div className="interview-input-area">
          {currentQuestion.options && currentQuestion.options.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-bodytext">Pilih salah satu:</p>
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  className={cn(
                    'interview-option w-full',
                    inputValue === option && 'interview-option--selected'
                  )}
                  onClick={() => {
                    setInputValue(option);
                    submitAnswer(option);
                    setInputValue('');
                  }}
                >
                  <div
                    className={cn(
                      'interview-option__radio',
                      inputValue === option && 'interview-option__radio--selected'
                    )}
                  />
                  <span className="interview-option__label">{option}</span>
                </button>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="interview-input-form">
              <div className="interview-input-wrapper">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder={currentQuestion.placeholder || 'Ketik jawaban Anda...'}
                  className="interview-input resize-none"
                  rows={2}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="interview-send-button"
                  disabled={!inputValue.trim()}
                >
                  <Icon icon="solar:arrow-up-bold" width={16} />
                </Button>
              </div>
            </form>
          )}

          {!currentQuestion.required && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-bodytext"
              onClick={() => {
                submitAnswer('-');
              }}
            >
              Lewati pertanyaan ini
            </Button>
          )}
        </div>
      )}
    </Card>
  );
};

// ============================================
// Main Component (wraps with provider)
// ============================================

export const AssistantInterviewThread: React.FC<AssistantInterviewThreadProps> = ({
  agentName = 'Dokumen',
  onGenerate,
  onBack,
  className,
}) => {
  return (
    <InterviewAssistantProvider agentName={agentName}>
      <InnerThread
        agentName={agentName}
        onGenerate={onGenerate}
        onBack={onBack}
        className={className}
      />
    </InterviewAssistantProvider>
  );
};

export default AssistantInterviewThread;
