# Workspace System — Phase 2b (Todos + Sertifikat Scoping) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use `- [ ]` syntax for tracking.

**Goal:** Scope `todos` and `sertifikat` to `workspace_id` and migrate their frontend pages from `/user/*` to `/:slug/*`. Reuses the workspace context middleware and axios interceptor from Phase 2a.

**Architecture:** Same as Phase 2a — backend `requireWorkspace` middleware on routes, axios interceptor injects `X-Workspace-Slug`. Schema gains `workspace_id` NOT NULL on `todos` (drop legacy `batch_id`) and `sertifikat`. Service queries filter by workspace.

**Reference:**
- Spec: `docs/superpowers/specs/2026-05-18-workspace-system-design.md`
- Phase 2a plan (pattern reference): `docs/superpowers/plans/2026-05-18-workspace-phase-2a-dokumen.md`

**Branch:** Continue on `workspace-system`.

**Out of scope:** Kelas/course progress/tugas/AI tables — Phase 2c. Admin awareness — Phase 4.

---

## File Structure

### Backend
- Modify: `src/db/schema/todos.ts` — add `workspaceId`, drop `batchId`.
- Modify: `src/db/schema/certificates.ts` — add `workspaceId`.
- Modify: `src/todos/todos.service.ts` + `.test.ts` (rewrite for workspace scoping).
- Modify: `src/todos/todos.routes.ts` (apply requireWorkspace).
- Modify: `src/todos/todos.repository.ts` (workspace-scoped queries).
- Modify: `src/certificates/certificate.service.ts` + `.test.ts`.
- Modify: `src/certificates/certificate.routes.ts`.
- Modify: `src/certificates/certificate.repository.ts`.

### Frontend
- Modify: `src/views/sertifikat/Sertifikat.tsx` (use workspace context if it has hooks).
- Find/modify any `useTodos*` hooks to be slug-keyed (similar to `useDokumen` from Phase 2a).
- Modify: `src/routes/protectedRouteChildren.tsx` — remove `/user/sertifikat`, add `/:slug/sertifikat` child. Todos doesn't have a dedicated route so check where it renders and key its hook by workspace.

### Seed
- Modify: `apps/backend-hono/scripts/seed-workspace.ts` — add 1-2 sample todos + 1 sertifikat row scoped to the seeded workspace.

---

## Task 1: Schema — `workspace_id` on `todos` and `sertifikat`, drop `todos.batch_id`

**Files:**
- Modify: `apps/backend-hono/src/db/schema/todos.ts`
- Modify: `apps/backend-hono/src/db/schema/certificates.ts`

- [ ] **Step 1: Update todos schema**

Edit `apps/backend-hono/src/db/schema/todos.ts`. Replace the import + the `todos` table definition:

```ts
import { boolean, json, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { workspaces } from './workspaces'

export const todoStatusEnum = pgEnum('todo_status', [
  'todo',
  'in_progress',
  'waiting_review',
  'done',
])
export const todoCategoryEnum = pgEnum('todo_category', [
  'Pra-Training',
  'Training',
  'Pasca-Training',
  'Sertifikat',
  'Admin',
])

export const todos = pgTable('todos', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id'),
  key: text('key').notNull(),
  title: text('title').notNull(),
  category: todoCategoryEnum('category').notNull(),
  status: todoStatusEnum('status').default('todo').notNull(),
  isBlocking: boolean('is_blocking').default(false),
  meta: json('meta'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
})

export type Todo = typeof todos.$inferSelect
export type NewTodo = typeof todos.$inferInsert
```

(`batchId` and the import of `batchTraining` are removed.)

- [ ] **Step 2: Update certificates schema**

Edit `apps/backend-hono/src/db/schema/certificates.ts`. Add `workspaceId` to `sertifikat`:

