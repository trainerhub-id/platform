import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["src/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "postgresql://user:pass@example.neon.tech/neondb?sslmode=require",
      LOG_LEVEL: "silent",
    },
  },
});
