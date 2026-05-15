import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("auth middleware", () => {
  it("mounts Better Auth routes under /api/auth", async () => {
    const app = createApp();
    const res = await app.request("/api/auth/session");

    expect([200, 401]).toContain(res.status);
  });

  it("blocks protected route without session", async () => {
    const app = createApp();
    const res = await app.request("/api/documents");
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });
});
