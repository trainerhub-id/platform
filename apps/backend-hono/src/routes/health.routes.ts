import { Hono } from "hono";

export function createHealthRoutes() {
  const app = new Hono();

  app.get("/health", (c) =>
    c.json({
      ok: true,
      service: "trainerhub-backend-hono",
    }),
  );

  app.get("/ready", (c) =>
    c.json({
      ok: true,
      checks: {
        env: true,
      },
    }),
  );

  return app;
}
