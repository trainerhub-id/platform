# Admin Batch Enrollment Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the admin flow around batch workspaces, enrollment-scoped operations, payment-gated access, Scalev-safe batch offerings, global enrollment search, and a single audit log.

**Architecture:** Backend domain rules become the source of truth first: `peserta` is identity, `peserta_batch` is enrollment, `batch_tiers` is the sellable Scalev-synced offering, and `audit_logs` records admin mutations. Frontend then moves from global participant management to a batch-first workspace with global search as a shortcut into enrollment context.

**Tech Stack:** Hono, Drizzle ORM, Postgres, Vitest, React, Vite, TanStack Table, existing UI primitives, existing `api` Axios client.

---

## Scope Notes

This is a multi-subsystem change. Keep execution in this order so every phase produces working software:

1. Backend safety: enrollment access, payment status, audit log, Scalev sync status.
2. Backend admin APIs: batch workspace, enrollment search, audit log reads.
3. Frontend IA: route/menu rename and batch-first workspace.
4. Frontend workflows: create batch wizard, member operations, document/certificate queues.

Do not deploy beta with Wrangler. For beta deployment on this machine use `./scripts/deploy-beta.sh` from the repo root.

## File Structure

Backend files:

- Create: `apps/backend-hono/src/audit/audit-log.repository.ts`  
  Inserts and queries append-only audit events.
- Create: `apps/backend-hono/src/audit/audit-log.service.ts`  
  Normalizes audit event actions and actor metadata.
- Create: `apps/backend-hono/src/audit/audit-log.routes.ts`  
  Admin-only audit log query endpoint.
- Create: `apps/backend-hono/src/audit/audit-log.service.test.ts`  
  Unit tests for audit payload normalization.
- Modify: `apps/backend-hono/src/db/schema/batch.ts`  
  Adds enrollment lifecycle fields and Scalev sync fields.
- Modify: `apps/backend-hono/src/db/schema/index.ts`  
  Exports the audit schema.
- Create: `apps/backend-hono/src/db/schema/audit.ts`  
  Defines `audit_logs`.
- Create: `apps/backend-hono/src/enrollment/enrollment.repository.ts`  
  Encapsulates `peserta_batch` joins, paid access, and search.
- Create: `apps/backend-hono/src/enrollment/enrollment.service.ts`  
  Applies enrollment rules: paid access only, membership rows, search output.
- Create: `apps/backend-hono/src/enrollment/enrollment.routes.ts`  
  Admin batch enrollment APIs and global enrollment search.
- Create: `apps/backend-hono/src/enrollment/enrollment.service.test.ts`  
  Unit tests for access and search mapping.
- Modify: `apps/backend-hono/src/peserta/peserta.service.ts`  
  Replaces global profile payment access with paid enrollment access.
- Modify: `apps/backend-hono/src/peserta/peserta.service.test.ts`  
  Tests that unpaid enrollment gives no AI/course access.
- Modify: `apps/backend-hono/src/payment/payment.repository.ts`  
  Stores payment snapshots, updates Scalev sync state, finds sessions for enrollment activation.
- Modify: `apps/backend-hono/src/payment/payment.service.ts`  
  Activates enrollment only on paid payment and writes audit events.
- Modify: `apps/backend-hono/src/payment/payment.service.test.ts`  
  Tests pending payment does not grant access and paid payment activates enrollment.
- Modify: `apps/backend-hono/src/payment/payment.routes.ts`  
  Preserves existing public/admin routes; adds explicit sync status behavior.
- Modify: `apps/backend-hono/src/batch/batch.repository.ts`  
  Returns batch workspace counts and enrollment summaries.
- Modify: `apps/backend-hono/src/batch/batch.service.ts`  
  Adds batch lifecycle validations.
- Modify: `apps/backend-hono/src/batch/batch.routes.ts`  
  Adds workspace endpoint and publish endpoint.
- Modify: `apps/backend-hono/src/app.ts`  
  Registers audit and enrollment routes.

Frontend files:

- Modify: `apps/frontend/src/layouts/full/vertical/sidebar/Sidebaritems.ts`  
  Renames admin menu to batch-first IA.
- Modify: `apps/frontend/src/routes/protectedRouteChildren.tsx`  
  Adds new admin batch detail route and search route targets.
- Create: `apps/frontend/src/views/admin/batches/AdminBatchList.tsx`  
  Batch-first list with lifecycle filters and task counts.
- Create: `apps/frontend/src/views/admin/batches/AdminBatchDetail.tsx`  
  Batch workspace tabs: overview, member, dokumen, sertifikat, paket, mentor, materi, checkout, activity, export.
- Create: `apps/frontend/src/views/admin/batches/CreateBatchWizard.tsx`  
  Step-by-step batch creation and publish preflight.
- Create: `apps/frontend/src/views/admin/batches/hooks/useAdminBatchWorkspace.ts`  
  Fetches batch workspace data.
- Create: `apps/frontend/src/views/admin/batches/components/EnrollmentTable.tsx`  
  Member operation table scoped to one batch.
- Create: `apps/frontend/src/views/admin/batches/components/BatchPackagePanel.tsx`  
  Batch tier price, Scalev sync status, checkout links.
- Create: `apps/frontend/src/views/admin/components/AdminGlobalSearch.tsx`  
  Header search for participant/enrollment lookup.
- Modify: `apps/frontend/src/views/admin/tier-management/TierManagement.tsx`  
  Rename copy from tier template language to Paket & Akses.
- Modify: `apps/frontend/src/views/admin/components/BatchTierSection.tsx`  
  Shows Scalev sync status and stale/failed state.
- Modify: `apps/frontend/src/views/admin/AdminHome.tsx`  
  Converts dashboard into task queue.

## Task 1: Add Audit Log Schema and Service

**Files:**
- Create: `apps/backend-hono/src/db/schema/audit.ts`
- Modify: `apps/backend-hono/src/db/schema/index.ts`
- Create: `apps/backend-hono/src/audit/audit-log.service.ts`
- Create: `apps/backend-hono/src/audit/audit-log.repository.ts`
- Create: `apps/backend-hono/src/audit/audit-log.service.test.ts`

- [ ] **Step 1: Write the failing audit service test**

Create `apps/backend-hono/src/audit/audit-log.service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { AuditLogService } from "./audit-log.service";

describe("AuditLogService", () => {
  it("records normalized admin actor and entity metadata", async () => {
    const events: unknown[] = [];
    const service = new AuditLogService({
      repository: {
        create: async (input) => {
          events.push(input);
          return { id: "audit_1", ...input, createdAt: new Date("2026-05-15T00:00:00.000Z") };
        },
        findMany: async () => [],
      },
    });

    await service.record({
      actor: { id: "admin_1", email: "admin@example.com", name: "Admin Satu" },
      action: "batch_tier.price_updated",
      entityType: "batch_tier",
      entityId: "tier_1",
      batchId: "batch_1",
      before: { price: 2000000 },
      after: { price: 2500000 },
      metadata: { reason: "promo closed" },
      requestId: "req_1",
      ipAddress: "127.0.0.1",
      userAgent: "vitest",
    });

    expect(events).toEqual([
      {
        actorUserId: "admin_1",
        actorEmail: "admin@example.com",
        actorName: "Admin Satu",
        action: "batch_tier.price_updated",
        entityType: "batch_tier",
        entityId: "tier_1",
        batchId: "batch_1",
        enrollmentId: null,
        pesertaId: null,
        before: { price: 2000000 },
        after: { price: 2500000 },
        metadata: { reason: "promo closed" },
        requestId: "req_1",
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      },
    ]);
  });
});
```

- [ ] **Step 2: Run the failing audit test**

Run:

```bash
cd apps/backend-hono && bun test src/audit/audit-log.service.test.ts
```

Expected: FAIL because `src/audit/audit-log.service.ts` does not exist.

- [ ] **Step 3: Add the audit schema**

Create `apps/backend-hono/src/db/schema/audit.ts`:

