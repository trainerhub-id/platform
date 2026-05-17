# AI Core Data WSP SKKNI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make AI for Trainer and AI for Master collect only the core user facts needed for WSP semantic search, let users choose one SKKNI unit, then persist accurate `/unit/{code}` and `/map/{code}` data as the source for generated data.

**Architecture:** Keep chat interview and field-state persistence in the existing Hono backend. Normalize both flows around minimal core facts, use WSP semantic search to propose up to 10 SKKNI candidates, and treat selected unit detail plus competency map as imported authoritative data. DOCX/file rendering is out of scope for this plan; the output of this plan is reliable structured data in `documents.masterJson` and `document_field_states`.

**Tech Stack:** Bun, TypeScript, Hono, Drizzle/Postgres, AI SDK `generateText`/`streamText`, Vitest, WSP API (`/search/semantic`, `/unit/:code`, `/map/:code`), React/Vite frontend.

---

## Current Flow Facts

- Hono worktree: `/home/ujang/0new/thub/platform-clean/.worktrees/hono`
- Main interview engine: `apps/backend-hono/src/interview/interview-engine.ts`
- Current extraction prompt: `apps/backend-hono/src/ai/prompts/extractor.prompt.ts`
- Current assistant prompt: `apps/backend-hono/src/ai/prompts/interviewer.prompt.ts`
- SKKNI tool/service: `apps/backend-hono/src/skkni/skkni.service.ts`
- SKKNI routes:
  - `POST /api/documents/:documentId/skkni/search`
  - `POST /api/documents/:documentId/skkni/select`
- Accurate WSP unit data comes from:
  - `GET https://wsp.sertifikasitrainer.com/unit/M.70MKT00.012.1`
  - response includes `unit_code`, `unit_title`, `unit_description`, `competency_elements`, `variable_constraints`, `assessment_guide`, `number_kepmen`, `source_signature`, `audit_metadata`.
- Accurate WSP competency map comes from:
  - `GET https://wsp.sertifikasitrainer.com/map/M.70MKT00.012.1`
  - response includes `tujuan_utama`, `fungsi_kunci`, `fungsi_utama`, `matched_fungsi_dasar`, `mapping_confidence`, `decision_source`, `is_locked`.

## File Structure

- Modify `apps/backend-hono/src/interview/master/master-fields.ts`
  - Owns Master required core fields and optional/generated profile fields.
- Modify `apps/backend-hono/src/interview/trainer/trainer-fields.ts`
  - Owns Trainer required core fields and generated training detail fields.
- Create `apps/backend-hono/src/interview/generated-fields.ts`
  - Builds generated/default field states after core user facts are complete.
- Modify `apps/backend-hono/src/interview/phase-router.ts`
  - Makes both flows move from core collection to `unit_selection` after minimal facts, not after generated fields.
- Modify `apps/backend-hono/src/interview/master/master-readiness.ts`
  - Treats only core facts + WSP imported unit/map as blocking readiness.
- Modify `apps/backend-hono/src/interview/trainer/trainer-readiness.ts`
  - Treats Trainer training detail fields as generated, not blocking semantic search.
- Modify `apps/backend-hono/src/interview/interview-engine.ts`
  - Applies generated field states after extraction and before readiness/compile.
- Modify `apps/backend-hono/src/ai/prompts/extractor.prompt.ts`
  - Teaches extraction to collect only core facts, ignore help/discussion messages, and support corrections.
- Modify `apps/backend-hono/src/ai/prompts/interviewer.prompt.ts`
  - Teaches response flow: guide confused users, ask natural grouped questions, recommend SKKNI search once core facts are complete.
- Modify `apps/backend-hono/src/skkni/skkni.service.ts`
  - Uses different semantic search context for Master and Trainer JSON, returns 10 candidates, preserves imported WSP data accurately.
- Modify `apps/backend-hono/src/skkni/skkni.routes.ts`
  - Keeps `/select` as the only place where `/unit` and `/map` are fetched and persisted as imported authoritative data.
- Modify `apps/frontend/src/views/ai-workspace/checkpoints.ts`
  - Shows only user-required core fields as main progress; marks WSP-imported fields separately.
- Add or modify tests in:
  - `apps/backend-hono/src/interview/master/master-readiness.test.ts`
  - `apps/backend-hono/src/interview/trainer/trainer-readiness.test.ts`
  - `apps/backend-hono/src/interview/phase-router.test.ts`
  - `apps/backend-hono/src/interview/interview-engine.test.ts`
  - `apps/backend-hono/src/skkni/skkni.service.test.ts`
  - `apps/backend-hono/src/skkni/skkni.routes.test.ts`

---

### Task 1: Normalize Required Core Fields

**Files:**
- Modify: `apps/backend-hono/src/interview/master/master-fields.ts`
- Modify: `apps/backend-hono/src/interview/trainer/trainer-fields.ts`
- Test: `apps/backend-hono/src/interview/master/master-readiness.test.ts`
- Test: `apps/backend-hono/src/interview/trainer/trainer-readiness.test.ts`

- [ ] **Step 1: Write failing Master readiness test**

Add this test to `apps/backend-hono/src/interview/master/master-readiness.test.ts`:

