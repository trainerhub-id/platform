import { lazy } from 'react'
import { Navigate } from 'react-router'
import Loadable from '../layouts/full/shared/loadable/Loadable'

const Login = Loadable(lazy(() => import('../views/authentication/auth1/Login')))
const AuthRegister = Loadable(lazy(() => import('../views/authentication/auth1/Register')))
const ForgotPassword = Loadable(lazy(() => import('../views/authentication/auth1/ForgotPassword')))
const PasswordResetRedirect = Loadable(
  lazy(() => import('../views/authentication/PasswordResetRedirect')),
)

const PublicRegister = Loadable(lazy(() => import('../views/public/Register')))
const PaymentCheckout = Loadable(lazy(() => import('../views/public/PaymentCheckout')))
const PaymentStatus = Loadable(lazy(() => import('../views/public/PaymentStatus')))
const PaymentCallback = Loadable(lazy(() => import('../views/public/PaymentCallback')))
const PaymentSuccess = Loadable(lazy(() => import('../views/public/PaymentSuccess')))
const PaymentFailed = Loadable(lazy(() => import('../views/public/PaymentFailed')))
const TwoSteps = Loadable(lazy(() => import('../views/authentication/auth1/TwoSteps')))
const SSOCallback = Loadable(lazy(() => import('../views/authentication/SSOCallback')))
const Maintainance = Loadable(lazy(() => import('../views/authentication/Maintainance')))
const Error = Loadable(lazy(() => import('../views/authentication/Error')))
const ValidateCertificate = Loadable(lazy(() => import('../views/certificate/ValidateCertificate')))

export const publicRouteChildren = [
  { path: '/auth/login', element: <Login /> },
  { path: '/auth/register', element: <AuthRegister /> },
  { path: '/auth/forgot-password', element: <ForgotPassword /> },
  { path: '/sign-in', element: <PasswordResetRedirect /> },
  { path: '/register', element: <PublicRegister /> },
  { path: '/register/:batchSlug/:tierSlug', element: <PublicRegister /> },
  { path: '/payment/checkout', element: <PaymentCheckout /> },
  { path: '/payment/status', element: <PaymentStatus /> },
  { path: '/payment/callback', element: <PaymentCallback /> },
  { path: '/payment/success', element: <PaymentSuccess /> },
  { path: '/payment/failed', element: <PaymentFailed /> },
  { path: '/auth/two-steps', element: <TwoSteps /> },
  { path: '/auth/maintenance', element: <Maintainance /> },
  { path: '/sso-callback', element: <SSOCallback /> },
  { path: '/validate/:certificateNumber', element: <ValidateCertificate /> },
  { path: '404', element: <Error /> },
  { path: '/auth/404', element: <Error /> },
  { path: '*', element: <Navigate to="/auth/404" /> },
]
