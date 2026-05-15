import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AI_MASTER_CORE_FIELDS,
  AI_MASTER_OPTIONAL_FIELDS,
  aiMasterWorkspaceStateSchema,
  slotStateSchema,
} from './contracts.ts';

test('keeps core intake fields intentionally small', () => {
  assert.deepStrictEqual(AI_MASTER_CORE_FIELDS, [
    'organization_name',
    'organization_focus',
    'program_name',
    'target_participants',
    'industry_problem',
  ]);
});

test('keeps enrichment fields separate from minimum intake', () => {
  assert.ok(AI_MASTER_OPTIONAL_FIELDS.includes('training_duration'));
  assert.ok(AI_MASTER_OPTIONAL_FIELDS.includes('delivery_method'));
  assert.ok(AI_MASTER_OPTIONAL_FIELDS.includes('evaluation_methods'));
});

test('validates a slot state with draft metadata', () => {
  const parsed = slotStateSchema.parse({
    key: 'training_duration',
    label: 'Durasi pelatihan',
    value: '2 hari',
    rawValue: 'sekitar dua harian',
    status: 'draft',
    source: 'ai_inferred',
    confidence: 0.72,
    updatedAt: '2026-05-14T00:00:00.000Z',
    evidence: 'sekitar dua harian',
  });

  assert.strictEqual(parsed.status, 'draft');
});

test('validates a complete workspace state skeleton', () => {
  const parsed = aiMasterWorkspaceStateSchema.parse({
    sessionId: 'session-1',
    documentId: 'doc-1',
    phase: 'intake',
    messages: [],
    slots: {},
    minimumComplete: false,
    generationReady: false,
    selectedSkkniUnitId: null,
    skkniCandidates: [],
    documentProgress: [],
  });

  assert.strictEqual(parsed.phase, 'intake');
});