```ts
import { jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { batchTraining, pesertaBatch } from "./batch";
import { peserta } from "./people";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: text("actor_user_id"),
  actorEmail: varchar("actor_email", { length: 255 }),
  actorName: varchar("actor_name", { length: 255 }),
  action: varchar("action", { length: 120 }).notNull(),
  entityType: varchar("entity_type", { length: 80 }).notNull(),
  entityId: text("entity_id").notNull(),
  batchId: uuid("batch_id").references(() => batchTraining.id, { onDelete: "set null" }),
  enrollmentId: uuid("enrollment_id").references(() => pesertaBatch.id, { onDelete: "set null" }),
  pesertaId: uuid("peserta_id").references(() => peserta.id, { onDelete: "set null" }),
  before: jsonb("before").$type<Record<string, unknown> | null>(),
  after: jsonb("after").$type<Record<string, unknown> | null>(),
  metadata: jsonb("metadata").$type<Record<string, unknown> | null>(),
  requestId: text("request_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
```

Modify `apps/backend-hono/src/db/schema/index.ts`:

```ts
export * from "./auth";
export * from "./audit";
export * from "./batch";
export * from "./certificates";
export * from "./documents";
export * from "./dokumen";
export * from "./learning";
export * from "./people";
export * from "./todos";
export * from "./tugas";
```

- [ ] **Step 4: Add repository and service**

Create `apps/backend-hono/src/audit/audit-log.repository.ts`:

```ts
import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import { auditLogs, type NewAuditLog } from "../db/schema";

export type AuditLogFilter = {
  batchId?: string;
  enrollmentId?: string;
  pesertaId?: string;
  limit?: number;
};

export class AuditLogRepository {
  async create(input: NewAuditLog) {
    const [row] = await db.insert(auditLogs).values(input).returning();
    if (!row) throw new Error("AUDIT_LOG_CREATE_FAILED");
    return row;
  }

  async findMany(filter: AuditLogFilter = {}) {
    const conditions: SQL[] = [];
    if (filter.batchId) conditions.push(eq(auditLogs.batchId, filter.batchId));
    if (filter.enrollmentId) conditions.push(eq(auditLogs.enrollmentId, filter.enrollmentId));
    if (filter.pesertaId) conditions.push(eq(auditLogs.pesertaId, filter.pesertaId));

    const query = db.select().from(auditLogs);
    const scoped = conditions.length > 0 ? query.where(and(...conditions)) : query;
    return scoped.orderBy(desc(auditLogs.createdAt)).limit(filter.limit ?? 100);
  }
}
```

Create `apps/backend-hono/src/audit/audit-log.service.ts`:

```ts
import { AuditLogRepository, type AuditLogFilter } from "./audit-log.repository";

type Actor = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
};

type AuditRecordInput = {
  actor?: Actor | null;
  action: string;
  entityType: string;
  entityId: string;
  batchId?: string | null;
  enrollmentId?: string | null;
  pesertaId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

type AuditLogRepositoryLike = Pick<AuditLogRepository, "create" | "findMany">;

export class AuditLogService {
  private readonly repository: AuditLogRepositoryLike;

  constructor(deps: { repository?: AuditLogRepositoryLike } = {}) {
    this.repository = deps.repository ?? new AuditLogRepository();
  }

  async record(input: AuditRecordInput) {
    return this.repository.create({
      actorUserId: input.actor?.id ?? null,
      actorEmail: input.actor?.email ?? null,
      actorName: input.actor?.name ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      batchId: input.batchId ?? null,
      enrollmentId: input.enrollmentId ?? null,
      pesertaId: input.pesertaId ?? null,
      before: input.before ?? null,
      after: input.after ?? null,
      metadata: input.metadata ?? null,
      requestId: input.requestId ?? null,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    });
  }

  async findMany(filter: AuditLogFilter) {
    return this.repository.findMany(filter);
  }
}
```

- [ ] **Step 5: Run audit test**

Run:

```bash
cd apps/backend-hono && bun test src/audit/audit-log.service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Generate migration**

Run:

```bash
cd apps/backend-hono && bun run db:generate
```

Expected: Drizzle creates a migration under `apps/backend-hono/drizzle/`.

- [ ] **Step 7: Commit audit foundation**

Run:

```bash
git add apps/backend-hono/src/db/schema/audit.ts apps/backend-hono/src/db/schema/index.ts apps/backend-hono/src/audit apps/backend-hono/drizzle
git commit -m "feat: add admin audit log foundation"
```

## Task 2: Add Enrollment Repository and Paid Access Rules

**Files:**
- Create: `apps/backend-hono/src/enrollment/enrollment.repository.ts`
- Create: `apps/backend-hono/src/enrollment/enrollment.service.ts`
- Create: `apps/backend-hono/src/enrollment/enrollment.service.test.ts`
- Modify: `apps/backend-hono/src/peserta/peserta.service.ts`
- Modify: `apps/backend-hono/src/peserta/peserta.service.test.ts`

- [ ] **Step 1: Write enrollment access tests**

Create `apps/backend-hono/src/enrollment/enrollment.service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { EnrollmentService } from "./enrollment.service";

describe("EnrollmentService", () => {
  it("returns access only from paid enrollments", async () => {
    const service = new EnrollmentService({
      repository: {
        findAccessByPesertaId: async () => [
          {
            enrollmentId: "enroll_paid",
            paymentStatus: "paid",
            tierName: "Trainer",
            courseIds: ["course_trainer"],
            aiFeatures: ["trainer"],
            benefits: ["Trainer class"],
          },
          {
            enrollmentId: "enroll_pending",
            paymentStatus: "pending",
            tierName: "Master",
            courseIds: ["course_master"],
            aiFeatures: ["master"],
            benefits: ["Master class"],
          },
        ],
        search: async () => [],
        listBatchEnrollments: async () => [],
        setPaymentStatus: async () => ({ id: "enroll_paid" }),
      },
    });

    await expect(service.getPaidAccess("peserta_1")).resolves.toEqual({
      hasTier: true,
      tierNames: ["Trainer"],
      aiFeatures: ["trainer"],
      courseIds: ["course_trainer"],
      benefits: ["Trainer class"],
      enrollments: [{ enrollmentId: "enroll_paid", tierName: "Trainer", paymentStatus: "paid" }],
    });
  });

  it("returns no access when every enrollment is unpaid", async () => {
    const service = new EnrollmentService({
      repository: {
        findAccessByPesertaId: async () => [
          {
            enrollmentId: "enroll_pending",
            paymentStatus: "pending",
            tierName: "Master",
            courseIds: ["course_master"],
            aiFeatures: ["master"],
            benefits: ["Master class"],
          },
        ],
        search: async () => [],
        listBatchEnrollments: async () => [],
        setPaymentStatus: async () => ({ id: "enroll_pending" }),
      },
    });

    await expect(service.getPaidAccess("peserta_1")).resolves.toEqual({
      hasTier: false,
      tierNames: [],
      aiFeatures: [],
      courseIds: [],
      benefits: [],
      enrollments: [],
    });
  });
});
```

- [ ] **Step 2: Run failing enrollment tests**

Run:

```bash
cd apps/backend-hono && bun test src/enrollment/enrollment.service.test.ts
```

Expected: FAIL because enrollment service does not exist.

- [ ] **Step 3: Implement enrollment repository**

Create `apps/backend-hono/src/enrollment/enrollment.repository.ts`:

```ts
import { and, eq, getTableColumns, ilike, or, sql } from "drizzle-orm";
import { db } from "../db/client";
import { batchTiers, batchTraining, peserta, pesertaBatch } from "../db/schema";

export type EnrollmentAccessRow = {
  enrollmentId: string;
  paymentStatus: string;
  tierName: string | null;
  courseIds: string[] | null;
  aiFeatures: string[] | null;
  benefits: string[] | null;
};

