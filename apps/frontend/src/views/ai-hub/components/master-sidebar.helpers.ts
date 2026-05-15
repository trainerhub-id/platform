import {
  MASTER_SIDEBAR_SECTIONS,
  MasterSidebarSectionConfig,
  MasterSidebarSectionId,
} from './master-sidebar.config';

type MasterJson = Partial<
  Record<MasterSidebarSectionConfig['source'], Record<string, unknown>>
> &
  Record<string, unknown>;

const hasText = (value: unknown): boolean =>
  typeof value === 'string' && value.trim().length > 0;

export type MasterSidebarFieldState = {
  key: string;
  label: string;
  value: string;
  complete: boolean;
};

export type MasterSidebarSectionState = {
  id: MasterSidebarSectionId;
  label: string;
  source: MasterSidebarSectionConfig['source'];
  readOnly: boolean;
  fields: MasterSidebarFieldState[];
  totalFields: number;
  completedFields: number;
  completionPercent: number;
  status: 'complete' | 'incomplete';
  summary: string;
  askAiPrompt?: string;
};

export function buildMasterSidebarSections(masterJson: MasterJson): MasterSidebarSectionState[] {
  return MASTER_SIDEBAR_SECTIONS.map((section) => {
    const sourceData = (masterJson[section.source] ?? {}) as Record<string, unknown>;
    const fieldStates = section.fields.map((field) => {
      const value = sourceData?.[field.key];
      const normalizedValue = typeof value === 'string' ? value.trim() : '';

      return {
        key: field.key,
        label: field.label,
        value: normalizedValue,
        complete: hasText(normalizedValue),
      };
    });

    const totalFields = fieldStates.length;
    const completedFields = fieldStates.filter((field) => field.complete).length;
    const completionPercent =
      totalFields === 0 ? 0 : Math.round((completedFields / totalFields) * 100);

    const sectionState: MasterSidebarSectionState = {
      id: section.id,
      label: section.label,
      source: section.source,
      readOnly: section.readOnly,
      fields: fieldStates,
      totalFields,
      completedFields,
      completionPercent,
      status:
        totalFields === 0 ? 'complete' : completedFields === totalFields ? 'complete' : 'incomplete',
      summary: section.buildSummary(masterJson),
      askAiPrompt: section.buildAskAiPrompt?.(),
    };

    return sectionState;
  });
}

export type MasterSidebarOverview = {
  totalFields: number;
  completedFields: number;
  completionPercent: number;
};

export type MasterDocumentProgressItem = {
  documentType: string;
  label: string;
  canGenerate: boolean;
  completionPercent: number;
  missingFields: string[];
};

export type MasterDocumentOverview = {
  total: number;
  completed: number;
  completionPercent: number;
};

export function buildMasterSidebarOverview(
  sections: MasterSidebarSectionState[],
): MasterSidebarOverview {
  const editableSections = sections.filter((section) => !section.readOnly);
  const totalFields = editableSections.reduce((sum, section) => sum + section.totalFields, 0);
  const completedFields = editableSections.reduce((sum, section) => sum + section.completedFields, 0);
  const completionPercent = totalFields === 0 ? 0 : Math.round((completedFields / totalFields) * 100);

  return { totalFields, completedFields, completionPercent };
}

export function buildMasterDocumentOverview(
  progressItems: MasterDocumentProgressItem[],
): MasterDocumentOverview {
  const total = progressItems.length;
  const completed = progressItems.filter((item) => item.canGenerate).length;
  const completionPercent =
    total === 0
      ? 0
      : Math.round(
          progressItems.reduce((sum, item) => sum + Math.max(0, Math.min(100, item.completionPercent)), 0) /
            total,
        );

  return { total, completed, completionPercent };
}

export type MasterSectionPatchPayload = {
  section: 'brainstorming_master';
  value: Record<string, string>;
};

export function buildMasterSectionPatchValue(
  sectionId: MasterSidebarSectionId,
  values: Record<string, unknown>,
): MasterSectionPatchPayload {
  const sectionConfig = MASTER_SIDEBAR_SECTIONS.find((section) => section.id === sectionId);

  if (!sectionConfig) {
    throw new Error(`Unknown section ${sectionId}`);
  }

  if (sectionConfig.readOnly) {
    throw new Error(`${sectionConfig.label} is read-only`);
  }

  if (sectionConfig.source !== 'brainstorming_master') {
    throw new Error(`${sectionConfig.label} cannot be patched yet`);
  }

  const allowedKeys = new Set(sectionConfig.fields.map((field) => field.key));
  const cleaned = Object.fromEntries(
    Object.entries(values)
      .map(([key, value]): [string, unknown] => [
        key,
        typeof value === 'string' ? value.trim() : value,
      ])
      .filter(
        (entry): entry is [string, string] =>
          allowedKeys.has(entry[0]) && typeof entry[1] === 'string' && entry[1].length > 0,
      ),
  );

  return {
    section: 'brainstorming_master',
    value: cleaned,
  };
}
