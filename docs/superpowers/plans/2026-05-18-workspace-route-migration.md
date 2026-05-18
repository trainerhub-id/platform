# Migrate `/user/*` Routes to `/:slug/*` Workspace Namespace

**Goal:** Move all peserta routes from `/user/*` to `/:slug/*` so every page lives under the workspace context. The slug comes from the active workspace (e.g. `btch1-trainers`).

**Result:** After login, peserta lands on `/:slug` (dashboard). All navigation uses `/:slug/...` paths. `/user/*` routes are removed (with temporary redirects for bookmarks).

---

## Route Mapping

| Old Path | New Path (under `/:slug/`) |
|----------|---------------------------|
| `/user/home` | `/:slug` (index/dashboard) |
| `/user/training/info` | `/:slug/training` |
| `/user/profile` | `/:slug/profile` |
| `/user/kelas` | `/:slug/kelas` |
| `/user/kelas/:id` | `/:slug/kelas/:id` |
| `/user/dokumen` | `/:slug/dokumen` (already exists) |
| `/user/sertifikat` | `/:slug/sertifikat` (already exists) |
| `/user/ai-hub` | `/:slug/ai-hub` |
| `/user/ai-hub/master-workspace` | `/:slug/ai-hub/master-workspace` |
| `/user/ai-hub/trainer-workspace` | `/:slug/ai-hub/trainer-workspace` |
| `/user/ai-hub/branding` | `/:slug/ai-hub/branding` |
| `/user/ai-generator` | redirect → `/:slug/ai-hub/trainer-workspace` |
| `/user/documents` | redirect → `/:slug/ai-hub/trainer-workspace` |

---

## Tasks

### Task 1: Move routes in `protectedRouteChildren.tsx`

**File:** `apps/frontend/src/routes/protectedRouteChildren.tsx`