```ts
it("does not require organization_city or generated program fields before SKKNI search", () => {
  const states: FieldStateSnapshot[] = [
    confirmed("profile", "trainer_name", "Budi Santoso"),
    confirmed("profile", "organization_name", "PT LSP"),
    confirmed("profile", "organization_focus", "Digital Marketing"),
    confirmed("profile", "target_participants", "Owner UMKM"),
    confirmed("profile", "industry_problem", "Iklan boros tapi hasil minim"),
    confirmed("profile", "program_goal", "Meningkatkan penjualan UMKM melalui strategi digital"),
    confirmed("profile", "training_location", "Bekasi"),
    confirmed("profile", "training_duration", "2 hari"),
  ];

  const readiness = buildMasterReadiness(states);

  expect(readiness.missing).not.toContain("profile.organization_city");
  expect(readiness.missing).not.toContain("profile.program_name");
  expect(readiness.missing).toContain("unit_selection.selected_unit_code");
});
```

- [ ] **Step 2: Run Master readiness test and verify it fails**

Run:

```bash
cd apps/backend-hono
bun test src/interview/master/master-readiness.test.ts
```

Expected: FAIL because `profile.organization_city` and/or `profile.program_name` is currently required by `masterProfileRequiredFields`.

- [ ] **Step 3: Write failing Trainer readiness test**

Add this test to `apps/backend-hono/src/interview/trainer/trainer-readiness.test.ts`:

```ts
it("does not require generated training details before SKKNI search", () => {
  const states: FieldStateSnapshot[] = [
    confirmed("brainstorming", "trainer_name", "Ujang Abdus Salam"),
    confirmed("brainstorming", "institution", "Mandiri"),
    confirmed("brainstorming", "expertise", "Marketing"),
    confirmed("brainstorming", "audience", "UMKM yang mau naik kelas"),
    confirmed("brainstorming", "outcome", "UMKM bisa membuat strategi pemasaran sendiri"),
  ];

  const readiness = buildTrainerReadiness(states);

  expect(readiness.missing).not.toContain("training_details.program_name");
  expect(readiness.missing).not.toContain("training_details.delivery_method");
  expect(readiness.missing).not.toContain("training_details.duration_jp");
  expect(readiness.missing).toContain("unit_selection.selected_unit_code");
});
```

- [ ] **Step 4: Run Trainer readiness test and verify it fails**

Run:

```bash
cd apps/backend-hono
bun test src/interview/trainer/trainer-readiness.test.ts
```

Expected: FAIL because `trainerTrainingDetailsRequiredFields` currently block readiness.

- [ ] **Step 5: Modify Master field definitions**

Replace `apps/backend-hono/src/interview/master/master-fields.ts` with:

```ts
export const masterProfileRequiredFields = [
  "trainer_name",
  "organization_name",
  "organization_focus",
  "target_participants",
  "industry_problem",
  "program_goal",
  "training_location",
  "training_duration",
] as const;

export const masterProfileGeneratedFields = ["program_name", "organization_city"] as const;

export const masterProfileOptionalFields = ["delivery_method", "evaluation_methods"] as const;

export const masterSkkniRequiredFields = [
  { phaseKey: "unit_selection", fieldKey: "selected_unit_code" },
  { phaseKey: "unit_selection", fieldKey: "unit_detail" },
  { phaseKey: "competency_map", fieldKey: "skkni_map" },
] as const;

export type MasterProfileRequiredField = (typeof masterProfileRequiredFields)[number];
export type MasterProfileGeneratedField = (typeof masterProfileGeneratedFields)[number];
export type MasterProfileOptionalField = (typeof masterProfileOptionalFields)[number];
```

- [ ] **Step 6: Modify Trainer field definitions**

Replace `apps/backend-hono/src/interview/trainer/trainer-fields.ts` with:

```ts
export const trainerBrainstormingRequiredFields = ["trainer_name", "institution", "expertise", "audience", "outcome"] as const;

export const trainerBrainstormingOptionalFields = ["activities", "training_objective", "training_date"] as const;

export const trainerTrainingDetailsGeneratedFields = ["program_name", "delivery_method", "duration_jp"] as const;

export const trainerSkkniRequiredFields = [
  { phaseKey: "unit_selection", fieldKey: "selected_unit_code" },
  { phaseKey: "unit_selection", fieldKey: "unit_detail" },
  { phaseKey: "competency_map", fieldKey: "skkni_map" },
] as const;
```

- [ ] **Step 7: Update Trainer readiness import and generated optional gaps**

In `apps/backend-hono/src/interview/trainer/trainer-readiness.ts`, replace the import:

```ts
import { trainerBrainstormingOptionalFields, trainerBrainstormingRequiredFields, trainerSkkniRequiredFields, trainerTrainingDetailsGeneratedFields } from "./trainer-fields";
```

Then replace this loop:

```ts
for (const fieldKey of trainerTrainingDetailsRequiredFields) requireField("training_details", fieldKey);
```

with:

```ts
for (const fieldKey of trainerTrainingDetailsGeneratedFields) {
  const state = byKey.get(keyOf("training_details", fieldKey));
  if (!state || !hasUsableValue(state.value)) optionalGaps.push(keyOf("training_details", fieldKey));
}
```

- [ ] **Step 8: Run readiness tests and verify they pass**

Run:

