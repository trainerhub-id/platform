'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import type { ProgressStep, ProgressTrackerChoice } from './schema'

interface ProgressTrackerProps {
  id: string
  steps: ProgressStep[]
  elapsedTime?: number
  choice?: ProgressTrackerChoice
  className?: string
}

const formatElapsedTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) {
    return `${(ms / 1000).toFixed(1)}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

const StepIcon: React.FC<{ status: ProgressStep['status'] }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    case 'in-progress':
      return (
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      )
    case 'failed':
      return (
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
      )
    case 'pending':
    default:
      return <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600" />
  }
}

const OutcomeIcon: React.FC<{ outcome: ProgressTrackerChoice['outcome'] }> = ({ outcome }) => {
  switch (outcome) {
    case 'success':
      return (
        <div className="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-green-600 dark:text-green-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
    case 'failed':
      return (
        <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      )
    case 'cancelled':
    case 'partial':
    default:
      return (
        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-gray-600 dark:text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )
  }
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  id,
  steps,
  elapsedTime,
  choice,
  className,
}) => {
  const isComplete = choice !== undefined
  const currentStepIndex = steps.findIndex((s) => s.status === 'in-progress')
  const hasInProgress = currentStepIndex !== -1

  return (
    <article
      id={id}
      role="status"
      aria-live="polite"
      aria-busy={hasInProgress}
      className={cn(
        'bg-card border rounded-xl p-4 shadow-sm w-full max-w-md select-none',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {elapsedTime !== undefined && (
          <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {formatElapsedTime(elapsedTime)}
          </span>
        )}
        {choice && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{choice.summary}</span>
            <OutcomeIcon outcome={choice.outcome} />
          </div>
        )}
      </div>

      {/* Steps */}
      <ul className="space-y-1">
        {steps.map((step, index) => {
          const isCurrentStep =
            step.status === 'in-progress' ||
            (step.status === 'pending' &&
              !hasInProgress &&
              index === steps.findIndex((s) => s.status === 'pending'))
          const showDescription =
            step.description &&
            (step.status === 'in-progress' ||
              step.status === 'failed' ||
              isCurrentStep ||
              (isComplete && step.status === 'completed'))

          return (
            <li
              key={step.id}
              aria-current={isCurrentStep ? 'step' : undefined}
              className={cn(
                'flex items-start gap-3 py-2 px-2 rounded-lg transition-colors',
                isCurrentStep && !isComplete && 'bg-primary/5',
              )}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <StepIcon status={step.status} />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium',
                    step.status === 'completed' && 'text-muted-foreground',
                    step.status === 'failed' && 'text-red-600 dark:text-red-400',
                    step.status === 'in-progress' && 'text-foreground',
                    step.status === 'pending' && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                {showDescription && (
                  <p
                    className={cn(
                      'text-xs mt-0.5',
                      step.status === 'failed' ? 'text-red-500' : 'text-muted-foreground',
                    )}
                  >
                    {step.description}
                  </p>
                )}
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="absolute left-[26px] top-[32px] w-0.5 h-4 bg-gray-200 dark:bg-gray-700" />
              )}
            </li>
          )
        })}
      </ul>
    </article>
  )
}

export default ProgressTracker