1. Remove all `/user/*` route entries (except keep temporary catch-all redirect).
2. Add all pages as children of the existing `/:slug` route:

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
    { path: 'training', element: <TrainingInformation /> },
    { path: 'profile', element: <ProfilePage /> },
    { path: 'kelas', element: <KelasArchive /> },
    { path: 'kelas/:id', element: <Kelas /> },
    { path: 'dokumen', element: <Dokumen /> },
    { path: 'sertifikat', element: <Sertifikat /> },
    { path: 'ai-hub', element: <AiHubSelection /> },
    { path: 'ai-hub/master-workspace', element: <AiWorkspace flow="master" /> },
    { path: 'ai-hub/trainer-workspace', element: <AiWorkspace flow="trainer" /> },
    { path: 'ai-hub/branding', element: <AiBrandingPlaceholder /> },
  ],
},
```

3. Add legacy redirects (catch `/user/*` and send to workspace):

```tsx
{ path: '/user/*', element: <LegacyUserRedirect /> },
```

Where `LegacyUserRedirect` reads the slug from workspace context and redirects.

---

### Task 2: Create `LegacyUserRedirect` component

**File:** `apps/frontend/src/components/LegacyUserRedirect.tsx`

Maps old `/user/X` paths to `/:slug/X`:
- `/user/home` → `/:slug`
- `/user/training/info` → `/:slug/training`
- `/user/dokumen` → `/:slug/dokumen`
- Others: strip `/user/` prefix, append to `/:slug/`

Uses `useWorkspaces()` to get the active slug.

---

### Task 3: Update sidebar navigation

**File:** `apps/frontend/src/layouts/full/vertical/sidebar/Sidebaritems.ts`

URLs must be dynamic (depend on slug). Two options:
- **Option A:** Change `url` to relative paths (e.g. `'kelas'`) and resolve in the sidebar component using current slug from context.
- **Option B:** Make `PesertaMenuItems` a function that takes `slug` and returns items with full paths.

**Recommended: Option B** — cleaner, explicit.

```ts
export const getPesertaMenuItems = (slug: string): MenuItem[] => [
  {
    id: 1,
    name: 'Menu Peserta',
    items: [{
      heading: '',
      children: [
        { name: 'Home', icon: '...', id: nextMenuId(), url: `/${slug}` },
        { name: 'Info Training', icon: '...', id: nextMenuId(), url: `/${slug}/training` },
        { name: 'Profil', icon: '...', id: nextMenuId(), url: `/${slug}/profile` },
        { name: 'Kelas', icon: '...', id: nextMenuId(), url: `/${slug}/kelas` },
        { name: 'Dokumen', icon: '...', id: nextMenuId(), url: `/${slug}/dokumen` },
        { name: 'AI Hub', icon: '...', id: nextMenuId(), url: `/${slug}/ai-hub` },
        { name: 'Sertifikat', icon: '...', id: nextMenuId(), url: `/${slug}/sertifikat` },
      ],
    }],
  },
]
```

Update sidebar component to call `getPesertaMenuItems(workspace.slug)`.

---

### Task 4: Update horizontal menu

**File:** `apps/frontend/src/layouts/full/horizontal/MenuData.ts`

Same pattern as Task 3 — make it a function that takes `slug`.

---

### Task 5: Update Header breadcrumb/title logic

**File:** `apps/frontend/src/layouts/full/vertical/header/Header.tsx`

Replace all `pathname === '/user/...'` checks with workspace-relative checks:
- `pathname === '/user/home'` → `pathname === '/' + slug` (or use a helper)
- Better: extract the sub-path after `/:slug/` and match on that.

```ts
const subPath = pathname.replace(`/${slug}`, '') || '/'
// Then: subPath === '/' for home, '/training' for training, etc.
```

---

### Task 6: Update `Data.ts` (header quick links)

**File:** `apps/frontend/src/layouts/full/vertical/header/Data.ts`

Make URLs dynamic with slug, same pattern as sidebar.

---

### Task 7: Update internal navigations in components

**Files:**
- `components/dashboards/trainer/QuickAccess.tsx` — URLs need slug prefix
- `views/ai-workspace/AiHubSelection.tsx` — route paths need slug
- `views/ai-workspace/AiBrandingPlaceholder.tsx` — Link to ai-hub
- `views/kelas/Kelas.tsx` — navigate calls
- `views/kelas/KelasArchive.tsx` — navigate calls
- `views/public/PaymentCallback.tsx` — navigate to home after payment
- `components/shared/CourseCompletionModal.tsx` — navigate to sertifikat

**Pattern:** Use a `useWorkspaceNav()` hook or get slug from `useParams()` / workspace context:

```ts
const { slug } = useWorkspace() // or useParams()
navigate(`/${slug}/kelas`)
```

---

### Task 8: Update `RoleBasedRedirect`

Already done — redirects to `/${slug}`. No change needed.

---

### Task 9: Update `ProtectedRoute.tsx`

**File:** `apps/frontend/src/components/auth/ProtectedRoute.tsx`

Remove the fallback `<Navigate to="/user/home">` for non-admin. Replace with `<Navigate to="/" replace />` (which triggers RoleBasedRedirect → workspace).

---

### Task 10: Build, deploy, verify

1. `bun run build` in `apps/frontend`
2. Copy dist to `/var/www/trainerbiz-clean/frontend/`
3. Playwright test: login → lands on `/:slug`, navigate sidebar links, verify all pages load.

---

## Execution Order

1 → 2 → 3 → 4 → 5 → 6 → 7 → 9 → 10

Tasks 3-7 can be parallelized after Task 1 is done.

## Risk

- **Bookmarked URLs:** Legacy redirect (Task 2) handles this.
- **PaymentCallback:** After payment, user needs workspace slug. If they don't have one yet (first payment creates enrollment), the redirect should go to `/workspaces` and workspace creation happens server-side on enrollment.
- **Admin routes:** Untouched — stay at `/admin/*`.

## Estimated scope

~13 files modified, ~70 path references updated. Medium complexity, mostly mechanical find-replace with slug injection.
