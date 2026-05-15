import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createSkkniRoutes } from "./skkni.routes";

class FakeDocumentRepository {
	doc: any = { id: "doc_1", ownerUserId: "user_1", flow: "master", masterJson: { brainstorming_master: { organization_focus: "Digital Marketing" } } };
	updated: any = null;
	async findById() {
		return this.doc;
	}
	async updateInterviewState(id: string, input: any) {
		this.updated = { id, ...input };
		return this.updated;
	}
}

class FakeFieldStateRepository {
	states: any[] = [];
	async list() {
		return this.states;
	}
	async upsert(input: any) {
		this.states = this.states.filter((state) => !(state.flow === input.flow && state.phaseKey === input.phaseKey && state.fieldKey === input.fieldKey));
		this.states.push(input);
		return input;
	}
}

const fakeSkkni = {
	async searchMaster() {
		return [{ id: "u1", unitCode: "M.70MKT00.001.1", title: "Mengelola Kampanye Digital", relevanceScore: 0.9, reason: "high", evidence: [] }];
	},
	async getUnitDetail() {
		return { code: "M.70MKT00.001.1", name: "Mengelola Kampanye Digital", elements: [{ element_text: "Menyiapkan kampanye", kuk: [] }] };
	},
	async getCompetencyMap() {
		return { main_goal: "Goal", key_function: "Key", main_function: "Main", basic_function: "Basic" };
	},
};

describe("skkni routes", () => {
	it("searches Master SKKNI candidates for document owner", async () => {
		const app = new Hono<{ Variables: { user: { id: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1" });
			await next();
		});
		app.route("/", createSkkniRoutes({ documents: new FakeDocumentRepository() as any, skkni: fakeSkkni as any }));

		const res = await app.request("/api/documents/doc_1/skkni/search", { method: "POST" });
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.candidates[0].unitCode).toBe("M.70MKT00.001.1");
	});

	it("selects unit and updates Master readiness state", async () => {
		const docs = new FakeDocumentRepository();
		const fields = new FakeFieldStateRepository();
		const app = new Hono<{ Variables: { user: { id: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1" });
			await next();
		});
		app.route("/", createSkkniRoutes({ documents: docs as any, fieldStates: fields as any, skkni: fakeSkkni as any }));

		const res = await app.request("/api/documents/doc_1/skkni/select", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ unitCode: "M.70MKT00.001.1" }),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body.unit.code).toBe("M.70MKT00.001.1");
		expect(docs.updated.masterJson.unit.code).toBe("M.70MKT00.001.1");
		expect(fields.states.map((state) => state.fieldKey)).toContain("skkni_map");
	});

	it("selects unit and updates Trainer readiness state", async () => {
		const docs = new FakeDocumentRepository();
		docs.doc = { id: "doc_1", ownerUserId: "user_1", flow: "trainer", masterJson: { brainstorming: { expertise: "Digital Marketing" } } };
		const fields = new FakeFieldStateRepository();
		const app = new Hono<{ Variables: { user: { id: string } } }>();
		app.use("*", async (c, next) => {
			c.set("user", { id: "user_1" });
			await next();
		});
		app.route("/", createSkkniRoutes({ documents: docs as any, fieldStates: fields as any, skkni: fakeSkkni as any }));

		const res = await app.request("/api/documents/doc_1/skkni/select", {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify({ unitCode: "M.70MKT00.001.1" }),
		});
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(docs.updated.masterJson.schema_key).toBe("hono_trainer_alpha_v1");
		expect(docs.updated.masterJson.unit.code).toBe("M.70MKT00.001.1");
		expect(body.phase).toBe("brainstorming");
		expect(fields.states.every((state) => state.flow === "trainer")).toBe(true);
	});
});
