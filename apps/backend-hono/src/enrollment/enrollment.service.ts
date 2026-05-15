import { EnrollmentRepository, type EnrollmentAccessRow, type EnsurePendingEnrollmentInput, type SetPaymentStatusInput } from "./enrollment.repository";

type EnrollmentRepositoryLike = {
	findAccessByPesertaId(pesertaId: string): Promise<EnrollmentAccessRow[]>;
	listBatchEnrollments(batchId: string): Promise<unknown[]>;
	search(query: string): Promise<unknown[]>;
	setPaymentStatus(input: SetPaymentStatusInput): Promise<unknown>;
	ensurePendingEnrollmentForPayment(input: EnsurePendingEnrollmentInput): Promise<{ id: string; pesertaId: string }>;
};

export type PaidAccess = {
	hasTier: boolean;
	tierNames: string[];
	aiFeatures: string[];
	courseIds: string[];
	benefits: string[];
	enrollments: Array<{ enrollmentId: string; tierName: string | null; paymentStatus: string }>;
};

export class EnrollmentService {
	private readonly repository: EnrollmentRepositoryLike;

	constructor(deps: { repository?: EnrollmentRepositoryLike } = {}) {
		this.repository = deps.repository ?? new EnrollmentRepository();
	}

	async getPaidAccess(pesertaId: string): Promise<PaidAccess> {
		const rows = await this.repository.findAccessByPesertaId(pesertaId);
		const paidRows = rows.filter((row) => row.paymentStatus === "paid");

		return {
			hasTier: paidRows.length > 0,
			tierNames: unique(paidRows.flatMap((row) => (row.tierName ? [row.tierName] : []))),
			aiFeatures: unique(paidRows.flatMap((row) => row.aiFeatures ?? [])),
			courseIds: unique(paidRows.flatMap((row) => row.courseIds ?? [])),
			benefits: unique(paidRows.flatMap((row) => row.benefits ?? [])),
			enrollments: paidRows.map((row) => ({ enrollmentId: row.enrollmentId, tierName: row.tierName, paymentStatus: row.paymentStatus })),
		};
	}

	async listBatchEnrollments(batchId: string) {
		return this.repository.listBatchEnrollments(batchId);
	}

	async search(query: string) {
		const trimmed = query.trim();
		if (trimmed.length < 2) return [];
		return this.repository.search(trimmed);
	}

	async markPaid(enrollmentId: string) {
		return this.repository.setPaymentStatus({ enrollmentId, paymentStatus: "paid", enrollmentStatus: "active" });
	}

	async ensurePendingEnrollmentForPayment(input: EnsurePendingEnrollmentInput) {
		return this.repository.ensurePendingEnrollmentForPayment(input);
	}
}

function unique(values: string[]) {
	return [...new Set(values)];
}
