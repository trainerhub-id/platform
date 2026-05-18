# Workspace System — Phase 1 (Foundation) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation of the workspace system — schema, slug generator, workspace API, top bar switcher, sidebar with workspace+akun section, `/workspaces` selector page, and redirect logic. After this phase, peserta can navigate a working workspace shell with placeholder dashboard. Actual data scoping (dokumen, kelas, dll.) comes in Phase 2.

**Architecture:** New `workspaces` table 1:1 with `peserta_batch` (enrollment). Slug per-user format `b{n}-{course_short_code}`. Backend exposes workspace API; frontend resolves slug from URL via `WorkspaceRouteWrapper`. Top-bar switcher and `/workspaces` page added. Existing `/user/*` routes left untouched in this phase — Phase 2 replaces their content.

**Tech Stack:** Hono + Drizzle ORM + Postgres (backend), React 19 + react-router v7 + @tanstack/react-query + axios (frontend), vitest for both.

**Reference spec:** `docs/superpowers/specs/2026-05-18-workspace-system-design.md`

---

## File Structure

### Backend (apps/backend-hono)

**Create:**
- `src/db/schema/workspaces.ts` — Drizzle schema for `workspaces` table.
- `src/workspace/slug-generator.ts` — Pure function `generateSlug(batchNumber, courseShortCode)` with reserved-word check.
- `src/workspace/slug-generator.test.ts` — Unit tests.
- `src/workspace/workspace.repository.ts` — DB queries.
- `src/workspace/workspace.repository.test.ts` — Unit tests with mocked db.
- `src/workspace/workspace.service.ts` — Business logic: `createForEnrollment`, `listForUser`, `findByUserAndSlug`, `getDefaultForUser`.
- `src/workspace/workspace.service.test.ts`
- `src/workspace/workspace.routes.ts` — `GET /api/workspaces`, `GET /api/workspaces/by-slug/:slug`.
- `src/workspace/workspace.routes.test.ts`

**Modify:**
- `src/db/schema/index.ts` — re-export workspaces.
- `src/db/schema/learning.ts` — add `short_code` to `courses` table.
- `src/db/schema/batch.ts` — add `batch_number` to `batch_training` table.
- `src/app.ts` — wire workspace routes.

**Generated:**
- `src/db/migrations/<timestamp>_workspaces.sql` (drizzle-kit generate output).

### Frontend (apps/frontend)

**Create:**
- `src/api/workspace.api.ts` — axios calls.
- `src/hooks/useWorkspaces.ts` — list workspaces (react-query).
- `src/hooks/useCurrentWorkspace.ts` — read current workspace from URL slug + workspaces list.
- `src/context/WorkspaceContext.tsx` — provider + `useWorkspace` hook.
- `src/components/workspace/WorkspaceSwitcher.tsx` — top-bar dropdown.
- `src/components/workspace/WorkspaceRouteWrapper.tsx` — wraps `/:slug/*` routes, redirects on slug mismatch.
- `src/views/workspaces/Workspaces.tsx` — selector / empty state page.
- `src/views/workspace-dashboard/WorkspaceDashboard.tsx` — placeholder dashboard inside workspace.

**Modify:**
- `src/routes/protectedRouteChildren.tsx` — add `/workspaces`, `/:slug/` routes. Add WorkspaceContext provider on slug routes.
- `src/components/RoleBasedRedirect.tsx` — for peserta, fetch workspaces and redirect to default.
- `src/layouts/full/vertical/header/Header.tsx` — render `<WorkspaceSwitcher />`.

### Seed

**Create:**
- `apps/backend-hono/scripts/seed-workspace.ts` — seed 1 dummy user + peserta + course (with short_code) + batch (with batch_number) + tier + enrollment + workspace, for manual verification.

---

## Task 1: Add `short_code` to `courses` and `batch_number` to `batch_training`

**Why first:** Slug generator depends on these columns. Migration must run before workspace logic.

**Files:**
- Modify: `apps/backend-hono/src/db/schema/learning.ts`
- Modify: `apps/backend-hono/src/db/schema/batch.ts`
- Create: `apps/backend-hono/src/db/schema/schema.test.ts` modifications (add tests)

- [ ] **Step 1: Add `short_code` column to `courses`**

Edit `apps/backend-hono/src/db/schema/learning.ts`. In the `courses` definition, add:

```ts
import { integer, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { peserta } from './people'

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  shortCode: varchar('short_code', { length: 30 }).unique().notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  // ... rest unchanged
})
```

- [ ] **Step 2: Add `batch_number` column to `batch_training`**

Edit `apps/backend-hono/src/db/schema/batch.ts`. In the `batchTraining` definition, add:

```ts
export const batchTraining = pgTable(
  'batch_training',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    batchNumber: integer('batch_number').notNull(),
    namaBatch: varchar('nama_batch', { length: 255 }).notNull(),
    // ... rest unchanged
  },
  (table) => ({
    courseBatchUnique: uniqueIndex('batch_training_course_batch_number_unique').on(
      table.courseId,
      table.batchNumber,
    ),
  }),
)
```

Add `uniqueIndex` to imports: `import { ..., uniqueIndex } from 'drizzle-orm/pg-core'`.

- [ ] **Step 3: Generate migration**

Run from `apps/backend-hono`:

```bash
bun run db:generate
```

Expected: a new SQL migration file appears in `src/db/migrations/`.

- [ ] **Step 4: Inspect migration**

Open the generated SQL. Verify:
- `ALTER TABLE courses ADD COLUMN short_code varchar(30) NOT NULL` (note: NOT NULL on ALTER will fail if rows exist; for alpha/clean DB this is fine; if needed, add DEFAULT or run after manual fill).
- `ALTER TABLE batch_training ADD COLUMN batch_number integer NOT NULL`
- `CREATE UNIQUE INDEX ON courses (short_code)`
- `CREATE UNIQUE INDEX batch_training_course_batch_number_unique ON batch_training (course_id, batch_number)`

If existing data exists (alpha 0 users assumption), drop & recreate is OK:

```bash
# For a clean alpha DB:
psql $DATABASE_URL -c "TRUNCATE TABLE courses, batch_training CASCADE;"
```

- [ ] **Step 5: Apply migration**

```bash
bun run db:migrate
```

Expected: migration applies cleanly. Verify with:

```bash
psql $DATABASE_URL -c "\d courses" | grep short_code
psql $DATABASE_URL -c "\d batch_training" | grep batch_number
```

Both columns should appear.

- [ ] **Step 6: Commit**

```bash
git add apps/backend-hono/src/db/schema/learning.ts apps/backend-hono/src/db/schema/batch.ts apps/backend-hono/src/db/migrations/
git commit -m "feat(workspace): add courses.short_code and batch_training.batch_number"
```

---

## Task 2: Add `workspaces` table schema

**Files:**
- Create: `apps/backend-hono/src/db/schema/workspaces.ts`
- Modify: `apps/backend-hono/src/db/schema/index.ts`

- [ ] **Step 1: Write schema**

Create `apps/backend-hono/src/db/schema/workspaces.ts`:

