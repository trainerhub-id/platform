import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { requireRole } from "../auth/roles";
import { errorResponse } from "../common/errors";
import { BatchService } from "./batch.service";

const createBatchSchema = z.object({ namaBatch: z.string().min(1), tanggal: z.string().optional() }).passthrough();
const assignPesertaSchema = z.object({ pesertaIds: z.array(z.string().min(1)).min(1) });
const updateStatusSchema = z.object({ pesertaId: z.string().min(1), batchId: z.string().min(1), status: z.enum(["registered", "attended"]) });

type BatchVariables = AuthVariables & { requestId: string };
type UserLike = { id: string; role?: string };
type BatchServiceLike = Pick<BatchService, "create" | "update" | "remove" | "listForUser" | "assignPeserta" | "updateStatus" | "getPesertaInBatch" | "getWorkspace" | "publish" | "getCurriculum" | "resolveMapUrl">;

export function createBatchRoutes(service: BatchServiceLike = new BatchService()) {
	const app = new Hono<{ Variables: BatchVariables }>();

	app.post("/batch/create", requireAuth, requireRole(["admin"]), async (c) => {
		const parsed = createBatchSchema.safeParse(await c.req.json());
		if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		const batch = await service.create(parsed.data);
		return c.json({ batch }, 201);
	});

	app.patch("/batch/:id", requireAuth, requireRole(["admin"]), async (c) => c.json({ batch: await service.update(c.req.param("id"), await c.req.json()) }));
	app.delete("/batch/:id", requireAuth, requireRole(["admin"]), async (c) => c.json(await service.remove(c.req.param("id"))));

	app.get("/batch/list", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		const batches = await service.listForUser(c.get("user") as UserLike);
		return c.json({ batches });
	});

	app.post("/batch/:id/assign-peserta", requireAuth, requireRole(["admin"]), async (c) => {
		const parsed = assignPesertaSchema.safeParse(await c.req.json());
		if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		return c.json({ assignments: await service.assignPeserta(c.req.param("id"), parsed.data) }, 201);
	});

	app.patch("/batch/peserta/update-status", requireAuth, requireRole(["admin"]), async (c) => {
		const parsed = updateStatusSchema.safeParse(await c.req.json());
		if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		return c.json({ assignment: await service.updateStatus(parsed.data) });
	});

	app.get("/batch/:id/peserta", requireAuth, requireRole(["admin"]), async (c) => c.json({ peserta: await service.getPesertaInBatch(c.req.param("id")) }));
	app.get("/admin/batches/:id/workspace", requireAuth, requireRole(["admin"]), async (c) => c.json({ batch: await service.getWorkspace(c.req.param("id")) }));
	app.post("/admin/batches/:id/publish", requireAuth, requireRole(["admin"]), async (c) => c.json({ batch: await service.publish(c.req.param("id")) }));
	app.get("/batch/:id/curriculum", requireAuth, requireRole(["peserta", "admin"]), async (c) => c.json(await service.getCurriculum(c.req.param("id"))));
	app.post("/batch/resolve-map-url", requireAuth, requireRole(["admin"]), async (c) => c.json(await service.resolveMapUrl((await c.req.json()).url)));

	return app;
}
