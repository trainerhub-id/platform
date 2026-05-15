import { desc, eq, getTableColumns, ilike, or } from "drizzle-orm";
import { db } from "../db/client";
import { batchTiers, batchTraining, peserta, pesertaBatch } from "../db/schema";

export type EnrollmentAccessRow = {
	enrollmentId: string;
	paymentStatus: string;
	tierName: string | null;
	courseIds: string[] | null;
	aiFeatures: string[] | null;
	benefits: string[] | null;
};

export type SetPaymentStatusInput = {
	enrollmentId: string;
	paymentStatus: string;
	enrollmentStatus?: string;
};

export class EnrollmentRepository {
	async findAccessByPesertaId(pesertaId: string): Promise<EnrollmentAccessRow[]> {
		return db
			.select({
				enrollmentId: pesertaBatch.id,
				paymentStatus: pesertaBatch.paymentStatus,
				tierName: batchTiers.name,
				courseIds: batchTiers.courseIds,
				aiFeatures: batchTiers.aiFeatures,
				benefits: batchTiers.benefits,
			})
			.from(pesertaBatch)
			.leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
			.where(eq(pesertaBatch.pesertaId, pesertaId));
	}

	async listBatchEnrollments(batchId: string) {
		return db
			.select({
				...getTableColumns(pesertaBatch),
				participantName: peserta.nama,
				participantEmail: peserta.email,
				participantPhone: peserta.noWa,
				tierName: batchTiers.name,
				tierSlug: batchTiers.slug,
			})
			.from(pesertaBatch)
			.leftJoin(peserta, eq(pesertaBatch.pesertaId, peserta.id))
			.leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
			.where(eq(pesertaBatch.batchId, batchId))
			.orderBy(desc(pesertaBatch.createdAt));
	}

	async search(query: string) {
		const pattern = `%${query.trim()}%`;
		return db
			.select({
				...getTableColumns(pesertaBatch),
				participantName: peserta.nama,
				participantEmail: peserta.email,
				participantPhone: peserta.noWa,
				batchName: batchTraining.namaBatch,
				tierName: batchTiers.name,
				tierSlug: batchTiers.slug,
			})
			.from(pesertaBatch)
			.leftJoin(peserta, eq(pesertaBatch.pesertaId, peserta.id))
			.leftJoin(batchTraining, eq(pesertaBatch.batchId, batchTraining.id))
			.leftJoin(batchTiers, eq(pesertaBatch.tierId, batchTiers.id))
			.where(or(ilike(peserta.nama, pattern), ilike(peserta.email, pattern), ilike(peserta.noWa, pattern), ilike(batchTraining.namaBatch, pattern)))
			.orderBy(desc(pesertaBatch.createdAt));
	}

	async setPaymentStatus(input: SetPaymentStatusInput) {
		const [row] = await db
			.update(pesertaBatch)
			.set({
				paymentStatus: input.paymentStatus,
				status: input.enrollmentStatus ?? (input.paymentStatus === "paid" ? "active" : "registered"),
				updatedAt: new Date(),
			})
			.where(eq(pesertaBatch.id, input.enrollmentId))
			.returning();
		if (!row) throw new Error("ENROLLMENT_NOT_FOUND");
		return row;
	}
}
