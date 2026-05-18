export type RenderFlow = 'master' | 'trainer'
export type RenderOutputFormat = 'docx' | 'pdf' | 'zip'
export type RendererName = 'docx-template' | 'programmatic-docx' | 'react-pdf'

export type RenderContext = {
  flow: RenderFlow
  documentType: string
  renderer: RendererName
  outputFormat: RenderOutputFormat
  templatePath?: string | null
}

export type RenderInput = {
  context: RenderContext
  payload: unknown
}

export type RenderResult = {
  bytes: Uint8Array
  mimeType: string
  outputFormat: RenderOutputFormat
}

export interface DocumentRenderer {
  supports(context: RenderContext): boolean
  render(input: RenderInput): Promise<RenderResult>
}

export class TemplateNotConfiguredError extends Error {
  constructor(documentType: string) {
    super(`TEMPLATE_NOT_CONFIGURED:${documentType}`)
    this.name = 'TemplateNotConfiguredError'
  }
}
