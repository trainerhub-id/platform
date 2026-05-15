export type StoredChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date | string;
  toolCalls?: unknown[];
};

const ACTIVE_MESSAGE_STATUSES = new Set(['loading', 'running', 'streaming', 'in_progress']);

export function isActiveAssistantMessageStatus(status: string | undefined): boolean {
  return typeof status === 'string' && ACTIVE_MESSAGE_STATUSES.has(status);
}

export function shouldHandleLiveToolUiForMessage(params: {
  isLatestAssistantMessage: boolean;
  messageStatus: string | undefined;
  threadIsRunning: boolean;
}): boolean {
  const { isLatestAssistantMessage, messageStatus } = params;

  if (!isLatestAssistantMessage) {
    return false;
  }

  return isActiveAssistantMessageStatus(messageStatus);
}

export function formatAssistantTextForMarkdown(text: string): string {
  if (!text) {
    return text;
  }

  return text
    .replace(/([.!?])(?=[A-Z])/g, '$1 ')
    .replace(
      /([.!?])\s+(?=(Sudah tercatat|Sudah saya catat|Mantap|Oke,?\s*sudah|Satu lagi|Sekarang|Pelatihan ini|Apa\s|\*\*Apa))/gi,
      '$1\n\n',
    )
    .replace(
      /(Sudah tercatat!|Sudah saya catat!|berhasil disimpan\.)\s+(?=(Satu lagi|Sekarang|Pelatihan ini|Apa\s|\*\*Apa|Kalau|Contoh))/gi,
      '$1\n\n',
    )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function extractEmbeddedSkkniData(rawText: string): any | null {
  if (!rawText) {
    return null;
  }

  const match = rawText.match(/<!--SKKNI_DATA:(.*?):SKKNI_DATA-->/);
  if (!match?.[1]) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function normalizeToolName(toolName: unknown): string {
  if (typeof toolName !== 'string') {
    return 'unknown';
  }

  const aliases: Record<string, string> = {
    _2: 'skkni_search',
    _3: 'skkni_search',
    _4: 'skkni_search',
    _5: 'skkni_search',
    _7: 'patch_master_json',
    patchMasterJson: 'patch_master_json',
    skkniSearchTool: 'skkni_search',
  };

  return aliases[toolName] || toolName;
}

function extractHydratedToolData(toolCalls: unknown): {
  contentToolCalls: Array<{
    type: 'tool-call';
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    argsText: string;
  }>;
  toolInvocations: Array<{
    toolName: string;
    result: any;
    args: Record<string, unknown>;
  }>;
} {
  if (!Array.isArray(toolCalls) || toolCalls.length === 0) {
    return { contentToolCalls: [], toolInvocations: [] };
  }

  const callMap = new Map<string, { toolName: string; args: Record<string, unknown> }>();
  const contentToolCalls: Array<{
    type: 'tool-call';
    toolCallId: string;
    toolName: string;
    args: Record<string, unknown>;
    argsText: string;
  }> = [];
  const toolInvocations: Array<{
    toolName: string;
    result: any;
    args: Record<string, unknown>;
  }> = [];

  toolCalls.forEach((event, index) => {
    const record = event && typeof event === 'object' ? (event as Record<string, any>) : {};
    const eventType = typeof record.eventType === 'string' ? record.eventType : '';
    const rawToolName = record.toolName || record.name || record.payload?.toolName;
    const toolName = normalizeToolName(rawToolName);
    const args =
      (record.args && typeof record.args === 'object' ? record.args : null) ||
      (record.payload?.args && typeof record.payload.args === 'object' ? record.payload.args : null) ||
      {};
    const toolCallIdRaw =
      record.toolCallId ||
      record.payload?.toolCallId ||
      record.id ||
      record.payload?.id;
    const toolCallId =
      typeof toolCallIdRaw === 'string' && toolCallIdRaw.trim().length > 0
        ? toolCallIdRaw.trim()
        : `stored-tool-${index}`;

    if (eventType !== 'tool-result') {
      callMap.set(toolCallId, { toolName, args });
      contentToolCalls.push({
        type: 'tool-call',
        toolCallId,
        toolName,
        args,
        argsText: JSON.stringify(args),
      });
      return;
    }

    const matchedCall = callMap.get(toolCallId);
    const invocationToolName = normalizeToolName(
      record.result?._sourcetool || matchedCall?.toolName || toolName,
    );
    const invocationArgs = matchedCall?.args || args;

    toolInvocations.push({
      toolName: invocationToolName,
      result: record.result || record.payload?.result,
      args: invocationArgs,
    });
  });

  return {
    contentToolCalls,
    toolInvocations,
  };
}

export function buildThreadMessageFromStoredMessage(msg: StoredChatMessage): ThreadMessage {
  const embeddedSkkniData = msg.role === 'assistant' ? extractEmbeddedSkkniData(msg.content) : null;
  const hydratedToolData = msg.role === 'assistant' ? extractHydratedToolData(msg.toolCalls) : {
    contentToolCalls: [],
    toolInvocations: [],
  };
  const embeddedToolInvocations = embeddedSkkniData
    ? [
        {
          toolName: embeddedSkkniData?._sourcetool || 'skkni_search',
          result: embeddedSkkniData,
          args: {},
        },
      ]
    : [];
  const toolInvocations = hydratedToolData.toolInvocations.length > 0
    ? hydratedToolData.toolInvocations
    : embeddedToolInvocations;

  if (msg.role === 'assistant') {
    const assistantMessage = {
      id: msg.id,
      role: 'assistant',
      status: 'done',
      content: [
        { type: 'text' as const, text: msg.content },
        ...hydratedToolData.contentToolCalls,
      ],
      createdAt: new Date(msg.createdAt),
      metadata: {
        custom: toolInvocations.length > 0 ? { toolInvocations } : {},
      },
    };

    return assistantMessage as unknown as ThreadMessage;
  }

  const userMessage: ThreadMessage = {
    id: msg.id,
    role: 'user',
    content: [{ type: 'text' as const, text: msg.content }],
    attachments: [],
    createdAt: new Date(msg.createdAt),
    metadata: {
      custom: {},
    },
  };

  return userMessage;
}
import type { ThreadMessage } from '@assistant-ui/react';
