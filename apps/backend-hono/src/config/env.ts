import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().startsWith('postgresql://'),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal', 'silent']).default('info'),
  BETTER_AUTH_SECRET: z.string().min(32).default('dev-secret-change-me-dev-secret-change-me'),
  BETTER_AUTH_URL: z.string().url().default('http://localhost:3739/api/auth'),
  AI_PROVIDER: z.enum(['deepseek']).default('deepseek'),
  AI_MODEL: z.string().min(1).default('deepseek-v4-flash'),
  DEEPSEEK_API_KEY: z.string().min(1).optional(),
  DEEPSEEK_BASE_URL: z.string().url().default('https://api.deepseek.com/v1'),
  WSP_API_URL: z.string().url().default('https://wsp.sertifikasitrainer.com'),
  OUTPUT_DIR: z.string().min(1).default('./outputs'),
  PGBOSS_SCHEMA: z.string().min(1).default('pgboss'),
  FRONTEND_URL: z.string().url().default('http://localhost:5757'),
  FRONTEND_ORIGINS: z.string().optional(),
  AWS_REGION: z.string().min(1).default('auto'),
  AWS_S3_BUCKET: z.string().min(1).default('trainerhub-storage'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_ENDPOINT: z.string().url().optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
  MAX_FILE_SIZE_MB: z.coerce.number().positive().default(10),
  PAYMENT_PROVIDER: z.enum(['manual', 'scalev']).default('scalev'),
  MANUAL_PAYMENT_URL: z.string().url().optional(),
  SCALEV_API_KEY: z.string().optional(),
  SCALEV_BASE_URL: z.string().url().default('https://api.scalev.id'),
  SCALEV_STORE_UNIQUE_ID: z.string().optional(),
  SCALEV_VARIANT_UNIQUE_ID: z.string().optional(),
  SCALEV_BUNDLE_PRICE_OPTION_UNIQUE_ID: z.string().optional(),
})

export type AppEnv = z.infer<typeof envSchema>

export function parseEnv(input: NodeJS.ProcessEnv | Record<string, string | undefined>): AppEnv {
  const parsed = envSchema.safeParse(input)
  if (!parsed.success) {
    const message = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Invalid environment: ${message}`)
  }
  if (
    parsed.data.NODE_ENV === 'production' &&
    parsed.data.BETTER_AUTH_SECRET === 'dev-secret-change-me-dev-secret-change-me'
  ) {
    throw new Error('BETTER_AUTH_SECRET must be set to a secure value in production')
  }
  return parsed.data
}

export const env = parseEnv(process.env)

export function getFrontendOrigins(input: Pick<AppEnv, 'FRONTEND_URL' | 'FRONTEND_ORIGINS'> = env) {
  const origins = input.FRONTEND_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  return origins?.length ? origins : [input.FRONTEND_URL]
}
