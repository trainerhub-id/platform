'use client'

import type { UIMessage } from 'ai'
import type { HTMLAttributes } from 'react'
import { memo } from 'react'
import { cn } from 'src/lib/utils'
import { Streamdown } from 'streamdown'

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role']
}

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full max-w-[95%] flex-col gap-1',
      from === 'user' ? 'is-user ml-auto justify-end' : 'is-assistant',
      className,
    )}
    {...props}
  />
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement>

export const MessageContent = ({ children, className, style, ...props }: MessageContentProps) => (
  <div
    className={cn(
      'flex w-fit min-w-0 max-w-full flex-col gap-1 overflow-hidden text-sm leading-relaxed',
      // User bubble: warm gold fill, white text, rounded pill
      'group-[.is-user]:ml-auto group-[.is-user]:rounded-2xl group-[.is-user]:px-4 group-[.is-user]:py-2.5',
      // Assistant: soft card with cream bg and thin border
      'group-[.is-assistant]:rounded-2xl group-[.is-assistant]:border group-[.is-assistant]:px-4 group-[.is-assistant]:py-3',
      className,
    )}
    style={style}
    {...props}
  >
    {children}
  </div>
)

export type MessageResponseProps = HTMLAttributes<HTMLDivElement> & {
  whiteText?: boolean
}

const whiteComponents = {
  p: (props: Record<string, unknown>) => <p {...props} style={{ color: '#ffffff' }} />,
  li: (props: Record<string, unknown>) => <li {...props} style={{ color: '#ffffff' }} />,
  strong: (props: Record<string, unknown>) => <strong {...props} style={{ color: '#ffffff' }} />,
  em: (props: Record<string, unknown>) => <em {...props} style={{ color: '#ffffff' }} />,
  a: (props: Record<string, unknown>) => <a {...props} style={{ color: '#ffffff' }} />,
  span: (props: Record<string, unknown>) => <span {...props} style={{ color: '#ffffff' }} />,
  div: (props: Record<string, unknown>) => <div {...props} style={{ color: '#ffffff' }} />,
}

export const MessageResponse = memo(
  ({ className, children, whiteText, ...props }: MessageResponseProps) => (
    <div
      className={cn(
        'min-w-0 break-words text-[14px] leading-relaxed [&_ol]:my-1.5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5',
        className,
      )}
      {...props}
    >
      {typeof children === 'string' ? (
        <Streamdown
          mode="streaming"
          parseIncompleteMarkdown
          components={whiteText ? whiteComponents : undefined}
        >
          {children}
        </Streamdown>
      ) : (
        children
      )}
    </div>
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className &&
    prevProps.whiteText === nextProps.whiteText,
)

MessageResponse.displayName = 'MessageResponse'
