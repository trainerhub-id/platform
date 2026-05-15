import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { auth } from "./auth/better-auth";
import { sessionMiddleware, type AuthVariables } from "./auth/auth.middleware";
import { createBatchRoutes } from "./batch/batch.routes";
import { createCertificateRoutes } from "./certificates/certificate.routes";
import { handleAppError, errorResponse } from "./common/errors";
import { createOpenApiApp } from "./common/openapi";
import { requestIdMiddleware } from "./common/request-id.middleware";
import { env } from "./config/env";
import { createDocumentRoutes } from "./documents/document.routes";
import { createDokumenRoutes } from "./dokumen/dokumen.routes";
import { createGenerationRoutes } from "./generation/generation.routes";
import { createInterviewReadRoutes, createInterviewRoutes } from "./interview/interview.routes";
import { createKelasRoutes } from "./kelas/kelas.routes";
import { createPaymentRoutes } from "./payment/payment.routes";
import { createPesertaRoutes } from "./peserta/peserta.routes";
import { createHealthRoutes } from "./routes/health.routes";
import { createReadinessRoutes } from "./routes/readiness.routes";
import { createSkkniRoutes } from "./skkni/skkni.routes";
import { createTodosRoutes } from "./todos/todos.routes";
import { createTugasRoutes } from "./tugas/tugas.routes";

type AppVariables = AuthVariables & {
  requestId: string;
};

type TestUser = { id: string; email: string; name: string; role?: string };
type CreateAppOptions = { testUser?: TestUser };

export function createApp(options: CreateAppOptions = {}) {
  const app = new OpenAPIHono<{ Variables: AppVariables }>();

  app.use("*", cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }));
  app.use("*", requestIdMiddleware);
  app.use("*", sessionMiddleware);
  const testUser = options.testUser;
  if (testUser) {
    app.use("*", async (c, next) => {
      c.set("user", testUser as never);
      c.set("session", { id: "test-session", userId: testUser.id } as never);
      await next();
    });
  }
  app.get("/api/auth/session", (c) => {
    const user = c.get("user");
    const session = c.get("session");
    if (!user || !session) {
      return errorResponse(c, 401, "UNAUTHORIZED", "Authentication required");
    }
    return c.json({ user, session });
  });
  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
  app.route("/", createOpenApiApp());
  app.route("/", createHealthRoutes());
  app.route("/", createReadinessRoutes());
  app.route("/api", createOpenApiApp());
  app.route("/api", createHealthRoutes());
  app.route("/api", createReadinessRoutes());
  app.route("/api", createDocumentRoutes());
  app.route("/api", createBatchRoutes());
  app.route("/api", createPaymentRoutes());
  app.route("/api", createCertificateRoutes());
  app.route("/api", createPesertaRoutes());
  app.route("/api", createInterviewRoutes());
  app.route("/api", createInterviewReadRoutes());
  app.route("/api", createGenerationRoutes());
  app.route("/api", createSkkniRoutes());
  app.route("/api", createTodosRoutes());
  app.route("/api", createTugasRoutes());
  app.route("/api", createKelasRoutes());
  app.route("/api", createDokumenRoutes());
  app.route("/", createDocumentRoutes());
  app.route("/", createBatchRoutes());
  app.route("/", createPaymentRoutes());
  app.route("/", createCertificateRoutes());
  app.route("/", createPesertaRoutes());
  app.route("/", createInterviewRoutes());
  app.route("/", createInterviewReadRoutes());
  app.route("/", createGenerationRoutes());
  app.route("/", createSkkniRoutes());
  app.route("/", createTodosRoutes());
  app.route("/", createTugasRoutes());
  app.route("/", createKelasRoutes());
  app.route("/", createDokumenRoutes());

  app.notFound((c) => errorResponse(c, 404, "NOT_FOUND", "Not found"));
  app.onError(handleAppError);

  return app;
}

export type TrainerHubApp = ReturnType<typeof createApp>;
