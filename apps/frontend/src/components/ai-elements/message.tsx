"use client";

import type { UIMessage } from "ai";
import type { HTMLAttributes } from "react";
import { memo } from "react";
import { cn } from "src/lib/utils";
import { Streamdown } from "streamdown";

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      "group flex w-full max-w-[95%] flex-col gap-2",
      from === "user" ? "is-user ml-auto justify-end" : "is-assistant",
      className,
    )}
    {...props}
  />
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement>;

export const MessageContent = ({ children, className, ...props }: MessageContentProps) => (
  <div
    className={cn(
      "flex w-fit min-w-0 max-w-full flex-col gap-2 overflow-hidden whitespace-pre-wrap text-sm leading-6",
      "group-[.is-user]:ml-auto group-[.is-user]:rounded-lg group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
      "group-[.is-assistant]:text-foreground",
      className,
    )}
    {...props}
  >
    {children}
  </div>
);

export type MessageResponseProps = HTMLAttributes<HTMLDivElement>;

export const MessageResponse = memo(
  ({ className, children, ...props }: MessageResponseProps) => (
    <div
      className={cn(
        "min-w-0 break-words [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5",
        className,
      )}
      {...props}
    >
      {typeof children === "string" ? (
        <Streamdown mode="streaming" parseIncompleteMarkdown>
          {children}
        </Streamdown>
      ) : (
        children
      )}
    </div>
  ),
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children && prevProps.className === nextProps.className,
);

MessageResponse.displayName = "MessageResponse";
