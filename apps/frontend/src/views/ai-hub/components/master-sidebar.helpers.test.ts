import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMasterDocumentOverview,
  buildMasterSidebarSections,
  buildMasterSidebarOverview,
  buildMasterSectionPatchValue,
  type MasterDocumentProgressItem,
  type MasterSidebarFieldState,
  type MasterSidebarSectionState,
} from './master-sidebar.helpers';
import type { MasterSidebarSectionId } from './master-sidebar.config';

const makeSectionState = (
  overrides: Partial<MasterSidebarSectionState> & {
    id: MasterSidebarSectionId;
    readOnly: boolean;
    totalFields: number;
    completedFields: number;
  },
): MasterSidebarSectionState => {
  const completionPercent =
    overrides.completionPercent ??
    (overrides.totalFields === 0
      ? 0
      : Math.round((overrides.completedFields / overrides.totalFields) * 100));

  const status =
    overrides.status ??
    (overrides.totalFields === 0
      ? 'complete'
      : overrides.completedFields === overrides.totalFields
      ? 'complete'
      : 'incomplete');

  const fields: MasterSidebarFieldState[] = overrides.fields ?? [];

  return {
    id: overrides.id,
    label: overrides.label ?? overrides.id,
    source: overrides.source ?? 'brainstorming_master',
    readOnly: overrides.readOnly,
    fields,
    totalFields: overrides.totalFields,
    completedFields: overrides.completedFields,
    completionPercent,
    status,
    summary: overrides.summary ?? '',
    askAiPrompt: overrides.askAiPrompt,
  };
};

test('builds master sections for empty masterJson', () => {
  const sections = buildMasterSidebarSections({});

  assert.deepStrictEqual(sections.map((section) => section.id), [
    'organization',
    'program',
    'target',
    'delivery',
    'unit',
  ]);
  assert.strictEqual(
    sections.find((section) => section.id === 'organization')?.completionPercent,
    0,
  );
  assert.deepStrictEqual(
    sections.find((section) => section.id === 'delivery')?.fields.map((field) => field.key),
    ['training_location', 'training_duration'],
  );
  assert.strictEqual(sections.find((section) => section.id === 'unit')?.summary, 'Belum dipilih');
});

test('trims string values before storing field state', () => {
  const sections = buildMasterSidebarSections({
    brainstorming_master: {
      organization_name: '  PT Clean  ',
    },
  });

  const organizationSection = sections.find((section) => section.id === 'organization');
  const nameField = organizationSection?.fields.find((field) => field.key === 'organization_name');

  assert.strictEqual(nameField?.value, 'PT Clean');
});

test('computes completion from brainstorming and unit', () => {
  const masterJson = {
    brainstorming_master: {
      organization_name: 'PT Hanlivia Sinergi Indonesia',
      organization_city: 'Semarang',
      program_name: 'Pelatihan Ahli K3 Umum',
      program_goal: 'Meningkatkan identifikasi bahaya',
      target_participants: 'HSE Officer',
      industry_problem: 'HIRADC belum dipahami',
      training_location: 'Jakarta',
      training_duration: '10 hari',
      delivery_method: 'Hybrid',
      evaluation_methods: 'Ujian tertulis, praktik',
    },
    unit: {
      code: 'M.71KKK01.004.1',
      name: 'Mengawasi Pelaksanaan Izin Kerja',
    },
  };

  const sections = buildMasterSidebarSections(masterJson);

  assert.strictEqual(
    sections.find((section) => section.id === 'organization')?.completionPercent,
    100,
  );
  assert.strictEqual(sections.find((section) => section.id === 'delivery')?.completionPercent, 100);
  assert.strictEqual(sections.find((section) => section.id === 'unit')?.completionPercent, 100);
});

test('computes overview from editable sections only', () => {
  const overview = buildMasterSidebarOverview([
    makeSectionState({
      id: 'organization',
      readOnly: false,
      totalFields: 2,
      completedFields: 2,
    }),
    makeSectionState({
      id: 'program',
      readOnly: false,
      totalFields: 2,
      completedFields: 1,
    }),
  ]);

  assert.strictEqual(overview.totalFields, 4);
  assert.strictEqual(overview.completedFields, 3);
  assert.strictEqual(overview.completionPercent, 75);
});

test('computes master document overview from document readiness progress', () => {
  const overview = buildMasterDocumentOverview([
    {
      documentType: 'bukti-1',
      label: 'Bukti 1',
      canGenerate: true,
      completionPercent: 100,
      missingFields: [],
    },
    {
      documentType: 'bukti-2',
      label: 'Bukti 2',
      canGenerate: false,
      completionPercent: 50,
      missingFields: ['selected_unit_code'],
    },
    {
      documentType: 'bukti-3',
      label: 'Bukti 3',
      canGenerate: false,
      completionPercent: 0,
      missingFields: ['skkni_map'],
    },
  ] satisfies MasterDocumentProgressItem[]);

  assert.strictEqual(overview.total, 3);
  assert.strictEqual(overview.completed, 1);
  assert.strictEqual(overview.completionPercent, 50);
});

test('builds patch payload for delivery using only required fields', () => {
  const payload = buildMasterSectionPatchValue('delivery', {
    training_location: 'Jakarta',
    training_duration: '10 hari',
    delivery_method: 'Hybrid',
    evaluation_methods: 'Ujian tertulis, praktik',
    extra_field: 'should be dropped',
  });

  assert.deepStrictEqual(payload, {
    section: 'brainstorming_master',
    value: {
      training_location: 'Jakarta',
      training_duration: '10 hari',
    },
  });
});

test('trims string values in patch payload', () => {
  const payload = buildMasterSectionPatchValue('delivery', {
    training_location: '  Jakarta  ',
    training_duration: '  10 hari  ',
    delivery_method: '  Hybrid  ',
    evaluation_methods: '  Ujian tertulis, praktik  ',
  });

  assert.deepStrictEqual(payload.value.training_location, 'Jakarta');
  assert.deepStrictEqual(payload.value.training_duration, '10 hari');
  assert.ok(!('delivery_method' in payload.value));
});

test('rejects unit patching via free-text', () => {
  assert.throws(
    () => buildMasterSectionPatchValue('unit', { code: 'M.71KKK01.004.1' }),
    /Unit SKKNI is read-only/,
  );
});