export class EnrollmentRepository {
  async findAccessByPesertaId(pesertaId: string): Promise<EnrollmentAccessRow[]> {
    return db
      .select({
        enrollmentId: pesertaBatch.id,
        paymentStatus: pesertaBatch.paymentStatus,
        tierName: batchTiers.name,
        courseIds: batchTiers.courseIds,
        aiFeatures: batchTiers.aiFeatures,
        benefits: batchTiers.benefits,
      })
      .from(pesertaBatch)
      .leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
      .where(eq(pesertaBatch.pesertaId, pesertaId));
  }

  async listBatchEnrollments(batchId: string) {
    return db
      .select({
        ...getTableColumns(pesertaBatch),
        pesertaName: peserta.nama,
        pesertaEmail: peserta.email,
        pesertaPhone: peserta.noWa,
        tierName: batchTiers.name,
        tierSlug: batchTiers.slug,
      })
      .from(pesertaBatch)
      .innerJoin(peserta, eq(pesertaBatch.pesertaId, peserta.id))
      .leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
      .where(eq(pesertaBatch.batchId, batchId));
  }

  async search(query: string) {
    const pattern = `%${query}%`;
    return db
      .select({
        enrollmentId: pesertaBatch.id,
        pesertaId: peserta.id,
        pesertaName: peserta.nama,
        pesertaEmail: peserta.email,
        pesertaPhone: peserta.noWa,
        batchId: batchTraining.id,
        batchName: batchTraining.namaBatch,
        batchSlug: batchTraining.slug,
        tierId: batchTiers.id,
        tierName: batchTiers.name,
        paymentStatus: pesertaBatch.paymentStatus,
        enrollmentStatus: pesertaBatch.status,
      })
      .from(pesertaBatch)
      .innerJoin(peserta, eq(pesertaBatch.pesertaId, peserta.id))
      .innerJoin(batchTraining, eq(pesertaBatch.batchId, batchTraining.id))
      .leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
      .where(or(ilike(peserta.nama, pattern), ilike(peserta.email, pattern), ilike(peserta.noWa, pattern), ilike(batchTraining.namaBatch, pattern)))
      .limit(20);
  }

  async setPaymentStatus(input: { enrollmentId: string; paymentStatus: string; enrollmentStatus?: string }) {
    const [row] = await db
      .update(pesertaBatch)
      .set({
        paymentStatus: input.paymentStatus,
        status: input.enrollmentStatus ?? (input.paymentStatus === "paid" ? "active" : "registered"),
        updatedAt: new Date(),
      })
      .where(eq(pesertaBatch.id, input.enrollmentId))
      .returning();
    if (!row) throw new Error("ENROLLMENT_NOT_FOUND");
    return row;
  }
}
```

- [ ] **Step 4: Implement enrollment service**

Create `apps/backend-hono/src/enrollment/enrollment.service.ts`:

```ts
import { EnrollmentRepository, type EnrollmentAccessRow } from "./enrollment.repository";

type EnrollmentRepositoryLike = Pick<EnrollmentRepository, "findAccessByPesertaId" | "listBatchEnrollments" | "search" | "setPaymentStatus">;

const unique = (values: string[]) => Array.from(new Set(values));

export class EnrollmentService {
  private readonly repository: EnrollmentRepositoryLike;

  constructor(deps: { repository?: EnrollmentRepositoryLike } = {}) {
    this.repository = deps.repository ?? new EnrollmentRepository();
  }

  async getPaidAccess(pesertaId: string) {
    const rows = await this.repository.findAccessByPesertaId(pesertaId);
    const paidRows = rows.filter((row) => row.paymentStatus === "paid");

    return {
      hasTier: paidRows.length > 0,
      tierNames: unique(paidRows.map((row) => row.tierName).filter((value): value is string => Boolean(value))),
      aiFeatures: unique(paidRows.flatMap((row) => this.arrayOrEmpty(row.aiFeatures))),
      courseIds: unique(paidRows.flatMap((row) => this.arrayOrEmpty(row.courseIds))),
      benefits: unique(paidRows.flatMap((row) => this.arrayOrEmpty(row.benefits))),
      enrollments: paidRows.map((row) => ({
        enrollmentId: row.enrollmentId,
        tierName: row.tierName,
        paymentStatus: row.paymentStatus,
      })),
    };
  }

  async listBatchEnrollments(batchId: string) {
    return this.repository.listBatchEnrollments(batchId);
  }

  async search(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < 2) return [];
    return this.repository.search(trimmed);
  }

  async markPaid(enrollmentId: string) {
    return this.repository.setPaymentStatus({ enrollmentId, paymentStatus: "paid", enrollmentStatus: "active" });
  }

  private arrayOrEmpty(value: EnrollmentAccessRow["aiFeatures"]) {
    return Array.isArray(value) ? value : [];
  }
}
```

- [ ] **Step 5: Run enrollment tests**

Run:

```bash
cd apps/backend-hono && bun test src/enrollment/enrollment.service.test.ts
```

Expected: PASS.

- [ ] **Step 6: Update peserta access service**

Modify `apps/backend-hono/src/peserta/peserta.service.ts`:

```ts
import { EnrollmentService } from "../enrollment/enrollment.service";
import { PesertaRepository, type CreatePesertaInput, type UpdatePesertaInput } from "./peserta.repository";

type PesertaRecord = {
  id: string;
  clerkId: string;
  nama: string;
  email: string;
  [key: string]: unknown;
};

type PesertaRepositoryLike = {
  create(input: CreatePesertaInput): Promise<PesertaRecord>;
  findByClerkId(clerkId: string): Promise<PesertaRecord | null>;
  findByEmail(email: string): Promise<PesertaRecord | null>;
  findById(id: string): Promise<PesertaRecord | null>;
  linkClerkId(id: string, clerkId: string): Promise<void>;
  update(id: string, input: UpdatePesertaInput): Promise<PesertaRecord>;
};

type EnrollmentServiceLike = Pick<EnrollmentService, "getPaidAccess">;

export class PesertaService {
  private readonly repository: PesertaRepositoryLike;
  private readonly enrollmentService: EnrollmentServiceLike;

  constructor(deps: { repository?: PesertaRepositoryLike; enrollmentService?: EnrollmentServiceLike } = {}) {
    this.repository = deps.repository ?? new PesertaRepository();
    this.enrollmentService = deps.enrollmentService ?? new EnrollmentService();
  }

  async create(userId: string, input: Omit<CreatePesertaInput, "clerkId">) {
    return this.repository.create({ ...input, clerkId: userId });
  }

  async getProfile(userId: string, email?: string) {
    let profile = await this.repository.findByClerkId(userId);
    if (!profile && email) {
      profile = await this.repository.findByEmail(email);
      if (profile && profile.clerkId !== userId) {
        await this.repository.linkClerkId(profile.id, userId);
        profile = { ...profile, clerkId: userId };
      }
    }

    if (!profile) {
      return {
        id: "00000000-0000-0000-0000-000000000000",
        clerkId: userId,
        nama: "Admin User",
        email: email ?? "admin@trainerhub.com",
        paymentStatus: "paid",
      };
    }

    return profile;
  }

  async update(userId: string, input: UpdatePesertaInput, email?: string) {
    const profile = await this.getProfile(userId, email);
    if (profile.id === "00000000-0000-0000-0000-000000000000") throw new Error("PESERTA_NOT_FOUND");
    if (profile.clerkId !== userId) throw new Error("FORBIDDEN");
    return this.repository.update(profile.id, input);
  }

