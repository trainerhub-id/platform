import { PgBoss } from "pg-boss";
import { env } from "../config/env";
import { ObjectStorageService } from "../storage/object-storage.service";
import { DocumentGeneratorService } from "./document-generator.service";
import { GeneratedFileRepository } from "./generated-file.repository";
import type { GenerationJobType } from "./generation-job.service";

export const generationWorkerJobNames = [
	"generate-master-documents",
	"generate-trainer-documents",
	"regenerate-document",
	"render-single-document",
] as const satisfies readonly GenerationJobType[];

type BossLike = {
	start(): Promise<unknown>;
	stop(): Promise<void>;
	work(name: string, handler: (jobs: Array<{ data: unknown }>) => Promise<unknown>): Promise<unknown>;
};

type DocumentGeneratorLike = Pick<DocumentGeneratorService, "generateFromJob">;

type ObjectStorageLike = Pick<ObjectStorageService, "uploadBuffer">;

type GeneratedFilesLike = Pick<GeneratedFileRepository, "create">;

export class GenerationWorkerService {
	private readonly boss: BossLike;
	private readonly documentGenerator: DocumentGeneratorLike;
	private readonly objectStorage: ObjectStorageLike;
	private readonly generatedFiles: GeneratedFilesLike;

	constructor(deps: { boss?: BossLike; documentGenerator?: DocumentGeneratorLike; objectStorage?: ObjectStorageLike; generatedFiles?: GeneratedFilesLike } = {}) {
		this.boss = deps.boss ?? new PgBoss({ connectionString: env.DATABASE_URL, schema: env.PGBOSS_SCHEMA });
		this.documentGenerator = deps.documentGenerator ?? new DocumentGeneratorService();
		this.objectStorage = deps.objectStorage ?? new ObjectStorageService();
		this.generatedFiles = deps.generatedFiles ?? new GeneratedFileRepository();
	}

	async start(): Promise<void> {
		await this.boss.start();
		for (const jobName of generationWorkerJobNames) {
			await this.boss.work(jobName, async (jobs) => Promise.all(jobs.map((job) => this.processJob(job.data))));
		}
	}

	private async processJob(data: unknown) {
		const results = await this.documentGenerator.generateFromJob(data);
		const payload = data as { jobId?: string; document?: { id?: string } };
		if (!payload.jobId || !payload.document?.id) return results;

		for (const result of results) {
			const upload = await this.objectStorage.uploadBuffer(result.bytes, `generated/${payload.document.id}/${payload.jobId}`, result.mimeType);
			await this.generatedFiles.create({
				documentId: payload.document.id,
				generationJobId: payload.jobId,
				documentType: result.documentType,
				outputFormat: result.outputFormat,
				filePath: upload.key,
				filename: result.filename,
				mimeType: result.mimeType,
				sizeBytes: result.bytes.byteLength,
			});
		}

		return results;
	}

	async stop(): Promise<void> {
		await this.boss.stop();
	}
}
