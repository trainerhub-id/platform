# Workspace System Design

Date: 2026-05-18
Status: Draft (awaiting user review)
Owner: ujang

---

## 1. Overview & Motivation

Saat ini TrainerHub menggabungkan semua program (Training for Trainers, Training for Masters, dst.) yang dibeli seorang user ke dalam satu pengalaman bersama. Ini menyebabkan:

- Halaman dokumen menampilkan semua jenis dokumen (8 field) tanpa peduli program apa yang user beli — banyak field tidak relevan.
- Tidak ada isolasi antara program yang berbeda. Progress, todo, sertifikat, dan AI workspace tercampur.
- User yang punya 2+ program tidak punya batas konteks yang jelas.

**Solusi:** Sistem **workspace** per enrollment. Setiap pembelian (program × batch) jadi workspace tersendiri dengan dokumen, progress, todo, sertifikat, dan AI workspace yang terpisah. Identity dan data personal pokok (KTP, NPWP, alamat, dll.) tetap di akun-level supaya user tidak perlu isi ulang.

**Aplikasi alpha — 0 user existing.** Migration jadi clean schema, tanpa backfill data. Tidak ada legacy redirect untuk URL lama.

---

## 2. Concept & Boundaries

### Definisi workspace

Workspace = ruang kerja per-enrollment milik 1 user untuk 1 program × batch. 1 user bisa punya beberapa workspace kalau dia beli beberapa program. User **tidak bisa** beli batch yang sama dua kali (constraint bisnis: training one-shot per program per user).

Setiap workspace punya:
- `id` (uuid PK)
- `slug` pendek format `b<n>-<course-short-code>`, scope unique per user
- 1:1 mapping ke 1 enrollment (`peserta_batch.id`)
- Lifecycle: `created_at` (saat enrollment paid), `last_accessed_at`, `archived_at`
- `status`: `active | archived | suspended`

### Pembagian data: akun-level vs workspace-level

| Data | Lokasi | Alasan |
|------|--------|--------|
| Identity (email, password, name, image) | Akun-level (`users` table — Better Auth) | Satu orang = satu identitas |
| KTP, NPWP, NIK, foto KTP, alamat, HP | Akun-level (`peserta` table) | Sekali isi, dipakai semua program |
| Dokumen training-specific | Workspace-level | Setiap program punya field requirement berbeda |
| Progress kelas, materi, sesi | Workspace-level | Per batch |
| Todo list | Workspace-level | Tergantung tahap di program |
| AI workspace state | Workspace-level | Setiap program punya konteks AI berbeda |
| Sertifikat | Workspace-level | Sertifikat keluar per batch |
| Notifikasi terkait program | Workspace-level | Filter natural |
| Notifikasi sistem (billing, akun) | Akun-level | Bukan terkait program |
| Payment / billing history | Akun-level | Lihat semua transaksi di 1 tempat |
| Audit log | Akun-level dengan `workspace_id` reference | Bisa filter per workspace |

### Bundling 2 Peserta

Paket "Bundling Class - 2 Peserta" = 1 transaksi pembelian → 2 enrollment terpisah → 2 workspace terpisah.

Flow:
1. Pembeli bayar → enrollment ke-1 dibuat untuk pembeli (paymentStatus = paid) → workspace ke-1 dibuat untuk pembeli.
2. Sistem generate `invite_token` di slot ke-2 enrollment.
3. Pembeli kasih link `/auth/accept-invite/<token>` ke peserta kedua.
4. Peserta kedua register/login → enrollment ke-2 di-claim → workspace ke-2 dibuat untuk dia.

Kedua peserta jadi user terpisah dengan akun masing-masing dan workspace masing-masing. Tidak ada shared workspace.

---

## 3. Data Model

### 3.1 Tabel baru: `workspaces`