```bash
cd apps/backend-hono
bun test src/interview/master/master-readiness.test.ts src/interview/trainer/trainer-readiness.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/backend-hono/src/interview/master/master-fields.ts apps/backend-hono/src/interview/trainer/trainer-fields.ts apps/backend-hono/src/interview/master/master-readiness.test.ts apps/backend-hono/src/interview/trainer/trainer-readiness.test.ts apps/backend-hono/src/interview/trainer/trainer-readiness.ts
git commit -m "feat: normalize core interview fields"
```

---

### Task 2: Route Core Completion To SKKNI Selection

**Files:**
- Modify: `apps/backend-hono/src/interview/phase-router.ts`
- Test: `apps/backend-hono/src/interview/phase-router.test.ts`

- [ ] **Step 1: Write failing phase-router tests**

Add these tests to `apps/backend-hono/src/interview/phase-router.test.ts`:

```ts
it("moves Master to unit selection after only core profile fields are complete", () => {
  const states: FieldStateSnapshot[] = [
    confirmed("profile", "trainer_name", "Budi Santoso"),
    confirmed("profile", "organization_name", "PT LSP"),
    confirmed("profile", "organization_focus", "Digital Marketing"),
    confirmed("profile", "target_participants", "Owner UMKM"),
    confirmed("profile", "industry_problem", "Iklan boros tapi hasil minim"),
    confirmed("profile", "program_goal", "Meningkatkan penjualan UMKM melalui strategi digital"),
    confirmed("profile", "training_location", "Bekasi"),
    confirmed("profile", "training_duration", "2 hari"),
  ];

  expect(getNextMasterPhase(states)).toBe("unit_selection");
});

it("moves Trainer to unit selection before generated training details exist", () => {
  const states: FieldStateSnapshot[] = [
    confirmed("brainstorming", "trainer_name", "Ujang Abdus Salam"),
    confirmed("brainstorming", "institution", "Mandiri"),
    confirmed("brainstorming", "expertise", "Marketing"),
    confirmed("brainstorming", "audience", "UMKM yang mau naik kelas"),
    confirmed("brainstorming", "outcome", "UMKM bisa membuat strategi pemasaran sendiri"),
  ];

  expect(getNextTrainerPhase(states)).toBe("unit_selection");
});
```

- [ ] **Step 2: Run phase-router test and verify it fails**

Run:

```bash
cd apps/backend-hono
bun test src/interview/phase-router.test.ts
```

Expected: FAIL if Trainer still waits for `training_details` before generation-ready or if imports reference removed `trainerTrainingDetailsRequiredFields`.

- [ ] **Step 3: Update `phase-router.ts` imports**

Change:

```ts
import { trainerBrainstormingRequiredFields, trainerSkkniRequiredFields, trainerTrainingDetailsRequiredFields } from "./trainer/trainer-fields";
```

to:

```ts
import { trainerBrainstormingRequiredFields, trainerSkkniRequiredFields } from "./trainer/trainer-fields";
```

- [ ] **Step 4: Remove generated training details gate**

In `getNextTrainerPhase`, delete this block:

```ts
const trainingDetailsComplete = trainerTrainingDetailsRequiredFields.every((fieldKey) =>
  hasFinalValue(states, "training_details", fieldKey),
);
if (!trainingDetailsComplete) return "training_details";
```

Then make the end of `getNextTrainerPhase`:

```ts
if (!hasFinalValue(states, "competency_map", "skkni_map")) return "competency_map";

return "generation_ready";
```

- [ ] **Step 5: Run phase-router test and verify it passes**

Run:

```bash
cd apps/backend-hono
bun test src/interview/phase-router.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend-hono/src/interview/phase-router.ts apps/backend-hono/src/interview/phase-router.test.ts
git commit -m "feat: route interviews to skkni after core facts"
```

---

### Task 3: Generate Non-Core Field States As AI-Generated Data

**Files:**
- Create: `apps/backend-hono/src/interview/generated-fields.ts`
- Modify: `apps/backend-hono/src/interview/interview-engine.ts`
- Test: `apps/backend-hono/src/interview/interview-engine.test.ts`

- [ ] **Step 1: Write failing generated-fields engine tests**

Add this test to `apps/backend-hono/src/interview/interview-engine.test.ts`:

```ts
it("fills Trainer generated training details after core facts are captured", async () => {
  const fieldStates = new FakeFieldStateRepository();
  const documents = new FakeDocumentRepository();
  documents.doc = { id: "doc_1", ownerUserId: "user_1", flow: "trainer", title: "Trainer Doc" };

  const engine = new InterviewEngine({
    documents: documents as any,
    fieldStates: fieldStates as any,
    conversations: new FakeConversationRepository() as any,
    extraction: {
      async extract() {
        return {
          patches: [
            { flow: "trainer", phaseKey: "brainstorming", fieldKey: "trainer_name", value: "Ujang Abdus Salam", source: "user_explicit", confidence: 0.95 },
            { flow: "trainer", phaseKey: "brainstorming", fieldKey: "institution", value: "Mandiri", source: "user_explicit", confidence: 0.95 },
            { flow: "trainer", phaseKey: "brainstorming", fieldKey: "expertise", value: "Marketing", source: "user_explicit", confidence: 0.95 },
            { flow: "trainer", phaseKey: "brainstorming", fieldKey: "audience", value: "UMKM yang mau naik kelas", source: "user_explicit", confidence: 0.95 },
            { flow: "trainer", phaseKey: "brainstorming", fieldKey: "outcome", value: "UMKM bisa membuat strategi pemasaran sendiri", source: "user_explicit", confidence: 0.95 },
          ],
          pendingSuggestions: [],
          confirmedPendingFields: [],
          generateConfirmed: false,
        };
      },
    },
    response: { async stream() { return new Response("Data inti cukup. Saya bisa carikan unit SKKNI."); } },
  });

  await engine.handleMessage({ documentId: "doc_1", userId: "user_1", message: "Saya Ujang, mandiri, bidang marketing untuk UMKM." });

  expect(documents.updated.masterJson.training_details.program_name).toBe("Pelatihan Marketing untuk UMKM yang mau naik kelas");
  expect(documents.updated.masterJson.training_details.delivery_method).toBe("AI GENERATED");
  expect(documents.updated.masterJson.training_details.duration_jp).toBe(0);
});
```

