import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../config/env'
import * as schema from './schema'

export const sql = postgres(env.DATABASE_URL, {
  max: env.NODE_ENV === 'test' ? 1 : 10,
})

export const db = drizzle(sql, { schema })
