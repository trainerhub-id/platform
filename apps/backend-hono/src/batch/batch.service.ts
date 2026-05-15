import { BatchRepository } from "./batch.repository";

export function createBatchSlug(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "batch";
}

function calculateJourney(startDate: Date | string, endDate?: Date | string | null) {
	const now = new Date();
	const start = new Date(startDate);
	const end = endDate ? new Date(endDate) : new Date(startDate);
	end.setHours(23, 59, 59, 999);
	const sertifikasiDate = new Date(end);
	sertifikasiDate.setDate(sertifikasiDate.getDate() + 7);
	let praStatus = "pending";
	let trainingStatus = "pending";
	let pascaStatus = "pending";
	let sertifikasiStatus = "pending";
	if (now < start) praStatus = "current";
	else if (now >= start && now <= end) {
		praStatus = "completed";
		trainingStatus = "current";
	} else if (now > end && now < sertifikasiDate) {
		praStatus = "completed";
		trainingStatus = "completed";
		pascaStatus = "current";
	} else {
		praStatus = "completed";
		trainingStatus = "completed";
		pascaStatus = "completed";
		sertifikasiStatus = "current";
	}
	return [
		{ id: 1, title: "Pra-Training", status: praStatus },
		{ id: 2, title: "Training", status: trainingStatus },
		{ id: 3, title: "Pasca-Training", status: pascaStatus },
		{ id: 4, title: "Sertifikasi", status: sertifikasiStatus },
	];
}

type BatchRepositoryLike = {
	create(input: Record<string, unknown>): Promise<Record<string, unknown>>;
	update(id: string, input: Record<string, unknown>): Promise<Record<string, unknown>>;
	remove(id: string): Promise<void>;
	findById(id: string): Promise<Record<string, unknown> | null>;
	findAll(): Promise<Array<Record<string, unknown>>>;
	findPesertaByClerkId(clerkId: string): Promise<{ id: string } | null>;
	findByPesertaId(pesertaId: string): Promise<Array<Record<string, unknown>>>;
	assignPeserta(batchId: string, pesertaId: string): Promise<Record<string, unknown>>;
	updateStatus(input: { batchId: string; pesertaId: string; status: string }): Promise<Record<string, unknown>>;
	getPesertaInBatch(batchId: string): Promise<Array<Record<string, unknown>>>;
	getCurriculum(batchId: string): Promise<unknown>;
};

export class BatchService {
	private readonly repository: BatchRepositoryLike;
	private readonly fetcher: (input: string, init?: RequestInit) => Promise<{ url: string }>;

	constructor(deps: { repository?: BatchRepositoryLike; fetcher?: (input: string, init?: RequestInit) => Promise<{ url: string }> } = {}) {
		this.repository = deps.repository ?? new BatchRepository();
		this.fetcher = deps.fetcher ?? fetch;
	}

	async create(input: Record<string, unknown>) {
		const slug = createBatchSlug(String(input.namaBatch ?? "batch"));
		return this.repository.create({ ...input, slug, tanggal: input.tanggal ? new Date(String(input.tanggal)) : new Date() });
	}

	async update(id: string, input: Record<string, unknown>) {
		return this.repository.update(id, input);
	}

	async remove(id: string) {
		await this.repository.remove(id);
		return { success: true, deletedId: id, message: "Batch deleted successfully" };
	}

	async listForUser(user: { id: string; role?: string }) {
		if (user.role === "admin") return this.repository.findAll();
		const peserta = await this.repository.findPesertaByClerkId(user.id);
		if (!peserta) return [];
		const rows = await this.repository.findByPesertaId(peserta.id);
		return rows.map((batch) => ({ ...batch, journey: calculateJourney(batch.tanggal as Date, batch.tanggalSelesai as Date | null) }));
	}

	async assignPeserta(batchId: string, input: { pesertaIds: string[] }) {
		return Promise.all(input.pesertaIds.map((pesertaId) => this.repository.assignPeserta(batchId, pesertaId)));
	}

	async updateStatus(input: { batchId: string; pesertaId: string; status: string }) {
		return this.repository.updateStatus(input);
	}

	async getPesertaInBatch(batchId: string) {
		return this.repository.getPesertaInBatch(batchId);
	}

	async getCurriculum(batchId: string) {
		return this.repository.getCurriculum(batchId);
	}

	async resolveMapUrl(url: string) {
		try {
			const response = await this.fetcher(url, { method: "GET", redirect: "follow" });
			return { finalUrl: response.url };
		} catch {
			return { finalUrl: url };
		}
	}
}
