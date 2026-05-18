export const RESERVED_SLUG_SEGMENTS = [
  'auth',
  'admin',
  'profile',
  'settings',
  'billing',
  'workspaces',
  'api',
  'static',
  'assets',
] as const

export type ReservedSlugSegment = (typeof RESERVED_SLUG_SEGMENTS)[number]

export function isReservedSlugSegment(value: string): boolean {
  return (RESERVED_SLUG_SEGMENTS as readonly string[]).includes(value.toLowerCase())
}

const SHORT_CODE_PATTERN = /^[a-z0-9][a-z0-9-]*$/

export type GenerateWorkspaceSlugInput = {
  batchNumber: number
  courseShortCode: string
}

export function generateWorkspaceSlug(input: GenerateWorkspaceSlugInput): string {
  const shortCode = input.courseShortCode.trim().toLowerCase()

  if (!shortCode) throw new Error('short_code is required')

  if (isReservedSlugSegment(shortCode)) {
    throw new Error(`short_code '${shortCode}' is reserved`)
  }

  if (!SHORT_CODE_PATTERN.test(shortCode)) {
    throw new Error(`short_code '${shortCode}' contains invalid characters`)
  }

  if (
    !Number.isInteger(input.batchNumber) ||
    input.batchNumber <= 0
  ) {
    throw new Error('batch_number must be a positive integer')
  }

  return `b${input.batchNumber}-${shortCode}`
}
