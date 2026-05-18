import { cn } from 'src/lib/utils'

interface LoadingProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show as full page centered loading */
  fullPage?: boolean
  /** Optional text to show below spinner */
  text?: string
  /** Additional className */
  className?: string
}

/**
 * Unified Loading Component
 * Use this for all loading states across the app
 */
export const Loading = ({ size = 'md', fullPage = false, text, className }: LoadingProps) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  }

  const spinner = (
    <div
      className={cn(
        'animate-spin rounded-full border-primary border-t-transparent',
        sizeClasses[size],
        className,
      )}
    />
  )

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-3">
        {spinner}
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    )
  }

  if (text) {
    return (
      <div className="flex flex-col items-center justify-center gap-2">
        {spinner}
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    )
  }

  return spinner
}

/**
 * Inline loading spinner for buttons
 */
export const ButtonLoading = ({ className }: { className?: string }) => (
  <div
    className={cn(
      'w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2',
      className,
    )}
  />
)

export default Loading
