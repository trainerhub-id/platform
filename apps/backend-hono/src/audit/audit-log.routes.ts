import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { requireRole } from "../auth/roles";
import { errorResponse } from "../common/errors";
import type { AuditLogFilter } from "./audit-log.repository";
import { AuditLogService } from "./audit-log.service";

const auditLogQuerySchema = z.object({
	batchId: z.string().uuid().optional(),
	enrollmentId: z.string().uuid().optional(),
	pesertaId: z.string().uuid().optional(),
	limit: z.coerce.number().int().min(1).max(200).default(100),
});

type AuditLogVariables = AuthVariables & { requestId: string };
type AuditLogServiceLike = Pick<AuditLogService, "findMany">;

export function createAuditLogRoutes(service: AuditLogServiceLike = new AuditLogService()) {
	const app = new Hono<{ Variables: AuditLogVariables }>();

	app.get("/admin/audit-logs", requireAuth, requireRole(["admin"]), async (c) => {
		const parsed = auditLogQuerySchema.safeParse({
			batchId: c.req.query("batchId"),
			enrollmentId: c.req.query("enrollmentId"),
			pesertaId: c.req.query("pesertaId"),
			limit: c.req.query("limit"),
		});
		if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		const filter: AuditLogFilter = { limit: parsed.data.limit };
		if (parsed.data.batchId) filter.batchId = parsed.data.batchId;
		if (parsed.data.enrollmentId) filter.enrollmentId = parsed.data.enrollmentId;
		if (parsed.data.pesertaId) filter.pesertaId = parsed.data.pesertaId;
		return c.json({ logs: await service.findMany(filter) });
	});

	return app;
}