Add this second test:

```ts
it("fills Master generated program_name from core facts", async () => {
  const fieldStates = new FakeFieldStateRepository();
  const documents = new FakeDocumentRepository();
  documents.doc = { id: "doc_1", ownerUserId: "user_1", flow: "master", title: "Master Doc" };

  const engine = new InterviewEngine({
    documents: documents as any,
    fieldStates: fieldStates as any,
    conversations: new FakeConversationRepository() as any,
    extraction: {
      async extract() {
        return {
          patches: [
            { flow: "master", phaseKey: "profile", fieldKey: "trainer_name", value: "Budi Santoso", source: "user_explicit", confidence: 0.95 },
            { flow: "master", phaseKey: "profile", fieldKey: "organization_name", value: "PT LSP", source: "user_explicit", confidence: 0.95 },
            { flow: "master", phaseKey: "profile", fieldKey: "organization_focus", value: "Digital Marketing", source: "user_explicit", confidence: 0.95 },
            { flow: "master", phaseKey: "profile", fieldKey: "target_participants", value: "Owner UMKM", source: "user_explicit", confidence: 0.95 },
            { flow: "master", phaseKey: "profile", fieldKey: "industry_problem", value: "Iklan boros tapi hasil minim", source: "user_explicit", confidence: 0.95 },
            { flow: "master", phaseKey: "profile", fieldKey: "program_goal", value: "Meningkatkan penjualan UMKM melalui strategi digital", source: "user_explicit", confidence: 0.95 },
            { flow: "master", phaseKey: "profile", fieldKey: "training_location", value: "Bekasi", source: "user_explicit", confidence: 0.95 },
            { flow: "master", phaseKey: "profile", fieldKey: "training_duration", value: "2 hari", source: "user_explicit", confidence: 0.95 },
          ],
          pendingSuggestions: [],
          confirmedPendingFields: [],
          generateConfirmed: false,
        };
      },
    },
    response: { async stream() { return new Response("Data inti cukup. Saya bisa carikan unit SKKNI."); } },
  });

  await engine.handleMessage({ documentId: "doc_1", userId: "user_1", message: "Program digital marketing untuk owner UMKM di Bekasi." });

  expect(documents.updated.masterJson.brainstorming_master.program_name).toBe("Pelatihan Digital Marketing untuk Owner UMKM");
  expect(documents.updated.masterJson.brainstorming_master.organization_city).toBe("Bekasi");
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:

```bash
cd apps/backend-hono
bun test src/interview/interview-engine.test.ts
```

Expected: FAIL because generated/default field states are not added yet.

- [ ] **Step 3: Create generated field helper**

Create `apps/backend-hono/src/interview/generated-fields.ts`:

```ts
import type { FieldSnapshotFlow, FieldStateSnapshot } from "./field-state.types";

export type GeneratedFieldPatch = {
  flow: FieldSnapshotFlow;
  phaseKey: string;
  fieldKey: string;
  value: unknown;
};

function finalValue(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): unknown {
  const state = states.find((item) => item.phaseKey === phaseKey && item.fieldKey === fieldKey && ["captured", "confirmed"].includes(item.status));
  return state?.value;
}

function finalString(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): string {
  const value = finalValue(states, phaseKey, fieldKey);
  return typeof value === "string" ? value.trim() : "";
}

function hasValue(states: FieldStateSnapshot[], phaseKey: string, fieldKey: string): boolean {
  const value = finalValue(states, phaseKey, fieldKey);
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return !!value;
}

function allPresent(states: FieldStateSnapshot[], phaseKey: string, fields: string[]): boolean {
  return fields.every((fieldKey) => hasValue(states, phaseKey, fieldKey));
}

export function buildGeneratedFieldPatches(flow: FieldSnapshotFlow, states: FieldStateSnapshot[]): GeneratedFieldPatch[] {
  if (flow === "trainer") return buildTrainerGeneratedFieldPatches(states);
  return buildMasterGeneratedFieldPatches(states);
}