```
workspaces
├─ id              uuid PK
├─ slug            varchar(80) NOT NULL
├─ user_id         text FK → users.id NOT NULL
├─ peserta_id      uuid FK → peserta.id NOT NULL
├─ enrollment_id   uuid FK → peserta_batch.id NOT NULL UNIQUE  (1:1)
├─ batch_id        uuid FK → batch_training.id NOT NULL  (denormalized)
├─ course_id       uuid FK → courses.id NOT NULL  (denormalized — "program")
├─ display_name    varchar(255) NOT NULL  (e.g. "Training for Trainers - Batch 1")
├─ status          varchar(50) NOT NULL DEFAULT 'active'  (active | archived | suspended)
├─ last_accessed_at timestamp with timezone
├─ archived_at     timestamp with timezone NULL
├─ created_at, updated_at

UNIQUE (user_id, slug)              -- scope unique per-user
UNIQUE (enrollment_id)              -- 1:1 ke enrollment
INDEX (user_id, status)             -- list workspaces user
INDEX (batch_id)                    -- admin query per batch
```

### 3.2 Tabel baru: `dokumen_jenis_program` (junction M:N)

`dokumen_jenis` saat ini flat (tidak terkait program). Menyebabkan 8 field muncul untuk semua program. Solusi: pisahkan master jenis dari mapping ke program.

```
dokumen_jenis (existing — tidak diubah strukturnya)
├─ id, nama_jenis, kategori_id, opsional, ...

dokumen_jenis_program (BARU)
├─ jenis_id     uuid FK → dokumen_jenis.id NOT NULL
├─ course_id    uuid FK → courses.id NOT NULL
├─ order_index  integer NOT NULL DEFAULT 0  -- urutan tampilan, bisa beda per program
├─ required     boolean NOT NULL DEFAULT true  -- bisa wajib di program A, opsional di B
├─ created_at

PRIMARY KEY (jenis_id, course_id)
INDEX (course_id, order_index)
```

Tier-level scoping (Premier butuh dokumen tambahan dibanding Platinum) **tidak** di-implement di phase ini. Schema bisa di-extend dengan menambah `tier_slug` nullable di junction nanti.

### 3.3 Modifikasi tabel existing — tambah `workspace_id`

Semua tabel berikut tambah kolom `workspace_id uuid FK → workspaces.id NOT NULL` (NOT NULL dari awal karena alpha 0 users):

| Tabel | Catatan |
|-------|---------|
| `dokumen_peserta` | Fix akar masalah 8-field. Query upload pakai `WHERE workspace_id = ?`. |
| `todos` | Drop kolom `batch_id` legacy (covered via workspace.batch_id). |
| `sertifikat` | Bantu bulk-generate per batch. |
| `peserta_course_progress` | Progress per workspace, bukan global per peserta. |
| `tugas` | Tugas peserta scoped ke workspace. |
| AI workspace tables (interview, ai-related) | State per workspace. Specific tables tergantung modul existing — di Phase 2 inventory dulu. |

### 3.4 Modifikasi master data

Kolom prerequisites untuk slug generation:

```
courses tambah:
├─ short_code  varchar(30) UNIQUE NOT NULL  -- e.g. "trainers", "masters"

batch_training tambah:
├─ batch_number  integer NOT NULL  -- urutan batch dalam program
├─ UNIQUE (course_id, batch_number)
```

`short_code` di-validate reject reserved word (`auth`, `admin`, `profile`, `settings`, `billing`, `workspaces`, `api`, `static`, `assets`).

### 3.5 Tabel TIDAK diubah

- `users`, `peserta` — akun-level identity & profile data
- `peserta_batch` — enrollment (workspace derive darinya). Tambah kolom `invite_token` (untuk Bundling) di Phase 3.
- `batch_training`, `batch_tiers`, `tier_templates`, `courses`, `chapters`, `lessons` — master data
- `payment_sessions` — billing global per user
- `audit_log` — global, dengan `workspace_id` sebagai metadata reference (bukan FK NOT NULL)

### 3.6 Slug generation

```
slug = "b{batch_number}-{course_short_code}"
```

Contoh: `b1-trainers`, `b15-trainers`, `b3-masters`.