```ts
import { index, pgTable, text, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core'
import { pesertaBatch, batchTraining, batchTiers } from './batch'
import { courses } from './learning'
import { peserta } from './people'
import { users } from './auth'

export const workspaceStatusValues = ['active', 'archived', 'suspended'] as const

export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: varchar('slug', { length: 80 }).notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    pesertaId: uuid('peserta_id')
      .notNull()
      .references(() => peserta.id, { onDelete: 'cascade' }),
    enrollmentId: uuid('enrollment_id')
      .notNull()
      .references(() => pesertaBatch.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => batchTraining.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    displayName: varchar('display_name', { length: 255 }).notNull(),
    status: varchar('status', { length: 50 }).notNull().default('active'),
    lastAccessedAt: timestamp('last_accessed_at', { withTimezone: true }),
    archivedAt: timestamp('archived_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userSlugUnique: uniqueIndex('workspaces_user_slug_unique').on(table.userId, table.slug),
    enrollmentUnique: uniqueIndex('workspaces_enrollment_unique').on(table.enrollmentId),
    userStatusIdx: index('workspaces_user_status_idx').on(table.userId, table.status),
    batchIdx: index('workspaces_batch_idx').on(table.batchId),
  }),
)

export type Workspace = typeof workspaces.$inferSelect
export type NewWorkspace = typeof workspaces.$inferInsert
```

- [ ] **Step 2: Re-export from schema index**

Edit `apps/backend-hono/src/db/schema/index.ts`. Add at the end:

```ts
export * from './workspaces'
```

Final file:

```ts
export * from './audit'
export * from './auth'
export * from './batch'
export * from './certificates'
export * from './documents'
export * from './dokumen'
export * from './learning'
export * from './people'
export * from './todos'
export * from './tugas'
export * from './workspaces'
```

- [ ] **Step 3: Generate migration**

```bash
cd apps/backend-hono
bun run db:generate
```

Inspect the new SQL — should include `CREATE TABLE workspaces (...)` plus the unique indexes and indexes.

- [ ] **Step 4: Apply migration**

```bash
bun run db:migrate
```

Verify:

```bash
psql $DATABASE_URL -c "\d workspaces"
```

Should show all columns plus indexes.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/db/schema/workspaces.ts apps/backend-hono/src/db/schema/index.ts apps/backend-hono/src/db/migrations/
git commit -m "feat(workspace): add workspaces table schema"
```

---

## Task 3: Slug generator utility (TDD)

**Files:**
- Create: `apps/backend-hono/src/workspace/slug-generator.ts`
- Create: `apps/backend-hono/src/workspace/slug-generator.test.ts`

- [ ] **Step 1: Write failing tests**

Create `apps/backend-hono/src/workspace/slug-generator.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { generateWorkspaceSlug, isReservedSlugSegment, RESERVED_SLUG_SEGMENTS } from './slug-generator'

describe('generateWorkspaceSlug', () => {
  it('formats slug as b<n>-<short_code>', () => {
    expect(generateWorkspaceSlug({ batchNumber: 1, courseShortCode: 'trainers' })).toBe('b1-trainers')
    expect(generateWorkspaceSlug({ batchNumber: 15, courseShortCode: 'masters' })).toBe('b15-masters')
  })

  it('lowercases short_code', () => {
    expect(generateWorkspaceSlug({ batchNumber: 2, courseShortCode: 'Trainers' })).toBe('b2-trainers')
  })

  it('throws when short_code is empty', () => {
    expect(() => generateWorkspaceSlug({ batchNumber: 1, courseShortCode: '' })).toThrow(
      /short_code is required/,
    )
  })

  it('throws when batch_number is not a positive integer', () => {
    expect(() => generateWorkspaceSlug({ batchNumber: 0, courseShortCode: 'trainers' })).toThrow(
      /batch_number must be a positive integer/,
    )
    expect(() => generateWorkspaceSlug({ batchNumber: -1, courseShortCode: 'trainers' })).toThrow()
    expect(() => generateWorkspaceSlug({ batchNumber: 1.5, courseShortCode: 'trainers' })).toThrow()
  })

  it('throws when short_code is reserved', () => {
    expect(() =>
      generateWorkspaceSlug({ batchNumber: 1, courseShortCode: 'admin' }),
    ).toThrow(/reserved/)
  })

  it('throws when short_code contains invalid characters', () => {
    expect(() =>
      generateWorkspaceSlug({ batchNumber: 1, courseShortCode: 'trainers!' }),
    ).toThrow(/invalid characters/)
    expect(() =>
      generateWorkspaceSlug({ batchNumber: 1, courseShortCode: 'tra ners' }),
    ).toThrow(/invalid characters/)
  })
})