function buildTrainerGeneratedFieldPatches(states: FieldStateSnapshot[]): GeneratedFieldPatch[] {
  if (!allPresent(states, "brainstorming", ["trainer_name", "institution", "expertise", "audience", "outcome"])) return [];

  const expertise = finalString(states, "brainstorming", "expertise") || "AI GENERATED";
  const audience = finalString(states, "brainstorming", "audience") || "AI GENERATED";
  const patches: GeneratedFieldPatch[] = [];

  if (!hasValue(states, "training_details", "program_name")) {
    patches.push({ flow: "trainer", phaseKey: "training_details", fieldKey: "program_name", value: `Pelatihan ${expertise} untuk ${audience}` });
  }
  if (!hasValue(states, "training_details", "delivery_method")) {
    patches.push({ flow: "trainer", phaseKey: "training_details", fieldKey: "delivery_method", value: "AI GENERATED" });
  }
  if (!hasValue(states, "training_details", "duration_jp")) {
    patches.push({ flow: "trainer", phaseKey: "training_details", fieldKey: "duration_jp", value: 0 });
  }

  return patches;
}

function buildMasterGeneratedFieldPatches(states: FieldStateSnapshot[]): GeneratedFieldPatch[] {
  if (!allPresent(states, "profile", ["trainer_name", "organization_name", "organization_focus", "target_participants", "industry_problem", "program_goal", "training_location", "training_duration"])) return [];

  const focus = finalString(states, "profile", "organization_focus") || "AI GENERATED";
  const audience = finalString(states, "profile", "target_participants") || "AI GENERATED";
  const location = finalString(states, "profile", "training_location") || "AI GENERATED";
  const patches: GeneratedFieldPatch[] = [];

  if (!hasValue(states, "profile", "program_name")) {
    patches.push({ flow: "master", phaseKey: "profile", fieldKey: "program_name", value: `Pelatihan ${focus} untuk ${audience}` });
  }
  if (!hasValue(states, "profile", "organization_city")) {
    patches.push({ flow: "master", phaseKey: "profile", fieldKey: "organization_city", value: location });
  }

  return patches;
}
```

- [ ] **Step 4: Apply generated fields in interview engine**

In `apps/backend-hono/src/interview/interview-engine.ts`, add import:

```ts
import { buildGeneratedFieldPatches } from "./generated-fields";
```

After the `pendingSuggestions` loop and before `const updatedStates = await fieldStates.list(...)`, insert:

```ts
      const statesAfterExtraction = await fieldStates.list(input.documentId, flow);
      for (const generated of buildGeneratedFieldPatches(flow, statesAfterExtraction as FieldStateSnapshot[])) {
        await fieldStates.upsert({
          documentId: input.documentId,
          flow: generated.flow,
          phaseKey: generated.phaseKey,
          fieldKey: generated.fieldKey,
          value: generated.value,
          status: "captured",
          source: "system",
          pendingSuggestion: null,
        });
      }
