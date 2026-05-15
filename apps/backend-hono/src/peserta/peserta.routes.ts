import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { requireRole } from "../auth/roles";
import { errorResponse } from "../common/errors";
import { PesertaService } from "./peserta.service";

const createPesertaSchema = z.object({
	nama: z.string().min(1).max(255),
	email: z.string().email(),
	noWa: z.string().min(10).max(20).optional(),
	tShirtSize: z.string().optional(),
});

const updatePesertaSchema = z.object({
	nama: z.string().max(255).optional(),
	noWa: z.string().min(10).max(20).optional(),
	nik: z.string().min(16).max(16).optional(),
	ttl: z.string().max(100).optional(),
	jk: z.enum(["L", "P"]).optional(),
	alamat: z.string().max(500).optional(),
	kota: z.string().max(100).optional(),
	provinsi: z.string().max(100).optional(),
	pendidikan: z.string().max(100).optional(),
	pekerjaan: z.string().max(100).optional(),
	tShirtSize: z.string().optional(),
});

type PesertaVariables = AuthVariables & { requestId: string };
type UserLike = { id: string; email?: string; role?: string };

type PesertaServiceLike = Pick<PesertaService, "create" | "getProfile" | "getAccess" | "update">;

export function createPesertaRoutes(service: PesertaServiceLike = new PesertaService()) {
	const app = new Hono<{ Variables: PesertaVariables }>();

	app.post("/peserta/create", requireAuth, requireRole(["peserta"]), async (c) => {
		const user = c.get("user") as UserLike;
		const parsed = createPesertaSchema.safeParse(await c.req.json());
		if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		const profile = await service.create(user.id, parsed.data);
		return c.json({ profile }, 201);
	});

	app.get("/peserta/me", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		const user = c.get("user") as UserLike;
		const profile = await service.getProfile(user.id, user.email);
		return c.json({ profile });
	});

	app.get("/peserta/me/access", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		const user = c.get("user") as UserLike;
		const access = await service.getAccess(user.id, user.email);
		return c.json(access);
	});

	app.patch("/peserta/update", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		const user = c.get("user") as UserLike;
		const parsed = updatePesertaSchema.safeParse(await c.req.json());
		if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		const profile = await service.update(user.id, parsed.data, user.email);
		return c.json({ profile });
	});

	return app;
}
