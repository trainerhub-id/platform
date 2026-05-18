import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'drizzle-kit'

function readEnvFile(path: string): Record<string, string> {
  if (!existsSync(path)) return {}

  return Object.fromEntries(
    readFileSync(path, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=')
        const key = line.slice(0, index).trim()
        const value = line
          .slice(index + 1)
          .trim()
          .replace(/^['"]|['"]$/g, '')
        return [key, value]
      }),
  )
}

function findRepoEnv(start: string): Record<string, string> {
  let current = start
  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = resolve(current, 'apps/backend/.env')
    if (existsSync(candidate)) return readEnvFile(candidate)

    const parent = resolve(current, '..')
    if (parent === current) break
    current = parent
  }
  return {}
}

const configDir = dirname(fileURLToPath(import.meta.url))
const cwd = process.cwd()
const fileEnv = {
  ...findRepoEnv(cwd),
  ...findRepoEnv(configDir),
  ...readEnvFile(resolve(cwd, '.env')),
  ...readEnvFile(resolve(cwd, '../backend/.env')),
  ...readEnvFile(resolve(configDir, '.env')),
  ...readEnvFile(resolve(configDir, '../backend/.env')),
}

const databaseUrl = process.env.DATABASE_URL ?? fileEnv.DATABASE_URL
if (!databaseUrl) {
  throw new Error('Invalid environment: DATABASE_URL is required')
}
if (!databaseUrl.startsWith('postgresql://')) {
  throw new Error('Invalid environment: DATABASE_URL must start with postgresql://')
}

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  strict: true,
  verbose: true,
})