```

- [ ] **Step 5: Run engine tests and verify they pass**

Run:

```bash
cd apps/backend-hono
bun test src/interview/interview-engine.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend-hono/src/interview/generated-fields.ts apps/backend-hono/src/interview/interview-engine.ts apps/backend-hono/src/interview/interview-engine.test.ts
git commit -m "feat: generate non-core interview fields"
```

---

### Task 4: Make Extraction And Interview Prompts Match The Core-Data Flow

**Files:**
- Modify: `apps/backend-hono/src/ai/prompts/extractor.prompt.ts`
- Modify: `apps/backend-hono/src/ai/prompts/interviewer.prompt.ts`
- Test: `apps/backend-hono/src/ai/extraction.service.test.ts`

- [ ] **Step 1: Write prompt regression tests**

Add this test to `apps/backend-hono/src/ai/extraction.service.test.ts`:

```ts
it("prompt names only core Master fields as explicit extraction targets", () => {
  expect(extractorPrompt).toContain("Master flow profile core fields");
  expect(extractorPrompt).toContain("trainer_name");
  expect(extractorPrompt).toContain("organization_name");
  expect(extractorPrompt).toContain("organization_focus");
  expect(extractorPrompt).toContain("target_participants");
  expect(extractorPrompt).toContain("industry_problem");
  expect(extractorPrompt).toContain("program_goal");
  expect(extractorPrompt).toContain("training_location");
  expect(extractorPrompt).toContain("training_duration");
  expect(extractorPrompt).toContain("Do not extract questions like aku belum mengerti");
});
```

If `extractorPrompt` is not imported in the file, add:

```ts
import { extractorPrompt } from "./prompts/extractor.prompt";
```

- [ ] **Step 2: Run prompt regression test and verify it fails**

Run:

```bash
cd apps/backend-hono
bun test src/ai/extraction.service.test.ts
```

Expected: FAIL because the prompt does not yet contain the new wording.

- [ ] **Step 3: Replace extractor prompt**

Replace `apps/backend-hono/src/ai/prompts/extractor.prompt.ts` with:

```ts
export const extractorPrompt = `Extract only explicitly stated or confirmed fields from the user's Indonesian message.
Do not infer final values from weak hints.
Do not extract questions like aku belum mengerti, maksudnya gimana, contoh apa, or user confusion as data.
If the user asks a question only, return empty patches.
If the user asks for a recommendation, return pendingSuggestions, not final patches.
If the user confirms a previous pending suggestion, return confirmedPendingFields.
Extract every explicit field in the message, even when several fields appear in one sentence.
If the user corrects a value, emit a new patch for the corrected field. Example: "bukan marketing, public speaking" means the relevant expertise/focus value is public speaking.

Use these canonical field keys:
- Trainer flow brainstorming core fields: trainer_name, institution, expertise, audience, outcome.
- Trainer flow brainstorming optional fields: activities, training_objective, training_date.
- Trainer flow training_details fields are generated by the system unless explicitly stated: program_name, delivery_method, duration_jp.
- Master flow profile core fields: trainer_name, organization_name, organization_focus, target_participants, industry_problem, program_goal, training_location, training_duration.
- Master flow generated fields: program_name, organization_city.

Do not extract WSP / SKKNI unit detail, competency elements, KUK, assessment guide, or competency map from chat. Those must come from WSP endpoints after the user selects a unit code.
Return structured output matching the provided schema.`;
```

- [ ] **Step 4: Replace interviewer prompt**

Replace `apps/backend-hono/src/ai/prompts/interviewer.prompt.ts` with:

```ts
export const interviewerPrompt = `Speak Indonesian naturally, concise, and professional.
Acknowledge captured information.
Do not interview rigidly one field at a time.
When multiple important fields are still missing, ask one compact follow-up that groups 2-3 related fields.
If the user already provided several fields, acknowledge them together and move to the next useful group.
If the user is confused or says they do not understand, guide them with an example instead of treating that text as document data.
For Trainer, collect only core facts before SKKNI search: trainer name, institution or Mandiri, expertise, target audience, and desired outcome.
For Master, collect only core facts before SKKNI search: trainer name, institution, focus/expertise, target participants, industry problem, desired outcome, training location, and duration.
Once core facts are enough, tell the user you can search related SKKNI units and ask for confirmation.
Never ask the user to provide unit title, unit detail, KUK, assessment guide, or competency map manually. Those are imported from WSP after unit selection.
Do not expose raw checklist.
Do not claim the document is ready unless deterministic readiness says ready.
If user is unsure, suggest one best option and ask confirmation.`;
```

- [ ] **Step 5: Run prompt tests and verify they pass**

Run:

```bash
cd apps/backend-hono
bun test src/ai/extraction.service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend-hono/src/ai/prompts/extractor.prompt.ts apps/backend-hono/src/ai/prompts/interviewer.prompt.ts apps/backend-hono/src/ai/extraction.service.test.ts
git commit -m "feat: align ai prompts with core skkni flow"
```

---

### Task 5: Make WSP Semantic Search Use Flow-Specific Context And Return 10 Candidates

**Files:**
- Modify: `apps/backend-hono/src/skkni/skkni.service.ts`
- Test: `apps/backend-hono/src/skkni/skkni.service.test.ts`

- [ ] **Step 1: Write failing WSP context tests**

Add these tests to `apps/backend-hono/src/skkni/skkni.service.test.ts`:

```ts
it("builds Trainer SKKNI semantic context from trainer json", () => {
  const context = buildSkkniContext({
    schema_key: "hono_trainer_alpha_v1",
    brainstorming: {
      trainer_name: "Ujang Abdus Salam",
      institution: "Mandiri",
      expertise: "Marketing",
      audience: "UMKM yang mau naik kelas",
      outcome: "UMKM bisa membuat strategi pemasaran sendiri",
    },
  });

  expect(context).toEqual({
    expertise: "Marketing",
    activities: "UMKM bisa membuat strategi pemasaran sendiri",
    audience: "UMKM yang mau naik kelas",
    outcome: "UMKM bisa membuat strategi pemasaran sendiri",
    domain_hint: "Marketing",
    inferred_goal_label: "UMKM bisa membuat strategi pemasaran sendiri",
  });
});

it("limits semantic candidates to 10 results", () => {
  const response = {
    results: Array.from({ length: 12 }, (_, index) => ({
      rank: index + 1,
      unit_code: `CODE.${index + 1}`,
      unit_title: `Unit ${index + 1}`,
      score: 1 - index * 0.01,
    })),
  };

  expect(transformSemanticSearch(response)).toHaveLength(10);
});
```

Update existing import if needed:

```ts
import { buildSkkniContext, transformSemanticSearch, normalizeCompetencyMap, normalizeUnitDetail } from "./skkni.service";
```

- [ ] **Step 2: Run SKKNI service test and verify it fails**

Run:

```bash
cd apps/backend-hono
bun test src/skkni/skkni.service.test.ts
```

Expected: FAIL because `buildSkkniContext` does not exist and search currently slices to 10 in transform but `searchMaster` still sends `top_k: 5`.

- [ ] **Step 3: Replace context builder**

In `apps/backend-hono/src/skkni/skkni.service.ts`, replace `buildMasterSkkniContext` with:

```ts
export function buildSkkniContext(masterJson: unknown): MasterSkkniContext {
  const root = masterJson && typeof masterJson === "object" ? (masterJson as any) : {};
  const master = root.brainstorming_master ?? {};
  const trainer = root.brainstorming ?? {};

  if (root.schema_key === "hono_trainer_alpha_v1" || trainer.expertise || trainer.audience || trainer.outcome) {
    return {
      expertise: clean(trainer.expertise),
      activities: clean(trainer.outcome) ?? clean(trainer.training_objective),
      audience: clean(trainer.audience),
      outcome: clean(trainer.outcome) ?? clean(trainer.training_objective),
      domain_hint: clean(trainer.expertise),
      inferred_goal_label: clean(trainer.outcome) ?? clean(trainer.training_objective),
    };
  }

  return {
    expertise: clean(master.organization_focus) ?? clean(master.program_name),
    activities: clean(master.program_goal),
    audience: clean(master.target_participants),
    outcome: clean(master.program_goal) ?? clean(master.industry_problem),
    domain_hint: clean(master.program_name) ?? clean(master.organization_focus),
    inferred_goal_label: clean(master.program_goal),
  };
}

