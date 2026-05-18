import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, isAbsolute, resolve } from 'node:path'
import { env } from '../config/env'

export function sanitizeFilename(filename: string): string {
  const base = basename(filename)
    .replace(/["\r\n\\]/g, '_')
    .replace(/[^\p{L}\p{N} ._()\-[\]]/gu, '_')
    .trim()
  return base.length > 0 ? base : 'file'
}

export function resolveSafeOutputPath(baseDir: string, filename: string): string {
  const resolvedBase = resolve(baseDir)
  const safeName = sanitizeFilename(filename)
  const resolvedPath = resolve(resolvedBase, safeName)
  if (resolvedPath !== resolvedBase && !resolvedPath.startsWith(`${resolvedBase}/`)) {
    throw new Error('File path is outside output directory')
  }
  return resolvedPath
}

export class FileStorageService {
  private readonly baseDir: string

  constructor(baseDir = env.OUTPUT_DIR) {
    this.baseDir = resolve(baseDir)
  }

  async writeBuffer(filename: string, buffer: Buffer | Uint8Array): Promise<string> {
    const filePath = resolveSafeOutputPath(this.baseDir, filename)
    await mkdir(this.baseDir, { recursive: true })
    await writeFile(filePath, buffer)
    return filePath
  }

  async readBuffer(filePath: string): Promise<Buffer> {
    const resolvedPath = resolve(filePath)
    if (
      !isAbsolute(filePath) ||
      (resolvedPath !== this.baseDir && !resolvedPath.startsWith(`${this.baseDir}/`))
    ) {
      throw new Error('File path is outside output directory')
    }
    return readFile(resolvedPath)
  }
}
