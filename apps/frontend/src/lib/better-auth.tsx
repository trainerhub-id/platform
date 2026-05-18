import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const API_URL = import.meta.env.VITE_API_URL || '/api'

type RawAuthUser = {
  id: string
  email: string
  name?: string | null
  image?: string | null
  role?: string | null
  emailVerified?: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
  [key: string]: unknown
}

type RawAuthSession = {
  id: string
  token?: string | null
  userId: string
  expiresAt?: string | Date
  [key: string]: unknown
}

export type BetterAuthUser = RawAuthUser & {
  fullName: string | null
  firstName: string | null
  username: string | null
  imageUrl: string
  publicMetadata: Record<string, unknown>
  unsafeMetadata: Record<string, unknown>
  primaryEmailAddress: { emailAddress: string } | null
  update: (input: Record<string, unknown>) => Promise<BetterAuthUser>
}

type AuthContextValue = {
  isLoaded: boolean
  isSignedIn: boolean
  user: BetterAuthUser | null
  session: RawAuthSession | null
  refresh: () => Promise<void>
  signInEmail: (input: {
    email: string
    password: string
    rememberMe?: boolean
  }) => Promise<{ token?: string | null; user?: RawAuthUser }>
  signUpEmail: (input: {
    name: string
    email: string
    password: string
    rememberMe?: boolean
  }) => Promise<{ token?: string | null; user?: RawAuthUser }>
  signOut: () => Promise<void>
  getToken: (...args: unknown[]) => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function toAuthError(error: unknown, fallback: string) {
  if (error instanceof Error) {
    const err = error as Error & { errors?: Array<{ longMessage?: string; message?: string }> }
    return err.errors?.[0]?.longMessage || err.errors?.[0]?.message || err.message || fallback
  }
  return fallback
}

async function authFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      payload?.message || payload?.error?.message || payload?.error || response.statusText
    const error = new Error(message || 'Authentication request failed') as Error & {
      errors?: Array<{ longMessage: string }>
    }
    error.errors = [{ longMessage: message || 'Authentication request failed' }]
    throw error
  }

  return response.json() as Promise<T>
}

function normalizeUser(user: RawAuthUser, refresh: () => Promise<void>): BetterAuthUser {
  const name = user.name || user.email?.split('@')[0] || null
  const role = !user.role || user.role === 'user' ? 'peserta' : user.role

  return {
    ...user,
    name,
    fullName: name,
    firstName: name?.split(' ')[0] ?? null,
    username: user.email?.split('@')[0] ?? null,
    imageUrl: user.image || '',
    publicMetadata: { role },
    unsafeMetadata: {},
    primaryEmailAddress: user.email ? { emailAddress: user.email } : null,
    update: async () => {
      await refresh()
      return normalizeUser(user, refresh)
    },
  }
}

export function BetterAuthProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [user, setUser] = useState<BetterAuthUser | null>(null)
  const [session, setSession] = useState<RawAuthSession | null>(null)

  const refresh = useCallback(async () => {
    try {
      const payload = await authFetch<{ user: RawAuthUser; session: RawAuthSession }>(
        '/auth/session',
        {
          method: 'GET',
        },
      )
      setSession(payload.session)
      setUser(normalizeUser(payload.user, refresh))
    } catch {
      setSession(null)
      setUser(null)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const signInEmail = useCallback(
    async (input: { email: string; password: string; rememberMe?: boolean }) => {
      const payload = await authFetch<{ token?: string | null; user?: RawAuthUser }>(
        '/auth/sign-in/email',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      )
      await refresh()
      return payload
    },
    [refresh],
  )

  const signUpEmail = useCallback(
    async (input: { name: string; email: string; password: string; rememberMe?: boolean }) => {
      const payload = await authFetch<{ token?: string | null; user?: RawAuthUser }>(
        '/auth/sign-up/email',
        {
          method: 'POST',
          body: JSON.stringify(input),
        },
      )
      await refresh()
      return payload
    },
    [refresh],
  )

  const signOut = useCallback(async () => {
    await authFetch<{ success: boolean }>('/auth/sign-out', { method: 'POST' }).catch(() => ({
      success: true,
    }))
    setSession(null)
    setUser(null)
  }, [])

  const getToken = useCallback(async (..._args: unknown[]) => session?.token ?? null, [session])

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoaded,
      isSignedIn: Boolean(user),
      user,
      session,
      refresh,
      signInEmail,
      signUpEmail,
      signOut,
      getToken,
    }),
    [getToken, isLoaded, refresh, session, signInEmail, signOut, signUpEmail, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useBetterAuthContext() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('BetterAuthProvider is missing')
  return value
}

export function useAuth() {
  const { isLoaded, isSignedIn, getToken, session } = useBetterAuthContext()
  return { isLoaded, isSignedIn, getToken, sessionId: session?.id ?? null }
}

export function useUser() {
  const { isLoaded, isSignedIn, user } = useBetterAuthContext()
  return { isLoaded, isSignedIn, user }
}

export function useAuthActions() {
  const { signOut } = useBetterAuthContext()
  return { signOut }
}

export function useSignIn() {
  const { isLoaded, signInEmail, refresh } = useBetterAuthContext()

  return {
    isLoaded,
    setActive: async (..._args: unknown[]) => {
      await refresh()
    },
    signIn: {
      create: async (input: Record<string, unknown>) => {
        if (input.strategy === 'ticket') {
          throw new Error('Payment claim now requires manual login with the registered email.')
        }

        if (input.strategy === 'reset_password_email_code') {
          throw new Error('Password reset email is not configured yet.')
        }

        const email = String(input.identifier ?? input.email ?? '')
        const password = String(input.password ?? '')
        const result = await signInEmail({ email, password })
        return {
          status: 'complete',
          createdSessionId: result.token ?? null,
          supportedSecondFactors: [],
        }
      },
      prepareSecondFactor: async (..._args: unknown[]) => undefined,
      attemptSecondFactor: async (..._args: unknown[]) => ({
        status: 'complete',
        createdSessionId: null,
      }),
      attemptFirstFactor: async (..._args: unknown[]) => {
        throw new Error('Password reset email is not configured yet.')
        return { status: 'needs_identifier' } as { status: string }
      },
      authenticateWithRedirect: async (..._args: unknown[]) => {
        throw new Error('Social sign-in is not configured yet.')
      },
    },
  }
}

export function useSignUp() {
  const { isLoaded, signUpEmail, refresh } = useBetterAuthContext()

  return {
    isLoaded,
    setActive: async (..._args: unknown[]) => {
      await refresh()
    },
    signUp: {
      create: async (input: Record<string, unknown>) => {
        const email = String(input.emailAddress ?? input.email ?? '')
        const password = String(input.password ?? '')
        const metadata =
          input.unsafeMetadata && typeof input.unsafeMetadata === 'object'
            ? (input.unsafeMetadata as Record<string, unknown>)
            : {}
        const name = String(
          input.firstName ?? input.name ?? metadata.firstName ?? email.split('@')[0],
        )
        const result = await signUpEmail({ name, email, password })
        return {
          status: 'complete',
          createdSessionId: result.token ?? null,
          prepareEmailAddressVerification: async () => undefined,
        }
      },
      prepareEmailAddressVerification: async (..._args: unknown[]) => undefined,
      attemptEmailAddressVerification: async (..._args: unknown[]) => ({
        status: 'complete',
        createdSessionId: null,
      }),
    },
  }
}

export function AuthenticateWithRedirectCallback() {
  useEffect(() => {
    window.location.replace('/')
  }, [])

  return null
}

export { toAuthError }
