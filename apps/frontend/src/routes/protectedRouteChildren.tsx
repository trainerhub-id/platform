import { lazy } from 'react'
import { Navigate } from 'react-router'
import { AdminRoute } from '../components/auth/AdminRoute'
import { UserRoute } from '../components/auth/UserRoute'
import { RoleBasedRedirect } from '../components/RoleBasedRedirect'
import { LegacyUserRedirect } from '../components/LegacyUserRedirect'
import Loadable from '../layouts/full/shared/loadable/Loadable'
import { WorkspaceRouteWrapper } from '../components/workspace/WorkspaceRouteWrapper'

const TrainerDashboard = Loadable(lazy(() => import('../views/dashboard/TrainerDashboard')))
const TrainingInformation = Loadable(lazy(() => import('../views/training/TrainingInformation')))
const KelasArchive = Loadable(lazy(() => import('../views/kelas/KelasArchive')))
const Kelas = Loadable(lazy(() => import('../views/kelas/Kelas')))
const Sertifikat = Loadable(lazy(() => import('../views/sertifikat/Sertifikat')))
const AiHubSelection = Loadable(lazy(() => import('../views/ai-workspace/AiHubSelection')))
const AiWorkspace = Loadable(lazy(() => import('../views/ai-workspace/AiWorkspace')))
const AiBrandingPlaceholder = Loadable(
  lazy(() => import('../views/ai-workspace/AiBrandingPlaceholder')),
)
const AdminHome = Loadable(lazy(() => import('../views/admin/AdminHome')))
const AdminBatchList = Loadable(lazy(() => import('../views/admin/batches/AdminBatchList')))
const AdminBatchDetail = Loadable(lazy(() => import('../views/admin/batches/AdminBatchDetail')))
const ManageTraining = Loadable(lazy(() => import('../views/admin/ManageTraining')))
const TierManagement = Loadable(lazy(() => import('../views/admin/tier-management/TierManagement')))
const DaftarPeserta = Loadable(lazy(() => import('../views/admin/DaftarPeserta')))
const DaftarTrainer = Loadable(lazy(() => import('../views/admin/DaftarTrainer')))
const Settings = Loadable(lazy(() => import('../views/admin/Settings')))
const MuxVideoList = Loadable(lazy(() => import('../views/admin/MuxVideoList')))
const ProfilePage = Loadable(lazy(() => import('../views/profile/ProfilePage')))
const ManageKelas = Loadable(lazy(() => import('../views/admin/ManageKelas')))
const EditKelas = Loadable(lazy(() => import('../views/admin/EditKelas')))
const Dokumen = Loadable(lazy(() => import('../views/dokumen/Dokumen')))
const Workspaces = Loadable(lazy(() => import('../views/workspaces/Workspaces')))
const WorkspaceDashboard = Loadable(
  lazy(() => import('../views/workspace-dashboard/WorkspaceDashboard')),
)

export const protectedRouteChildren = [
  { path: '/', exact: true, element: <RoleBasedRedirect /> },

  // Workspace routes — all peserta pages live here
  {
    path: '/:slug',
    element: (
      <UserRoute>
        <WorkspaceRouteWrapper />
      </UserRoute>
    ),
    children: [
      { index: true, element: <TrainerDashboard /> },
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

  // Legacy /user/* redirects (bookmarks, old links)
  { path: '/user/*', element: <LegacyUserRedirect /> },
  { path: '/trainer/documents', element: <LegacyUserRedirect /> },

  // Workspace selector
  {
    path: '/workspaces',
    exact: true,
    element: (
      <UserRoute>
        <Workspaces />
      </UserRoute>
    ),
  },

  // Admin routes (unchanged)
  {
    path: '/admin/home',
    exact: true,
    element: (
      <AdminRoute>
        <AdminHome />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/batches',
    exact: true,
    element: (
      <AdminRoute>
        <AdminBatchList />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/batches/:batchId',
    exact: true,
    element: (
      <AdminRoute>
        <AdminBatchDetail />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/manage-training',
    exact: true,
    element: (
      <AdminRoute>
        <ManageTraining />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/tier-management',
    exact: true,
    element: (
      <AdminRoute>
        <TierManagement />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/daftar-peserta',
    exact: true,
    element: (
      <AdminRoute>
        <DaftarPeserta />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/daftar-trainer',
    exact: true,
    element: (
      <AdminRoute>
        <DaftarTrainer />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/manage-kelas',
    exact: true,
    element: (
      <AdminRoute>
        <ManageKelas />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/manage-kelas/create',
    exact: true,
    element: (
      <AdminRoute>
        <EditKelas />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/manage-kelas/edit/:id',
    exact: true,
    element: (
      <AdminRoute>
        <EditKelas />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/settings',
    exact: true,
    element: (
      <AdminRoute>
        <Settings />
      </AdminRoute>
    ),
  },
  {
    path: '/admin/mux-videos',
    exact: true,
    element: (
      <AdminRoute>
        <MuxVideoList />
      </AdminRoute>
    ),
  },

  { path: '*', element: <Navigate to="/auth/404" /> },
]
