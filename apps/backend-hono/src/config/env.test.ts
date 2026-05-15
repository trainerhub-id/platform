import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("parses a valid Neon database URL", () => {
    const env = parseEnv({
      NODE_ENV: "test",
      PORT: "3100",
      DATABASE_URL: "postgresql://user:pass@example.neon.tech/neondb?sslmode=require",
      LOG_LEVEL: "debug",
    });

    expect(env.NODE_ENV).toBe("test");
    expect(env.PORT).toBe(3100);
    expect(env.DATABASE_URL).toContain("postgresql://user:pass@");
    expect(env.LOG_LEVEL).toBe("debug");
  });

  it("rejects missing DATABASE_URL", () => {
    expect(() =>
      parseEnv({
        NODE_ENV: "test",
        PORT: "3100",
      }),
    ).toThrow(/DATABASE_URL/);
  });

  it("parses Better Auth settings", () => {
    const env = parseEnv({
      NODE_ENV: "test",
      PORT: "3100",
      DATABASE_URL: "postgresql://user:pass@example.neon.tech/neondb?sslmode=require",
      BETTER_AUTH_SECRET: "a-test-secret-with-at-least-32-characters",
      BETTER_AUTH_URL: "http://localhost:3000",
    });

    expect(env.BETTER_AUTH_SECRET).toBe("a-test-secret-with-at-least-32-characters");
    expect(env.BETTER_AUTH_URL).toBe("http://localhost:3000");
  });

  it("parses DeepSeek AI settings", () => {
    const env = parseEnv({
      NODE_ENV: "test",
      PORT: "3100",
      DATABASE_URL: "postgresql://user:pass@example.neon.tech/neondb?sslmode=require",
      AI_PROVIDER: "deepseek",
      AI_MODEL: "deepseek-v4-flash",
      DEEPSEEK_API_KEY: "sk-test",
      DEEPSEEK_BASE_URL: "https://api.deepseek.com/v1",
    });

    expect(env.AI_PROVIDER).toBe("deepseek");
    expect(env.AI_MODEL).toBe("deepseek-v4-flash");
    expect(env.DEEPSEEK_BASE_URL).toBe("https://api.deepseek.com/v1");
    expect(env.WSP_API_URL).toBe("https://wsp.sertifikasitrainer.com");
  });

  it("parses generation storage settings", () => {
    const env = parseEnv({
      NODE_ENV: "test",
      PORT: "3100",
      DATABASE_URL: "postgresql://user:pass@example.neon.tech/neondb?sslmode=require",
      OUTPUT_DIR: "/tmp/trainerhub-output",
      PGBOSS_SCHEMA: "pgboss_test",
    });

    expect(env.OUTPUT_DIR).toBe("/tmp/trainerhub-output");
    expect(env.PGBOSS_SCHEMA).toBe("pgboss_test");
  });
});