export const buildMasterSkkniContext = buildSkkniContext;
```

- [ ] **Step 4: Update search to request 10 candidates**

In `searchMaster`, replace:

```ts
const context = buildMasterSkkniContext(masterJson);
```

with:

```ts
const context = buildSkkniContext(masterJson);
```

Then replace:

```ts
top_k: 5,
```

with:

```ts
top_k: 10,
```

- [ ] **Step 5: Run SKKNI service tests and verify they pass**

Run:

```bash
cd apps/backend-hono
bun test src/skkni/skkni.service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend-hono/src/skkni/skkni.service.ts apps/backend-hono/src/skkni/skkni.service.test.ts
git commit -m "feat: build wsp search context from core facts"
```

---

### Task 6: Preserve WSP Unit And Map As Authoritative Imported Data

**Files:**
- Modify: `apps/backend-hono/src/skkni/skkni.service.ts`
- Modify: `apps/backend-hono/src/skkni/skkni.routes.ts`
- Test: `apps/backend-hono/src/skkni/skkni.routes.test.ts`

- [ ] **Step 1: Write failing route test for imported data**

Add this assertion block to the existing `"selects unit and updates Master readiness state"` test in `apps/backend-hono/src/skkni/skkni.routes.test.ts` after the request:

```ts
const unitDetail = fields.states.find((state) => state.phaseKey === "unit_selection" && state.fieldKey === "unit_detail");
const competencyMap = fields.states.find((state) => state.phaseKey === "competency_map" && state.fieldKey === "skkni_map");

expect(unitDetail?.source).toBe("imported");
expect(competencyMap?.source).toBe("imported");
expect(unitDetail?.value).toMatchObject({
  code: "M.70MKT00.001.1",
  name: "Mengelola Kampanye Digital",
});
expect(competencyMap?.value).toMatchObject({
  main_goal: expect.any(String),
  key_function: expect.any(String),
  main_function: expect.any(String),
  basic_function: expect.any(String),
});
```

If fake WSP data in the test lacks those fields, update `fakeSkkni` inside the test to return:

```ts
const fakeSkkni = {
  async searchMaster() {
    return [{ id: "unit_1", unitCode: "M.70MKT00.001.1", title: "Mengelola Kampanye Digital", relevanceScore: 0.92, reason: "Sesuai", evidence: ["Rank 1"] }];
  },
  async getUnitDetail() {
    return {
      code: "M.70MKT00.001.1",
      name: "Mengelola Kampanye Digital",
      description: "Unit kompetensi kampanye digital.",
      elements: [{ element_number: 1, element_text: "Menyiapkan kampanye", kuk: [{ kuk_code: "1.1", kuk_text: "Tujuan kampanye ditentukan." }] }],
      variable_constraints: {},
      assessment_guide: {},
      source_document: { document_id: "doc_wsp", document_title: "SKKNI Pemasaran" },
    };
  },
  async getCompetencyMap() {
    return {
      main_goal: "Kampanye digital efektif",
      key_function: "Pemasaran digital",
      main_function: "Mengelola kampanye",
      basic_function: "Menyiapkan kampanye",
    };
  },
};
```

- [ ] **Step 2: Run route test**

Run:

```bash
cd apps/backend-hono
bun test src/skkni/skkni.routes.test.ts
```

Expected: PASS if current route already stores imported data correctly; FAIL if fake data or assertions reveal missing authoritative fields.

- [ ] **Step 3: If route test fails, keep route storage exactly authoritative**

Ensure `apps/backend-hono/src/skkni/skkni.routes.ts` keeps these exact `source` values:

```ts
source: "user_confirmed",
```

for `selected_unit_code` and `selected_unit_title`, and:

```ts
source: "imported",
```

for `unit_detail` and `skkni_map`.

- [ ] **Step 4: Run route test and verify it passes**

Run:

```bash
cd apps/backend-hono
bun test src/skkni/skkni.routes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/skkni/skkni.routes.ts apps/backend-hono/src/skkni/skkni.routes.test.ts
git commit -m "test: lock wsp imported unit persistence"
```

---

### Task 7: Simplify Frontend Checkpoints To Core Facts And WSP Imported Data

**Files:**
- Modify: `apps/frontend/src/views/ai-workspace/checkpoints.ts`

- [ ] **Step 1: Update checkpoint config for Master**

In `apps/frontend/src/views/ai-workspace/checkpoints.ts`, replace the Master `profile` fields with:

```ts
fields: [
  { phaseKey: 'profile', fieldKey: 'trainer_name', label: 'Nama trainer' },
  { phaseKey: 'profile', fieldKey: 'organization_name', label: 'Nama lembaga' },
  { phaseKey: 'profile', fieldKey: 'organization_focus', label: 'Bidang pelatihan' },
  { phaseKey: 'profile', fieldKey: 'target_participants', label: 'Target peserta' },
  { phaseKey: 'profile', fieldKey: 'industry_problem', label: 'Masalah utama' },
  { phaseKey: 'profile', fieldKey: 'program_goal', label: 'Hasil utama' },
  { phaseKey: 'profile', fieldKey: 'training_location', label: 'Lokasi pelatihan' },
  { phaseKey: 'profile', fieldKey: 'training_duration', label: 'Durasi pelatihan' },
  { phaseKey: 'profile', fieldKey: 'program_name', label: 'Nama program', optional: true },
  { phaseKey: 'profile', fieldKey: 'organization_city', label: 'Kota lembaga', optional: true },
],
```

- [ ] **Step 2: Update checkpoint config for Trainer**

In the Trainer `brainstorming` group, replace fields with:

```ts
fields: [
  { phaseKey: 'brainstorming', fieldKey: 'trainer_name', label: 'Nama trainer' },
  { phaseKey: 'brainstorming', fieldKey: 'institution', label: 'Lembaga / Mandiri' },
  { phaseKey: 'brainstorming', fieldKey: 'expertise', label: 'Bidang keahlian' },
  { phaseKey: 'brainstorming', fieldKey: 'audience', label: 'Target peserta' },
  { phaseKey: 'brainstorming', fieldKey: 'outcome', label: 'Hasil pelatihan' },
  { phaseKey: 'brainstorming', fieldKey: 'activities', label: 'Aktivitas belajar', optional: true },
  { phaseKey: 'brainstorming', fieldKey: 'training_objective', label: 'Tujuan pelatihan', optional: true },
  { phaseKey: 'brainstorming', fieldKey: 'training_date', label: 'Tanggal pelatihan', optional: true },
],
```

In the Trainer `training_details` group, mark all fields optional:

```ts
fields: [
  { phaseKey: 'training_details', fieldKey: 'program_name', label: 'Nama program', optional: true },
  { phaseKey: 'training_details', fieldKey: 'delivery_method', label: 'Metode pelaksanaan', optional: true },
  { phaseKey: 'training_details', fieldKey: 'duration_jp', label: 'Durasi JP', optional: true },
],
```

- [ ] **Step 3: Run frontend typecheck/build**

Run:

```bash
cd apps/frontend
bun run build
```

Expected: PASS and no TypeScript errors from checkpoint config.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/views/ai-workspace/checkpoints.ts
git commit -m "feat: show core ai workspace checkpoints"
```

