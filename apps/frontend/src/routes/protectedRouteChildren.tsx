import { lazy } from 'react';
import { Navigate } from 'react-router';
import { AdminRoute } from '../components/auth/AdminRoute';
import { UserRoute } from '../components/auth/UserRoute';
import { RoleBasedRedirect } from '../components/RoleBasedRedirect';
import Loadable from '../layouts/full/shared/loadable/Loadable';

const TrainerDashboard = Loadable(lazy(() => import('../views/dashboard/TrainerDashboard')));
const TrainingInformation = Loadable(lazy(() => import('../views/training/TrainingInformation')));
const KelasArchive = Loadable(lazy(() => import('../views/kelas/KelasArchive')));
const Kelas = Loadable(lazy(() => import('../views/kelas/Kelas')));
const Sertifikat = Loadable(lazy(() => import('../views/sertifikat/Sertifikat')));
const AiRebuild = Loadable(lazy(() => import('../views/ai-rebuild/AiRebuild')));
const AdminHome = Loadable(lazy(() => import('../views/admin/AdminHome')));
const ManageTraining = Loadable(lazy(() => import('../views/admin/ManageTraining')));
const TierManagement = Loadable(lazy(() => import('../views/admin/tier-management/TierManagement')));
const DaftarPeserta = Loadable(lazy(() => import('../views/admin/DaftarPeserta')));
const DaftarTrainer = Loadable(lazy(() => import('../views/admin/DaftarTrainer')));
const Settings = Loadable(lazy(() => import('../views/admin/Settings')));
const MuxVideoList = Loadable(lazy(() => import('../views/admin/MuxVideoList')));
const ProfilePage = Loadable(lazy(() => import('../views/profile/ProfilePage')));
const ManageKelas = Loadable(lazy(() => import('../views/admin/ManageKelas')));
const EditKelas = Loadable(lazy(() => import('../views/admin/EditKelas')));
const Dokumen = Loadable(lazy(() => import('../views/dokumen/Dokumen')));

export const protectedRouteChildren = [
  { path: '/', exact: true, element: <RoleBasedRedirect /> },
  { path: '/user/home', exact: true, element: <UserRoute><TrainerDashboard /></UserRoute> },
  { path: '/user/training/info', exact: true, element: <UserRoute><TrainingInformation /></UserRoute> },
  { path: '/user/kelas', exact: true, element: <UserRoute><KelasArchive /></UserRoute> },
  { path: '/user/kelas/:id', exact: true, element: <UserRoute><Kelas /></UserRoute> },
  { path: '/user/dokumen', exact: true, element: <UserRoute><Dokumen /></UserRoute> },
  { path: '/user/sertifikat', exact: true, element: <UserRoute><Sertifikat /></UserRoute> },
  { path: '/user/ai-generator', exact: true, element: <UserRoute><AiRebuild /></UserRoute> },
  { path: '/user/ai-hub', exact: true, element: <UserRoute><AiRebuild /></UserRoute> },
  { path: '/user/ai-hub/master-workspace', exact: true, element: <UserRoute><AiRebuild /></UserRoute> },
  { path: '/user/ai-hub/:category', exact: true, element: <UserRoute><AiRebuild /></UserRoute> },
  { path: '/user/documents', exact: true, element: <UserRoute><AiRebuild /></UserRoute> },
  { path: '/trainer/documents', exact: true, element: <UserRoute><AiRebuild /></UserRoute> },
  { path: '/user/profile', exact: true, element: <UserRoute><ProfilePage /></UserRoute> },

  { path: '/admin/home', exact: true, element: <AdminRoute><AdminHome /></AdminRoute> },
  { path: '/admin/manage-training', exact: true, element: <AdminRoute><ManageTraining /></AdminRoute> },
  { path: '/admin/tier-management', exact: true, element: <AdminRoute><TierManagement /></AdminRoute> },
  { path: '/admin/daftar-peserta', exact: true, element: <AdminRoute><DaftarPeserta /></AdminRoute> },
  { path: '/admin/daftar-trainer', exact: true, element: <AdminRoute><DaftarTrainer /></AdminRoute> },
  { path: '/admin/manage-kelas', exact: true, element: <AdminRoute><ManageKelas /></AdminRoute> },
  { path: '/admin/manage-kelas/create', exact: true, element: <AdminRoute><EditKelas /></AdminRoute> },
  { path: '/admin/manage-kelas/edit/:id', exact: true, element: <AdminRoute><EditKelas /></AdminRoute> },
  { path: '/admin/settings', exact: true, element: <AdminRoute><Settings /></AdminRoute> },
  { path: '/admin/mux-videos', exact: true, element: <AdminRoute><MuxVideoList /></AdminRoute> },
  { path: '*', element: <Navigate to="/auth/404" /> },
];
