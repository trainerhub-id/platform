import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import type { AuthVariables } from "../auth/auth.middleware";
import { createInterviewRoutes } from "./interview.routes";

describe("interview routes", () => {
  it("blocks unauthenticated messages", async () => {
    const app = new Hono<{ Variables: AuthVariables }>();
    app.use("*", async (c, next) => {
      c.set("user", null);
      await next();
    });
    app.route("/", createInterviewRoutes({} as any));

    const res = await app.request("/api/interview/doc_1/message", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "halo" }),
    });

    expect(res.status).toBe(401);
  });

  it("validates message body", async () => {
    const app = new Hono<{ Variables: AuthVariables }>();
    app.use("*", async (c, next) => {
      c.set("user", { id: "user_1" } as never);
      await next();
    });
    app.route("/", createInterviewRoutes({ handleMessage: async () => new Response("unused") } as any));

    const res = await app.request("/api/interview/doc_1/message", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "" }),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("streams engine response for authenticated user", async () => {
    const app = new Hono<{ Variables: AuthVariables }>();
    app.use("*", async (c, next) => {
      c.set("user", { id: "user_1" } as never);
      await next();
    });
    app.route(
      "/",
      createInterviewRoutes({
        handleMessage: async () => new Response("Halo, saya bantu.", { status: 200 }),
      } as any),
    );

    const res = await app.request("/api/interview/doc_1/message", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ message: "halo" }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get("x-document-id")).toBe("doc_1");
    expect(await res.text()).toBe("Halo, saya bantu.");
  });
});
