import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { requireRole } from "../auth/roles";
import { errorResponse } from "../common/errors";
import { TugasService } from "./tugas.service";

const reviewSchema = z.object({ nilai: z.string().min(1).max(10), catatanTrainer: z.string().optional().nullable() });
type TugasVariables = AuthVariables & { requestId: string };
type UserLike = { id: string; role?: string };
type TugasServiceLike = Pick<TugasService, "list" | "upload" | "review" | "getPesertaTugas" | "getPesertaTugasById" | "getUploads">;

export function createTugasRoutes(service: TugasServiceLike = new TugasService()) {
	const app = new Hono<{ Variables: TugasVariables }>();

	app.get("/tugas/list", requireAuth, requireRole(["peserta", "admin"]), async (c) => c.json(await service.list()));

	app.post("/tugas/upload", requireAuth, requireRole(["peserta"]), async (c) => {
		const body = await c.req.parseBody();
		const file = body.file;
		const tugasId = body.tugasId;
		if (!(file instanceof File)) return errorResponse(c, 400, "VALIDATION_ERROR", "file is required");
		if (typeof tugasId !== "string" || !z.string().uuid().safeParse(tugasId).success) return errorResponse(c, 400, "VALIDATION_ERROR", "valid tugasId is required");
		const user = c.get("user") as UserLike;
		return c.json(await service.upload(file, { tugasId }, user.id), 201);
	});

	app.patch("/tugas/:id/review", requireAuth, requireRole(["admin"]), async (c) => {
		const parsed = reviewSchema.safeParse(await c.req.json());
		if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		return c.json(await service.review(c.req.param("id"), { nilai: parsed.data.nilai, catatanTrainer: parsed.data.catatanTrainer ?? null }));
	});

	app.get("/tugas/my-submissions", requireAuth, requireRole(["peserta"]), async (c) => {
		const user = c.get("user") as UserLike;
		return c.json(await service.getPesertaTugas(user.id));
	});

	app.get("/tugas/peserta/:id", requireAuth, requireRole(["admin"]), async (c) => c.json(await service.getPesertaTugasById(c.req.param("id"))));
	app.get("/tugas/:tugasPesertaId/uploads", requireAuth, requireRole(["peserta", "admin"]), async (c) => c.json(await service.getUploads(c.req.param("tugasPesertaId"))));

	return app;
}
