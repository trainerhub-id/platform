import { describe, expect, it } from "vitest";
import { GenerationWorkerService, generationWorkerJobNames } from "./generation-worker.service";

class FakeBoss {
	started = false;
	stopped = false;
	registered: string[] = [];
	handlers = new Map<string, (jobs: Array<{ data: unknown }>) => Promise<unknown>>();
	async start() {
		this.started = true;
		return this;
	}
	async stop() {
		this.stopped = true;
	}
	async work(name: string, handler: (jobs: Array<{ data: unknown }>) => Promise<unknown>) {
		this.registered.push(name);
		this.handlers.set(name, handler);
		return `worker-${name}`;
	}
}

describe("GenerationWorkerService", () => {
	it("registers all generation job handlers", async () => {
		const boss = new FakeBoss();
		const calls: unknown[] = [];
		const worker = new GenerationWorkerService({
			boss: boss as any,
			documentGenerator: { generateFromJob: async (payload: unknown) => calls.push(payload) } as any,
		});

		await worker.start();

		expect(boss.started).toBe(true);
		expect(boss.registered.sort()).toEqual([...generationWorkerJobNames].sort());
	});

	it("stops boss", async () => {
		const boss = new FakeBoss();
		const worker = new GenerationWorkerService({ boss: boss as any, documentGenerator: { generateFromJob: async () => [] } as any });

		await worker.stop();

		expect(boss.stopped).toBe(true);
	});

	it("stores generated render results from job handler", async () => {
		const boss = new FakeBoss();
		const savedFiles: unknown[] = [];
		const worker = new GenerationWorkerService({
			boss: boss as any,
			documentGenerator: {
				generateFromJob: async () => [
					{ documentType: "bukti-1", filename: "bukti-1.docx", bytes: new TextEncoder().encode("docx"), mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", outputFormat: "docx" as const },
				],
			} as any,
			objectStorage: { uploadBuffer: async (_buffer: Uint8Array, path: string) => ({ key: `${path}/bukti-1.docx`, url: "signed" }) } as any,
			generatedFiles: { create: async (input: unknown) => savedFiles.push(input) } as any,
		});

		await worker.start();
		await boss.handlers.get("generate-master-documents")?.([{ data: { jobId: "job_1", document: { id: "doc_1" }, documentTypes: ["bukti-1"] } }]);

		expect(savedFiles).toHaveLength(1);
		expect((savedFiles[0] as { documentType: string; filePath: string }).documentType).toBe("bukti-1");
		expect((savedFiles[0] as { filePath: string }).filePath).toBe("generated/doc_1/job_1/bukti-1.docx");
	});
});
