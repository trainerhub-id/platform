import { readFile } from 'node:fs/promises'
import { createReport } from 'docx-templates'
import type { DocumentRenderer, RenderContext, RenderInput, RenderResult } from './renderer.types'
import { TemplateNotConfiguredError } from './renderer.types'

export class DocxTemplateRenderer implements DocumentRenderer {
  supports(context: RenderContext): boolean {
    return context.renderer === 'docx-template'
  }

  async render(input: RenderInput): Promise<RenderResult> {
    if (!input.context.templatePath) {
      throw new TemplateNotConfiguredError(input.context.documentType)
    }

    const template = await readFile(input.context.templatePath)
    const bytes = await createReport({
      template,
      data: input.payload as Record<string, unknown>,
    })

    return {
      bytes,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      outputFormat: 'docx',
    }
  }
}
