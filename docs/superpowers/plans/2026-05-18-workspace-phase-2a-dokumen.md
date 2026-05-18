# Workspace System — Phase 2a (Dokumen Scoping) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the 8-field problem on `/dokumen`. Each workspace shows only the dokumen jenis relevant to its program (course). Build the foundation pieces (workspace context middleware, axios interceptor, junction table) that Phase 2b will reuse for todos/sertifikat/kelas/tugas/AI.

**Architecture:** Backend gains a `requireWorkspace` middleware that resolves workspace from `X-Workspace-Slug` header (set by frontend axios interceptor). New junction `dokumen_jenis_program` ties each `dokumen_jenis` to one or more `courses` with per-program order/required flags. `dokumen_peserta.workspace_id` (NOT NULL) replaces the implicit pesertaId-only scoping. Dokumen view moves to `/:slug/dokumen`; legacy `/user/dokumen` is removed (alpha — no users to break).

**Tech Stack:** Hono + Drizzle (backend), React + react-query + axios (frontend), vitest.

**Reference:** `docs/superpowers/specs/2026-05-18-workspace-system-design.md` (Sections 3.2, 3.3, 4) and Phase 1 plan/code at `docs/superpowers/plans/2026-05-18-workspace-phase-1-foundation.md`.

**Branch:** Continue on `workspace-system` (Phase 1 already merged into the branch). Worktree at `.worktrees/workspace-system`.

---

## File Structure

### Backend (apps/backend-hono)

**Create:**
- `src/db/schema/dokumen.ts` (modify) — add `dokumen_jenis_program` junction table.
- `src/workspace/workspace.middleware.ts` — `requireWorkspace` middleware.
- `src/workspace/workspace.middleware.test.ts`

