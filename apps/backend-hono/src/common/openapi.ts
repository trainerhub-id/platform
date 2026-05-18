import { OpenAPIHono } from '@hono/zod-openapi'

export function createOpenApiApp() {
  const app = new OpenAPIHono()

  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      title: 'TrainerHub Hono API',
      version: '0.1.0',
    },
  })

  app.get('/docs', (c) =>
    c.html(`<!doctype html>
<html>
  <head><title>TrainerHub Hono API Docs</title></head>
  <body>
    <h1>TrainerHub Hono API</h1>
    <p>OpenAPI JSON: <a href="/openapi.json">/openapi.json</a></p>
  </body>
</html>`),
  )

  return app
}
