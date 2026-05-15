import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/client";
import { generatedFiles } from "../db/schema";

export class GeneratedFileRepository {
	async listByDocument(documentId: string) {
		return db.select().from(generatedFiles).where(eq(generatedFiles.documentId, documentId)).orderBy(desc(generatedFiles.createdAt));
	}

	async findById(id: string, documentId: string) {
		const [file] = await db.select().from(generatedFiles).where(and(eq(generatedFiles.id, id), eq(generatedFiles.documentId, documentId))).limit(1);
		return file ?? null;
	}

	async create(input: {
		documentId: string;
		generationJobId: string;
		documentType: string;
		outputFormat: string;
		filePath: string;
		filename: string;
		mimeType: string;
		sizeBytes?: number;
		checksum?: string;
		metadata?: unknown;
	}) {
		const [file] = await db
			.insert(generatedFiles)
			.values({
				documentId: input.documentId,
				generationJobId: input.generationJobId,
				documentType: input.documentType,
				outputFormat: input.outputFormat,
				filePath: input.filePath,
				filename: input.filename,
				mimeType: input.mimeType,
				sizeBytes: input.sizeBytes,
				checksum: input.checksum,
				metadata: input.metadata ?? {},
			})
			.returning();
		return file;
	}
}
