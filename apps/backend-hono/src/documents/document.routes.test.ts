import { describe, expect, it } from "vitest";
import { createApp } from "../app";

describe("document routes", () => {
  it("blocks unauthenticated document creation", async () => {
    const app = createApp();
    const res = await app.request("/api/documents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ flow: "master", title: "Dokumen" }),
    });

    expect(res.status).toBe(401);
  });

  it("validates create document body before repository access", async () => {
    const app = createApp({
      testUser: { id: "user_1", email: "u@example.com", name: "User", role: "user" },
    });
    const res = await app.request("/api/documents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ flow: "master", title: "" }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
