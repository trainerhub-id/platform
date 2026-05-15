import { Hono } from "hono";
import { z } from "zod";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { requireRole } from "../auth/roles";
import { errorResponse } from "../common/errors";
import { KelasService } from "./kelas.service";

const progressSchema = z.object({
	status: z.enum(["belum-mulai", "sedang-diproses", "selesai"]).optional(),
	videoProgress: z.number().int().min(0).optional(),
});

type KelasVariables = AuthVariables & { requestId: string };
type UserLike = { id: string; role?: string };
type KelasServiceLike = Pick<KelasService, "findPesertaByUserId" | "getAllCourses" | "getCourseDetail" | "updateLessonProgress" | "getPlaybackToken">;

export function createKelasRoutes(service: KelasServiceLike = new KelasService()) {
	const app = new Hono<{ Variables: KelasVariables }>();

	app.get("/kelas", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		const user = c.get("user") as UserLike;
		const role = !user.role || user.role === "user" ? "peserta" : user.role;
		const profile = role === "peserta" ? await service.findPesertaByUserId(user.id) : null;
		return c.json(await service.getAllCourses(profile?.id));
	});

	app.get("/kelas/lessons/:lessonId/playback-token", requireAuth, requireRole(["peserta", "admin"]), async (c) => c.json(await service.getPlaybackToken()));

	app.get("/kelas/:id", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		const user = c.get("user") as UserLike;
		const role = !user.role || user.role === "user" ? "peserta" : user.role;
		const profile = role === "peserta" ? await service.findPesertaByUserId(user.id) : null;
		return c.json(await service.getCourseDetail(c.req.param("id"), profile?.id));
	});

	app.patch("/kelas/:courseId/lesson/:lessonId/progress", requireAuth, requireRole(["peserta"]), async (c) => {
		const parsed = progressSchema.safeParse(await c.req.json());
		if (!parsed.success) return errorResponse(c, 400, "VALIDATION_ERROR", parsed.error.issues.map((issue) => issue.message).join("; "));
		const user = c.get("user") as UserLike;
		const profile = await service.findPesertaByUserId(user.id);
		if (!profile) return errorResponse(c, 404, "PESERTA_NOT_FOUND", "Peserta profile not found");
		return c.json(await service.updateLessonProgress(profile.id, c.req.param("lessonId"), parsed.data));
	});

	return app;
}