```ts
import { pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { courses } from './learning'
import { peserta } from './people'
import { workspaces } from './workspaces'

export const certificateTypeEnum = pgEnum('certificate_type', ['bnsp', 'trainerhub'])
export const certificateStatusEnum = pgEnum('certificate_status', [
  'not_submitted',
  'in_review',
  'approved',
  'rejected',
  'issued',
])

export const sertifikat = pgTable('sertifikat', {
  id: uuid('id').primaryKey().defaultRandom(),
  pesertaId: uuid('peserta_id')
    .notNull()
    .references(() => peserta.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  // ... rest of columns unchanged
  type: certificateTypeEnum('type').notNull().default('trainerhub'),
  status: certificateStatusEnum('status').default('issued').notNull(),
  certificateNumber: varchar('certificate_number', { length: 100 }).unique(),
  courseName: varchar('course_name', { length: 255 }),
  pesertaName: varchar('peserta_name', { length: 255 }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  nomorSertifikat: varchar('nomor_sertifikat', { length: 100 }),
  fileUrl: varchar('file_url', { length: 500 }),
  lsp: varchar('lsp', { length: 255 }),
  issuedDate: timestamp('issued_date', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type Sertifikat = typeof sertifikat.$inferSelect
export type NewSertifikat = typeof sertifikat.$inferInsert
```

- [ ] **Step 3: Generate migration**

```bash
cd apps/backend-hono
bun run db:generate
```

Inspect the SQL. Must:
- Drop `batch_id` column from `todos`.
- Add `workspace_id` NOT NULL to `todos` and `sertifikat`.

- [ ] **Step 4: Apply migration**

NOT NULL on new columns will fail if rows exist. Alpha state remediation:

```bash
psql $DATABASE_URL -c "TRUNCATE TABLE todos, sertifikat CASCADE;"
```

Then `bun run db:migrate`. If migrate fails (historical pattern), fall back to `bunx drizzle-kit push --force` and update `drizzle.__drizzle_migrations` journal.

- [ ] **Step 5: Verify**

```bash
psql $DATABASE_URL -c "\d todos" | grep -E "workspace_id|batch_id"
psql $DATABASE_URL -c "\d sertifikat" | grep workspace_id
```

`workspace_id` must appear, `batch_id` must NOT appear in `todos`.

- [ ] **Step 6: Commit**

```bash
git add apps/backend-hono/src/db/schema/todos.ts apps/backend-hono/src/db/schema/certificates.ts apps/backend-hono/src/db/migrations/
git commit -m "feat(workspace): scope todos and sertifikat to workspace"
```

---

## Task 2: Update `todos.repository.ts` and `todos.service.ts` (TDD)

**Files:**
- Modify: `apps/backend-hono/src/todos/todos.repository.ts`
- Modify: `apps/backend-hono/src/todos/todos.service.ts`
- Modify: `apps/backend-hono/src/todos/todos.service.test.ts` (or create — check first)

Goal: every todos query filters by `workspaceId`. Method signatures change from `(userId)` to `(workspaceId)`. Insertion of new todos requires `workspaceId`.

- [ ] **Step 1: Inspect current code**

Read `apps/backend-hono/src/todos/todos.repository.ts`, `todos.service.ts`, `todos-definitions.ts` to understand current shape. Identify methods that currently take `userId` or `batchId` and need to swap to `workspaceId`.

- [ ] **Step 2: Write failing tests for service**

Replace or extend `apps/backend-hono/src/todos/todos.service.test.ts` to test the new shape:

```ts
import { describe, expect, it, vi } from 'vitest'
import { TodosService } from './todos.service'

function makeRepository(overrides: any = {}) {
  return {
    findByWorkspace: vi.fn().mockResolvedValue([]),
    upsertForWorkspace: vi.fn(),
    updateStatus: vi.fn(),
    ...overrides,
  }
}

describe('TodosService', () => {
  it('listForWorkspace returns todos from repository', async () => {
    const rows = [{ id: 't1', workspaceId: 'ws_1', title: 'Upload KTP', status: 'todo' }]
    const repository = makeRepository({ findByWorkspace: vi.fn().mockResolvedValue(rows) })
    const service = new TodosService({ repository: repository as any })

    const result = await service.listForWorkspace('ws_1')

    expect(repository.findByWorkspace).toHaveBeenCalledWith('ws_1')
    expect(result).toEqual(rows)
  })

  it('updateStatus passes workspace_id for ownership check', async () => {
    const updated = { id: 't1', workspaceId: 'ws_1', status: 'done' }
    const repository = makeRepository({ updateStatus: vi.fn().mockResolvedValue(updated) })
    const service = new TodosService({ repository: repository as any })

    const result = await service.updateStatus({ id: 't1', workspaceId: 'ws_1', status: 'done' })

    expect(repository.updateStatus).toHaveBeenCalledWith({
      id: 't1',
      workspaceId: 'ws_1',
      status: 'done',
    })
    expect(result).toEqual(updated)
  })

  it('updateStatus throws TODO_NOT_FOUND when repository returns null', async () => {
    const repository = makeRepository({ updateStatus: vi.fn().mockResolvedValue(null) })
    const service = new TodosService({ repository: repository as any })

    await expect(
      service.updateStatus({ id: 't_x', workspaceId: 'ws_1', status: 'done' }),
    ).rejects.toThrow(/TODO_NOT_FOUND/)
  })
})
```

