import type { DocumentRenderer, RenderContext } from './renderer.types'

export class RendererNotFoundError extends Error {
  constructor(context: RenderContext) {
    super(`RENDERER_NOT_FOUND:${context.renderer}:${context.documentType}`)
    this.name = 'RendererNotFoundError'
  }
}

export class RendererRegistry {
  constructor(private readonly renderers: DocumentRenderer[]) {}

  getRenderer(context: RenderContext): DocumentRenderer {
    const renderer = this.renderers.find((candidate) => candidate.supports(context))
    if (!renderer) throw new RendererNotFoundError(context)
    return renderer
  }
}
