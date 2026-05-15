import assert from 'node:assert/strict';
import test from 'node:test';

import { createMockAiMasterApi } from './api.ts';

test('loads initial workspace state', async () => {
  const api = createMockAiMasterApi({ latencyMs: 0 });
  const state = await api.loadWorkspace();

  assert.strictEqual(state.phase, 'intake');
  assert.strictEqual(state.minimumComplete, false);
  assert.strictEqual(state.messages[0]?.role, 'assistant');
});

test('commits core fields from a natural user message', async () => {
  const api = createMockAiMasterApi({ latencyMs: 0 });
  await api.loadWorkspace();

  const result = await api.sendMessage(
    'Lembaganya PT Hanlivia, fokus K3, programnya HIRADC untuk supervisor, targetnya HSE Officer, masalahnya banyak yang belum paham identifikasi bahaya.',
  );

  assert.strictEqual(result.state.minimumComplete, true);
  assert.strictEqual(result.state.slots.organization_name?.value, 'PT Hanlivia');
  assert.strictEqual(result.state.slots.organization_focus?.value, 'K3');
  assert.match(result.assistantMessage.content, /cukup untuk membuat draft awal/);
});

test('creates SKKNI candidates after minimum intake is complete', async () => {
  const api = createMockAiMasterApi({ latencyMs: 0 });
  await api.loadWorkspace();
  await api.sendMessage(
    'Lembaganya PT Hanlivia, fokus K3, programnya HIRADC untuk supervisor, targetnya HSE Officer, masalahnya banyak yang belum paham identifikasi bahaya.',
  );

  const state = await api.searchSkkni();

  assert.strictEqual(state.phase, 'skkni_search');
  assert.ok(state.skkniCandidates.length > 0);
});

test('isolates initial document progress between api instances', async () => {
  const firstApi = createMockAiMasterApi({ latencyMs: 0 });
  const firstState = await firstApi.loadWorkspace();
  firstState.documentProgress[0]?.missingFields.push('evaluation_methods');

  const secondApi = createMockAiMasterApi({ latencyMs: 0 });
  const secondState = await secondApi.loadWorkspace();

  assert.deepStrictEqual(secondState.documentProgress[0]?.missingFields, [
    'program_goal',
    'training_duration',
    'delivery_method',
  ]);
});

test('updateSlot recalculates derived state after completing core fields', async () => {
  const api = createMockAiMasterApi({ latencyMs: 0 });
  await api.loadWorkspace();

  await api.updateSlot('organization_name', 'PT Hanlivia');
  await api.updateSlot('organization_focus', 'K3');
  await api.updateSlot('program_name', 'HIRADC');
  await api.updateSlot('target_participants', 'HSE Officer');
  const state = await api.updateSlot(
    'industry_problem',
    'Peserta belum memahami identifikasi bahaya dan pengendalian risiko',
  );

  assert.strictEqual(state.minimumComplete, true);
  assert.strictEqual(state.generationReady, false);
  assert.strictEqual(state.phase, 'draft_ready');
});