If the existing service has methods like `seedForUser`/`createForBatch` that depended on `batchId`, ALSO add tests for the new equivalents (`seedForWorkspace` or similar). Adapt to actual existing code shape.

- [ ] **Step 3: Run tests, verify failure**

```bash
bun run test src/todos/todos.service.test.ts
```

- [ ] **Step 4: Update repository**

Edit `apps/backend-hono/src/todos/todos.repository.ts`:
- Replace any method that takes `batchId` with one that takes `workspaceId`.
- `findByWorkspace(workspaceId)` returns todos filtered by `workspace_id`.
- `upsertForWorkspace(input)` accepts `{ workspaceId, ... }`.
- `updateStatus({ id, workspaceId, status, ... })` includes `workspaceId` in WHERE for ownership.

Apply minimal changes, preserving existing functionality. Use Drizzle `eq(todos.workspaceId, workspaceId)` patterns.

- [ ] **Step 5: Update service**

Edit `apps/backend-hono/src/todos/todos.service.ts`:
- Replace method signatures to use `workspaceId`.
- `listForWorkspace(workspaceId)`.
- `updateStatus({ id, workspaceId, status })` — throws `TODO_NOT_FOUND` if repository returns null.
- Any seeding/creating logic uses `workspaceId`.

- [ ] **Step 6: Run tests, verify pass**

```bash
bun run test src/todos/todos.service.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add apps/backend-hono/src/todos/
git commit -m "feat(todos): scope service and repository to workspace"
```

---

## Task 3: Update `todos.routes.ts` to apply `requireWorkspace`

