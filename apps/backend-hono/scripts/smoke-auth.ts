import { createApp } from '../src/app'

const app = createApp()
const response = await app.request('/api/auth/session')

if (response.status !== 401) {
  throw new Error(`Expected unauthenticated session to return 401, got ${response.status}`)
}

const body = await response.json()
if (body?.error?.code !== 'UNAUTHORIZED') {
  throw new Error(`Expected UNAUTHORIZED error, got ${JSON.stringify(body)}`)
}

console.log('Better Auth unauthenticated session smoke passed')