Karena unique scope per-user, dua user beda tidak konflik walau slug-nya sama. Constraint `UNIQUE (user_id, slug)` di workspaces table memastikan ini.

---

## 4. URL Routing & Redirect Rules

### 4.1 Root path structure

```
/                              → redirect berdasarkan login state & role
/auth/*                        → login, register, lupa password (existing)
/admin/*                       → admin panel (existing, expanded)
/profile                       → akun-level (identity, KTP, NPWP, foto, alamat, HP)
/settings                      → preferensi akun (notif, password, ganti email)
/billing                       → riwayat pembayaran semua workspace
/workspaces                    → workspace selector / empty state
/<slug>/*                      → halaman dalam workspace
*                              → 404
```

### 4.2 Reserved root segments

Slug **tidak boleh** sama dengan: `auth`, `admin`, `profile`, `settings`, `billing`, `workspaces`, `api`, `static`, `assets`. Validasi di:

1. Admin UI saat input `course.short_code`.
2. Slug generator backend (kalau ada konflik runtime, fallback append suffix angka).

### 4.3 Halaman per workspace

```
/<slug>/                       → dashboard workspace (overview)
/<slug>/training/info          → info batch (jadwal, lokasi)
/<slug>/kelas                  → list kelas/materi
/<slug>/kelas/:lessonId        → detail kelas
/<slug>/dokumen                → upload dokumen (filtered per program)
/<slug>/sertifikat             → sertifikat workspace ini
/<slug>/ai-hub                 → AI workspace selector (tier-gated)
/<slug>/ai-hub/master-workspace
/<slug>/ai-hub/trainer-workspace
/<slug>/todos                  → todo list workspace
```

### 4.4 Slug resolution middleware (backend & frontend router)

Untuk path `/<slug>/...`:

```
1. Ambil slug = path[0]
2. Kalau slug ∈ reserved list → lanjut ke route handler biasa (tidak ada workspace context).
3. Resolve workspace:
   SELECT * FROM workspaces
   WHERE user_id = session.user.id
     AND slug = path[0]
     AND status = 'active'
   LIMIT 1

4a. Found → set request context workspace_id, lanjut handler.
4b. Not found → check user punya workspace lain:
    - 0 workspace active → redirect ke /workspaces (empty state)
    - 1+ workspace active → redirect ke /<default-slug>/<rest-of-path>
      default = ORDER BY last_accessed_at DESC NULLS LAST LIMIT 1
      Kalau rest-of-path tidak match route di workspace target (404 di workspace baru), fallback ke /<default-slug>/. Lihat juga Section 5.2 untuk perilaku switcher.
```

### 4.5 Root `/` redirect logic

```
- Belum login → /auth/login
- Login as admin → /admin/home (existing)
- Login as peserta:
  - 0 workspace active → /workspaces (empty state dengan CTA daftar)
  - 1+ workspace active → /<last-accessed-slug>/
```

### 4.6 `last_accessed_at` update

Setiap kali user load page `/<slug>/...` dan slug match workspace user, middleware update `workspaces.last_accessed_at = NOW()` dengan **debounce 5 menit** (tidak update kalau last_accessed_at < 5 menit yang lalu). Mencegah write storm dari navigasi cepat.

---

## 5. UI / UX

### 5.1 Layout struktur

```
┌─────────────────────────────────────────────────────────────┐
│ Top bar: logo │ workspace switcher │ user avatar │ search   │
├──────────────┬──────────────────────────────────────────────┤
│ Sidebar      │ Main content                                 │
│              │                                              │
│ Workspace    │                                              │
│   - Dashboard│                                              │
│   - Training │                                              │
│   - Kelas    │                                              │
│   - Dokumen  │                                              │
│   - Sertifik.│                                              │
│   - AI Hub   │   (tier-gated, hide kalau bukan Premier)     │
│   - Todos    │                                              │
│              │                                              │
│ ─────────    │                                              │
│ Akun         │                                              │
│   - Profile  │                                              │
│   - Billing  │                                              │
│   - Settings │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

### 5.2 Workspace switcher (top bar)

**Single workspace user:** label workspace ditampilkan statis (atau dropdown disabled).

```
[ Training for Trainers - Batch 1 ]
```

**Multi workspace user:** dropdown aktif.

```
[ Training for Trainers - Batch 1   ▼ ]
   ├ Training for Trainers - Batch 1   ✓ active
   ├ Training for Masters - Batch 3
   └ ─────────────
     + Daftar program lain   → link ke landing page beli