---

### Task 8: Verification And Hono Deployment

**Files:**
- No direct source edits.

- [ ] **Step 1: Run targeted backend tests**

Run:

```bash
cd apps/backend-hono
bun test src/interview/master/master-readiness.test.ts src/interview/trainer/trainer-readiness.test.ts src/interview/phase-router.test.ts src/interview/interview-engine.test.ts src/skkni/skkni.service.test.ts src/skkni/skkni.routes.test.ts src/ai/extraction.service.test.ts
```

Expected: all targeted tests PASS.

- [ ] **Step 2: Run backend typecheck**

Run:

```bash
cd apps/backend-hono
bun run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd apps/frontend
bun run build
```

Expected: PASS.

- [ ] **Step 4: Run Hono deploy script**

From repo root:

```bash
./scripts/deploy-hono.sh
```

Expected: deploy script finishes successfully. Do not claim live until this command succeeds.

- [ ] **Step 5: Verify live Hono health**

Run:

```bash
curl -sS https://hono.sertifikasitrainer.com/api/health
```

Expected response includes:

```json
{"ok":true,"service":"trainerhub-backend-hono"}
```

- [ ] **Step 6: Verify WSP example endpoints still return authoritative data**

Run:

```bash
curl -sS https://wsp.sertifikasitrainer.com/unit/M.70MKT00.012.1 | jq '.data.unit_code, .data.unit_title, (.data.competency_elements | length)'
curl -sS https://wsp.sertifikasitrainer.com/map/M.70MKT00.012.1 | jq '.unit_code, .tujuan_utama, .fungsi_kunci, .fungsi_utama, .matched_fungsi_dasar'
```

Expected output includes:

```txt
"M.70MKT00.012.1"
"Menggunakan Media Sosial dan Aplikasi Daring (Online Tools)"
5
```

and non-empty map strings.

- [ ] **Step 7: Commit final verification note if code changed after previous commits**

If any source changes were made during verification:

```bash
git status --short
git add <changed-files>
git commit -m "chore: finalize hono ai core data flow"
```

Expected: commit created only if verification required fixes.

---

## Self-Review

**Spec coverage:** This plan covers the user's requirements: collect only core data, use early questions to support WSP semantic search, return up to 10 SKKNI options, let the user choose a unit code, fetch `/unit/:code` and `/map/:code`, save authoritative imported data to DB/state, generate non-core fields as system data, and postpone DOCX rendering.

**Placeholder scan:** The plan avoids vague implementation markers and broad testing instructions. Every task includes exact files, concrete code snippets, commands, and expected outcomes.

**Type consistency:** Field names match current code conventions: Master uses `profile.*`, Trainer uses `brainstorming.*` and `training_details.*`, WSP imported fields use `unit_selection.unit_detail` and `competency_map.skkni_map`, and sources use existing `FieldSource` values `user_confirmed`, `imported`, and `system`.