  async getAccess(userId: string, email?: string) {
    const profile = await this.getProfile(userId, email);
    if (profile.id === "00000000-0000-0000-0000-000000000000") {
      return { hasTier: false, tierName: null, tierNames: [], aiFeatures: [], courseIds: [], benefits: [], enrollments: [] };
    }

    const access = await this.enrollmentService.getPaidAccess(profile.id);
    return {
      ...access,
      tierName: access.tierNames[0] ?? null,
    };
  }
}
```

- [ ] **Step 7: Add peserta service regression test**

Append to `apps/backend-hono/src/peserta/peserta.service.test.ts`:

```ts
it("does not grant access from profile payment status without paid enrollment", async () => {
  const service = new PesertaService({
    repository: {
      create: async (input: any) => ({ id: "peserta_1", ...input }),
      findByClerkId: async () => ({ id: "peserta_1", clerkId: "user_1", nama: "Budi", email: "budi@example.com", paymentStatus: "paid" }),
      findByEmail: async () => null,
      findById: async () => null,
      linkClerkId: async () => undefined,
      update: async (_id: string, input: any) => ({ id: "peserta_1", clerkId: "user_1", nama: "Budi", email: "budi@example.com", ...input }),
    },
    enrollmentService: {
      getPaidAccess: async () => ({ hasTier: false, tierNames: [], aiFeatures: [], courseIds: [], benefits: [], enrollments: [] }),
    },
  });

  await expect(service.getAccess("user_1", "budi@example.com")).resolves.toMatchObject({
    hasTier: false,
    tierName: null,
    aiFeatures: [],
    courseIds: [],
  });
});
```

- [ ] **Step 8: Run access tests**

Run:

```bash
cd apps/backend-hono && bun test src/enrollment/enrollment.service.test.ts src/peserta/peserta.service.test.ts
```

Expected: PASS.

- [ ] **Step 9: Commit enrollment access**

Run:

```bash
git add apps/backend-hono/src/enrollment apps/backend-hono/src/peserta/peserta.service.ts apps/backend-hono/src/peserta/peserta.service.test.ts
git commit -m "fix: derive access from paid enrollments"
```

## Task 3: Add Enrollment and Audit Routes

**Files:**
- Create: `apps/backend-hono/src/enrollment/enrollment.routes.ts`
- Create: `apps/backend-hono/src/enrollment/enrollment.routes.test.ts`
- Create: `apps/backend-hono/src/audit/audit-log.routes.ts`
- Create: `apps/backend-hono/src/audit/audit-log.routes.test.ts`
- Modify: `apps/backend-hono/src/app.ts`

- [ ] **Step 1: Write route tests**

Create `apps/backend-hono/src/enrollment/enrollment.routes.test.ts`:

```ts
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createEnrollmentRoutes } from "./enrollment.routes";

describe("enrollment routes", () => {
  it("searches enrollments for admins", async () => {
    const app = new Hono();
    app.use("*", async (c, next) => {
      c.set("user", { id: "admin_1", email: "admin@example.com", role: "admin" });
      await next();
    });
    app.route("/", createEnrollmentRoutes({
      search: async () => [{ enrollmentId: "enroll_1", pesertaName: "Budi", batchName: "Batch 22 Mei", paymentStatus: "paid" }],
      listBatchEnrollments: async () => [],
      markPaid: async () => ({ id: "enroll_1" }),
    } as any));

    const res = await app.request("/admin/enrollments/search?q=budi");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      results: [{ enrollmentId: "enroll_1", pesertaName: "Budi", batchName: "Batch 22 Mei", paymentStatus: "paid" }],
    });
  });
});
```

Create `apps/backend-hono/src/audit/audit-log.routes.test.ts`:

```ts
import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createAuditLogRoutes } from "./audit-log.routes";

describe("audit log routes", () => {
  it("returns audit logs for admins", async () => {
    const app = new Hono();
    app.use("*", async (c, next) => {
      c.set("user", { id: "admin_1", email: "admin@example.com", role: "admin" });
      await next();
    });
    app.route("/", createAuditLogRoutes({
      findMany: async () => [{ id: "audit_1", action: "batch.published", entityType: "batch", entityId: "batch_1" }],
    } as any));

    const res = await app.request("/admin/audit-logs?batchId=batch_1");
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({
      logs: [{ id: "audit_1", action: "batch.published", entityType: "batch", entityId: "batch_1" }],
    });
  });
});
```

- [ ] **Step 2: Run failing route tests**

Run:

```bash
cd apps/backend-hono && bun test src/enrollment/enrollment.routes.test.ts src/audit/audit-log.routes.test.ts
```

Expected: FAIL because route files do not exist.

- [ ] **Step 3: Implement enrollment routes**

Create `apps/backend-hono/src/enrollment/enrollment.routes.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { requireRole } from "../auth/roles";
import { errorResponse } from "../common/errors";
import { EnrollmentService } from "./enrollment.service";

type EnrollmentVariables = AuthVariables & { requestId: string };
type EnrollmentServiceLike = Pick<EnrollmentService, "search" | "listBatchEnrollments" | "markPaid">;

const searchSchema = z.object({ q: z.string().min(2) });

export function createEnrollmentRoutes(service: EnrollmentServiceLike = new EnrollmentService()) {
  const app = new Hono<{ Variables: EnrollmentVariables }>();

  app.get("/admin/enrollments/search", requireAuth, requireRole(["admin"]), async (c) => {
    const parsed = searchSchema.safeParse({ q: c.req.query("q") });
    if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
    return c.json({ results: await service.search(parsed.data.q) });
  });

  app.get("/admin/batches/:batchId/enrollments", requireAuth, requireRole(["admin"]), async (c) => {
    return c.json({ enrollments: await service.listBatchEnrollments(c.req.param("batchId")) });
  });

  app.patch("/admin/enrollments/:enrollmentId/mark-paid", requireAuth, requireRole(["admin"]), async (c) => {
    return c.json({ enrollment: await service.markPaid(c.req.param("enrollmentId")) });
  });

  return app;
}
```

- [ ] **Step 4: Implement audit routes**

Create `apps/backend-hono/src/audit/audit-log.routes.ts`:

```ts
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { requireRole } from "../auth/roles";
import { errorResponse } from "../common/errors";
import { AuditLogService } from "./audit-log.service";

type AuditVariables = AuthVariables & { requestId: string };
type AuditLogServiceLike = Pick<AuditLogService, "findMany">;

