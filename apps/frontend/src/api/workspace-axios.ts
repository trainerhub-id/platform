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
  'user',
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
      config.headers.set('X-Workspace-Slug', slug)
    }
    return config
  })
}

export default api
