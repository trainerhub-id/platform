import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { CustomizerContext } from 'src/context/CustomizerContext'

import { cn } from 'src/lib/utils'

const alertVariants = cva('relative w-full p-4', {
  variants: {
    variant: {
      default: 'bg-background text-foreground',
      primary: 'bg-primary text-white',
      secondary: 'bg-secondary text-black',
      success: 'bg-success text-white',
      error: 'bg-error text-white',
      warning: 'bg-warning text-white',
      info: 'bg-info text-white',
      lightprimary: 'bg-lightprimary text-primary',
      lightsecondary: 'bg-lightsecondary text-secondary',
      lightsuccess: 'bg-lightsuccess text-success',
      lightwarning: 'bg-lightwarning text-warning',
      lighterror: 'bg-lighterror text-error',
      lightinfo: 'bg-lightinfo text-info',
      destructive:
        'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => {
  const { isBorderRadius } = React.useContext(CustomizerContext)
  return (
    <div
      ref={ref}
      role="alert"
      style={{ borderRadius: `${isBorderRadius}px` }}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  )
})
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-medium leading-none tracking-tight', className)}
      {...props}
    />
  ),
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />
))
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertDescription, AlertTitle }
