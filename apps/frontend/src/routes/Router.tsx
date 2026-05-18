import { lazy } from 'react'
import { createBrowserRouter } from 'react-router'
import { ProtectedRoute } from '../components/auth/ProtectedRoute'
import RouterErrorElement from '../components/RouterErrorElement'
import Loadable from '../layouts/full/shared/loadable/Loadable'
import { protectedRouteChildren } from './protectedRouteChildren'
import { publicRouteChildren } from './publicRouteChildren'

const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')))
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')))

const Router = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <FullLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouterErrorElement />,
    children: protectedRouteChildren,
  },
  {
    path: '/',
    element: <BlankLayout />,
    errorElement: <RouterErrorElement />,
    children: publicRouteChildren,
  },
]

const router = createBrowserRouter(Router)

export default router
