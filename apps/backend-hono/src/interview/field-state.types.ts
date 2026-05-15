export const fieldStatuses = ["missing", "captured", "pending_confirmation", "confirmed", "rejected"] as const;
export type FieldStatus = (typeof fieldStatuses)[number];

export const fieldSources = ["user_explicit", "user_confirmed", "ai_suggested", "imported", "system"] as const;
export type FieldSource = (typeof fieldSources)[number];

export type FieldSnapshotFlow = "master" | "trainer";

export type FieldStateSnapshot = {
  flow: FieldSnapshotFlow;
  phaseKey: string;
  fieldKey: string;
  status: FieldStatus;
  value: unknown;
  source?: FieldSource;
  pendingSuggestion?: unknown;
};

export type ReadinessResult = {
  ready: boolean;
  missing: string[];
  pendingConfirmation: string[];
  optionalGaps: string[];
};
