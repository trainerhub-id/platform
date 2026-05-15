import { Hono } from "hono";
import type { Context } from "hono";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { errorResponse } from "../common/errors";
import { createDocumentSchema, updateDocumentSchema } from "./document.schemas";
import { DocumentRepository, isDocumentOwner } from "./document.repository";

type DocumentRouteVariables = AuthVariables & { requestId: string };
type AuthenticatedUser = NonNullable<AuthVariables["user"]>;

function getRequiredUser(c: Context<{ Variables: DocumentRouteVariables }>): AuthenticatedUser {
  const user = c.get("user");
  if (!user) {
    throw new Error("Authenticated route reached without user context");
  }
  return user;
}

export function createDocumentRoutes(repository = new DocumentRepository()) {
  const app = new Hono<{ Variables: DocumentRouteVariables }>();

  app.use("/api/documents/*", requireAuth);
  app.use("/api/documents", requireAuth);

  app.get("/api/documents", async (c) => {
    const user = getRequiredUser(c);
    const docs = await repository.listByOwner(user.id);
    return c.json({ documents: docs });
  });

  app.post("/api/documents", async (c) => {
    const user = getRequiredUser(c);
    const parsed = createDocumentSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
    }

    const doc = await repository.create({ ownerUserId: user.id, flow: parsed.data.flow, title: parsed.data.title });
    return c.json({ document: doc }, 201);
  });

  app.get("/api/documents/:documentId", async (c) => {
    const user = getRequiredUser(c);
    const doc = await repository.findById(c.req.param("documentId"));
    if (!doc) return errorResponse(c, 404, "DOCUMENT_NOT_FOUND", "Document not found");
    if (!isDocumentOwner(doc, user.id)) return errorResponse(c, 403, "FORBIDDEN", "Document belongs to another user");
    return c.json({ document: doc });
  });

  app.patch("/api/documents/:documentId", async (c) => {
    const user = getRequiredUser(c);
    const doc = await repository.findById(c.req.param("documentId"));
    if (!doc) return errorResponse(c, 404, "DOCUMENT_NOT_FOUND", "Document not found");
    if (!isDocumentOwner(doc, user.id)) return errorResponse(c, 403, "FORBIDDEN", "Document belongs to another user");

    const parsed = updateDocumentSchema.safeParse(await c.req.json());
    if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));

    const updated = parsed.data.title ? await repository.updateTitle(doc.id, parsed.data.title) : doc;
    return c.json({ document: updated });
  });

  app.delete("/api/documents/:documentId", async (c) => {
    const user = getRequiredUser(c);
    const doc = await repository.findById(c.req.param("documentId"));
    if (!doc) return errorResponse(c, 404, "DOCUMENT_NOT_FOUND", "Document not found");
    if (!isDocumentOwner(doc, user.id)) return errorResponse(c, 403, "FORBIDDEN", "Document belongs to another user");
    await repository.softDelete(doc.id);
    return c.json({ ok: true });
  });

  return app;
}