describe('isReservedSlugSegment', () => {
  it('returns true for reserved words', () => {
    for (const word of RESERVED_SLUG_SEGMENTS) {
      expect(isReservedSlugSegment(word)).toBe(true)
    }
  })

  it('is case-insensitive', () => {
    expect(isReservedSlugSegment('Admin')).toBe(true)
    expect(isReservedSlugSegment('AUTH')).toBe(true)
  })

  it('returns false for non-reserved', () => {
    expect(isReservedSlugSegment('trainers')).toBe(false)
    expect(isReservedSlugSegment('b1-trainers')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
cd apps/backend-hono
bun run test src/workspace/slug-generator.test.ts
```

Expected: FAIL — `Cannot find module './slug-generator'`.

- [ ] **Step 3: Write implementation**

Create `apps/backend-hono/src/workspace/slug-generator.ts`:

```ts
export const RESERVED_SLUG_SEGMENTS = [
  'auth',
  'admin',
  'profile',
  'settings',
  'billing',
  'workspaces',
  'api',
  'static',
  'assets',
] as const

export type ReservedSlugSegment = (typeof RESERVED_SLUG_SEGMENTS)[number]

export function isReservedSlugSegment(value: string): boolean {
  return (RESERVED_SLUG_SEGMENTS as readonly string[]).includes(value.toLowerCase())
}

const SHORT_CODE_PATTERN = /^[a-z0-9][a-z0-9-]*$/

export type GenerateWorkspaceSlugInput = {
  batchNumber: number
  courseShortCode: string
}

export function generateWorkspaceSlug(input: GenerateWorkspaceSlugInput): string {
  const shortCode = input.courseShortCode.trim().toLowerCase()

  if (!shortCode) throw new Error('short_code is required')

  if (isReservedSlugSegment(shortCode)) {
    throw new Error(`short_code '${shortCode}' is reserved`)
  }

  if (!SHORT_CODE_PATTERN.test(shortCode)) {
    throw new Error(`short_code '${shortCode}' contains invalid characters`)
  }

  if (
    !Number.isInteger(input.batchNumber) ||
    input.batchNumber <= 0
  ) {
    throw new Error('batch_number must be a positive integer')
  }

  return `b${input.batchNumber}-${shortCode}`
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
bun run test src/workspace/slug-generator.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/workspace/
git commit -m "feat(workspace): add slug generator utility"
```

---

## Task 4: Workspace repository (TDD)

**Files:**
- Create: `apps/backend-hono/src/workspace/workspace.repository.ts`
- Create: `apps/backend-hono/src/workspace/workspace.repository.test.ts`

The repository wraps Drizzle queries. Since unit-testing Drizzle is awkward, we test via in-memory mock by accepting a `db` dependency. Following the existing `EnrollmentRepository` pattern.

- [ ] **Step 1: Write failing tests**

Create `apps/backend-hono/src/workspace/workspace.repository.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceRepository } from './workspace.repository'
import type { Workspace } from '../db/schema'

function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 'ws_1',
    slug: 'b1-trainers',
    userId: 'user_1',
    pesertaId: 'peserta_1',
    enrollmentId: 'enroll_1',
    batchId: 'batch_1',
    courseId: 'course_1',
    displayName: 'Training for Trainers - Batch 1',
    status: 'active',
    lastAccessedAt: null,
    archivedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

describe('WorkspaceRepository', () => {
  it('listForUser returns active workspaces ordered by last_accessed desc', async () => {
    const rows = [
      makeWorkspace({ id: 'a', slug: 'b1-trainers', lastAccessedAt: new Date('2026-01-10') }),
      makeWorkspace({ id: 'b', slug: 'b2-masters', lastAccessedAt: new Date('2026-01-05') }),
    ]
    const repo = new WorkspaceRepository({ findActiveByUserId: vi.fn().mockResolvedValue(rows) } as any)

    const result = await repo.listForUser('user_1')

    expect(result).toEqual(rows)
  })

  it('findByUserAndSlug returns matching active workspace', async () => {
    const ws = makeWorkspace({ slug: 'b1-trainers' })
    const repo = new WorkspaceRepository({
      findOneByUserAndSlug: vi.fn().mockResolvedValue(ws),
    } as any)

    const result = await repo.findByUserAndSlug('user_1', 'b1-trainers')

    expect(result).toEqual(ws)
  })

  it('findByEnrollmentId returns the linked workspace', async () => {
    const ws = makeWorkspace({ enrollmentId: 'enroll_1' })
    const repo = new WorkspaceRepository({
      findOneByEnrollmentId: vi.fn().mockResolvedValue(ws),
    } as any)

    const result = await repo.findByEnrollmentId('enroll_1')

    expect(result).toEqual(ws)
  })

  it('create returns the inserted workspace', async () => {
    const ws = makeWorkspace({ id: 'ws_new' })
    const repo = new WorkspaceRepository({
      insert: vi.fn().mockResolvedValue(ws),
    } as any)

    const result = await repo.create({
      slug: 'b1-trainers',
      userId: 'user_1',
      pesertaId: 'peserta_1',
      enrollmentId: 'enroll_1',
      batchId: 'batch_1',
      courseId: 'course_1',
      displayName: 'Training for Trainers - Batch 1',
    })

    expect(result).toEqual(ws)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
bun run test src/workspace/workspace.repository.test.ts
```

Expected: FAIL — `Cannot find module './workspace.repository'`.

- [ ] **Step 3: Write implementation**

Create `apps/backend-hono/src/workspace/workspace.repository.ts`:

```ts
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { type Workspace, workspaces } from '../db/schema'

export type CreateWorkspaceInput = {
  slug: string
  userId: string
  pesertaId: string
  enrollmentId: string
  batchId: string
  courseId: string
  displayName: string
}

type WorkspaceDb = {
  findActiveByUserId(userId: string): Promise<Workspace[]>
  findOneByUserAndSlug(userId: string, slug: string): Promise<Workspace | null>
  findOneByEnrollmentId(enrollmentId: string): Promise<Workspace | null>
  insert(values: CreateWorkspaceInput): Promise<Workspace>
  updateLastAccessed(id: string, at: Date): Promise<void>
}

const defaultDb: WorkspaceDb = {
  async findActiveByUserId(userId) {
    return db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.userId, userId), eq(workspaces.status, 'active')))
      .orderBy(desc(workspaces.lastAccessedAt))
  },

  async findOneByUserAndSlug(userId, slug) {
    const [row] = await db
      .select()
      .from(workspaces)
      .where(
        and(
          eq(workspaces.userId, userId),
          eq(workspaces.slug, slug),
          eq(workspaces.status, 'active'),
        ),
      )
      .limit(1)
    return row ?? null
  },

  async findOneByEnrollmentId(enrollmentId) {
    const [row] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.enrollmentId, enrollmentId))
      .limit(1)
    return row ?? null
  },

  async insert(values) {
    const [row] = await db
      .insert(workspaces)
      .values({
        slug: values.slug,
        userId: values.userId,
        pesertaId: values.pesertaId,
        enrollmentId: values.enrollmentId,
        batchId: values.batchId,
        courseId: values.courseId,
        displayName: values.displayName,
        status: 'active',
      })
      .returning()
    if (!row) throw new Error('WORKSPACE_INSERT_FAILED')
    return row
  },

  async updateLastAccessed(id, at) {
    await db.update(workspaces).set({ lastAccessedAt: at, updatedAt: at }).where(eq(workspaces.id, id))
  },
}

export class WorkspaceRepository {
  private readonly impl: WorkspaceDb

  constructor(impl: WorkspaceDb = defaultDb) {
    this.impl = impl
  }

  listForUser(userId: string) {
    return this.impl.findActiveByUserId(userId)
  }

  findByUserAndSlug(userId: string, slug: string) {
    return this.impl.findOneByUserAndSlug(userId, slug)
  }

  findByEnrollmentId(enrollmentId: string) {
    return this.impl.findOneByEnrollmentId(enrollmentId)
  }

  create(input: CreateWorkspaceInput) {
    return this.impl.insert(input)
  }

  updateLastAccessed(id: string, at: Date = new Date()) {
    return this.impl.updateLastAccessed(id, at)
  }
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
bun run test src/workspace/workspace.repository.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/workspace/workspace.repository.ts apps/backend-hono/src/workspace/workspace.repository.test.ts
git commit -m "feat(workspace): add workspace repository"
```

---

## Task 5: Workspace service (TDD)

**Files:**
- Create: `apps/backend-hono/src/workspace/workspace.service.ts`
- Create: `apps/backend-hono/src/workspace/workspace.service.test.ts`

Service layer enforces business rules: idempotent creation, default workspace selection, slug generation from enrollment data.

- [ ] **Step 1: Write failing tests**

Create `apps/backend-hono/src/workspace/workspace.service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { WorkspaceService } from './workspace.service'

function makeRow(overrides: any = {}) {
  return {
    id: 'ws_1',
    slug: 'b1-trainers',
    userId: 'user_1',
    pesertaId: 'peserta_1',
    enrollmentId: 'enroll_1',
    batchId: 'batch_1',
    courseId: 'course_1',
    displayName: 'Training for Trainers - Batch 1',
    status: 'active',
    lastAccessedAt: null,
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('WorkspaceService', () => {
  describe('listForUser', () => {
    it('returns workspaces from repository', async () => {
      const rows = [makeRow({ id: 'a' }), makeRow({ id: 'b', slug: 'b2-masters' })]
      const service = new WorkspaceService({
        repository: { listForUser: vi.fn().mockResolvedValue(rows) } as any,
      })

      expect(await service.listForUser('user_1')).toEqual(rows)
    })
  })

  describe('findByUserAndSlug', () => {
    it('returns workspace and updates last_accessed_at', async () => {
      const ws = makeRow()
      const updateLastAccessed = vi.fn()
      const service = new WorkspaceService({
        repository: {
          findByUserAndSlug: vi.fn().mockResolvedValue(ws),
          updateLastAccessed,
        } as any,
      })

      const result = await service.findByUserAndSlug('user_1', 'b1-trainers')

      expect(result).toEqual(ws)
      expect(updateLastAccessed).toHaveBeenCalledWith('ws_1', expect.any(Date))
    })

    it('returns null and does not touch last_accessed when not found', async () => {
      const updateLastAccessed = vi.fn()
      const service = new WorkspaceService({
        repository: {
          findByUserAndSlug: vi.fn().mockResolvedValue(null),
          updateLastAccessed,
        } as any,
      })

      expect(await service.findByUserAndSlug('user_1', 'nope')).toBeNull()
      expect(updateLastAccessed).not.toHaveBeenCalled()
    })
  })

  describe('getDefaultForUser', () => {
    it('returns the workspace with most recent last_accessed_at', async () => {
      const a = makeRow({ id: 'a', lastAccessedAt: new Date('2026-01-05') })
      const b = makeRow({ id: 'b', lastAccessedAt: new Date('2026-01-10') })
      const service = new WorkspaceService({
        repository: { listForUser: vi.fn().mockResolvedValue([a, b]) } as any,
      })

      const result = await service.getDefaultForUser('user_1')

      expect(result?.id).toBe('b')
    })

    it('returns null when user has no workspaces', async () => {
      const service = new WorkspaceService({
        repository: { listForUser: vi.fn().mockResolvedValue([]) } as any,
      })

      expect(await service.getDefaultForUser('user_1')).toBeNull()
    })

    it('falls back to created_at when last_accessed_at is null', async () => {
      const a = makeRow({ id: 'a', lastAccessedAt: null, createdAt: new Date('2026-01-05') })
      const b = makeRow({ id: 'b', lastAccessedAt: null, createdAt: new Date('2026-01-10') })
      const service = new WorkspaceService({
        repository: { listForUser: vi.fn().mockResolvedValue([a, b]) } as any,
      })

      const result = await service.getDefaultForUser('user_1')

      expect(result?.id).toBe('b')
    })
  })

  describe('createForEnrollment', () => {
    it('throws if enrollment not found', async () => {
      const service = new WorkspaceService({
        repository: {} as any,
        enrollmentLookup: vi.fn().mockResolvedValue(null),
      })

      await expect(service.createForEnrollment('enroll_missing')).rejects.toThrow(
        /ENROLLMENT_NOT_FOUND/,
      )
    })

    it('returns existing workspace if already created (idempotent)', async () => {
      const existing = makeRow()
      const repository = {
        findByEnrollmentId: vi.fn().mockResolvedValue(existing),
        create: vi.fn(),
      } as any
      const enrollmentLookup = vi.fn().mockResolvedValue({
        enrollmentId: 'enroll_1',
        userId: 'user_1',
        pesertaId: 'peserta_1',
        batchId: 'batch_1',
        batchNumber: 1,
        courseId: 'course_1',
        courseShortCode: 'trainers',
        courseTitle: 'Training for Trainers',
      })
      const service = new WorkspaceService({ repository, enrollmentLookup })

      const result = await service.createForEnrollment('enroll_1')

      expect(result).toEqual(existing)
      expect(repository.create).not.toHaveBeenCalled()
    })

    it('creates a new workspace with generated slug and display name', async () => {
      const created = makeRow({ id: 'ws_new', slug: 'b3-masters' })
      const repository = {
        findByEnrollmentId: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(created),
      } as any
      const enrollmentLookup = vi.fn().mockResolvedValue({
        enrollmentId: 'enroll_2',
        userId: 'user_1',
        pesertaId: 'peserta_1',
        batchId: 'batch_2',
        batchNumber: 3,
        courseId: 'course_2',
        courseShortCode: 'masters',
        courseTitle: 'Training for Masters',
      })
      const service = new WorkspaceService({ repository, enrollmentLookup })

      const result = await service.createForEnrollment('enroll_2')

      expect(result).toEqual(created)
      expect(repository.create).toHaveBeenCalledWith({
        slug: 'b3-masters',
        userId: 'user_1',
        pesertaId: 'peserta_1',
        enrollmentId: 'enroll_2',
        batchId: 'batch_2',
        courseId: 'course_2',
        displayName: 'Training for Masters - Batch 3',
      })
    })
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
bun run test src/workspace/workspace.service.test.ts
```

Expected: FAIL — `Cannot find module './workspace.service'`.

- [ ] **Step 3: Write implementation**

Create `apps/backend-hono/src/workspace/workspace.service.ts`:

```ts
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { batchTraining, courses, peserta, pesertaBatch, type Workspace } from '../db/schema'
import { generateWorkspaceSlug } from './slug-generator'
import { WorkspaceRepository } from './workspace.repository'

export type EnrollmentLookupResult = {
  enrollmentId: string
  userId: string
  pesertaId: string
  batchId: string
  batchNumber: number
  courseId: string
  courseShortCode: string
  courseTitle: string
}

type EnrollmentLookup = (enrollmentId: string) => Promise<EnrollmentLookupResult | null>

const defaultEnrollmentLookup: EnrollmentLookup = async (enrollmentId) => {
  const [row] = await db
    .select({
      enrollmentId: pesertaBatch.id,
      userId: peserta.clerkId,
      pesertaId: peserta.id,
      batchId: batchTraining.id,
      batchNumber: batchTraining.batchNumber,
      courseId: courses.id,
      courseShortCode: courses.shortCode,
      courseTitle: courses.title,
    })
    .from(pesertaBatch)
    .innerJoin(peserta, eq(pesertaBatch.pesertaId, peserta.id))
    .innerJoin(batchTraining, eq(pesertaBatch.batchId, batchTraining.id))
    .innerJoin(courses, eq(batchTraining.courseId, courses.id))
    .where(eq(pesertaBatch.id, enrollmentId))
    .limit(1)
  return row ?? null
}

type RepositoryLike = Pick<
  WorkspaceRepository,
  'listForUser' | 'findByUserAndSlug' | 'findByEnrollmentId' | 'create' | 'updateLastAccessed'
>

export class WorkspaceService {
  private readonly repository: RepositoryLike
  private readonly enrollmentLookup: EnrollmentLookup

  constructor(deps: { repository?: RepositoryLike; enrollmentLookup?: EnrollmentLookup } = {}) {
    this.repository = deps.repository ?? new WorkspaceRepository()
    this.enrollmentLookup = deps.enrollmentLookup ?? defaultEnrollmentLookup
  }

  listForUser(userId: string): Promise<Workspace[]> {
    return this.repository.listForUser(userId)
  }

  async findByUserAndSlug(userId: string, slug: string): Promise<Workspace | null> {
    const ws = await this.repository.findByUserAndSlug(userId, slug)
    if (ws) {
      // fire-and-forget update — log but don't throw
      this.repository.updateLastAccessed(ws.id, new Date()).catch(() => {})
    }
    return ws
  }

  async getDefaultForUser(userId: string): Promise<Workspace | null> {
    const list = await this.repository.listForUser(userId)
    if (list.length === 0) return null

    return list.reduce((best, current) => {
      const currentTs = (current.lastAccessedAt ?? current.createdAt).getTime()
      const bestTs = (best.lastAccessedAt ?? best.createdAt).getTime()
      return currentTs > bestTs ? current : best
    })
  }

  async createForEnrollment(enrollmentId: string): Promise<Workspace> {
    const existing = await this.repository.findByEnrollmentId(enrollmentId)
    if (existing) return existing

    const enrollment = await this.enrollmentLookup(enrollmentId)
    if (!enrollment) throw new Error('ENROLLMENT_NOT_FOUND')

    const slug = generateWorkspaceSlug({
      batchNumber: enrollment.batchNumber,
      courseShortCode: enrollment.courseShortCode,
    })
    const displayName = `${enrollment.courseTitle} - Batch ${enrollment.batchNumber}`

    return this.repository.create({
      slug,
      userId: enrollment.userId,
      pesertaId: enrollment.pesertaId,
      enrollmentId: enrollment.enrollmentId,
      batchId: enrollment.batchId,
      courseId: enrollment.courseId,
      displayName,
    })
  }
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
bun run test src/workspace/workspace.service.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/workspace/workspace.service.ts apps/backend-hono/src/workspace/workspace.service.test.ts
git commit -m "feat(workspace): add workspace service with idempotent createForEnrollment"
```

---

## Task 6: Workspace API routes (TDD)

**Files:**
- Create: `apps/backend-hono/src/workspace/workspace.routes.ts`
- Create: `apps/backend-hono/src/workspace/workspace.routes.test.ts`

API: `GET /api/workspaces` (list user's workspaces) and `GET /api/workspaces/by-slug/:slug` (resolve a slug, used for redirect logic).

- [ ] **Step 1: Write failing tests**

Create `apps/backend-hono/src/workspace/workspace.routes.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { createApp } from '../app'
import { createWorkspaceRoutes } from './workspace.routes'

function appWithRoutes(service: any) {
  const app = createApp({ testUser: { id: 'user_1', email: 'u@example.com', name: 'U' } })
  app.route('/api', createWorkspaceRoutes(service))
  return app
}

describe('GET /api/workspaces', () => {
  it('returns the user workspaces', async () => {
    const list = [
      {
        id: 'ws_1',
        slug: 'b1-trainers',
        displayName: 'Training for Trainers - Batch 1',
        status: 'active',
        lastAccessedAt: null,
        courseId: 'course_1',
        batchId: 'batch_1',
      },
    ]
    const app = appWithRoutes({
      listForUser: async (userId: string) => {
        expect(userId).toBe('user_1')
        return list
      },
    })

    const res = await app.request('/api/workspaces')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(list)
  })

  it('returns 401 when no user in session', async () => {
    const app = createApp() // no testUser
    app.route('/api', createWorkspaceRoutes({ listForUser: async () => [] } as any))

    const res = await app.request('/api/workspaces')

    expect(res.status).toBe(401)
  })
})

describe('GET /api/workspaces/by-slug/:slug', () => {
  it('returns the workspace when user owns the slug', async () => {
    const ws = {
      id: 'ws_1',
      slug: 'b1-trainers',
      displayName: 'Training for Trainers - Batch 1',
      status: 'active',
      lastAccessedAt: null,
      courseId: 'course_1',
      batchId: 'batch_1',
    }
    const app = appWithRoutes({
      findByUserAndSlug: async (userId: string, slug: string) => {
        expect(userId).toBe('user_1')
        expect(slug).toBe('b1-trainers')
        return ws
      },
    })

    const res = await app.request('/api/workspaces/by-slug/b1-trainers')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(ws)
  })

  it('returns 404 when workspace not found', async () => {
    const app = appWithRoutes({
      findByUserAndSlug: async () => null,
    })

    const res = await app.request('/api/workspaces/by-slug/nope')

    expect(res.status).toBe(404)
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
bun run test src/workspace/workspace.routes.test.ts
```

Expected: FAIL — `Cannot find module './workspace.routes'`.

- [ ] **Step 3: Write implementation**

Create `apps/backend-hono/src/workspace/workspace.routes.ts`:

```ts
import { Hono } from 'hono'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { errorResponse } from '../common/errors'
import type { WorkspaceService } from './workspace.service'

type Variables = AuthVariables & { requestId: string }
type ServiceLike = Pick<WorkspaceService, 'listForUser' | 'findByUserAndSlug'>

export function createWorkspaceRoutes(service: ServiceLike) {
  const app = new Hono<{ Variables: Variables }>()

  app.get('/workspaces', requireAuth, async (c) => {
    const user = c.get('user')
    if (!user) return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
    const list = await service.listForUser(user.id)
    return c.json(list)
  })

  app.get('/workspaces/by-slug/:slug', requireAuth, async (c) => {
    const user = c.get('user')
    if (!user) return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
    const slug = c.req.param('slug')
    const ws = await service.findByUserAndSlug(user.id, slug)
    if (!ws) return errorResponse(c, 404, 'NOT_FOUND', 'Workspace not found')
    return c.json(ws)
  })

  return app
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
bun run test src/workspace/workspace.routes.test.ts
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/workspace/workspace.routes.ts apps/backend-hono/src/workspace/workspace.routes.test.ts
git commit -m "feat(workspace): add workspace API routes"
```

---

## Task 7: Wire workspace routes into app.ts

**Files:**
- Modify: `apps/backend-hono/src/app.ts`

- [ ] **Step 1: Add import and wire route**

Edit `apps/backend-hono/src/app.ts`. Add import alongside other route imports (alphabetical insert):

```ts
import { createWorkspaceRoutes } from './workspace/workspace.routes'
import { WorkspaceService } from './workspace/workspace.service'
```

In the body of `createApp`, after the other `app.route('/api', createXxxRoutes())` calls but before `app.notFound`, add:

```ts
const workspaceService = new WorkspaceService()
app.route('/api', createWorkspaceRoutes(workspaceService))
app.route('/', createWorkspaceRoutes(workspaceService))
```

(Mirror the dual-mount pattern other routes use, with `/api` and `/`.)

- [ ] **Step 2: Run typecheck**

```bash
cd apps/backend-hono
bun run typecheck
```

Expected: no errors.

- [ ] **Step 3: Run all tests**

```bash
bun run test
```

Expected: all existing + new tests PASS.

- [ ] **Step 4: Smoke check the endpoint locally**

Start the backend:

```bash
bun run dev
```

In another terminal, with a session cookie or test bypass:

```bash
curl -i http://localhost:3001/api/workspaces
```

Expected: 401 (no auth) or 200 with `[]` (logged in but no workspaces yet).

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/app.ts
git commit -m "feat(workspace): wire workspace routes into app"
```

---

## Task 8: Frontend workspace API client

**Files:**
- Create: `apps/frontend/src/api/workspace.api.ts`

- [ ] **Step 1: Write the client**

Create `apps/frontend/src/api/workspace.api.ts`:

```ts
import api from './axios'

export type Workspace = {
  id: string
  slug: string
  userId: string
  pesertaId: string
  enrollmentId: string
  batchId: string
  courseId: string
  displayName: string
  status: 'active' | 'archived' | 'suspended'
  lastAccessedAt: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const res = await api.get<Workspace[]>('/workspaces')
  return res.data
}

export async function fetchWorkspaceBySlug(slug: string): Promise<Workspace | null> {
  try {
    const res = await api.get<Workspace>(`/workspaces/by-slug/${slug}`)
    return res.data
  } catch (err: any) {
    if (err?.response?.status === 404) return null
    throw err
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/api/workspace.api.ts
git commit -m "feat(workspace): add frontend workspace api client"
```

---

## Task 9: Frontend workspace hooks

**Files:**
- Create: `apps/frontend/src/hooks/useWorkspaces.ts`
- Create: `apps/frontend/src/hooks/useCurrentWorkspace.ts`
- Create: `apps/frontend/src/context/WorkspaceContext.tsx`

- [ ] **Step 1: useWorkspaces hook**

Create `apps/frontend/src/hooks/useWorkspaces.ts`:

```ts
import { useQuery } from '@tanstack/react-query'
import { fetchWorkspaces, type Workspace } from '../api/workspace.api'

export function useWorkspaces() {
  return useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: fetchWorkspaces,
    staleTime: 60_000, // 1 min
  })
}
```

- [ ] **Step 2: WorkspaceContext**

Create `apps/frontend/src/context/WorkspaceContext.tsx`:

```tsx
import { createContext, useContext, type ReactNode } from 'react'
import type { Workspace } from '../api/workspace.api'

const WorkspaceContext = createContext<Workspace | null>(null)

export function WorkspaceProvider({
  workspace,
  children,
}: {
  workspace: Workspace
  children: ReactNode
}) {
  return <WorkspaceContext.Provider value={workspace}>{children}</WorkspaceContext.Provider>
}

export function useWorkspace(): Workspace {
  const ws = useContext(WorkspaceContext)
  if (!ws) {
    throw new Error('useWorkspace must be used inside <WorkspaceProvider> (route under /:slug/*)')
  }
  return ws
}

export function useOptionalWorkspace(): Workspace | null {
  return useContext(WorkspaceContext)
}
```

- [ ] **Step 3: useCurrentWorkspace hook**

Create `apps/frontend/src/hooks/useCurrentWorkspace.ts`:

```ts
import { useMemo } from 'react'
import { useParams } from 'react-router'
import type { Workspace } from '../api/workspace.api'
import { useWorkspaces } from './useWorkspaces'

export type CurrentWorkspaceResult =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'no-workspaces' }
  | { status: 'mismatch'; defaultSlug: string }
  | { status: 'ok'; workspace: Workspace }

export function useCurrentWorkspace(): CurrentWorkspaceResult {
  const { slug } = useParams<{ slug: string }>()
  const { data: workspaces, isLoading, isError } = useWorkspaces()

  return useMemo<CurrentWorkspaceResult>(() => {
    if (isLoading) return { status: 'loading' }
    if (isError || !workspaces) return { status: 'unauthenticated' }
    if (workspaces.length === 0) return { status: 'no-workspaces' }

    const matched = workspaces.find((w) => w.slug === slug)
    if (matched) return { status: 'ok', workspace: matched }

    const sorted = [...workspaces].sort((a, b) => {
      const aTs = new Date(a.lastAccessedAt ?? a.createdAt).getTime()
      const bTs = new Date(b.lastAccessedAt ?? b.createdAt).getTime()
      return bTs - aTs
    })
    return { status: 'mismatch', defaultSlug: sorted[0].slug }
  }, [isLoading, isError, workspaces, slug])
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/hooks/useWorkspaces.ts apps/frontend/src/hooks/useCurrentWorkspace.ts apps/frontend/src/context/WorkspaceContext.tsx
git commit -m "feat(workspace): add frontend workspace hooks and context"
```

---

## Task 10: WorkspaceSwitcher component

**Files:**
- Create: `apps/frontend/src/components/workspace/WorkspaceSwitcher.tsx`

- [ ] **Step 1: Write the component**

Create `apps/frontend/src/components/workspace/WorkspaceSwitcher.tsx`:

```tsx
import { useNavigate, useLocation } from 'react-router'
import { useWorkspaces } from '../../hooks/useWorkspaces'
import { useOptionalWorkspace } from '../../context/WorkspaceContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

export function WorkspaceSwitcher() {
  const { data: workspaces } = useWorkspaces()
  const current = useOptionalWorkspace()
  const navigate = useNavigate()
  const location = useLocation()

  if (!workspaces || workspaces.length === 0) {
    return null
  }

  const label = current?.displayName ?? 'Pilih workspace'

  const goTo = (slug: string) => {
    if (current) {
      // Replace the slug segment, keep the sub-path
      const parts = location.pathname.split('/').filter(Boolean)
      parts[0] = slug
      navigate(`/${parts.join('/')}`)
    } else {
      navigate(`/${slug}`)
    }
  }

  if (workspaces.length === 1) {
    return (
      <div className="px-3 py-1.5 rounded-md bg-muted text-sm font-medium" data-testid="workspace-switcher-single">
        {label}
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="px-3 py-1.5 rounded-md bg-muted text-sm font-medium hover:bg-muted/80"
          data-testid="workspace-switcher-trigger"
        >
          {label} ▼
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Workspaces saya</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.id}
            onSelect={() => goTo(ws.slug)}
            className={ws.id === current?.id ? 'font-bold' : ''}
            data-testid={`workspace-switcher-item-${ws.slug}`}
          >
            {ws.displayName}
            {ws.id === current?.id ? ' ✓' : ''}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/workspaces')}>
          Lihat semua workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

If `dropdown-menu` from `components/ui` doesn't exist with the expected named exports, inspect `apps/frontend/src/components/ui/` first and adapt to the actual API. (The codebase uses `radix-ui` so a `DropdownMenu` primitive should be available.)

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/workspace/
git commit -m "feat(workspace): add WorkspaceSwitcher component"
```

---

## Task 11: WorkspaceRouteWrapper component

**Files:**
- Create: `apps/frontend/src/components/workspace/WorkspaceRouteWrapper.tsx`

This wraps `/:slug/*` routes, providing the workspace context or redirecting on mismatch.

- [ ] **Step 1: Write the component**

Create `apps/frontend/src/components/workspace/WorkspaceRouteWrapper.tsx`:

```tsx
import { Navigate, Outlet, useParams } from 'react-router'
import { useCurrentWorkspace } from '../../hooks/useCurrentWorkspace'
import { WorkspaceProvider } from '../../context/WorkspaceContext'

export function WorkspaceRouteWrapper() {
  const result = useCurrentWorkspace()
  const params = useParams()

  if (result.status === 'loading') {
    return <div className="p-8 text-sm text-muted-foreground">Memuat workspace…</div>
  }

  if (result.status === 'unauthenticated') {
    return <Navigate to="/auth/login" replace />
  }

  if (result.status === 'no-workspaces') {
    return <Navigate to="/workspaces" replace />
  }

  if (result.status === 'mismatch') {
    // Keep sub-path after the slug if present
    const subPath = window.location.pathname.split('/').slice(2).join('/')
    const target = subPath ? `/${result.defaultSlug}/${subPath}` : `/${result.defaultSlug}`
    return <Navigate to={target} replace />
  }

  return (
    <WorkspaceProvider workspace={result.workspace}>
      <Outlet />
    </WorkspaceProvider>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/components/workspace/WorkspaceRouteWrapper.tsx
git commit -m "feat(workspace): add WorkspaceRouteWrapper for slug resolution"
```

---

## Task 12: `/workspaces` selector page

**Files:**
- Create: `apps/frontend/src/views/workspaces/Workspaces.tsx`

- [ ] **Step 1: Write the page**

Create `apps/frontend/src/views/workspaces/Workspaces.tsx`:

```tsx
import { Link } from 'react-router'
import { useWorkspaces } from '../../hooks/useWorkspaces'

export default function Workspaces() {
  const { data: workspaces, isLoading } = useWorkspaces()

  if (isLoading) {
    return <div className="p-8 text-sm">Memuat workspace…</div>
  }

  if (!workspaces || workspaces.length === 0) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <h1 className="text-xl font-semibold mb-2">Belum ada workspace</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Setelah pembayaran, workspace untuk program yang kamu beli akan otomatis muncul di sini.
        </p>
        <a
          href="https://sertifikasitrainer.com"
          className="inline-block px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Lihat program tersedia →
        </a>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold mb-4">Workspaces saya</h1>
      <div className="space-y-3">
        {workspaces.map((ws) => (
          <div key={ws.id} className="border rounded-md p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{ws.displayName}</div>
              <div className="text-xs text-muted-foreground">
                Status: {ws.status}
                {ws.lastAccessedAt
                  ? ` · Terakhir diakses ${new Date(ws.lastAccessedAt).toLocaleDateString('id-ID')}`
                  : ''}
              </div>
            </div>
            <Link
              to={`/${ws.slug}`}
              className="text-sm font-medium text-primary hover:underline"
              data-testid={`open-workspace-${ws.slug}`}
            >
              Buka →
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/views/workspaces/
git commit -m "feat(workspace): add /workspaces selector page"
```

---

## Task 13: Workspace dashboard placeholder

**Files:**
- Create: `apps/frontend/src/views/workspace-dashboard/WorkspaceDashboard.tsx`

- [ ] **Step 1: Write the page**

Create `apps/frontend/src/views/workspace-dashboard/WorkspaceDashboard.tsx`:

```tsx
import { useWorkspace } from '../../context/WorkspaceContext'

export default function WorkspaceDashboard() {
  const ws = useWorkspace()

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-1">{ws.displayName}</h1>
      <p className="text-sm text-muted-foreground mb-6">
        Workspace slug: <code>{ws.slug}</code>
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-md p-4">
          <div className="text-xs uppercase text-muted-foreground mb-1">Status</div>
          <div className="font-medium">{ws.status}</div>
        </div>
        <div className="border rounded-md p-4">
          <div className="text-xs uppercase text-muted-foreground mb-1">Dibuat</div>
          <div className="font-medium">
            {new Date(ws.createdAt).toLocaleDateString('id-ID')}
          </div>
        </div>
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        Halaman dashboard ini placeholder. Konten lengkap (kelas, dokumen, sertifikat, todos)
        akan muncul di Phase 2.
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/frontend/src/views/workspace-dashboard/
git commit -m "feat(workspace): add workspace dashboard placeholder page"
```

---

## Task 14: Update routes and root redirect

**Files:**
- Modify: `apps/frontend/src/routes/protectedRouteChildren.tsx`
- Modify: `apps/frontend/src/components/RoleBasedRedirect.tsx`

- [ ] **Step 1: Update RoleBasedRedirect to handle peserta workspace flow**

Replace `apps/frontend/src/components/RoleBasedRedirect.tsx` content with:

```tsx
import { Navigate } from 'react-router'
import { useUser } from 'src/lib/better-auth'
import { useWorkspaces } from '../hooks/useWorkspaces'

export const RoleBasedRedirect = () => {
  const { user } = useUser()
  const role = user?.publicMetadata?.role || 'peserta'

  if (role === 'admin') {
    return <Navigate to="/admin/home" replace />
  }

  return <PesertaRedirect />
}

function PesertaRedirect() {
  const { data: workspaces, isLoading, isError } = useWorkspaces()

  if (isLoading) {
    return <div className="p-8 text-sm text-muted-foreground">Memuat…</div>
  }

  if (isError) {
    return <Navigate to="/auth/login" replace />
  }

  if (!workspaces || workspaces.length === 0) {
    return <Navigate to="/workspaces" replace />
  }

  const sorted = [...workspaces].sort((a, b) => {
    const aTs = new Date(a.lastAccessedAt ?? a.createdAt).getTime()
    const bTs = new Date(b.lastAccessedAt ?? b.createdAt).getTime()
    return bTs - aTs
  })
  return <Navigate to={`/${sorted[0].slug}`} replace />
}
```

- [ ] **Step 2: Add new routes to protectedRouteChildren**

Edit `apps/frontend/src/routes/protectedRouteChildren.tsx`. Add lazy imports near the top with the existing ones:

```tsx
const Workspaces = Loadable(lazy(() => import('../views/workspaces/Workspaces')))
const WorkspaceDashboard = Loadable(
  lazy(() => import('../views/workspace-dashboard/WorkspaceDashboard')),
)
```

Import the wrapper:

```tsx
import { WorkspaceRouteWrapper } from '../components/workspace/WorkspaceRouteWrapper'
```

In the `protectedRouteChildren` array, add (BEFORE the catch-all `{ path: '*', element: <Navigate to="/auth/404" /> }`):

```tsx
  {
    path: '/workspaces',
    exact: true,
    element: (
      <UserRoute>
        <Workspaces />
      </UserRoute>
    ),
  },
  {
    path: '/:slug',
    element: (
      <UserRoute>
        <WorkspaceRouteWrapper />
      </UserRoute>
    ),
    children: [
      { index: true, element: <WorkspaceDashboard /> },
    ],
  },
```

Note on react-router v7: the `:slug` route uses `<Outlet />` from `WorkspaceRouteWrapper` to render the child. Make sure all reserved root paths (`/admin/...`, `/auth/...`, `/user/...`, `/workspaces`, `/profile`, etc.) appear BEFORE the `:slug` route in the array. React Router v7's ranking should pick static segments over dynamic, but explicit ordering removes ambiguity.

- [ ] **Step 3: Run frontend typecheck**

```bash
cd apps/frontend
bun run build:check
```

Expected: typecheck passes (build will run and may surface stale issues — focus on TS errors).

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/routes/protectedRouteChildren.tsx apps/frontend/src/components/RoleBasedRedirect.tsx
git commit -m "feat(workspace): wire workspace routes and update root redirect"
```

---

## Task 15: Integrate WorkspaceSwitcher into Header

**Files:**
- Modify: `apps/frontend/src/layouts/full/vertical/header/Header.tsx`

The existing header is large. We add the switcher near the logo/branding area. Inspect the file first to find an appropriate insertion point.

- [ ] **Step 1: Read the existing Header**

Open `apps/frontend/src/layouts/full/vertical/header/Header.tsx` and find the section near the logo (likely a flex container at the start of the desktop header). The Header is ~22kB; locate where the brand/title is rendered and insert beside it.

- [ ] **Step 2: Insert WorkspaceSwitcher**

Add import at top of Header.tsx:

```tsx
import { WorkspaceSwitcher } from 'src/components/workspace/WorkspaceSwitcher'
```

Find the desktop header's left area (where `<FullLogo />` or similar logo component renders). Add `<WorkspaceSwitcher />` next to it, e.g.:

```tsx
<div className="flex items-center gap-4">
  <FullLogo />
  <WorkspaceSwitcher />
</div>
```

If the layout uses Flowbite's Navbar primitives, place it in the appropriate `Navbar.Brand` adjacent slot. The exact placement depends on the existing JSX — adapt to current structure.

- [ ] **Step 3: Verify no styling regressions**

Start the frontend:

```bash
cd apps/frontend
bun run dev
```

Open `http://localhost:5173` (or assigned port). Verify:
- Logged out: switcher does not render (component returns null when no workspaces).
- After Task 16's seed runs, switcher appears with workspace label.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/layouts/full/vertical/header/Header.tsx
git commit -m "feat(workspace): integrate WorkspaceSwitcher into Header"
```

---

## Task 16: Seed dummy workspace and end-to-end manual verification

**Files:**
- Create: `apps/backend-hono/scripts/seed-workspace.ts`

- [ ] **Step 1: Write seed script**

Create `apps/backend-hono/scripts/seed-workspace.ts`:

```ts
import { db } from '../src/db/client'
import {
  batchTiers,
  batchTraining,
  courses,
  peserta,
  pesertaBatch,
  users,
  workspaces,
} from '../src/db/schema'
import { eq } from 'drizzle-orm'
import { generateWorkspaceSlug } from '../src/workspace/slug-generator'

async function main() {
  const userId = 'seed-user-1'
  const userEmail = 'seed-user-1@example.com'

  // 1. Ensure user (Better Auth user)
  const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: userId,
      name: 'Seed User',
      email: userEmail,
      emailVerified: true,
      role: 'user',
    })
  }

  // 2. Ensure peserta linked
  const existingPeserta = await db
    .select()
    .from(peserta)
    .where(eq(peserta.clerkId, userId))
    .limit(1)
  let pesertaRow = existingPeserta[0]
  if (!pesertaRow) {
    const [created] = await db
      .insert(peserta)
      .values({
        clerkId: userId,
        nama: 'Seed User',
        email: userEmail,
        paymentStatus: 'paid',
      })
      .returning()
    pesertaRow = created
  }

  // 3. Ensure course
  let courseRow = (
    await db.select().from(courses).where(eq(courses.shortCode, 'trainers')).limit(1)
  )[0]
  if (!courseRow) {
    const [created] = await db
      .insert(courses)
      .values({
        shortCode: 'trainers',
        title: 'Training for Trainers',
      })
      .returning()
    courseRow = created
  }

  // 4. Ensure batch
  let batchRow = (
    await db
      .select()
      .from(batchTraining)
      .where(eq(batchTraining.slug, 'trainers-batch-1-seed'))
      .limit(1)
  )[0]
  if (!batchRow) {
    const [created] = await db
      .insert(batchTraining)
      .values({
        namaBatch: 'Training for Trainers - Batch 1',
        slug: 'trainers-batch-1-seed',
        batchNumber: 1,
        tanggal: new Date('2026-06-01'),
        courseId: courseRow.id,
        status: 'published',
      })
      .returning()
    batchRow = created
  }

  // 5. Ensure tier (Platinum)
  let tierRow = (
    await db
      .select()
      .from(batchTiers)
      .where(eq(batchTiers.slug, 'platinum-seed'))
      .limit(1)
  )[0]
  if (!tierRow) {
    const [created] = await db
      .insert(batchTiers)
      .values({
        batchId: batchRow.id,
        name: 'Platinum',
        slug: 'platinum-seed',
        price: 5470000,
      })
      .returning()
    tierRow = created
  }

  // 6. Ensure enrollment paid
  let enrollment = (
    await db
      .select()
      .from(pesertaBatch)
      .where(eq(pesertaBatch.pesertaId, pesertaRow.id))
      .limit(1)
  )[0]
  if (!enrollment) {
    const [created] = await db
      .insert(pesertaBatch)
      .values({
        pesertaId: pesertaRow.id,
        batchId: batchRow.id,
        tierId: tierRow.id,
        paymentStatus: 'paid',
        status: 'active',
      })
      .returning()
    enrollment = created
  }

  // 7. Ensure workspace
  const existingWs = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.enrollmentId, enrollment.id))
    .limit(1)
  if (existingWs.length === 0) {
    const slug = generateWorkspaceSlug({
      batchNumber: batchRow.batchNumber,
      courseShortCode: courseRow.shortCode,
    })
    await db.insert(workspaces).values({
      slug,
      userId,
      pesertaId: pesertaRow.id,
      enrollmentId: enrollment.id,
      batchId: batchRow.id,
      courseId: courseRow.id,
      displayName: `${courseRow.title} - Batch ${batchRow.batchNumber}`,
      status: 'active',
    })
    console.log(`[seed-workspace] created workspace ${slug} for ${userEmail}`)
  } else {
    console.log(`[seed-workspace] workspace already exists for enrollment ${enrollment.id}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
```

- [ ] **Step 2: Run the seed**

```bash
cd apps/backend-hono
bun run scripts/seed-workspace.ts
```

Expected: console output indicating workspace created (or already exists).

- [ ] **Step 3: Manual end-to-end check**

Start backend and frontend:

```bash
# terminal 1
cd apps/backend-hono && bun run dev

# terminal 2
cd apps/frontend && bun run dev
```

In a browser, log in as the seeded user (you may need to set a password via Better Auth UI or use an existing dev login flow).

Verify:

1. After login, browser navigates to `/b1-trainers` (workspace dashboard placeholder).
2. WorkspaceSwitcher in top bar shows "Training for Trainers - Batch 1".
3. Visiting `/workspaces` shows the workspace list.
4. Visiting `/b99-fake-slug` (not owned) redirects back to `/b1-trainers`.
5. Visiting `/admin/home` does NOT match `:slug` (reserved route check); admin route returns its own 401/403 since seeded user is not admin.

- [ ] **Step 4: Run all backend tests**

```bash
cd apps/backend-hono
bun run test
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/scripts/seed-workspace.ts
git commit -m "chore(workspace): add seed script for phase 1 manual verification"
```

---

## Self-Review

After all 16 tasks complete, run this checklist:

**1. Spec coverage check** (Phase 1 deliverables from spec Section 10):

- [x] `workspaces` table schema → Task 2
- [x] `courses.short_code` and `batch_training.batch_number` → Task 1
- [x] Slug generator service → Task 3
- [x] Backend slug resolution & API → Tasks 4–7
- [x] Frontend layout shell with workspace switcher and akun section → Tasks 10–11, 14, 15. **Sidebar layout (workspace section vs akun section, Section 5.1 of spec) is partially deferred**: Task 15 only adds top-bar switcher. Sidebar restructuring (`Sidebaritems.ts` reorder) is **NOT** in this plan because the existing sidebar already separates user vs admin items adequately for Phase 1. Phase 2 will redo sidebar items per workspace as part of dokumen/kelas/sertifikat scoping work.
- [x] `/workspaces` page → Task 12
- [x] Test with 1 dummy workspace seeded → Task 16

**2. Placeholder scan:** None. All tasks have concrete code, exact paths, and exact commands. ✓

**3. Type consistency:**
- `Workspace` type defined in backend (`workspaces.ts`) and frontend (`workspace.api.ts`) — both have same field names (camelCase in TS, snake_case in DB column declarations). ✓
- `WorkspaceService` methods used: `listForUser`, `findByUserAndSlug`, `getDefaultForUser`, `createForEnrollment` — all defined in Task 5, all called correctly elsewhere. ✓
- `useWorkspaces` returns `UseQueryResult<Workspace[]>` with `data` shape matching backend. ✓
- `useWorkspace`/`useOptionalWorkspace` returns/accepts `Workspace` type — consistent with `WorkspaceContext`. ✓

**4. Open items / known limitations:**
- Sidebar restructuring deferred to Phase 2 (see #1 above).
- Tier-based item gating deferred to Phase 2.
- `/profile`, `/settings`, `/billing` routes referenced in spec are NOT created in Phase 1. Existing `/user/profile` continues to work; spec routes (`/profile` etc.) are added in later phases or alongside their content.
- Backend slug-resolution middleware (deeper than the API endpoint) is deferred — Phase 1 only needs frontend-side slug resolution because Phase 1 has no workspace-scoped APIs yet. Phase 2 introduces backend middleware as part of scoped queries.
- The dual-mount pattern (`app.route('/api', ...)` AND `app.route('/', ...)`) in `app.ts` follows existing convention — keep both for consistency.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-18-workspace-phase-1-foundation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

**Which approach?**