**Files:**
- Modify: `apps/backend-hono/src/todos/todos.routes.ts`
- Modify: `apps/backend-hono/src/todos/todos.routes.test.ts` (if exists; otherwise update the bun:test file → vitest if it's one of the 3 broken ones).

The existing test file `todos.routes.test.ts` uses `bun:test` (it's one of the 3 pre-existing broken files). Either:
- (A) Convert it to vitest format and apply workspace scoping, OR
- (B) Skip the route tests for todos and rely on service tests + smoke. Add a `// TODO(phase 2c): convert from bun:test` comment.

Pick (A) if straightforward. Falls back to (B) if it's complex.

- [ ] **Step 1: Read existing routes**

Read `apps/backend-hono/src/todos/todos.routes.ts`. Identify endpoints (likely GET/POST/PATCH for todos).

- [ ] **Step 2: Apply requireWorkspace**

Update routes to:
- Take `dokumenService`-style options: `createTodosRoutes({ todosService, workspaceService })`.
- Each handler that needs workspace scoping uses `requireWorkspace(workspaceService)` middleware.
- Read `c.get('workspace')` to get `workspace_id`.
- Service calls use `workspace.id` instead of `user.id`.

Pattern reference: `apps/backend-hono/src/dokumen/dokumen.routes.ts` (built in Phase 2a Task 4).

- [ ] **Step 3: Convert tests if doing (A) above**

If converting from bun:test to vitest, replace:
- `import { describe, expect, test } from 'bun:test'` → `import { describe, expect, it } from 'vitest'`
- `test(` → `it(`

Update tests to use `requireWorkspace` and inject `workspaceService` mock that returns the test workspace.

If keeping (B), leave the existing test file as-is (still broken, still pre-existing) and rely on smoke + service tests.

- [ ] **Step 4: Run typecheck + tests**

```bash
cd apps/backend-hono
bun run typecheck
bun run test
```

Typecheck must pass. Tests: at least the new/updated ones pass; existing pre-existing failures unchanged.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/todos/
git commit -m "feat(todos): apply requireWorkspace and use workspace context in routes"
```

---

## Task 4: Update `certificate.repository.ts` and `certificate.service.ts` (TDD)

**Files:**
- Modify: `apps/backend-hono/src/certificates/certificate.repository.ts`
- Modify: `apps/backend-hono/src/certificates/certificate.service.ts`
- Modify: `apps/backend-hono/src/certificates/certificate.service.test.ts`
- Modify: `apps/backend-hono/src/certificates/certificate.repository.test.ts`

Goal: list/get sertifikat by `workspaceId`. Same pattern as todos (Task 2).

- [ ] **Step 1: Read existing code**

Read `certificate.service.ts` and `certificate.repository.ts` to understand current methods. Identify queries that should now filter by `workspace_id`.

- [ ] **Step 2: Write failing tests**

Update `certificate.service.test.ts` to test workspace-scoped methods:

```ts
import { describe, expect, it, vi } from 'vitest'
import { CertificateService } from './certificate.service'

describe('CertificateService', () => {
  it('listForWorkspace returns certificates filtered by workspace', async () => {
    const rows = [
      { id: 'c1', workspaceId: 'ws_1', type: 'trainerhub', status: 'issued' },
    ]
    const repository = { findByWorkspace: vi.fn().mockResolvedValue(rows) }
    const service = new CertificateService({ repository: repository as any })

    const result = await service.listForWorkspace('ws_1')

    expect(repository.findByWorkspace).toHaveBeenCalledWith('ws_1')
    expect(result).toEqual(rows)
  })
})
```

Adapt method names to match actual existing service surface (might be `getByPeserta`, `listForUser`, etc.).

- [ ] **Step 3: Run tests, verify failure**

- [ ] **Step 4: Update repository and service**

Repository: add `findByWorkspace(workspaceId)`. Update any other read method to also accept workspace context for ownership checks.

Service: surface methods like `listForWorkspace(workspaceId)`. Preserve any non-workspace-related methods (e.g. admin queries by certificateNumber) untouched.

- [ ] **Step 5: Run tests, verify pass**

- [ ] **Step 6: Commit**

```bash
git add apps/backend-hono/src/certificates/
git commit -m "feat(certificates): scope service and repository to workspace"
```

---

## Task 5: Update `certificate.routes.ts` to apply `requireWorkspace`

**Files:**
- Modify: `apps/backend-hono/src/certificates/certificate.routes.ts`
- Modify: `apps/backend-hono/src/certificates/certificate.routes.test.ts`

Same pattern as todos routes (Task 3). Apply `requireWorkspace` middleware to peserta-facing endpoints. Admin endpoints (if any are in the same router) keep their existing auth, no workspace requirement.

- [ ] **Step 1: Read existing routes**

Identify which routes are peserta-facing (need workspace) vs admin-facing (no workspace).

- [ ] **Step 2: Apply requireWorkspace to peserta routes**

Pattern: `createCertificateRoutes({ certificateService, workspaceService })`. Apply `workspaceGuard = requireWorkspace(workspaceService)` to peserta routes only.

- [ ] **Step 3: Update tests**

Adapt tests to mock `workspaceService.findByUserAndSlug` and provide `X-Workspace-Slug` header for peserta-route tests.

- [ ] **Step 4: Typecheck + tests**

```bash
cd apps/backend-hono
bun run typecheck
bun run test
```

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/certificates/
git commit -m "feat(certificates): apply requireWorkspace to peserta routes"
```

---

## Task 6: Wire workspace service into todos and certificate route registrations

**Files:**
- Modify: `apps/backend-hono/src/app.ts`

The route factories now take options. `app.ts` needs to pass `workspaceService` (or rely on default). If both `createTodosRoutes` and `createCertificateRoutes` accept default `new WorkspaceService()` like dokumen does, no change is needed beyond confirming.

- [ ] **Step 1: Inspect app.ts**

Find the `createTodosRoutes()` and `createCertificateRoutes()` calls. If they're called with no args and the factories default `workspaceService` internally, leave alone.

If the factory signature changed and now requires explicit `workspaceService`, update the calls:

```ts
const workspaceService = new WorkspaceService()
app.route('/api', createTodosRoutes({ todosService: new TodosService(), workspaceService }))
app.route('/', createTodosRoutes({ todosService: new TodosService(), workspaceService }))
app.route('/api', createCertificateRoutes({ certificateService: new CertificateService(), workspaceService }))
app.route('/', createCertificateRoutes({ certificateService: new CertificateService(), workspaceService }))
```

Reuse the existing `workspaceService` instance Phase 1 Task 7 created.

- [ ] **Step 2: Run typecheck and tests**

- [ ] **Step 3: Commit (only if changes were needed)**

```bash
git add apps/backend-hono/src/app.ts
git commit -m "feat(workspace): wire workspaceService to todos and certificates route factories"
```

If no changes were needed, skip this commit.

---

## Task 7: Frontend — `useSertifikat` (or equivalent) workspace-aware

**Files:**
- Modify: existing sertifikat hook (find in `apps/frontend/src/views/sertifikat/...` or `hooks/`).

If a `useSertifikat` hook exists, key its react-query keys by workspace slug. Same pattern as Phase 2a Task 5 for `useDokumen`.

- [ ] **Step 1: Locate the sertifikat hook**

Search:

```bash
grep -rln "useQuery" apps/frontend/src/views/sertifikat apps/frontend/src/hooks 2>/dev/null
```

If no dedicated hook, check `Sertifikat.tsx` for inline `useQuery` calls.

- [ ] **Step 2: Make it workspace-aware**

Following the `useDokumen` pattern from Phase 2a:

```ts
import { useOptionalWorkspace } from 'src/context/WorkspaceContext'
import api from 'src/api/workspace-axios'

const ws = useOptionalWorkspace()
const slug = ws?.slug ?? null
const query = useQuery({
  queryKey: ['sertifikat', slug],
  queryFn: async () => (await api.get('/sertifikat')).data, // adapt to existing endpoint
  enabled: !!ws,
})
```

- [ ] **Step 3: Verify frontend build**

```bash
cd apps/frontend
bun run build:check
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/
git commit -m "feat(sertifikat): make useSertifikat hook workspace-aware"
```

---

## Task 8: Frontend route — `/:slug/sertifikat`

**Files:**
- Modify: `apps/frontend/src/routes/protectedRouteChildren.tsx`

- [ ] **Step 1: Update route entries**

In `protectedRouteChildren.tsx`:
- Remove the `/user/sertifikat` entry.
- In the `/:slug` route's `children` array, add `{ path: 'sertifikat', element: <Sertifikat /> }` (Sertifikat lazy import already exists).

```tsx
{
  path: '/:slug',
  element: (
    <UserRoute>
      <WorkspaceRouteWrapper />
    </UserRoute>
  ),
  children: [
    { index: true, element: <WorkspaceDashboard /> },
    { path: 'dokumen', element: <Dokumen /> },
    { path: 'sertifikat', element: <Sertifikat /> },
  ],
},
```

- [ ] **Step 2: Verify build:check**

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/routes/protectedRouteChildren.tsx
git commit -m "feat(workspace): move /sertifikat under /:slug/sertifikat"
```

---

## Task 9: Seed sample todo + sertifikat for verification

**Files:**
- Modify: `apps/backend-hono/scripts/seed-workspace.ts`

Append idempotent seeding of 1-2 sample todos and 1 sertifikat tied to the seeded workspace.

- [ ] **Step 1: Add to seed script**

After the dokumen seed block (added in Phase 2a Task 8), append:

```ts
// 11. Seed sample todos (idempotent by key + workspace)
const todoDefinitions = [
  { key: 'upload-ktp', title: 'Upload KTP', category: 'Pra-Training' as const, isBlocking: true },
  { key: 'lengkapi-profil', title: 'Lengkapi profil peserta', category: 'Pra-Training' as const, isBlocking: false },
]
for (const def of todoDefinitions) {
  const [existing] = await db
    .select()
    .from(todos)
    .where(and(eq(todos.workspaceId, workspaceId), eq(todos.key, def.key)))
    .limit(1)
  if (!existing) {
    await db.insert(todos).values({
      workspaceId,
      userId,
      key: def.key,
      title: def.title,
      category: def.category,
      status: 'todo',
      isBlocking: def.isBlocking,
    })
  }
}

// 12. Seed sertifikat (idempotent by workspace + type)
const [existingCert] = await db
  .select()
  .from(sertifikat)
  .where(and(eq(sertifikat.workspaceId, workspaceId), eq(sertifikat.type, 'trainerhub')))
  .limit(1)
if (!existingCert) {
  await db.insert(sertifikat).values({
    pesertaId: pesertaRow.id,
    workspaceId,
    courseId: courseRow.id,
    type: 'trainerhub',
    status: 'not_submitted',
    pesertaName: pesertaRow.nama,
    courseName: courseRow.title,
  })
}

console.log('[seed-workspace] todos and sertifikat seeded')
```

`workspaceId` here is the variable holding the seeded workspace's id from earlier in the script. Update imports to include `todos` and `sertifikat`.

- [ ] **Step 2: Run seed and verify idempotency**

```bash
cd apps/backend-hono
bun run scripts/seed-workspace.ts
bun run scripts/seed-workspace.ts  # second run, must not error
```

- [ ] **Step 3: Verify DB**

```bash
psql $DATABASE_URL -c "SELECT count(*) FROM todos;"
psql $DATABASE_URL -c "SELECT count(*) FROM sertifikat;"
```

Both >= the expected counts (2 todos, 1 sertifikat).

- [ ] **Step 4: Commit**

```bash
git add apps/backend-hono/scripts/seed-workspace.ts
git commit -m "chore(workspace): seed sample todos and sertifikat for workspace"
```

---

## Task 10: E2E smoke

**Files:** none (verification only)

- [ ] **Step 1: Backend tests + typecheck**

```bash
cd apps/backend-hono
bun run typecheck
bun run test
```

Expected: 0 typecheck errors. Tests pass except 3 pre-existing bun:test failures (or 2 if Task 3 converted todos.routes.test.ts).

- [ ] **Step 2: Frontend build:check**

```bash
cd ../frontend
bun run build:check
```

- [ ] **Step 3: Programmatic smoke**

Start backend, hit endpoints, expect 401 without auth:

```bash
cd ../backend-hono
bun run dev > /tmp/backend.log 2>&1 &
echo $! > /tmp/backend.pid
sleep 5

curl -s -o /dev/null -w "todos:%{http_code}\n" -H "X-Workspace-Slug: b1-trainers" http://localhost:3001/api/todos
curl -s -o /dev/null -w "sertifikat:%{http_code}\n" -H "X-Workspace-Slug: b1-trainers" http://localhost:3001/api/sertifikat

kill "$(cat /tmp/backend.pid)" || true
rm -f /tmp/backend.pid /tmp/backend.log
```

Expected: both 401 (auth required, route reachable).

- [ ] **Step 4: DB sanity**

```bash
psql $DATABASE_URL -c "SELECT slug FROM workspaces;"
psql $DATABASE_URL -c "SELECT count(*) AS todos_count FROM todos;"
psql $DATABASE_URL -c "SELECT count(*) AS sertifikat_count FROM sertifikat;"
```

- [ ] **Step 5: No commit. Report findings.**

---

## Self-Review

**Spec coverage:**
- Section 3.3 — `workspace_id` NOT NULL on `todos` and `sertifikat`: Task 1.
- Module-level scoping (todos, sertifikat): Tasks 2-5.
- Frontend route migration: Task 8.
- Frontend hook workspace keying: Task 7.
- Backend wiring: Task 6.
- Seed coverage: Task 9.

**Out of scope:**
- Kelas / course progress / tugas / AI tables → Phase 2c.
- Admin awareness for these queries → Phase 4.

**Type consistency:**
- `Todo` and `Sertifikat` types remain Drizzle-inferred (just gained a `workspaceId` field).
- Service signatures consistent with Phase 2a pattern (`workspaceId` first arg or named param).
- Routes use `requireWorkspace(workspaceService)` middleware as established in Phase 2a.

**Known limitations:**
- Removing `/user/sertifikat` is a breaking change. Acceptable for alpha.
- Removing `todos.batch_id` is a breaking change. Alpha = TRUNCATE acceptable.
- If `todos.routes.test.ts` was kept on bun:test (option B in Task 3), the file remains a pre-existing failure — same as before this phase.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-18-workspace-phase-2b-todos-sertifikat.md`. Same execution choices as Phase 2a:

1. **Subagent-Driven** — fresh subagent per task.
2. **Inline Execution** — manual task-by-task.

Recommend Subagent-Driven (consistent with Phase 1 & 2a flow).