**Modify:**
- `src/db/schema/dokumen.ts` — add `workspaceId` column to `dokumenPeserta`.
- `src/dokumen/dokumen.service.ts` — methods become workspace-scoped.
- `src/dokumen/dokumen.service.test.ts` — update tests.
- `src/dokumen/dokumen.routes.ts` — apply `requireWorkspace`, update handlers.
- `src/dokumen/dokumen.routes.test.ts` (likely doesn't exist; create it) — integration tests.
- `src/app.ts` — no changes expected (routes already wired).

**Generated:**
- `src/db/migrations/<timestamp>_dokumen-workspace.sql`.

### Frontend (apps/frontend)

**Create:**
- `src/api/workspace-axios.ts` — wraps the existing axios with an interceptor that injects `X-Workspace-Slug` based on URL path.

**Modify:**
- `src/views/dokumen/hooks/useDokumen.ts` — use workspace-aware axios.
- `src/views/dokumen/Dokumen.tsx` — use `useWorkspace()` to display program context (e.g., "Dokumen untuk Training for Trainers - Batch 1").
- `src/routes/protectedRouteChildren.tsx` — replace `/user/dokumen` with `/:slug/dokumen` under the WorkspaceRouteWrapper.

### Seed

**Modify:**
- `apps/backend-hono/scripts/seed-workspace.ts` — add dokumen kategori, dokumen jenis, and `dokumen_jenis_program` rows for the seeded course (`trainers`).

---

## Task 1: Schema — `dokumen_jenis_program` junction + `workspace_id` on `dokumen_peserta`

**Files:**
- Modify: `apps/backend-hono/src/db/schema/dokumen.ts`

- [ ] **Step 1: Update schema**

Edit `apps/backend-hono/src/db/schema/dokumen.ts`. Append the junction table and add `workspaceId` to `dokumenPeserta`:

```ts
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { peserta } from './people'
import { courses } from './learning'
import { workspaces } from './workspaces'

export const dokumenStatusEnum = pgEnum('dokumen_status', ['pending', 'revisi', 'approved'])

export const dokumenKategori = pgTable('dokumen_kategori', {
  id: uuid('id').primaryKey().defaultRandom(),
  nama: varchar('nama', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const dokumenJenis = pgTable('dokumen_jenis', {
  id: uuid('id').primaryKey().defaultRandom(),
  kategoriId: uuid('kategori_id')
    .notNull()
    .references(() => dokumenKategori.id, { onDelete: 'cascade' }),
  namaJenis: varchar('nama_jenis', { length: 255 }).notNull(),
  opsional: boolean('opsional').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const dokumenJenisProgram = pgTable(
  'dokumen_jenis_program',
  {
    jenisId: uuid('jenis_id')
      .notNull()
      .references(() => dokumenJenis.id, { onDelete: 'cascade' }),
    courseId: uuid('course_id')
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    orderIndex: integer('order_index').notNull().default(0),
    required: boolean('required').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.jenisId, table.courseId] }),
  }),
)

export const dokumenPeserta = pgTable('dokumen_peserta', {
  id: uuid('id').primaryKey().defaultRandom(),
  pesertaId: uuid('peserta_id')
    .notNull()
    .references(() => peserta.id, { onDelete: 'cascade' }),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  jenisId: uuid('jenis_id')
    .notNull()
    .references(() => dokumenJenis.id, { onDelete: 'cascade' }),
  fileUrl: varchar('file_url', { length: 500 }).notNull(),
  status: dokumenStatusEnum('status').default('pending').notNull(),
  catatanRevisi: varchar('catatan_revisi', { length: 500 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export type DokumenKategori = typeof dokumenKategori.$inferSelect
export type DokumenJenis = typeof dokumenJenis.$inferSelect
export type DokumenJenisProgram = typeof dokumenJenisProgram.$inferSelect
export type DokumenPeserta = typeof dokumenPeserta.$inferSelect
```

- [ ] **Step 2: Generate migration**

```bash
cd apps/backend-hono
bun run db:generate
```

Inspect the generated SQL. It must:
- `CREATE TABLE dokumen_jenis_program (...)` with composite primary key on `(jenis_id, course_id)`.
- `ALTER TABLE dokumen_peserta ADD COLUMN workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`.

NOT NULL on a new column will fail if there are existing rows. Alpha state: truncate first if needed.

- [ ] **Step 3: Apply migration**

If `bun run db:migrate` fails (it has historically — see Phase 1 Task 1 notes), fall back to:

```bash
psql $DATABASE_URL -c "TRUNCATE TABLE dokumen_peserta CASCADE;"
bunx drizzle-kit push --force
```

Then manually record the migration hash in `drizzle.__drizzle_migrations` to keep journal consistent (mirror the recovery the Phase 1 implementer used).

- [ ] **Step 4: Verify**

```bash
psql $DATABASE_URL -c "\d dokumen_jenis_program"
psql $DATABASE_URL -c "\d dokumen_peserta" | grep workspace_id
```

Both should show the new structures.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/db/schema/dokumen.ts apps/backend-hono/src/db/migrations/
git commit -m "feat(workspace): add dokumen_jenis_program junction and workspace_id on dokumen_peserta"
```

---

## Task 2: Backend `requireWorkspace` middleware (TDD)

**Files:**
- Create: `apps/backend-hono/src/workspace/workspace.middleware.ts`
- Create: `apps/backend-hono/src/workspace/workspace.middleware.test.ts`

This middleware reads the `X-Workspace-Slug` header, resolves the workspace via `WorkspaceService.findByUserAndSlug`, and stores it in Hono context. Used by all workspace-scoped routes.

- [ ] **Step 1: Write failing tests**

Create `apps/backend-hono/src/workspace/workspace.middleware.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { errorResponse } from '../common/errors'
import { requireWorkspace, type WorkspaceContext } from './workspace.middleware'

function buildApp(service: any, user: any = { id: 'user_1' }) {
  const app = new Hono<{ Variables: WorkspaceContext & { user: any } }>()
  app.use('*', async (c, next) => {
    c.set('user', user)
    await next()
  })
  app.use('/dok/*', requireWorkspace(service))
  app.get('/dok/echo', (c) => {
    const ws = c.get('workspace')
    return c.json({ workspaceId: ws.id, slug: ws.slug })
  })
  app.onError((err, c) => errorResponse(c, 500, 'INTERNAL', err.message))
  return app
}

describe('requireWorkspace middleware', () => {
  it('returns 400 when X-Workspace-Slug header is missing', async () => {
    const app = buildApp({ findByUserAndSlug: async () => null })
    const res = await app.request('/dok/echo')
    expect(res.status).toBe(400)
  })

  it('returns 401 when user is not authenticated', async () => {
    const app = buildApp({ findByUserAndSlug: async () => null }, null)
    const res = await app.request('/dok/echo', {
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(401)
  })

  it('returns 404 when workspace is not found for user', async () => {
    const app = buildApp({ findByUserAndSlug: async () => null })
    const res = await app.request('/dok/echo', {
      headers: { 'X-Workspace-Slug': 'b99-nope' },
    })
    expect(res.status).toBe(404)
  })

  it('passes through and exposes workspace in context when valid', async () => {
    const ws = { id: 'ws_1', slug: 'b1-trainers', userId: 'user_1', courseId: 'c_1' }
    const app = buildApp({
      findByUserAndSlug: async (userId: string, slug: string) => {
        expect(userId).toBe('user_1')
        expect(slug).toBe('b1-trainers')
        return ws
      },
    })
    const res = await app.request('/dok/echo', {
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ workspaceId: 'ws_1', slug: 'b1-trainers' })
  })
})
```

- [ ] **Step 2: Run tests, verify they fail**

```bash
bun run test src/workspace/workspace.middleware.test.ts
```

Expected: FAIL with `Cannot find module './workspace.middleware'`.

- [ ] **Step 3: Write implementation**

Create `apps/backend-hono/src/workspace/workspace.middleware.ts`:

```ts
import type { MiddlewareHandler } from 'hono'
import { errorResponse } from '../common/errors'
import type { Workspace } from '../db/schema'
import type { WorkspaceService } from './workspace.service'

export type WorkspaceContext = {
  workspace: Workspace
}

type ServiceLike = Pick<WorkspaceService, 'findByUserAndSlug'>
type AuthLike = { id: string }

export function requireWorkspace(service: ServiceLike): MiddlewareHandler {
  return async (c, next) => {
    const user = c.get('user') as AuthLike | null
    if (!user) {
      return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
    }

    const slug = c.req.header('X-Workspace-Slug')?.trim()
    if (!slug) {
      return errorResponse(c, 400, 'WORKSPACE_REQUIRED', 'X-Workspace-Slug header is required')
    }

    const workspace = await service.findByUserAndSlug(user.id, slug)
    if (!workspace) {
      return errorResponse(c, 404, 'WORKSPACE_NOT_FOUND', `Workspace '${slug}' not found`)
    }

    c.set('workspace', workspace)
    await next()
  }
}
```

- [ ] **Step 4: Run tests, verify they pass**

```bash
bun run test src/workspace/workspace.middleware.test.ts
```

Expected: all 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/backend-hono/src/workspace/workspace.middleware.ts apps/backend-hono/src/workspace/workspace.middleware.test.ts
git commit -m "feat(workspace): add requireWorkspace middleware"
```

---

## Task 3: Update `dokumen.service.ts` for workspace scoping (TDD)

**Files:**
- Modify: `apps/backend-hono/src/dokumen/dokumen.service.ts`
- Create: `apps/backend-hono/src/dokumen/dokumen.service.test.ts` (if missing)

Service is rewritten to take `workspaceId` (and the workspace's `courseId` where needed) instead of `userId`. The methods become:

- `getKategoriForCourse(courseId)` — only kategori that have at least one jenis mapped to this course.
- `getJenisByKategoriAndCourse(kategoriId, courseId)` — filter via junction, ordered by `order_index`, includes `required` flag.
- `getStatus(workspaceId)` — list `dokumen_peserta` rows for the workspace, joined with jenis name.
- `upload(file, jenisId, workspaceId, pesertaId)` — validates jenis maps to the workspace's course; stores with `workspace_id`.
- `delete(id, workspaceId)` — checks ownership via workspace.

- [ ] **Step 1: Inspect current service**

Read `apps/backend-hono/src/dokumen/dokumen.service.ts` to see the existing methods and patterns. The Phase 1 (Section 3.1) already showed:
- `findPesertaByUserId(userId)` — looks up `peserta` by `clerkId`.
- `getKategori()` — returns all kategori (will be replaced).
- `getJenisByKategori(kategoriId)` — returns all jenis under kategori (will be replaced).
- `getStatus(userId)` — returns rows for that peserta (will be replaced).
- `upload(file, jenisId, userId)` (will be replaced).
- `delete(id, userId)` (will be replaced).

- [ ] **Step 2: Write failing tests**

Create or replace `apps/backend-hono/src/dokumen/dokumen.service.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { DokumenService } from './dokumen.service'

function makeStorage(overrides: any = {}) {
  return {
    getPublicUrl: async (key: string) => `https://cdn.example.com/${key}`,
    upload: vi.fn().mockResolvedValue({ key: 'uploads/file.pdf' }),
    buildPesertaDocumentPath: (pesertaId: string) => `peserta/${pesertaId}`,
    ...overrides,
  }
}

describe('DokumenService', () => {
  describe('getKategoriForCourse', () => {
    it('returns kategori filtered to those with jenis for this course', async () => {
      const repository = {
        findKategoriForCourse: vi.fn().mockResolvedValue([
          { id: 'kat_1', nama: 'Identitas' },
          { id: 'kat_2', nama: 'Pendidikan' },
        ]),
      }
      const service = new DokumenService({ repository: repository as any, storage: makeStorage() })

      const result = await service.getKategoriForCourse('course_1')

      expect(repository.findKategoriForCourse).toHaveBeenCalledWith('course_1')
      expect(result).toEqual([
        { id: 'kat_1', nama: 'Identitas' },
        { id: 'kat_2', nama: 'Pendidikan' },
      ])
    })
  })

  describe('getJenisByKategoriAndCourse', () => {
    it('returns jenis ordered by order_index with required flag', async () => {
      const rows = [
        { id: 'j_1', namaJenis: 'KTP', orderIndex: 1, required: true },
        { id: 'j_2', namaJenis: 'NPWP', orderIndex: 2, required: false },
      ]
      const repository = {
        findJenisByKategoriAndCourse: vi.fn().mockResolvedValue(rows),
      }
      const service = new DokumenService({ repository: repository as any, storage: makeStorage() })

      const result = await service.getJenisByKategoriAndCourse('kat_1', 'course_1')

      expect(repository.findJenisByKategoriAndCourse).toHaveBeenCalledWith('kat_1', 'course_1')
      expect(result).toEqual(rows)
    })
  })

  describe('getStatus', () => {
    it('returns dokumen_peserta rows for the workspace with public file urls', async () => {
      const repository = {
        findStatusByWorkspace: vi.fn().mockResolvedValue([
          {
            id: 'd_1',
            jenisId: 'j_1',
            jenisNama: 'KTP',
            fileUrl: 'uploads/ktp.pdf',
            status: 'pending',
            catatanRevisi: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]),
      }
      const storage = makeStorage()
      const service = new DokumenService({ repository: repository as any, storage })

      const result = await service.getStatus('ws_1')

      expect(repository.findStatusByWorkspace).toHaveBeenCalledWith('ws_1')
      expect(result[0].fileUrl).toBe('https://cdn.example.com/uploads/ktp.pdf')
    })
  })

  describe('upload', () => {
    it('throws INVALID_DOCUMENT_TYPE when jenis does not belong to course', async () => {
      const repository = {
        isJenisInCourse: vi.fn().mockResolvedValue(false),
      }
      const service = new DokumenService({ repository: repository as any, storage: makeStorage() })

      const file = new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' })
      await expect(
        service.upload({
          file,
          jenisId: 'j_x',
          workspaceId: 'ws_1',
          pesertaId: 'peserta_1',
          courseId: 'course_1',
        }),
      ).rejects.toThrow(/INVALID_DOCUMENT_TYPE/)
    })

    it('uploads, then upserts the dokumen_peserta row scoped to workspace', async () => {
      const upsert = vi.fn().mockResolvedValue({ id: 'dp_1' })
      const repository = {
        isJenisInCourse: vi.fn().mockResolvedValue(true),
        upsertPesertaDokumen: upsert,
      }
      const storage = makeStorage()
      const service = new DokumenService({ repository: repository as any, storage })

      const file = new File([new Uint8Array([1, 2, 3])], 'a.pdf', { type: 'application/pdf' })

      const result = await service.upload({
        file,
        jenisId: 'j_1',
        workspaceId: 'ws_1',
        pesertaId: 'peserta_1',
        courseId: 'course_1',
      })

      expect(storage.upload).toHaveBeenCalled()
      expect(upsert).toHaveBeenCalledWith({
        workspaceId: 'ws_1',
        pesertaId: 'peserta_1',
        jenisId: 'j_1',
        fileKey: 'uploads/file.pdf',
      })
      expect(result.id).toBe('dp_1')
    })
  })

  describe('delete', () => {
    it('deletes a dokumen_peserta scoped to workspace', async () => {
      const repository = {
        deleteByIdAndWorkspace: vi.fn().mockResolvedValue({ count: 1 }),
      }
      const service = new DokumenService({ repository: repository as any, storage: makeStorage() })

      const result = await service.delete('dp_1', 'ws_1')

      expect(repository.deleteByIdAndWorkspace).toHaveBeenCalledWith('dp_1', 'ws_1')
      expect(result).toEqual({ success: true })
    })
  })
})
```

- [ ] **Step 3: Run tests, verify they fail**

```bash
bun run test src/dokumen/dokumen.service.test.ts
```

Expected: FAIL — service has different shape.

- [ ] **Step 4: Rewrite service**

Replace `apps/backend-hono/src/dokumen/dokumen.service.ts` with:

```ts
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import {
  dokumenJenis,
  dokumenJenisProgram,
  dokumenKategori,
  dokumenPeserta,
} from '../db/schema'
import { ObjectStorageService } from '../storage/object-storage.service'

type StorageLike = {
  getPublicUrl(key: string): Promise<string>
  upload(
    file: { originalname: string; buffer: Buffer; mimetype: string; size: number },
    pathPrefix: string,
  ): Promise<{ key: string }>
  buildPesertaDocumentPath(pesertaId: string): string
}

export type DokumenStatusRow = {
  id: string
  jenisId: string
  jenisNama: string
  fileUrl: string
  status: 'pending' | 'revisi' | 'approved'
  catatanRevisi: string | null
  createdAt: Date
  updatedAt: Date
}

export type DokumenJenisForCourseRow = {
  id: string
  namaJenis: string
  orderIndex: number
  required: boolean
}

export type DokumenRepositoryLike = {
  findKategoriForCourse(courseId: string): Promise<Array<{ id: string; nama: string }>>
  findJenisByKategoriAndCourse(
    kategoriId: string,
    courseId: string,
  ): Promise<DokumenJenisForCourseRow[]>
  findStatusByWorkspace(workspaceId: string): Promise<DokumenStatusRow[]>
  isJenisInCourse(jenisId: string, courseId: string): Promise<boolean>
  upsertPesertaDokumen(input: {
    workspaceId: string
    pesertaId: string
    jenisId: string
    fileKey: string
  }): Promise<{ id: string }>
  deleteByIdAndWorkspace(id: string, workspaceId: string): Promise<{ count: number }>
}

const defaultRepository: DokumenRepositoryLike = {
  async findKategoriForCourse(courseId) {
    return db
      .selectDistinct({ id: dokumenKategori.id, nama: dokumenKategori.nama })
      .from(dokumenKategori)
      .innerJoin(dokumenJenis, eq(dokumenJenis.kategoriId, dokumenKategori.id))
      .innerJoin(
        dokumenJenisProgram,
        eq(dokumenJenisProgram.jenisId, dokumenJenis.id),
      )
      .where(eq(dokumenJenisProgram.courseId, courseId))
  },

  async findJenisByKategoriAndCourse(kategoriId, courseId) {
    return db
      .select({
        id: dokumenJenis.id,
        namaJenis: dokumenJenis.namaJenis,
        orderIndex: dokumenJenisProgram.orderIndex,
        required: dokumenJenisProgram.required,
      })
      .from(dokumenJenis)
      .innerJoin(
        dokumenJenisProgram,
        eq(dokumenJenisProgram.jenisId, dokumenJenis.id),
      )
      .where(
        and(
          eq(dokumenJenis.kategoriId, kategoriId),
          eq(dokumenJenisProgram.courseId, courseId),
        ),
      )
      .orderBy(asc(dokumenJenisProgram.orderIndex))
  },

  async findStatusByWorkspace(workspaceId) {
    return db
      .select({
        id: dokumenPeserta.id,
        jenisId: dokumenPeserta.jenisId,
        jenisNama: dokumenJenis.namaJenis,
        fileUrl: dokumenPeserta.fileUrl,
        status: dokumenPeserta.status,
        catatanRevisi: dokumenPeserta.catatanRevisi,
        createdAt: dokumenPeserta.createdAt,
        updatedAt: dokumenPeserta.updatedAt,
      })
      .from(dokumenPeserta)
      .leftJoin(dokumenJenis, eq(dokumenPeserta.jenisId, dokumenJenis.id))
      .where(eq(dokumenPeserta.workspaceId, workspaceId)) as Promise<DokumenStatusRow[]>
  },

  async isJenisInCourse(jenisId, courseId) {
    const [row] = await db
      .select({ jenisId: dokumenJenisProgram.jenisId })
      .from(dokumenJenisProgram)
      .where(
        and(
          eq(dokumenJenisProgram.jenisId, jenisId),
          eq(dokumenJenisProgram.courseId, courseId),
        ),
      )
      .limit(1)
    return !!row
  },

  async upsertPesertaDokumen(input) {
    const [existing] = await db
      .select()
      .from(dokumenPeserta)
      .where(
        and(
          eq(dokumenPeserta.workspaceId, input.workspaceId),
          eq(dokumenPeserta.jenisId, input.jenisId),
        ),
      )
      .limit(1)

    if (existing) {
      const [row] = await db
        .update(dokumenPeserta)
        .set({
          fileUrl: input.fileKey,
          status: 'pending',
          catatanRevisi: null,
          updatedAt: new Date(),
        })
        .where(eq(dokumenPeserta.id, existing.id))
        .returning()
      return { id: row.id }
    }

    const [row] = await db
      .insert(dokumenPeserta)
      .values({
        workspaceId: input.workspaceId,
        pesertaId: input.pesertaId,
        jenisId: input.jenisId,
        fileUrl: input.fileKey,
        status: 'pending',
      })
      .returning()
    return { id: row.id }
  },

  async deleteByIdAndWorkspace(id, workspaceId) {
    const result = await db
      .delete(dokumenPeserta)
      .where(and(eq(dokumenPeserta.id, id), eq(dokumenPeserta.workspaceId, workspaceId)))
      .returning({ id: dokumenPeserta.id })
    return { count: result.length }
  },
}

export type UploadInput = {
  file: File
  jenisId: string
  workspaceId: string
  pesertaId: string
  courseId: string
}

export class DokumenService {
  private readonly repository: DokumenRepositoryLike
  private readonly storage: StorageLike

  constructor(deps: { repository?: DokumenRepositoryLike; storage?: StorageLike } = {}) {
    this.repository = deps.repository ?? defaultRepository
    this.storage = deps.storage ?? new ObjectStorageService()
  }

  getKategoriForCourse(courseId: string) {
    return this.repository.findKategoriForCourse(courseId)
  }

  getJenisByKategoriAndCourse(kategoriId: string, courseId: string) {
    return this.repository.findJenisByKategoriAndCourse(kategoriId, courseId)
  }

  async getStatus(workspaceId: string) {
    const rows = await this.repository.findStatusByWorkspace(workspaceId)
    return Promise.all(
      rows.map(async (row) => ({
        ...row,
        fileUrl: await this.storage.getPublicUrl(row.fileUrl),
      })),
    )
  }

  async upload(input: UploadInput) {
    const valid = await this.repository.isJenisInCourse(input.jenisId, input.courseId)
    if (!valid) throw new Error('INVALID_DOCUMENT_TYPE')

    const buffer = Buffer.from(await input.file.arrayBuffer())
    const uploaded = await this.storage.upload(
      {
        originalname: input.file.name || 'dokumen',
        buffer,
        mimetype: input.file.type || 'application/octet-stream',
        size: buffer.byteLength,
      },
      this.storage.buildPesertaDocumentPath(input.pesertaId),
    )

    return this.repository.upsertPesertaDokumen({
      workspaceId: input.workspaceId,
      pesertaId: input.pesertaId,
      jenisId: input.jenisId,
      fileKey: uploaded.key,
    })
  }

  async delete(id: string, workspaceId: string) {
    await this.repository.deleteByIdAndWorkspace(id, workspaceId)
    return { success: true }
  }
}
```

- [ ] **Step 5: Run tests, verify they pass**

```bash
bun run test src/dokumen/dokumen.service.test.ts
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/backend-hono/src/dokumen/dokumen.service.ts apps/backend-hono/src/dokumen/dokumen.service.test.ts
git commit -m "feat(dokumen): scope service to workspace and course"
```

---

## Task 4: Update `dokumen.routes.ts` to use workspace context

**Files:**
- Modify: `apps/backend-hono/src/dokumen/dokumen.routes.ts`
- Create or modify: `apps/backend-hono/src/dokumen/dokumen.routes.test.ts`

Routes apply `requireWorkspace`, get `workspace` from context, derive `courseId` and `pesertaId`. The peserta_id comes from the workspace row (`workspace.pesertaId`).

- [ ] **Step 1: Replace routes file**

Replace `apps/backend-hono/src/dokumen/dokumen.routes.ts` with:

```ts
import { Hono } from 'hono'
import { z } from 'zod'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { requireRole } from '../auth/roles'
import { errorResponse } from '../common/errors'
import type { Workspace } from '../db/schema'
import { requireWorkspace } from '../workspace/workspace.middleware'
import { WorkspaceService } from '../workspace/workspace.service'
import { DokumenService } from './dokumen.service'

type Variables = AuthVariables & { requestId: string; workspace: Workspace }
type DokumenServiceLike = Pick<
  DokumenService,
  | 'getKategoriForCourse'
  | 'getJenisByKategoriAndCourse'
  | 'getStatus'
  | 'upload'
  | 'delete'
>

export function createDokumenRoutes(deps: {
  dokumenService?: DokumenServiceLike
  workspaceService?: Pick<WorkspaceService, 'findByUserAndSlug'>
} = {}) {
  const dokumenService: DokumenServiceLike = deps.dokumenService ?? new DokumenService()
  const workspaceService = deps.workspaceService ?? new WorkspaceService()
  const app = new Hono<{ Variables: Variables }>()

  const workspaceGuard = requireWorkspace(workspaceService)

  app.get(
    '/dokumen/kategori',
    requireAuth,
    requireRole(['peserta', 'admin']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      return c.json(await dokumenService.getKategoriForCourse(ws.courseId))
    },
  )

  app.get(
    '/dokumen/jenis/:kategoriId',
    requireAuth,
    requireRole(['peserta', 'admin']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      const kategoriId = c.req.param('kategoriId')
      return c.json(await dokumenService.getJenisByKategoriAndCourse(kategoriId, ws.courseId))
    },
  )

  app.get(
    '/dokumen/status',
    requireAuth,
    requireRole(['peserta']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      return c.json(await dokumenService.getStatus(ws.id))
    },
  )

  app.post(
    '/dokumen/upload',
    requireAuth,
    requireRole(['peserta']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      const body = await c.req.parseBody()
      const file = body.file
      const jenisId = body.jenisId
      if (!(file instanceof File))
        return errorResponse(c, 400, 'VALIDATION_ERROR', 'file is required')
      if (typeof jenisId !== 'string' || !z.string().uuid().safeParse(jenisId).success)
        return errorResponse(c, 400, 'VALIDATION_ERROR', 'valid jenisId is required')

      try {
        const result = await dokumenService.upload({
          file,
          jenisId,
          workspaceId: ws.id,
          pesertaId: ws.pesertaId,
          courseId: ws.courseId,
        })
        return c.json(result, 201)
      } catch (err) {
        if (err instanceof Error && err.message === 'INVALID_DOCUMENT_TYPE') {
          return errorResponse(
            c,
            400,
            'INVALID_DOCUMENT_TYPE',
            'Document type does not belong to this workspace program',
          )
        }
        throw err
      }
    },
  )

  app.delete(
    '/dokumen/:id',
    requireAuth,
    requireRole(['peserta']),
    workspaceGuard,
    async (c) => {
      const ws = c.get('workspace')
      return c.json(await dokumenService.delete(c.req.param('id'), ws.id))
    },
  )

  return app
}
```

- [ ] **Step 2: Write integration tests**

Create or replace `apps/backend-hono/src/dokumen/dokumen.routes.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'
import { createApp } from '../app'
import { createDokumenRoutes } from './dokumen.routes'

const fakeWorkspace = {
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
}

function appWith(dokumenService: any, workspaceService: any = {
  findByUserAndSlug: async (userId: string, slug: string) =>
    slug === 'b1-trainers' && userId === 'user_1' ? fakeWorkspace : null,
}) {
  const app = createApp({ testUser: { id: 'user_1', email: 'u@e.com', name: 'U', role: 'peserta' } })
  app.route('/api', createDokumenRoutes({ dokumenService, workspaceService }))
  return app
}

describe('GET /api/dokumen/kategori (workspace-scoped)', () => {
  it('returns 400 when X-Workspace-Slug missing', async () => {
    const app = appWith({ getKategoriForCourse: async () => [] })
    const res = await app.request('/api/dokumen/kategori')
    expect(res.status).toBe(400)
  })

  it('returns 404 when slug does not belong to user', async () => {
    const app = appWith({ getKategoriForCourse: async () => [] })
    const res = await app.request('/api/dokumen/kategori', {
      headers: { 'X-Workspace-Slug': 'b99-fake' },
    })
    expect(res.status).toBe(404)
  })

  it('returns kategori filtered by workspace courseId', async () => {
    const dokumenService = {
      getKategoriForCourse: vi.fn().mockResolvedValue([{ id: 'k', nama: 'Identitas' }]),
    }
    const app = appWith(dokumenService)
    const res = await app.request('/api/dokumen/kategori', {
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(200)
    expect(dokumenService.getKategoriForCourse).toHaveBeenCalledWith('course_1')
    expect(await res.json()).toEqual([{ id: 'k', nama: 'Identitas' }])
  })
})

describe('GET /api/dokumen/status', () => {
  it('returns workspace dokumen status', async () => {
    const dokumenService = {
      getStatus: vi.fn().mockResolvedValue([
        { id: 'd1', jenisId: 'j1', jenisNama: 'KTP', fileUrl: 'https://x', status: 'pending' },
      ]),
    }
    const app = appWith(dokumenService)
    const res = await app.request('/api/dokumen/status', {
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(200)
    expect(dokumenService.getStatus).toHaveBeenCalledWith('ws_1')
  })
})

describe('POST /api/dokumen/upload', () => {
  it('uploads a document', async () => {
    const upload = vi.fn().mockResolvedValue({ id: 'd_new' })
    const dokumenService = { upload }
    const app = appWith(dokumenService)

    const formData = new FormData()
    formData.set('file', new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' }))
    formData.set('jenisId', '00000000-0000-4000-8000-000000000001')

    const res = await app.request('/api/dokumen/upload', {
      method: 'POST',
      body: formData,
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })

    expect(res.status).toBe(201)
    expect(upload).toHaveBeenCalledWith(
      expect.objectContaining({
        jenisId: '00000000-0000-4000-8000-000000000001',
        workspaceId: 'ws_1',
        pesertaId: 'peserta_1',
        courseId: 'course_1',
      }),
    )
  })

  it('returns 400 for INVALID_DOCUMENT_TYPE', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('INVALID_DOCUMENT_TYPE'))
    const dokumenService = { upload }
    const app = appWith(dokumenService)

    const formData = new FormData()
    formData.set('file', new File([new Uint8Array([1])], 'a.pdf', { type: 'application/pdf' }))
    formData.set('jenisId', '00000000-0000-4000-8000-000000000002')

    const res = await app.request('/api/dokumen/upload', {
      method: 'POST',
      body: formData,
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })

    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/dokumen/:id', () => {
  it('deletes a workspace-scoped dokumen', async () => {
    const del = vi.fn().mockResolvedValue({ success: true })
    const dokumenService = { delete: del }
    const app = appWith(dokumenService)
    const res = await app.request('/api/dokumen/00000000-0000-4000-8000-000000000003', {
      method: 'DELETE',
      headers: { 'X-Workspace-Slug': 'b1-trainers' },
    })
    expect(res.status).toBe(200)
    expect(del).toHaveBeenCalledWith('00000000-0000-4000-8000-000000000003', 'ws_1')
  })
})
```

- [ ] **Step 3: Run all backend tests**

```bash
cd apps/backend-hono
bun run typecheck
bun run test
```

Expected: typecheck clean, all dokumen tests + workspace tests + others pass (only pre-existing `bun:test` failures remain).

- [ ] **Step 4: Commit**

```bash
git add apps/backend-hono/src/dokumen/dokumen.routes.ts apps/backend-hono/src/dokumen/dokumen.routes.test.ts
git commit -m "feat(dokumen): apply requireWorkspace and use workspace context"
```

---

## Task 5: Frontend — workspace-aware axios + useDokumen update

**Files:**
- Create: `apps/frontend/src/api/workspace-axios.ts`
- Modify: `apps/frontend/src/views/dokumen/hooks/useDokumen.ts`

The frontend axios instance gets a request interceptor that reads the workspace slug from `window.location.pathname` (URL is the source of truth) and adds `X-Workspace-Slug`. Reserved root segments (`auth`, `admin`, `profile`, `settings`, `billing`, `workspaces`, `api`, `static`, `assets`) are skipped.

- [ ] **Step 1: Create workspace-aware axios**

Create `apps/frontend/src/api/workspace-axios.ts`:

```ts
import api from './axios'

const RESERVED = new Set([
  'auth',
  'admin',
  'profile',
  'settings',
  'billing',
  'workspaces',
  'api',
  'static',
  'assets',
  'user', // legacy /user/* still rendering during migration
])

export function readCurrentWorkspaceSlug(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)/)
  if (!match) return null
  const segment = match[1]
  if (!segment || RESERVED.has(segment.toLowerCase())) return null
  return segment
}

let interceptorInstalled = false
export function ensureWorkspaceAxiosInterceptor() {
  if (interceptorInstalled) return
  interceptorInstalled = true
  api.interceptors.request.use((config) => {
    const slug = readCurrentWorkspaceSlug(window.location.pathname)
    if (slug) {
      config.headers = config.headers ?? {}
      config.headers['X-Workspace-Slug'] = slug
    }
    return config
  })
}

export default api
```

- [ ] **Step 2: Install the interceptor**

Edit `apps/frontend/src/main.tsx` (or `App.tsx`, wherever app boots). Add at top after axios is imported:

```ts
import { ensureWorkspaceAxiosInterceptor } from './api/workspace-axios'
ensureWorkspaceAxiosInterceptor()
```

If unsure where to put it, look at the existing axios setup. The call must happen before any axios request fires.

- [ ] **Step 3: Update `useDokumen.ts`**

Read the existing `apps/frontend/src/views/dokumen/hooks/useDokumen.ts` first. The dokumen API calls must continue to work — the interceptor handles header injection, so the hook itself usually doesn't need changes UNLESS it constructs URLs that bypass the workspace context. Adapt as needed: import from `../../api/workspace-axios` if it directly imports `axios`; the default export still works.

If the hook builds query keys for react-query, include the workspace slug in the key (read via `useOptionalWorkspace()` from `'../../../context/WorkspaceContext'`) so cached data switches when workspace switches.

Example shape (adapt to actual existing code):

```ts
import { useOptionalWorkspace } from 'src/context/WorkspaceContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from 'src/api/workspace-axios'

export function useDokumen() {
  const ws = useOptionalWorkspace()
  const slug = ws?.slug ?? 'no-workspace'

  const kategoriQuery = useQuery({
    queryKey: ['dokumen', slug, 'kategori'],
    queryFn: async () => (await api.get('/dokumen/kategori')).data,
    enabled: !!ws,
  })

  const statusQuery = useQuery({
    queryKey: ['dokumen', slug, 'status'],
    queryFn: async () => (await api.get('/dokumen/status')).data,
    enabled: !!ws,
  })

  // mutations: upload + delete with cache invalidation on `['dokumen', slug, ...]`

  return { kategoriQuery, statusQuery /* + jenisQuery, upload, remove */ }
}
```

Preserve the existing hook's API surface (what it returns) so `Dokumen.tsx` keeps working without rewrites. Only add workspace awareness internally.

- [ ] **Step 4: Verify typecheck**

```bash
cd apps/frontend
bun run build:check
```

Expected: typecheck passes.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/api/workspace-axios.ts apps/frontend/src/main.tsx apps/frontend/src/views/dokumen/hooks/useDokumen.ts
git commit -m "feat(workspace): workspace-aware axios + useDokumen scoping"
```

---

## Task 6: Frontend route — `/:slug/dokumen`

**Files:**
- Modify: `apps/frontend/src/routes/protectedRouteChildren.tsx`

- [ ] **Step 1: Move dokumen route under workspace wrapper**

Edit `apps/frontend/src/routes/protectedRouteChildren.tsx`:

1. Find the existing `/user/dokumen` route. **Remove it.**
2. Find the `/:slug` route entry created in Phase 1. It currently has `children: [{ index: true, element: <WorkspaceDashboard /> }]`. Add a `dokumen` child route:

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
  ],
},
```

The `<Dokumen />` lazy import already exists (was used by `/user/dokumen`). Reuse it.

- [ ] **Step 2: Verify typecheck**

```bash
cd apps/frontend
bun run build:check
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/routes/protectedRouteChildren.tsx
git commit -m "feat(workspace): move /dokumen under /:slug/dokumen"
```

---

## Task 7: Frontend — show workspace context in Dokumen view

**Files:**
- Modify: `apps/frontend/src/views/dokumen/Dokumen.tsx`

A small UX touch: the page shows which workspace the user is viewing. Helps confirm the filtering works.

- [ ] **Step 1: Add workspace label**

Edit `apps/frontend/src/views/dokumen/Dokumen.tsx`. Read the existing component first. Near the top of the rendered output, add:

```tsx
import { useWorkspace } from 'src/context/WorkspaceContext'

// inside component:
const ws = useWorkspace()

// in JSX:
<div className="text-sm text-muted-foreground mb-4">
  Dokumen untuk <span className="font-medium">{ws.displayName}</span>
</div>
```

If the existing layout has a header section, place it there. Don't restructure.

- [ ] **Step 2: Verify typecheck**

```bash
cd apps/frontend
bun run build:check
```

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/views/dokumen/Dokumen.tsx
git commit -m "feat(dokumen): show workspace context label in view"
```

---

## Task 8: Seed dokumen kategori, jenis, and program mapping

**Files:**
- Modify: `apps/backend-hono/scripts/seed-workspace.ts`

Extend the seed script with dokumen master data so the e2e check has something to render.

- [ ] **Step 1: Extend the seed**

Append to `apps/backend-hono/scripts/seed-workspace.ts`, after the workspace is created. Use idempotent upserts. Conceptually:

1. Ensure 1 kategori (e.g. "Persyaratan Trainer").
2. Ensure 4 jenis (e.g. "KTP", "NPWP", "Foto Profesional", "Surat Pernyataan Komitmen").
3. Ensure 4 rows in `dokumen_jenis_program` mapping each jenis to the seeded course (`trainers`), with `orderIndex` 1..4 and `required: true`.

```ts
// ... after workspace insert ...

// 8. Seed dokumen kategori
let kategoriRow = (
  await db.select().from(dokumenKategori).where(eq(dokumenKategori.nama, 'Persyaratan Trainer')).limit(1)
)[0]
if (!kategoriRow) {
  const [created] = await db
    .insert(dokumenKategori)
    .values({ nama: 'Persyaratan Trainer' })
    .returning()
  kategoriRow = created
}

// 9. Seed jenis (idempotent by namaJenis + kategoriId)
const jenisDefinitions = [
  { namaJenis: 'KTP', orderIndex: 1, required: true },
  { namaJenis: 'NPWP', orderIndex: 2, required: false },
  { namaJenis: 'Foto Profesional', orderIndex: 3, required: true },
  { namaJenis: 'Surat Pernyataan Komitmen', orderIndex: 4, required: true },
]
for (const def of jenisDefinitions) {
  const [existingJenis] = await db
    .select()
    .from(dokumenJenis)
    .where(and(eq(dokumenJenis.kategoriId, kategoriRow.id), eq(dokumenJenis.namaJenis, def.namaJenis)))
    .limit(1)
  const jenisRow =
    existingJenis ??
    (
      await db
        .insert(dokumenJenis)
        .values({
          kategoriId: kategoriRow.id,
          namaJenis: def.namaJenis,
          opsional: !def.required,
        })
        .returning()
    )[0]

  // 10. Seed junction
  const [existingMap] = await db
    .select()
    .from(dokumenJenisProgram)
    .where(
      and(
        eq(dokumenJenisProgram.jenisId, jenisRow.id),
        eq(dokumenJenisProgram.courseId, courseRow.id),
      ),
    )
    .limit(1)
  if (!existingMap) {
    await db.insert(dokumenJenisProgram).values({
      jenisId: jenisRow.id,
      courseId: courseRow.id,
      orderIndex: def.orderIndex,
      required: def.required,
    })
  }
}

console.log('[seed-workspace] dokumen kategori/jenis/junction seeded')
```

Update the imports at the top of the file to include `and`, `dokumenKategori`, `dokumenJenis`, `dokumenJenisProgram` from `drizzle-orm` and `../src/db/schema`.

- [ ] **Step 2: Run the seed**

```bash
cd apps/backend-hono
bun run scripts/seed-workspace.ts
```

Expected: console output indicates success, idempotent on re-run.

- [ ] **Step 3: Verify**

```bash
psql $DATABASE_URL -c "SELECT count(*) FROM dokumen_kategori;"
# >= 1
psql $DATABASE_URL -c "SELECT count(*) FROM dokumen_jenis;"
# >= 4
psql $DATABASE_URL -c "SELECT count(*) FROM dokumen_jenis_program WHERE course_id = (SELECT id FROM courses WHERE short_code = 'trainers');"
# >= 4
```

- [ ] **Step 4: Commit**

```bash
git add apps/backend-hono/scripts/seed-workspace.ts
git commit -m "chore(workspace): seed dokumen kategori/jenis with program mapping"
```

---

## Task 9: End-to-end smoke

**Files:**
- None modified. Manual / programmatic verification only.

- [ ] **Step 1: Run all backend tests**

```bash
cd apps/backend-hono
bun run typecheck
bun run test
```

Expected: typecheck clean, all new + existing tests pass (modulo the 3 pre-existing `bun:test` import failures).

- [ ] **Step 2: Run frontend build:check**

```bash
cd apps/frontend
bun run build:check
```

Expected: typecheck + vite build pass.

- [ ] **Step 3: Programmatic smoke**

Start backend:

```bash
cd apps/backend-hono
bun run dev > /tmp/backend.log 2>&1 &
echo $! > /tmp/backend.pid
sleep 4
```

Hit the workspace dokumen API as the seeded user. Without auth this should return 401:

```bash
curl -i http://localhost:3001/api/dokumen/kategori
# expect 401 (no session) — confirms route is reachable and requires auth
curl -i -H "X-Workspace-Slug: b1-trainers" http://localhost:3001/api/dokumen/kategori
# expect 401 (still — no session). Confirms workspace check is downstream of auth.
```

Kill backend:

```bash
kill "$(cat /tmp/backend.pid)"
```

- [ ] **Step 4: Manual browser verification (user-driven)**

This step is for you (the human user), not the implementer subagent. After Phase 2a is done:

1. Start backend and frontend.
2. Log in as `seed-user-1@example.com` (set password via Better Auth flow if needed).
3. Visit `/b1-trainers/dokumen`.
4. Expected: page shows label "Dokumen untuk Training for Trainers - Batch 1" and exactly 4 jenis (KTP, NPWP, Foto Profesional, Surat Pernyataan Komitmen).
5. Visit `/user/dokumen` — expected 404 (route removed).
6. Switch to a different workspace (if any) — list of jenis should be different (or empty for unmapped courses).

- [ ] **Step 5: No commit for this task**

This task is verification-only. Nothing to stage.

---

## Self-Review

After all 9 tasks complete, run this checklist:

**1. Spec coverage check** (Phase 2a deliverables):

- [x] Section 3.2 — `dokumen_jenis_program` junction with order_index + required → Task 1.
- [x] Section 3.3 — `workspace_id` NOT NULL on `dokumen_peserta` → Task 1.
- [x] Section 4.4 — slug resolution middleware (header-based for Phase 2a; future phases may move to path param) → Task 2.
- [x] Dokumen view filtered per program (the 8-field fix) → Tasks 3, 4, 5, 6, 7, 8.
- [x] Backend service uses workspace_id for all CRUD → Tasks 3, 4.
- [x] Frontend dokumen view uses workspace context → Tasks 5, 6, 7.

**2. Out of scope (explicit deferrals):**
- Other modules (todos, sertifikat, kelas, tugas, AI) → Phase 2b.
- Backend slug-resolution via path param (`/api/workspaces/:slug/...`) → Future. Phase 2a uses header which is simpler and equivalent for the current frontend flow.
- Admin awareness of workspace_id in dokumen queries → Phase 4.

**3. Placeholder scan:** None expected. All code blocks have full content.

**4. Type consistency:**
- `Workspace` type is the same across phases (Drizzle inferred).
- `requireWorkspace` middleware sets `workspace` in Hono context; `dokumen.routes.ts` reads it via `c.get('workspace')`.
- Service methods consistently take `workspaceId` (not `userId`) for scoped operations.
- Frontend `useDokumen` returns the same surface API as before, internally workspace-aware.

**5. Known limitations:**
- Removing `/user/dokumen` is a breaking change. Acceptable for alpha (0 users). Phase 2b will follow the same pattern for other `/user/*` routes.
- Workspace switching in `useDokumen` triggers refetch via slug-keyed react-query keys; no manual cache invalidation needed.
- The `RESERVED` list in `workspace-axios.ts` includes `'user'` to prevent the legacy path (during partial migration) from triggering header injection.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-18-workspace-phase-2a-dokumen.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — same flow as Phase 1.

**2. Inline Execution** — manual task-by-task in this session.

**Which approach?**
