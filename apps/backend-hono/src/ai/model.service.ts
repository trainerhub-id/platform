import { createDeepSeek } from '@ai-sdk/deepseek'
import type { LanguageModel } from 'ai'
import { type AppEnv, env } from '../config/env'

type AiModelEnv = Pick<
  AppEnv,
  'AI_PROVIDER' | 'AI_MODEL' | 'DEEPSEEK_API_KEY' | 'DEEPSEEK_BASE_URL'
>

export class AiModelNotConfiguredError extends Error {
  constructor(message = 'AI_MODEL_NOT_CONFIGURED') {
    super(message)
    this.name = 'AiModelNotConfiguredError'
  }
}

export class ModelService {
  constructor(private readonly modelEnv: AiModelEnv = env) {}

  getLanguageModel(): LanguageModel {
    if (this.modelEnv.AI_PROVIDER !== 'deepseek') {
      throw new AiModelNotConfiguredError(`Unsupported AI provider: ${this.modelEnv.AI_PROVIDER}`)
    }

    if (!this.modelEnv.DEEPSEEK_API_KEY) {
      throw new AiModelNotConfiguredError('AI_MODEL_NOT_CONFIGURED: DEEPSEEK_API_KEY is required')
    }

    const deepseek = createDeepSeek({
      apiKey: this.modelEnv.DEEPSEEK_API_KEY,
      baseURL: this.modelEnv.DEEPSEEK_BASE_URL,
    })

    return deepseek(this.modelEnv.AI_MODEL)
  }
}
