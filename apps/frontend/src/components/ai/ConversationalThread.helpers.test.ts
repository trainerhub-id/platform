import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildThreadMessageFromStoredMessage,
  formatAssistantTextForMarkdown,
  shouldHandleLiveToolUiForMessage,
} from './ConversationalThread.helpers';

test('shouldHandleLiveToolUiForMessage only enables live tool UI for latest active assistant message', () => {
  assert.equal(
    shouldHandleLiveToolUiForMessage({
      isLatestAssistantMessage: true,
      messageStatus: 'streaming',
      threadIsRunning: true,
    }),
    true,
  );

  assert.equal(
    shouldHandleLiveToolUiForMessage({
      isLatestAssistantMessage: false,
      messageStatus: 'streaming',
      threadIsRunning: true,
    }),
    false,
  );

  assert.equal(
    shouldHandleLiveToolUiForMessage({
      isLatestAssistantMessage: true,
      messageStatus: 'done',
      threadIsRunning: false,
    }),
    false,
  );

  assert.equal(
    shouldHandleLiveToolUiForMessage({
      isLatestAssistantMessage: true,
      messageStatus: 'done',
      threadIsRunning: true,
    }),
    false,
  );
});

test('buildThreadMessageFromStoredMessage hydrates assistant metadata from embedded SKKNI data', () => {
  const storedContent = [
    'Saya sudah mencarikan SKKNI untuk "programming".',
    '<!--SKKNI_DATA:{"documents":[{"id":"doc-1","title":"Dokumen","sector":"Teknologi","units":[{"id":"unit-1","code":"M.70JKP00.014.1","title":"Menulis Program"}]}],"summary":{"totalDocuments":1},"_sourcetool":"skkni_search"}:SKKNI_DATA-->',
  ].join('\n');

  const message = buildThreadMessageFromStoredMessage({
    id: 'assistant-1',
    role: 'assistant',
    content: storedContent,
    createdAt: '2026-04-06T00:00:00.000Z',
  });

  const toolInvocations = (message as any).metadata?.custom?.toolInvocations;

  assert.equal(message.role, 'assistant');
  assert.equal(Array.isArray(message.content), true);
  assert.equal(toolInvocations?.length, 1);
  assert.equal(toolInvocations?.[0]?.toolName, 'skkni_search');
  assert.equal(toolInvocations?.[0]?.result?.documents?.[0]?.units?.[0]?.code, 'M.70JKP00.014.1');
});

test('buildThreadMessageFromStoredMessage keeps user messages unchanged', () => {
  const message = buildThreadMessageFromStoredMessage({
    id: 'user-1',
    role: 'user',
    content: 'Halo',
    createdAt: '2026-04-06T00:00:00.000Z',
  });

  assert.equal(message.role, 'user');
  assert.deepEqual((message as any).metadata?.custom, {});
  assert.equal((message.content as any[])[0]?.text, 'Halo');
});

test('formatAssistantTextForMarkdown separates save confirmations from follow-up questions', () => {
  const input =
    'Mantap! Jadi peserta bisa bikin website sendiri dari nol. Catat ya.Sudah tercatat! Satu lagi nih, pelatihan ini di bawah naungan lembaga siapa? Contoh: LPK Maju Jaya.';

  const output = formatAssistantTextForMarkdown(input);

  assert.match(output, /Catat ya\.\n\nSudah tercatat!\n\nSatu lagi nih/);
  assert.doesNotMatch(output, /ya\.Sudah/);
});

test('buildThreadMessageFromStoredMessage hydrates stored tool calls and results from transcript data', () => {
  const message = buildThreadMessageFromStoredMessage({
    id: 'assistant-2',
    role: 'assistant',
    content: 'Saya sudah menampilkan hasil pencarian unit kompetensi.',
    createdAt: '2026-04-24T00:00:00.000Z',
    toolCalls: [
      {
        eventType: 'tool-call',
        toolCallId: 'call-1',
        toolName: 'skkni_search',
        args: { area: 'komunikasi pemasaran' },
      },
      {
        eventType: 'tool-result',
        toolCallId: 'call-1',
        result: {
          documents: [
            {
              id: 'doc-1',
              title: 'SKKNI Marketing',
              sector: 'Pemasaran',
              units: [
                {
                  id: 'unit-1',
                  code: 'M.70JKP00.006.1',
                  title: 'Membuat Rencana Komunikasi Pemasaran',
                },
              ],
            },
          ],
          _sourcetool: 'skkni_search',
        },
      },
    ],
  });

  const content = (message as any).content as any[];
  const toolCall = content.find((item) => item?.type === 'tool-call');
  const toolInvocations = (message as any).metadata?.custom?.toolInvocations;

  assert.equal(toolCall?.toolName, 'skkni_search');
  assert.equal(toolCall?.args?.area, 'komunikasi pemasaran');
  assert.equal(toolInvocations?.length, 1);
  assert.equal(toolInvocations?.[0]?.result?.documents?.[0]?.units?.[0]?.code, 'M.70JKP00.006.1');
});
