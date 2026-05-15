import { ObjectStorageService } from "../storage/object-storage.service";
import { TugasRepository } from "./tugas.repository";

export class TugasService {
	constructor(
		private readonly repository = new TugasRepository(),
		private readonly storage = new ObjectStorageService(),
	) {}

	async list() {
		return this.repository.list();
	}

	async upload(file: File, input: { tugasId: string }, userId: string) {
		const profile = await this.repository.findPesertaByUserId(userId);
		if (!profile) throw new Error("PESERTA_NOT_FOUND");
		const task = await this.repository.findTugasById(input.tugasId);
		if (!task) throw new Error("INVALID_TASK_ID");

		let submission = await this.repository.findSubmission(profile.id, input.tugasId);
		if (!submission) submission = await this.repository.createSubmission(profile.id, input.tugasId);
		else submission = await this.repository.markSubmitted(submission.id);
		if (!submission) throw new Error("TASK_SUBMISSION_NOT_FOUND");

		const buffer = Buffer.from(await file.arrayBuffer());
		const uploaded = await this.storage.upload({
			originalname: file.name || "submission",
			buffer,
			mimetype: file.type || "application/octet-stream",
			size: buffer.byteLength,
		}, this.storage.buildPesertaTugasPath(profile.id));

		return this.repository.createUpload(submission.id, uploaded.key);
	}

	async review(id: string, input: { nilai: string; catatanTrainer?: string | null }) {
		const row = await this.repository.review(id, input);
		if (!row) throw new Error("TASK_SUBMISSION_NOT_FOUND");
		return row;
	}

	async getPesertaTugas(userId: string) {
		return this.repository.listSubmissionsByUserId(userId);
	}

	async getPesertaTugasById(pesertaId: string) {
		return this.repository.listSubmissionsByPesertaId(pesertaId);
	}

	async getUploads(tugasPesertaId: string) {
		return this.repository.listUploads(tugasPesertaId);
	}
}