const querySchema = z.object({
  batchId: z.string().uuid().optional(),
  enrollmentId: z.string().uuid().optional(),
  pesertaId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export function createAuditLogRoutes(service: AuditLogServiceLike = new AuditLogService()) {
  const app = new Hono<{ Variables: AuditVariables }>();

  app.get("/admin/audit-logs", requireAuth, requireRole(["admin"]), async (c) => {
    const parsed = querySchema.safeParse({
      batchId: c.req.query("batchId"),
      enrollmentId: c.req.query("enrollmentId"),
      pesertaId: c.req.query("pesertaId"),
      limit: c.req.query("limit"),
    });
    if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
    return c.json({ logs: await service.findMany(parsed.data) });
  });

  return app;
}
```

- [ ] **Step 5: Register routes in app**

Modify `apps/backend-hono/src/app.ts` imports:

```ts
import { createAuditLogRoutes } from "./audit/audit-log.routes";
import { createEnrollmentRoutes } from "./enrollment/enrollment.routes";
```

Add both route registrations under `/api` and root:

```ts
app.route("/api", createAuditLogRoutes());
app.route("/api", createEnrollmentRoutes());
app.route("/", createAuditLogRoutes());
app.route("/", createEnrollmentRoutes());
```

- [ ] **Step 6: Run route tests**

Run:

```bash
cd apps/backend-hono && bun test src/enrollment/enrollment.routes.test.ts src/audit/audit-log.routes.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit admin utility routes**

Run:

```bash
git add apps/backend-hono/src/enrollment apps/backend-hono/src/audit apps/backend-hono/src/app.ts
git commit -m "feat: add admin enrollment search and audit routes"
```

## Task 4: Add Scalev Sync Status and Payment Snapshot Safety

**Files:**
- Modify: `apps/backend-hono/src/db/schema/batch.ts`
- Modify: `apps/backend-hono/src/payment/payment.repository.ts`
- Modify: `apps/backend-hono/src/payment/payment.service.ts`
- Modify: `apps/backend-hono/src/payment/payment.service.test.ts`

- [ ] **Step 1: Add payment service tests for pending and paid access activation**

Append to `apps/backend-hono/src/payment/payment.service.test.ts`:

```ts
it("creates pending payment without activating enrollment access", async () => {
  const calls: string[] = [];
  const service = new PaymentService({
    paymentProvider: "manual",
    repository: {
      getBatchBySlugOrId: async () => ({ id: "batch_1", namaBatch: "Batch 22 Mei" }),
      getTierBySlugOrId: async () => ({ id: "tier_1", batchId: "batch_1", name: "Master", price: 2500000 }),
      findPaymentByEmailAndBatch: async () => null,
      createPaymentSession: async () => ({ id: "session_1" }),
      updatePaymentSessionUrl: async () => undefined,
      getPublicBatchInfo: async () => ({ batch: {}, tiers: [] }),
      getPublicTierInfo: async () => ({ batch: {}, tier: {} }),
      getPaymentSessionById: async () => null,
      markClaimTokenUsed: async () => undefined,
      updateSessionFromScalev: async () => null,
      getTiersByBatch: async () => [],
      getTierById: async () => null,
      getTierTemplateById: async () => null,
      createTier: async () => ({ id: "tier_1", batchId: "batch_1", name: "Master", price: 2500000 }),
      updateTier: async () => null,
      deleteTier: async () => undefined,
      getPaymentsByBatch: async () => [],
    } as any,
    enrollmentService: {
      ensurePendingEnrollmentForPayment: async () => {
        calls.push("pending-enrollment");
        return { id: "enroll_1" };
      },
      markPaid: async () => {
        calls.push("mark-paid");
        return { id: "enroll_1" };
      },
    } as any,
  });

  await service.createRegistration({ email: "budi@example.com", whatsapp: "081234567890", batchSlug: "batch-22-mei", tierSlug: "master" });

  expect(calls).toEqual(["pending-enrollment"]);
});
```

- [ ] **Step 2: Run failing payment test**

Run:

```bash
cd apps/backend-hono && bun test src/payment/payment.service.test.ts
```

Expected: FAIL because `PaymentService` does not accept `enrollmentService`.

- [ ] **Step 3: Add Scalev sync fields**

Modify `apps/backend-hono/src/db/schema/batch.ts` in `batchTiers`:

```ts
scalevSyncStatus: varchar("scalev_sync_status", { length: 30 }).default("not_synced").notNull(),
scalevLastSyncedAt: timestamp("scalev_last_synced_at", { withTimezone: true }),
scalevSyncError: text("scalev_sync_error"),
```

Keep existing Scalev IDs:

```ts
scalevStoreUniqueId: text("scalev_store_unique_id"),
scalevVariantUniqueId: text("scalev_variant_unique_id"),
scalevBundlePriceOptionUniqueId: text("scalev_bundle_price_option_unique_id"),
```

- [ ] **Step 4: Add payment snapshot fields**

Modify `apps/backend-hono/src/db/schema/batch.ts` in `paymentSessions`:

```ts
batchNameSnapshot: varchar("batch_name_snapshot", { length: 255 }),
tierNameSnapshot: varchar("tier_name_snapshot", { length: 255 }),
```

- [ ] **Step 5: Generate migration**

Run:

```bash
cd apps/backend-hono && bun run db:generate
```

Expected: Drizzle creates a migration for new `batch_tiers` and `payment_sessions` columns.

- [ ] **Step 6: Update PaymentService constructor dependencies**

Modify `apps/backend-hono/src/payment/payment.service.ts` imports:

```ts
import { AuditLogService } from "../audit/audit-log.service";
import { EnrollmentService } from "../enrollment/enrollment.service";
```

Add dependency types:

```ts
type EnrollmentServiceLike = Pick<EnrollmentService, "markPaid"> & {
  ensurePendingEnrollmentForPayment(input: { email: string; whatsapp?: string | null; batchId: string; tierId: string }): Promise<{ id: string }>;
};
type AuditLogServiceLike = Pick<AuditLogService, "record">;
```

Add class fields:

```ts
private readonly enrollmentService: EnrollmentServiceLike;
private readonly auditLog: AuditLogServiceLike;
```

Update constructor signature and assignments:

```ts
constructor(deps: { repository?: PaymentRepositoryLike; scalev?: ScalevLike; enrollmentService?: EnrollmentServiceLike; auditLog?: AuditLogServiceLike; now?: () => number; createClaimToken?: () => string; frontendUrl?: string; paymentProvider?: PaymentProvider } = {}) {
  this.repository = deps.repository ?? new PaymentRepository();
  this.scalev = deps.scalev ?? new ScalevService();
  this.enrollmentService = deps.enrollmentService ?? new EnrollmentService();
  this.auditLog = deps.auditLog ?? new AuditLogService();
  this.now = deps.now ?? Date.now;
  this.createClaimToken = deps.createClaimToken ?? (() => randomBytes(32).toString("hex"));
  this.frontendUrl = deps.frontendUrl ?? env.FRONTEND_URL;
  this.paymentProvider = deps.paymentProvider ?? env.PAYMENT_PROVIDER;
}
```

- [ ] **Step 7: Ensure pending enrollment is created at registration**

In `createRegistration`, after `session` is created and before Scalev order creation, add:

```ts
const enrollment = await this.enrollmentService.ensurePendingEnrollmentForPayment({
  email: input.email,
  whatsapp: input.whatsapp,
  batchId: batch.id,
  tierId: tier.id,
});
```

Include `pesertaId`/`enrollmentId` in `createPaymentSession` repository input in the next repository step.

- [ ] **Step 8: Update repository input for snapshots**

Modify `apps/backend-hono/src/payment/payment.repository.ts` `createPaymentSession` input type and insert values so it accepts:

```ts
pesertaId?: string | null;
batchNameSnapshot?: string | null;
tierNameSnapshot?: string | null;
```

Insert:

```ts
pesertaId: input.pesertaId ?? null,
batchNameSnapshot: input.batchNameSnapshot ?? null,
tierNameSnapshot: input.tierNameSnapshot ?? null,
```

Update `PaymentService.createRegistration` session creation:

```ts
const session = await this.repository.createPaymentSession({
  email: input.email,
  whatsapp: input.whatsapp,
  batchId: batch.id,
  tierId: tier.id,
  pesertaId: "pesertaId" in enrollment ? String(enrollment.pesertaId) : null,
  batchNameSnapshot: batch.namaBatch ?? null,
  tierNameSnapshot: tier.name ?? null,
  amount: tier.price,
  status: "pending",
  claimToken,
  paymentUrl,
  referenceId,
  provider: this.paymentProvider,
  providerPaymentMethod: paymentMethod,
  providerSubPaymentMethod: subPaymentMethod,
  expiredAt,
});
```

- [ ] **Step 9: Mark Scalev sync status**

In `syncTierWithScalev`, when sync succeeds, update tier with:

```ts
{
  scalevStoreUniqueId: storeUniqueId,
  scalevVariantUniqueId: syncedVariant.unique_id,
  scalevSyncStatus: "synced",
  scalevLastSyncedAt: new Date(),
  scalevSyncError: null,
}
```

Wrap Scalev sync failure:

```ts
try {
  // existing sync body
} catch (error) {
  await this.repository.updateTier(tier.id, {
    scalevSyncStatus: "failed",
    scalevSyncError: error instanceof Error ? error.message : "Unknown Scalev sync error",
  });
  throw error;
}
```

- [ ] **Step 10: Run payment tests**

Run:

```bash
cd apps/backend-hono && bun test src/payment/payment.service.test.ts
```

Expected: PASS.

- [ ] **Step 11: Commit payment safety**

Run:

```bash
git add apps/backend-hono/src/db/schema/batch.ts apps/backend-hono/src/payment apps/backend-hono/drizzle
git commit -m "feat: add Scalev sync state and payment snapshots"
```

## Task 5: Add Batch Workspace and Publish Preflight APIs

**Files:**
- Modify: `apps/backend-hono/src/batch/batch.repository.ts`
- Modify: `apps/backend-hono/src/batch/batch.service.ts`
- Modify: `apps/backend-hono/src/batch/batch.routes.ts`
- Modify: `apps/backend-hono/src/batch/batch.service.test.ts`
- Modify: `apps/backend-hono/src/batch/batch.routes.test.ts`

- [ ] **Step 1: Write batch publish validation test**

Append to `apps/backend-hono/src/batch/batch.service.test.ts`:

```ts
it("blocks publish when a batch has no synced active tiers", async () => {
  const service = new BatchService({
    repository: {
      create: async () => ({ id: "batch_1" }),
      update: async (_id: string, input: any) => ({ id: "batch_1", ...input }),
      remove: async () => undefined,
      findAll: async () => [],
      findById: async () => ({ id: "batch_1", namaBatch: "Batch 22 Mei", status: "draft" }),
      findPesertaByClerkId: async () => null,
      findByPesertaId: async () => [],
      assignPeserta: async () => ({ id: "assign_1" }),
      updateStatus: async () => ({ id: "assign_1" }),
      getPesertaInBatch: async () => [],
      getCurriculum: async () => ({}),
      getActiveTiersForPublish: async () => [{ id: "tier_1", scalevSyncStatus: "failed", price: 2500000 }],
      getWorkspace: async () => ({}),
    } as any,
  });

  await expect(service.publish("batch_1")).rejects.toThrow("BATCH_TIERS_NOT_SYNCED");
});
```

- [ ] **Step 2: Run failing batch service test**

Run:

```bash
cd apps/backend-hono && bun test src/batch/batch.service.test.ts
```

Expected: FAIL because `publish` does not exist.

- [ ] **Step 3: Implement repository workspace methods**

Add to `apps/backend-hono/src/batch/batch.repository.ts`:

```ts
async getActiveTiersForPublish(batchId: string) {
  return db.select().from(batchTiers).where(and(eq(batchTiers.batchId, batchId), eq(batchTiers.isActive, true)));
}

async getWorkspace(batchId: string) {
  const [batch] = await db
    .select({ ...getTableColumns(batchTraining), trainerName: trainer.nama, courseName: courses.title })
    .from(batchTraining)
    .leftJoin(trainer, eq(batchTraining.trainerId, trainer.id))
    .leftJoin(courses, eq(batchTraining.courseId, courses.id))
    .where(eq(batchTraining.id, batchId))
    .limit(1);

  if (!batch) throw new Error("BATCH_NOT_FOUND");

  const [counts] = await db
    .select({
      totalEnrollments: sql<number>`count(${pesertaBatch.id})`.mapWith(Number),
      paidEnrollments: sql<number>`count(${pesertaBatch.id}) filter (where ${pesertaBatch.paymentStatus} = 'paid')`.mapWith(Number),
      pendingPayments: sql<number>`count(${pesertaBatch.id}) filter (where ${pesertaBatch.paymentStatus} = 'pending')`.mapWith(Number),
    })
    .from(pesertaBatch)
    .where(eq(pesertaBatch.batchId, batchId));

  return { batch, counts: counts ?? { totalEnrollments: 0, paidEnrollments: 0, pendingPayments: 0 } };
}
```

- [ ] **Step 4: Implement publish service**

Add to `apps/backend-hono/src/batch/batch.service.ts`:

```ts
async publish(batchId: string) {
  const batch = await this.repository.findById(batchId);
  if (!batch) throw new Error("BATCH_NOT_FOUND");
  if (batch.status !== "draft") throw new Error("BATCH_NOT_DRAFT");

  const tiers = await this.repository.getActiveTiersForPublish(batchId);
  if (tiers.length === 0) throw new Error("BATCH_REQUIRES_ACTIVE_TIER");
  if (tiers.some((tier: any) => !tier.price || tier.price <= 0)) throw new Error("BATCH_TIER_PRICE_REQUIRED");
  if (tiers.some((tier: any) => tier.scalevSyncStatus !== "synced")) throw new Error("BATCH_TIERS_NOT_SYNCED");

  return this.repository.update(batchId, { status: "open" });
}

async getWorkspace(batchId: string) {
  return this.repository.getWorkspace(batchId);
}
```

Update `BatchServiceLike` in `apps/backend-hono/src/batch/batch.routes.ts` to include `publish` and `getWorkspace`.

- [ ] **Step 5: Add routes**

Add to `apps/backend-hono/src/batch/batch.routes.ts`:

```ts
app.get("/admin/batches/:id/workspace", requireAuth, requireRole(["admin"]), async (c) => {
  return c.json(await service.getWorkspace(c.req.param("id")));
});

app.post("/admin/batches/:id/publish", requireAuth, requireRole(["admin"]), async (c) => {
  return c.json({ batch: await service.publish(c.req.param("id")) });
});
```

- [ ] **Step 6: Run batch tests**

Run:

```bash
cd apps/backend-hono && bun test src/batch/batch.service.test.ts src/batch/batch.routes.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit batch workspace API**

Run:

```bash
git add apps/backend-hono/src/batch
git commit -m "feat: add batch workspace and publish preflight"
```

## Task 6: Rename Admin IA and Add Batch Workspace Routes

**Files:**
- Modify: `apps/frontend/src/layouts/full/vertical/sidebar/Sidebaritems.ts`
- Modify: `apps/frontend/src/routes/protectedRouteChildren.tsx`
- Create: `apps/frontend/src/views/admin/batches/AdminBatchList.tsx`
- Create: `apps/frontend/src/views/admin/batches/AdminBatchDetail.tsx`
- Create: `apps/frontend/src/views/admin/batches/hooks/useAdminBatchWorkspace.ts`

- [ ] **Step 1: Create workspace hook**

Create `apps/frontend/src/views/admin/batches/hooks/useAdminBatchWorkspace.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import api from 'src/api/axios';

export const useAdminBatchWorkspace = (batchId?: string) => {
  return useQuery({
    queryKey: ['admin-batch-workspace', batchId],
    enabled: Boolean(batchId),
    queryFn: async () => {
      const res = await api.get(`/admin/batches/${batchId}/workspace`);
      return res.data;
    },
  });
};
```

- [ ] **Step 2: Create batch list screen**

Create `apps/frontend/src/views/admin/batches/AdminBatchList.tsx`:

```tsx
import { Icon } from '@iconify/react';
import { Link } from 'react-router';
import CardBox from 'src/components/shared/CardBox';
import { Button } from 'src/components/ui/button';
import { Loading } from 'src/components/ui/loading';
import { useManageTraining } from '../hooks/useManageTraining';

const AdminBatchList = () => {
  const { trainings, loading } = useManageTraining();

  if (loading) return <Loading fullPage />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-dark">Kelola Batch</h2>
          <p className="text-sm text-bodytext">Pilih batch untuk mengelola member, dokumen, sertifikat, paket, mentor, dan checkout.</p>
        </div>
        <Button asChild className="bg-primary text-white hover:bg-primary/90">
          <Link to="/admin/batches/new">
            <Icon icon="solar:add-circle-linear" height={18} className="mr-2" />
            Buat Batch
          </Link>
        </Button>
      </div>

      <CardBox className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Batch</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Tanggal</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Member</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-bodytext">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {trainings.map((batch: any) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-dark">{batch.name}</div>
                    <div className="text-xs text-bodytext">{batch.trainerName || 'Mentor belum dipilih'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-bodytext">{new Date(batch.startDate).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-4 text-sm capitalize">{batch.status}</td>
                  <td className="px-4 py-4 text-sm">{batch.participants}</td>
                  <td className="px-4 py-4 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link to={`/admin/batches/${batch.id}`}>Buka Workspace</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBox>
    </div>
  );
};

export default AdminBatchList;
```

- [ ] **Step 3: Create batch detail shell**

Create `apps/frontend/src/views/admin/batches/AdminBatchDetail.tsx`:

```tsx
import { useParams } from 'react-router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'src/components/ui/tabs';
import { Loading } from 'src/components/ui/loading';
import { useAdminBatchWorkspace } from './hooks/useAdminBatchWorkspace';

const AdminBatchDetail = () => {
  const { batchId } = useParams();
  const { data, isLoading } = useAdminBatchWorkspace(batchId);

  if (isLoading) return <Loading fullPage />;

  const batch = data?.batch;
  const counts = data?.counts;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-dark">{batch?.namaBatch || 'Batch'}</h2>
        <p className="text-sm text-bodytext">
          {counts?.totalEnrollments || 0} member, {counts?.paidEnrollments || 0} paid, {counts?.pendingPayments || 0} pending payment
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="member">Member</TabsTrigger>
          <TabsTrigger value="dokumen">Dokumen</TabsTrigger>
          <TabsTrigger value="sertifikat">Sertifikat</TabsTrigger>
          <TabsTrigger value="paket">Paket & Harga</TabsTrigger>
          <TabsTrigger value="mentor">Mentor</TabsTrigger>
          <TabsTrigger value="materi">Materi / Bonus</TabsTrigger>
          <TabsTrigger value="checkout">Checkout Links</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">Overview batch akan menampilkan ringkasan operasional dan preflight publish.</TabsContent>
        <TabsContent value="member">Member operation table akan dipasang pada task berikutnya.</TabsContent>
        <TabsContent value="dokumen">Queue dokumen akan dipasang pada task berikutnya.</TabsContent>
        <TabsContent value="sertifikat">Queue sertifikat akan dipasang pada task berikutnya.</TabsContent>
        <TabsContent value="paket">Paket batch dan status Scalev akan dipasang pada task berikutnya.</TabsContent>
        <TabsContent value="mentor">Assignment mentor akan dipasang pada task berikutnya.</TabsContent>
        <TabsContent value="materi">Kelas bonus dan akses akan dipasang pada task berikutnya.</TabsContent>
        <TabsContent value="checkout">Checkout links akan dipasang pada task berikutnya.</TabsContent>
        <TabsContent value="activity">Activity log akan dipasang pada task berikutnya.</TabsContent>
        <TabsContent value="export">Export batch akan dipasang pada task berikutnya.</TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminBatchDetail;
```

- [ ] **Step 4: Register routes**

Modify `apps/frontend/src/routes/protectedRouteChildren.tsx`:

```tsx
const AdminBatchList = Loadable(lazy(() => import('../views/admin/batches/AdminBatchList')));
const AdminBatchDetail = Loadable(lazy(() => import('../views/admin/batches/AdminBatchDetail')));
```

Add routes:

```tsx
{ path: '/admin/batches', exact: true, element: <AdminRoute><AdminBatchList /></AdminRoute> },
{ path: '/admin/batches/:batchId', exact: true, element: <AdminRoute><AdminBatchDetail /></AdminRoute> },
```

Keep `/admin/manage-training` temporarily pointing to the old screen until the new workspace is complete.

- [ ] **Step 5: Rename sidebar IA**

Modify `apps/frontend/src/layouts/full/vertical/sidebar/Sidebaritems.ts` admin items:

```ts
{
  id: uniqueId(),
  title: 'Kelola Batch',
  icon: IconCalendarEvent,
  href: '/admin/batches',
},
{
  id: uniqueId(),
  title: 'Paket & Akses',
  icon: IconPackage,
  href: '/admin/tier-management',
},
{
  id: uniqueId(),
  title: 'Kelas / Bonus',
  icon: IconBook,
  href: '/admin/manage-kelas',
},
{
  id: uniqueId(),
  title: 'Mentor',
  icon: IconUsers,
  href: '/admin/daftar-trainer',
},
```

Remove `Daftar Peserta` from primary sidebar navigation. Do not delete the old route yet.

- [ ] **Step 6: Build frontend**

Run:

```bash
cd apps/frontend && npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit IA shell**

Run:

```bash
git add apps/frontend/src/views/admin/batches apps/frontend/src/routes/protectedRouteChildren.tsx apps/frontend/src/layouts/full/vertical/sidebar/Sidebaritems.ts
git commit -m "feat: add batch-first admin workspace shell"
```

## Task 7: Add Global Enrollment Search UI

**Files:**
- Create: `apps/frontend/src/views/admin/components/AdminGlobalSearch.tsx`
- Modify: `apps/frontend/src/layouts/full/vertical/header/Header.tsx` or the current header component that renders admin top navigation

- [ ] **Step 1: Create global search component**

Create `apps/frontend/src/views/admin/components/AdminGlobalSearch.tsx`:

```tsx
import { Icon } from '@iconify/react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import api from 'src/api/axios';
import { Input } from 'src/components/ui/input';

export const AdminGlobalSearch = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  const { data, isFetching } = useQuery({
    queryKey: ['admin-enrollment-search', value],
    enabled: value.trim().length >= 2,
    queryFn: async () => {
      const res = await api.get('/admin/enrollments/search', { params: { q: value.trim() } });
      return res.data.results as any[];
    },
  });

  return (
    <div className="relative w-full max-w-xl">
      <Icon icon="solar:magnifer-linear" height={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder="Cari peserta, email, no HP, batch..." className="pl-10" />
      {value.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-[9999] overflow-hidden rounded-md border bg-white shadow-lg">
          {isFetching && <div className="px-4 py-3 text-sm text-bodytext">Mencari...</div>}
          {!isFetching && (data?.length ?? 0) === 0 && <div className="px-4 py-3 text-sm text-bodytext">Tidak ada hasil</div>}
          {!isFetching && data?.map((result) => (
            <Link
              key={result.enrollmentId}
              to={`/admin/batches/${result.batchId}?enrollment=${result.enrollmentId}`}
              className="block border-b px-4 py-3 last:border-b-0 hover:bg-gray-50"
              onClick={() => onChange('')}
            >
              <div className="font-semibold text-dark">{result.pesertaName}</div>
              <div className="mt-1 text-xs text-bodytext">
                {result.batchName} • {result.tierName || 'Tanpa paket'} • {result.paymentStatus}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Mount in header**

Find the active header file:

```bash
rg -n "Header|Navbar|Topbar" apps/frontend/src/layouts/full apps/frontend/src/layouts -g '*.tsx'
```

In the component that renders the top bar, add:

```tsx
import { useState } from 'react';
import { AdminGlobalSearch } from 'src/views/admin/components/AdminGlobalSearch';
```

Inside the component:

```tsx
const [adminSearch, setAdminSearch] = useState('');
```

Render near the header center:

```tsx
<AdminGlobalSearch value={adminSearch} onChange={setAdminSearch} />
```

- [ ] **Step 3: Build frontend**

Run:

```bash
cd apps/frontend && npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit global search**

Run:

```bash
git add apps/frontend/src/views/admin/components/AdminGlobalSearch.tsx apps/frontend/src/layouts
git commit -m "feat: add admin enrollment global search"
```

## Task 8: Add Batch Member Operation Table

**Files:**
- Create: `apps/frontend/src/views/admin/batches/components/EnrollmentTable.tsx`
- Modify: `apps/frontend/src/views/admin/batches/AdminBatchDetail.tsx`

- [ ] **Step 1: Create enrollment table component**

Create `apps/frontend/src/views/admin/batches/components/EnrollmentTable.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query';
import api from 'src/api/axios';
import { Badge } from 'src/components/ui/badge';
import { Button } from 'src/components/ui/button';
import { Loading } from 'src/components/ui/loading';

export const EnrollmentTable = ({ batchId }: { batchId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-batch-enrollments', batchId],
    queryFn: async () => {
      const res = await api.get(`/admin/batches/${batchId}/enrollments`);
      return res.data.enrollments as any[];
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-left">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Member</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Paket</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Bayar</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Dokumen</th>
            <th className="px-4 py-3 text-xs font-semibold uppercase text-bodytext">Sertifikat</th>
            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-bodytext">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {data?.map((enrollment) => (
            <tr key={enrollment.id} className="hover:bg-gray-50">
              <td className="px-4 py-4">
                <div className="font-semibold text-dark">{enrollment.pesertaName}</div>
                <div className="text-xs text-bodytext">{enrollment.pesertaEmail}</div>
              </td>
              <td className="px-4 py-4 text-sm">{enrollment.tierName || '-'}</td>
              <td className="px-4 py-4">
                <Badge className={enrollment.paymentStatus === 'paid' ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}>
                  {enrollment.paymentStatus}
                </Badge>
              </td>
              <td className="px-4 py-4 text-sm">{enrollment.documentStatus || 'Belum upload'}</td>
              <td className="px-4 py-4 text-sm">{enrollment.certificateStatus || 'Belum'}</td>
              <td className="px-4 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm">Detail</Button>
                  <Button variant="outline" size="sm">Dokumen</Button>
                  <Button variant="outline" size="sm">Sertifikat</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
```

- [ ] **Step 2: Mount table in batch detail**

Modify `apps/frontend/src/views/admin/batches/AdminBatchDetail.tsx`:

```tsx
import { EnrollmentTable } from './components/EnrollmentTable';
```

Replace member tab content:

```tsx
<TabsContent value="member">
  {batchId ? <EnrollmentTable batchId={batchId} /> : null}
</TabsContent>
```

- [ ] **Step 3: Build frontend**

Run:

```bash
cd apps/frontend && npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit member operation table**

Run:

```bash
git add apps/frontend/src/views/admin/batches
git commit -m "feat: add batch member operation table"
```

## Task 9: Rename Tier Management UI to Paket & Akses

**Files:**
- Modify: `apps/frontend/src/views/admin/tier-management/TierManagement.tsx`
- Modify: `apps/frontend/src/views/admin/tier-management/TierTemplateModal.tsx`
- Modify: `apps/frontend/src/views/admin/tier-management/useTierTemplates.ts`

- [ ] **Step 1: Rename visible copy**

In `apps/frontend/src/views/admin/tier-management/TierManagement.tsx`, replace user-facing labels:

```tsx
Kelola Paket & Akses
```

Use supporting copy:

```tsx
Atur paket global seperti Master dan Trainer, termasuk default kelas bonus, akses AI, dan benefit. Harga final tetap diatur per batch.
```

Replace button label:

```tsx
Tambah Paket
```

- [ ] **Step 2: Rename modal copy**

In `apps/frontend/src/views/admin/tier-management/TierTemplateModal.tsx`, use:

```tsx
Nama Paket
Default Kelas Bonus
Default Akses AI
Benefit Paket
```

Keep API field names unchanged: `defaultCourseIds`, `defaultAiFeatures`, `defaultBenefits`.

- [ ] **Step 3: Build frontend**

Run:

```bash
cd apps/frontend && npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit package wording**

Run:

```bash
git add apps/frontend/src/views/admin/tier-management
git commit -m "chore: rename tier templates to paket akses"
```

## Task 10: Add Activity Log UI in Batch Workspace

**Files:**
- Create: `apps/frontend/src/views/admin/batches/components/ActivityLogPanel.tsx`
- Modify: `apps/frontend/src/views/admin/batches/AdminBatchDetail.tsx`

- [ ] **Step 1: Create activity panel**

Create `apps/frontend/src/views/admin/batches/components/ActivityLogPanel.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query';
import api from 'src/api/axios';
import { Loading } from 'src/components/ui/loading';

const describeAction = (log: any) => {
  if (log.action === 'batch.published') return `${log.actorName || log.actorEmail || 'Admin'} publish batch`;
  if (log.action === 'batch_tier.price_updated') return `${log.actorName || log.actorEmail || 'Admin'} mengubah harga paket`;
  if (log.action === 'batch_tier.scalev_synced') return `${log.actorName || log.actorEmail || 'Admin'} sync paket ke Scalev`;
  if (log.action === 'document.approved') return `${log.actorName || log.actorEmail || 'Admin'} approve dokumen`;
  if (log.action === 'certificate.uploaded') return `${log.actorName || log.actorEmail || 'Admin'} upload sertifikat`;
  return `${log.actorName || log.actorEmail || 'Admin'} melakukan ${log.action}`;
};

export const ActivityLogPanel = ({ batchId }: { batchId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', batchId],
    queryFn: async () => {
      const res = await api.get('/admin/audit-logs', { params: { batchId } });
      return res.data.logs as any[];
    },
  });

  if (isLoading) return <Loading />;

  return (
    <div className="divide-y rounded-md border bg-white">
      {data?.map((log) => (
        <div key={log.id} className="px-4 py-3">
          <div className="text-sm font-medium text-dark">{describeAction(log)}</div>
          <div className="mt-1 text-xs text-bodytext">{new Date(log.createdAt).toLocaleString('id-ID')}</div>
        </div>
      ))}
      {(data?.length ?? 0) === 0 && <div className="px-4 py-6 text-sm text-bodytext">Belum ada aktivitas.</div>}
    </div>
  );
};
```

- [ ] **Step 2: Mount in batch detail**

Modify `apps/frontend/src/views/admin/batches/AdminBatchDetail.tsx`:

```tsx
import { ActivityLogPanel } from './components/ActivityLogPanel';
```

Replace activity tab:

```tsx
<TabsContent value="activity">
  {batchId ? <ActivityLogPanel batchId={batchId} /> : null}
</TabsContent>
```

- [ ] **Step 3: Build frontend**

Run:

```bash
cd apps/frontend && npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit activity log UI**

Run:

```bash
git add apps/frontend/src/views/admin/batches
git commit -m "feat: show batch activity log"
```

## Task 11: Verification

**Files:**
- No new files.

- [ ] **Step 1: Run backend tests**

Run:

```bash
cd apps/backend-hono && bun test
```

Expected: PASS.

- [ ] **Step 2: Run backend typecheck**

Run:

```bash
npm run typecheck:backend
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run:

```bash
npm run build:frontend
```

Expected: PASS.

- [ ] **Step 4: Run repo lint**

Run:

```bash
npm run lint
```

Expected: PASS.

- [ ] **Step 5: Manual admin flow check**

Run dev servers in separate terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

Verify in browser:

1. Admin sidebar shows `Kelola Batch`, `Paket & Akses`, `Kelas / Bonus`, `Mentor`, `Settings`.
2. `/admin/batches` lists batches.
3. Opening a batch shows workspace tabs.
4. Member tab lists enrollments only for that batch.
5. Header search finds a participant and links to `/admin/batches/:batchId?enrollment=:enrollmentId`.
6. `/peserta/me/access` returns no Master access for a user whose Master enrollment is pending.
7. A paid Trainer enrollment still grants Trainer access.
8. Batch publish fails if any active package has `scalevSyncStatus` other than `synced`.
9. Activity log endpoint returns events filtered by `batchId`.

- [ ] **Step 6: Commit verification fixes**

If verification required fixes, run:

```bash
git add apps/backend-hono apps/frontend
git commit -m "fix: stabilize admin batch enrollment flow"
```

If no fixes were required, do not create an empty commit.

## Self-Review

Spec coverage:

- Batch-first admin flow: covered by Tasks 5, 6, 8, 10.
- Global search without global peserta menu: covered by Tasks 3 and 7.
- Multi-enrollment participant model: covered by Task 2.
- Payment-gated access: covered by Tasks 2 and 4.
- Scalev-friendly batch tier sync: covered by Task 4.
- Paket & Akses wording: covered by Task 9.
- One global audit log: covered by Tasks 1, 3, and 10.
- Publish lifecycle/preflight: covered by Task 5.

Placeholder scan:

- The plan avoids placeholder markers and unspecified implementation steps.
- Each code-changing task includes concrete file paths, code blocks, commands, and expected results.

Type consistency:

- `EnrollmentService.getPaidAccess` returns `tierNames`, `aiFeatures`, `courseIds`, `benefits`, and `enrollments`.
- `PesertaService.getAccess` preserves frontend compatibility with `tierName` while adding `tierNames`.
- `AuditLogService.record` uses `actorUserId`, `actorEmail`, `actorName`, `action`, `entityType`, `entityId`, and optional contextual IDs consistently.
