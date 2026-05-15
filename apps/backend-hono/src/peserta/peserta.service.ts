import { EnrollmentService, type PaidAccess } from "../enrollment/enrollment.service";
import { PesertaRepository, type CreatePesertaInput, type UpdatePesertaInput } from "./peserta.repository";

type PesertaRecord = {
	id: string;
	clerkId: string;
	nama: string;
	email: string;
	paymentStatus?: string | null;
	[key: string]: unknown;
};

type PesertaRepositoryLike = {
	create(input: CreatePesertaInput): Promise<PesertaRecord>;
	findByClerkId(clerkId: string): Promise<PesertaRecord | null>;
	findByEmail(email: string): Promise<PesertaRecord | null>;
	findById(id: string): Promise<PesertaRecord | null>;
	linkClerkId(id: string, clerkId: string): Promise<void>;
	update(id: string, input: UpdatePesertaInput): Promise<PesertaRecord>;
};

type EnrollmentServiceLike = {
	getPaidAccess(pesertaId: string): Promise<PaidAccess>;
};

export class PesertaService {
	private readonly repository: PesertaRepositoryLike;
	private readonly enrollmentService: EnrollmentServiceLike;

	constructor(deps: { repository?: PesertaRepositoryLike; enrollmentService?: EnrollmentServiceLike } = {}) {
		this.repository = deps.repository ?? new PesertaRepository();
		this.enrollmentService = deps.enrollmentService ?? new EnrollmentService();
	}

	async create(userId: string, input: Omit<CreatePesertaInput, "clerkId">) {
		return this.repository.create({ ...input, clerkId: userId });
	}

	async getProfile(userId: string, email?: string) {
		let profile = await this.repository.findByClerkId(userId);
		if (!profile && email) {
			profile = await this.repository.findByEmail(email);
			if (profile && profile.clerkId !== userId) {
				await this.repository.linkClerkId(profile.id, userId);
				profile = { ...profile, clerkId: userId };
			}
		}

		if (!profile) {
			return {
				id: "00000000-0000-0000-0000-000000000000",
				clerkId: userId,
				nama: "Admin User",
				email: email ?? "admin@trainerhub.com",
				paymentStatus: "paid",
			};
		}

		return profile;
	}

	async update(userId: string, input: UpdatePesertaInput, email?: string) {
		const profile = await this.getProfile(userId, email);
		if (profile.id === "00000000-0000-0000-0000-000000000000") throw new Error("PESERTA_NOT_FOUND");
		if (profile.clerkId !== userId) throw new Error("FORBIDDEN");
		return this.repository.update(profile.id, input);
	}

	async getAccess(userId: string, email?: string) {
		const profile = await this.getProfile(userId, email);
		if (profile.id === "00000000-0000-0000-0000-000000000000") {
			return { hasTier: false, tierName: null, aiFeatures: [], courseIds: [], benefits: [] };
		}
		const access = await this.enrollmentService.getPaidAccess(profile.id);
		return { ...access, tierName: access.tierNames[0] ?? null };
	}
}
