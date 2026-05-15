import { Hono } from "hono";
import { requireAuth, type AuthVariables } from "../auth/auth.middleware";
import { requireRole } from "../auth/roles";
import { TodosService } from "./todos.service";

type TodosVariables = AuthVariables & { requestId: string };
type UserLike = { id: string; role?: string };
type TodosServiceLike = Pick<TodosService, "getTodosForUser" | "initializeTodosForUser" | "syncTodosWithProfileState" | "getTodosForBatch" | "initializeTodosForBatch" | "updateTodoStatus">;

export function createTodosRoutes(service: TodosServiceLike = new TodosService()) {
	const app = new Hono<{ Variables: TodosVariables }>();

	app.get("/todos/my", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		const user = c.get("user") as UserLike;
		return c.json(await service.getTodosForUser(user.id));
	});

	app.post("/todos/init", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		const user = c.get("user") as UserLike;
		await service.initializeTodosForUser(user.id);
		return c.json({ success: true });
	});

	app.post("/todos/sync", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		const user = c.get("user") as UserLike;
		await service.syncTodosWithProfileState(user.id);
		return c.json({ success: true });
	});

	app.get("/todos/admin/all", requireAuth, requireRole(["admin"]), async (c) => c.json(await service.getTodosForBatch()));
	app.post("/todos/admin/init", requireAuth, requireRole(["admin"]), async (c) => {
		await service.initializeTodosForBatch();
		return c.json({ success: true });
	});
	app.get("/todos/batch/:batchId/admin", requireAuth, requireRole(["admin"]), async (c) => c.json(await service.getTodosForBatch(c.req.param("batchId"))));
	app.post("/todos/batch/:batchId/init", requireAuth, requireRole(["admin"]), async (c) => {
		await service.initializeTodosForBatch(c.req.param("batchId"));
		return c.json({ success: true });
	});
	app.patch("/todos/:id/complete", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		await service.updateTodoStatus(c.req.param("id"), "done");
		return c.json({ success: true });
	});
	app.patch("/todos/:id/start", requireAuth, requireRole(["peserta", "admin"]), async (c) => {
		await service.updateTodoStatus(c.req.param("id"), "in_progress");
		return c.json({ success: true });
	});

	return app;
}