```

Klik workspace lain → navigate `/<other-slug>/<same-page-name>`. Misal user di `/b1-trainers/dokumen` lalu pilih Masters → `/b3-masters/dokumen`. Kalau halaman `dokumen` tidak match (route tidak ada di workspace target), fallback ke `/<other-slug>/`.

### 5.3 `/workspaces` (selector page)

Untuk: user akses URL workspace yang tidak dimiliki, atau klik "Lihat semua workspace" dari switcher, atau user belum punya workspace.

```
Workspaces saya
┌──────────────────────────────────────────────┐
│ Training for Trainers - Batch 1              │
│ Status: Active │ Last access: 2 jam lalu     │
│ [Buka workspace →]                           │
├──────────────────────────────────────────────┤
│ Training for Masters - Batch 3               │
│ Status: Active │ Last access: 5 hari lalu    │
│ [Buka workspace →]                           │
└──────────────────────────────────────────────┘

[Belum punya program lain? Lihat program tersedia →]
```

Empty state (0 workspace):

```
Belum ada program yang aktif.
Setelah pembayaran, workspace akan otomatis dibuat.
[Lihat program tersedia →]
```

### 5.4 Sidebar items per workspace, di-gate oleh tier

| Item | Platinum | Bundling | Premier |
|------|---------|---------|---------|
| Dashboard | ✓ | ✓ | ✓ |
| Training info | ✓ | ✓ | ✓ |
| Kelas | ✓ | ✓ | ✓ |
| Dokumen | ✓ | ✓ | ✓ |
| Sertifikat | ✓ | ✓ | ✓ |
| AI Hub | ✗ | ✗ | ✓ |
| Todos | ✓ | ✓ | ✓ |

AI Hub gating pakai pattern existing `useAiAccess`, di-extend supaya cek tier per workspace (bukan global per user).

### 5.5 Akun-level section (di bawah workspace section)

Selalu sama, tidak tergantung workspace:

- Profile (identity, KTP, NPWP, foto, alamat, HP)
- Billing (semua transaksi semua workspace)
- Settings (notif, password, ganti email)

Visual divider yang jelas memisahkan section workspace (kontekstual) dan section akun (global).

### 5.6 Mobile

Sidebar jadi drawer (existing pattern di hook `use-mobile.ts`). Workspace switcher pindah ke header drawer.

---

## 6. Admin Pattern

Admin **tidak pakai workspace**. Workspace adalah konsep peserta. Admin punya 2 mode pandang:

### 6.1 Batch-context view (mayoritas task)

```
/admin/batches                        → list semua batch (existing)
/admin/batches/:batchId               → detail batch dengan tabs:
  ├─ Tab: Peserta              (existing)
  ├─ Tab: Dokumen Pending      (new — review dokumen peserta di batch ini)
  ├─ Tab: Sertifikat           (new — bulk generate, status per peserta)
  ├─ Tab: Progress Kelas       (new — overview progress peserta)
  └─ Tab: Settings batch       (kelas, jadwal, dll)
```

Switch antar batch lewat **breadcrumb dropdown**:

```
[ Batches ] > [ Batch 1 Trainers  ▼ ]
                  ├─ Batch 1 Trainers ✓
                  ├─ Batch 2 Trainers
                  ├─ Batch 1 Masters
                  ├─ Batch 3 Masters
                  └─ Batch 4 Trainers (draft)
