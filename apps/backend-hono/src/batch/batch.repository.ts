import { and, asc, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "../db/client";
import { batchTraining, batchTiers, chapters, courses, lessons, peserta, pesertaBatch, trainer } from "../db/schema";

export class BatchRepository {
	async create(input: Record<string, unknown>) {
		const [row] = await db.insert(batchTraining).values(input as never).returning();
		if (!row) throw new Error("BATCH_CREATE_FAILED");
		return row;
	}

	async update(id: string, input: Record<string, unknown>) {
		const [row] = await db.update(batchTraining).set({ ...input, updatedAt: new Date() } as never).where(eq(batchTraining.id, id)).returning();
		if (!row) throw new Error("BATCH_UPDATE_FAILED");
		return row;
	}

	async remove(id: string) {
		await db.delete(batchTraining).where(eq(batchTraining.id, id));
	}

	async findById(id: string) {
		const [row] = await db.select().from(batchTraining).where(eq(batchTraining.id, id)).limit(1);
		return row ?? null;
	}

	async getWorkspace(id: string) {
		const [row] = await db
			.select({
				...getTableColumns(batchTraining),
				trainerName: trainer.nama,
				trainerPhoto: trainer.fotoUrl,
				courseName: courses.title,
				totalEnrollments: sql<number>`count(${pesertaBatch.id})`.mapWith(Number),
				paidEnrollments: sql<number>`count(${pesertaBatch.id}) filter (where ${pesertaBatch.paymentStatus} = 'paid')`.mapWith(Number),
				pendingPayments: sql<number>`count(${pesertaBatch.id}) filter (where ${pesertaBatch.paymentStatus} = 'pending')`.mapWith(Number),
			})
			.from(batchTraining)
			.leftJoin(trainer, eq(batchTraining.trainerId, trainer.id))
			.leftJoin(courses, eq(batchTraining.courseId, courses.id))
			.leftJoin(pesertaBatch, eq(batchTraining.id, pesertaBatch.batchId))
			.where(eq(batchTraining.id, id))
			.groupBy(batchTraining.id, trainer.id, courses.id)
			.limit(1);
		return row ?? null;
	}

	async findAll() {
		return db
			.select({ ...getTableColumns(batchTraining), trainerName: trainer.nama, trainerPhoto: trainer.fotoUrl, courseName: courses.title, participantsCount: sql<number>`count(${pesertaBatch.id})`.mapWith(Number) })
			.from(batchTraining)
			.leftJoin(trainer, eq(batchTraining.trainerId, trainer.id))
			.leftJoin(courses, eq(batchTraining.courseId, courses.id))
			.leftJoin(pesertaBatch, eq(batchTraining.id, pesertaBatch.batchId))
			.groupBy(batchTraining.id, trainer.id, courses.id);
	}

	async findPesertaByClerkId(clerkId: string) {
		const [row] = await db.select().from(peserta).where(eq(peserta.clerkId, clerkId)).limit(1);
		return row ?? null;
	}

	async findByPesertaId(pesertaId: string) {
		return db
			.select({ ...getTableColumns(batchTraining), trainerName: trainer.nama, trainerPhoto: trainer.fotoUrl, courseName: courses.title, paymentStatus: pesertaBatch.paymentStatus, enrollmentStatus: pesertaBatch.status })
			.from(batchTraining)
			.innerJoin(pesertaBatch, eq(batchTraining.id, pesertaBatch.batchId))
			.leftJoin(trainer, eq(batchTraining.trainerId, trainer.id))
			.leftJoin(courses, eq(batchTraining.courseId, courses.id))
			.where(eq(pesertaBatch.pesertaId, pesertaId));
	}

	async assignPeserta(batchId: string, pesertaId: string) {
		const [existing] = await db.select().from(pesertaBatch).where(and(eq(pesertaBatch.batchId, batchId), eq(pesertaBatch.pesertaId, pesertaId))).limit(1);
		if (existing) return existing;
		const [row] = await db.insert(pesertaBatch).values({ batchId, pesertaId, status: "registered" }).returning();
		if (!row) throw new Error("BATCH_ASSIGN_FAILED");
		return row;
	}

	async updateStatus(input: { batchId: string; pesertaId: string; status: string }) {
		const [existing] = await db.select().from(pesertaBatch).where(and(eq(pesertaBatch.batchId, input.batchId), eq(pesertaBatch.pesertaId, input.pesertaId))).limit(1);
		if (!existing) throw new Error("ASSIGNMENT_NOT_FOUND");
		const [row] = await db.update(pesertaBatch).set({ status: input.status, updatedAt: new Date() }).where(eq(pesertaBatch.id, existing.id)).returning();
		if (!row) throw new Error("BATCH_STATUS_UPDATE_FAILED");
		return row;
	}

	async getPesertaInBatch(batchId: string) {
		return db.select().from(pesertaBatch).where(eq(pesertaBatch.batchId, batchId));
	}

	async getActiveTiersForPublish(batchId: string) {
		return db
			.select({
				id: batchTiers.id,
				price: batchTiers.price,
				scalevSyncStatus: batchTiers.scalevSyncStatus,
			})
			.from(batchTiers)
			.where(and(eq(batchTiers.batchId, batchId), eq(batchTiers.isActive, true)));
	}

	async getCurriculum(batchId: string) {
		const batch = await this.findById(batchId);
		if (!batch?.courseId) return { batchId, courseTitle: batch?.namaBatch ?? "Unknown Batch", modules: [], message: "No course linked to this batch." };
		const [course] = await db.select().from(courses).where(eq(courses.id, batch.courseId)).limit(1);
		if (!course) return { batchId, modules: [] };
		const chapterList = await db.select().from(chapters).where(eq(chapters.courseId, course.id)).orderBy(asc(chapters.orderIndex));
		const modules = [];
		for (const chapter of chapterList) {
			const lessonList = await db.select().from(lessons).where(eq(lessons.chapterId, chapter.id)).orderBy(asc(lessons.orderIndex));
			modules.push({ id: chapter.id, title: chapter.title, duration: `${lessonList.reduce((acc, lesson) => acc + (Number.parseInt(lesson.duration ?? "0") || 0), 0)} mins`, content: `Contains ${lessonList.length} lessons.`, lessons: lessonList.map((lesson) => ({ id: lesson.id, title: lesson.title, duration: lesson.duration, videoUrl: lesson.videoUrl })) });
		}
		return { batchId, courseTitle: course.title, modules };
	}
}
