import { Hono } from 'hono'

const retiredPrefixes = ['/api/data/*', '/api/eCommerce/*', '/api/notes/*', '/api/kanban/*']

export function createRetiredRoutes() {
  const app = new Hono()

  for (const path of retiredPrefixes) {
    app.all(path, (c) =>
      c.json(
        {
          error: {
            code: 'RETIRED_ROUTE',
            message: 'This demo route is not available in production.',
          },
        },
        410,
      ),
    )
  }

  return app
}