```

Klik batch lain → navigate `/admin/batches/<other-batch-id>` di tab yang sama (kalau di Dokumen Pending → langsung ke Dokumen Pending batch baru).

### 6.2 Cross-batch view (aggregate task)

```
/admin/home                          → dashboard summary semua batch (existing)
/admin/dokumen/pending               → semua dokumen pending across batches
/admin/sertifikat                    → semua sertifikat (issued + pending)
/admin/daftar-peserta                → search peserta lintas batch (existing)
/admin/manage-training               → manage course/program (existing)
/admin/tier-management               → manage tier templates (existing)
```

### 6.3 Per-peserta drill-down

```
/admin/peserta/:userId               → drill-down 1 peserta:
  ├─ Identity (KTP, NPWP, foto)     ← akun-level data
  ├─ Workspaces (list semua workspace peserta)
  └─ Riwayat (payment, audit)

/admin/peserta/:userId/workspaces/<slug>  → admin view workspace peserta (read + edit dengan permission)
```

Plus tombol **"View as user"** di header `/admin/peserta/:userId` untuk impersonate (masuk ke workspace user dengan slug `/b1-trainers/...` sebagai user tersebut). Pakai pattern Better Auth impersonation kalau tersedia.

### 6.4 Backend admin queries jadi sadar workspace

Admin query yang sebelumnya filter per peserta, sekarang JOIN ke `workspaces` untuk filter per batch atau per program. Existing admin views tidak dirombak; cuma backend query-nya yang di-update.

### 6.5 Bulk actions per batch

- Approve semua dokumen wajib di Batch 1 Trainers (di tab Dokumen Pending)
- Generate sertifikat untuk semua peserta yang lulus (di tab Sertifikat)
- Send notifikasi ke semua peserta batch

Backend resolve `batch_id` → list semua workspace di batch itu (`SELECT * FROM workspaces WHERE batch_id = ? AND status = 'active'`) → loop action per workspace.

---

## 7. Edge Cases

### 7.1 Workspace creation timing

Workspace dibuat saat enrollment pertama kali jadi `paymentStatus = 'paid'`. Di payment service, setelah Scalev confirm payment, trigger `WorkspaceService.createForEnrollment(enrollmentId)`.

Pending payment → tidak ada workspace. User belum bisa akses route workspace.

Service `createForEnrollment` harus **idempotent**: cek `UNIQUE (enrollment_id)` constraint, kalau workspace sudah ada untuk enrollment ini, return existing workspace (bukan throw error). Penting untuk handle webhook payment yang bisa dipanggil berkali-kali.

### 7.2 Refund / cancel

Status `enrollment.paymentStatus = 'cancel'` atau `'refunded'` → set `workspaces.status = 'suspended'`, `workspaces.archived_at = NOW()`. User tidak bisa akses workspace (middleware filter status = 'active'). Data tidak dihapus (history, audit, dispute). Admin bisa unsuspend kalau ada kasus.

### 7.3 Bundling 2 peserta (invite flow)

1. Peserta pertama (pembeli) bayar → workspace pertama dibuat.
2. Saat enrollment slot ke-2 (Bundling tier punya `max_participants = 2`), `peserta_batch.invite_token` di-generate untuk slot kosong.
3. Pembeli kasih link `/auth/accept-invite/<token>` ke peserta kedua.
4. Peserta kedua register/login → enrollment slot ke-2 di-claim (set `peserta_id`, `paymentStatus = 'paid'`) → workspace kedua dibuat untuk dia.
5. `invite_token` di-invalidate setelah claimed.

Detail UI invite flow disimplifikasi di phase awal: cukup link email + halaman accept basic.

### 7.4 Slug collision

- Format `b{n}-{course_short_code}` plus UNIQUE constraint pada `(user_id, slug)` mencegah collision per user.
- Reserved word collision (course short_code = "admin") di-reject di admin UI saat input.
- Edge case: kalau ada legacy data atau race condition, slug generator append suffix `-2`, `-3`, dst.

### 7.5 User akses URL slug yang bukan miliknya

Sudah covered di Section 4.4: redirect ke default workspace user (last accessed) atau ke `/workspaces` kalau 0 workspace active.

### 7.6 User belum bayar, akses `/`

Redirect ke `/workspaces` empty state dengan CTA "Lihat program tersedia".

### 7.7 Tier upgrade setelah workspace dibuat

Misal user awalnya beli Platinum, lalu beli AI Mentor sebagai upgrade ke Premier untuk batch yang sama. Out of scope untuk phase ini — anggap setiap workspace tier-nya fixed di creation. Upgrade = manual proses admin (ubah `peserta_batch.tier_id`, sidebar AI Hub muncul setelah refresh).

### 7.8 Course tanpa `short_code` atau batch tanpa `batch_number`

Block workspace creation. Validation di `WorkspaceService.createForEnrollment`: kalau course atau batch belum punya kolom ini, throw error informatif. Admin harus isi via tier-management / manage-training UI dulu.

---

## 8. Migration (alpha — clean schema)

Karena 0 user existing:

1. **Drop dokumen-related data lama** (kalau ada seed yang tidak konsisten dengan skema baru). Tabel master tetap.
2. **Tambah kolom prerequisites:**
   - `courses.short_code` — admin isi via UI atau seed SQL.
   - `batch_training.batch_number` — admin isi.
3. **Buat tabel baru:** `workspaces`, `dokumen_jenis_program`.
4. **Modifikasi tabel existing** untuk tambah `workspace_id` NOT NULL FK:
   - `dokumen_peserta`, `todos`, `sertifikat`, `peserta_course_progress`, `tugas`, AI workspace tables.
5. **Drop kolom legacy:** `todos.batch_id` (covered via workspace).
6. **Seed data admin:** course short_codes, batch numbers, dokumen jenis × program mapping.
7. **Hapus legacy `/user/*` route handlers.** Replace dengan `/<slug>/*`. No redirect needed.

Setiap step adalah migration drizzle-kit terpisah, bisa di-rollback. Order penting karena foreign keys.

---

## 9. Out of Scope

Hal-hal yang **tidak** dikerjakan di spec ini, eksplisit:

- **Admin UX overhaul.** Yang dikerjakan: minimum awareness (kolom workspace info, batch dropdown, View as user button, tab baru di batch detail). Refactor besar admin UX = spec terpisah dengan brainstorming sendiri.
- **Tier-level dokumen.** Schema bisa di-extend nanti dengan menambah `tier_slug` di junction `dokumen_jenis_program`.
- **Workspace sharing antar user.** Workspace strictly private per user.
- **Cross-workspace search/aggregation untuk peserta.** Misal "tampilkan semua sertifikat dari semua workspace di 1 page user-level". Bisa dibuat sebagai akun-level page nanti.
- **Workspace archiving manual oleh user.** Cuma admin yang archive (otomatis saat program selesai atau refund).
- **AI Hub state migration kalau user upgrade tier.** Anggap setiap workspace state-nya self-contained.
- **Real-time multi-device sync** (notifikasi push, websocket per workspace) — pakai polling existing.
- **Backup/export data per workspace.** Future feature.

---

## 10. Implementation Phases

Detail per phase masuk ke implementation plan terpisah (lewat `writing-plans` skill setelah spec approved).

### Phase 1: Foundation

- Schema migration: `workspaces`, prerequisites kolom (`courses.short_code`, `batch_training.batch_number`).
- Slug generator service.
- Route middleware (backend + frontend) untuk slug resolution & redirect.
- Layout shell baru: top bar dengan workspace switcher, sidebar dengan workspace + akun section.
- `/workspaces` page (selector + empty state).
- Test dengan 1 dummy workspace seeded.

### Phase 2: Scoped data

- Schema: `dokumen_jenis_program` junction.
- Schema: tambah `workspace_id` NOT NULL ke tabel scoped (`dokumen_peserta`, `todos`, `sertifikat`, `peserta_course_progress`, `tugas`, AI workspace tables).
- Drop kolom legacy (`todos.batch_id`).
- Update services & routes untuk semua module:
  - `dokumen` — query pakai `workspace_id` + filter via junction.
  - `todos`, `sertifikat`, `kelas`, `tugas`, AI — scope ke `workspace_id`.
- Frontend views update untuk pakai `workspace_id` dari URL context (bukan global per user).

### Phase 3: Workspace lifecycle

- `WorkspaceService.createForEnrollment(enrollmentId)` — auto-create on payment success (hook ke payment service).
- Suspend on refund — hook ke payment status update.
- Bundling invite flow: `peserta_batch.invite_token`, `/auth/accept-invite/<token>` route, claim logic.
- Archive on completion (manual oleh admin via batch detail).

### Phase 4: Admin awareness

- Backend admin queries pakai workspace_id JOIN.
- Frontend admin: breadcrumb batch dropdown di `/admin/batches/:batchId`.
- New tabs di batch detail: Dokumen Pending, Sertifikat, Progress Kelas.
- `/admin/peserta/:userId` drill-down dengan workspaces list.
- "View as user" button (impersonate via Better Auth).
- Cross-batch admin pages: `/admin/dokumen/pending`, `/admin/sertifikat`.

---

## Appendix A: Existing Codebase References

Modul existing yang akan terpengaruh:

- `apps/backend-hono/src/db/schema/` — tambah workspaces.ts, modifikasi dokumen.ts, todos.ts, certificates.ts, learning.ts, batch.ts, people.ts (course short_code, batch number).
- `apps/backend-hono/src/dokumen/` — service & routes update untuk pakai workspace_id + junction.
- `apps/backend-hono/src/enrollment/` — hook ke workspace creation.
- `apps/backend-hono/src/payment/payment.service.ts` — trigger workspace creation pada payment success, suspend pada refund.
- `apps/backend-hono/src/todos/`, `certificates/`, `kelas/`, `tugas/`, `interview/`, `ai/` — scope to workspace.
- `apps/backend-hono/src/auth/auth.middleware.ts` — extend dengan workspace context.
- `apps/frontend/src/routes/protectedRouteChildren.tsx` — replace `/user/*` dengan `/<slug>/*`, tambah reserved root routes.
- `apps/frontend/src/layouts/full/` — top bar workspace switcher, sidebar dengan workspace + akun section.
- `apps/frontend/src/views/dokumen/` — update useDokumen hook untuk workspace context.
- `apps/frontend/src/views/admin/batches/AdminBatchDetail.tsx` — tambah tabs (Dokumen Pending, Sertifikat, Progress Kelas) dan breadcrumb dropdown.
- `apps/frontend/src/views/admin/DaftarPeserta.tsx` — tambah link drill-down ke `/admin/peserta/:userId`.

---

## Appendix B: Ringkasan Keputusan Brainstorming

| Decision | Pilihan | Alasan |
|----------|---------|--------|
| Unit workspace | Per (program × batch) per user | 1:1 dengan enrollment. User tidak repeat batch. |
| Tabel workspace | Tabel baru `workspaces` (Pendekatan 2) | Pemisahan semantik dari enrollment, atribut UX-spesifik (slug, last_accessed, display_name). |
| URL format | `/<slug>/*` di root, slug `b<n>-<short-code>` | Pendek, scope unique per-user. |
| Slug uniqueness | Per-user (tidak global) | URL pendek, workspace strictly private. |
| Akses URL slug bukan milik user | Redirect ke default workspace user | UX friendly, no 404. |
| Dokumen jenis × program | M:N junction (Opsi B) | Scalable untuk reuse jenis antar program, order_index per program. |
| Tier-level dokumen | Out of scope | Schema extensible nanti. |
| Admin UX | Batch-context dengan breadcrumb dropdown + cross-batch pages + per-peserta drill-down | Admin tidak masuk workspace; existing routes tetap dengan minor expand. |
| Migration | Clean schema (alpha 0 users) | Tidak perlu backfill. |
| Bundling 2-peserta | Invite flow → 2 akun + 2 workspace | Konsisten dengan model 1 user × 1 enrollment = 1 workspace. |

---

End of spec.
