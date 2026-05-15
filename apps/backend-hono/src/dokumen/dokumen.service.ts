import { and, eq } from "drizzle-orm";
import { db } from "../db/client";
import { dokumenJenis, dokumenKategori, dokumenPeserta, peserta } from "../db/schema";
import { ObjectStorageService } from "../storage/object-storage.service";

export class DokumenService {
	constructor(private readonly storage = new ObjectStorageService()) {}

	async findPesertaByUserId(userId: string) {
		const [row] = await db.select().from(peserta).where(eq(peserta.clerkId, userId)).limit(1);
		return row ?? null;
	}

	async getKategori() {
		return db.select().from(dokumenKategori);
	}

	async getJenisByKategori(kategoriId: string) {
		return db.select().from(dokumenJenis).where(eq(dokumenJenis.kategoriId, kategoriId));
	}

	async getStatus(userId: string) {
		const profile = await this.findPesertaByUserId(userId);
		if (!profile) return [];
		const rows = await db
			.select({
				id: dokumenPeserta.id,
				pesertaId: dokumenPeserta.pesertaId,
				jenisId: dokumenPeserta.jenisId,
				fileUrl: dokumenPeserta.fileUrl,
				status: dokumenPeserta.status,
				catatanRevisi: dokumenPeserta.catatanRevisi,
				createdAt: dokumenPeserta.createdAt,
				updatedAt: dokumenPeserta.updatedAt,
				jenisNama: dokumenJenis.namaJenis,
			})
			.from(dokumenPeserta)
			.leftJoin(dokumenJenis, eq(dokumenPeserta.jenisId, dokumenJenis.id))
			.where(eq(dokumenPeserta.pesertaId, profile.id));
		return Promise.all(rows.map(async (row) => ({ ...row, fileUrl: await this.storage.getPublicUrl(row.fileUrl) })));
	}

	async upload(file: File, jenisId: string, userId: string) {
		const profile = await this.findPesertaByUserId(userId);
		if (!profile) throw new Error("PESERTA_NOT_FOUND");
		const [jenis] = await db.select().from(dokumenJenis).where(eq(dokumenJenis.id, jenisId)).limit(1);
		if (!jenis) throw new Error("INVALID_DOCUMENT_TYPE");
		const buffer = Buffer.from(await file.arrayBuffer());
		const uploaded = await this.storage.upload({
			originalname: file.name || "dokumen",
			buffer,
			mimetype: file.type || "application/octet-stream",
			size: buffer.byteLength,
		}, this.storage.buildPesertaDocumentPath(profile.id));
		const [existing] = await db.select().from(dokumenPeserta).where(and(eq(dokumenPeserta.pesertaId, profile.id), eq(dokumenPeserta.jenisId, jenisId))).limit(1);
		if (existing) {
			const [row] = await db.update(dokumenPeserta).set({ fileUrl: uploaded.key, status: "pending", catatanRevisi: null, updatedAt: new Date() }).where(eq(dokumenPeserta.id, existing.id)).returning();
			return row;
		}
		const [row] = await db.insert(dokumenPeserta).values({ pesertaId: profile.id, jenisId, fileUrl: uploaded.key, status: "pending" }).returning();
		return row;
	}

	async delete(id: string, userId: string) {
		const profile = await this.findPesertaByUserId(userId);
		if (!profile) throw new Error("PESERTA_NOT_FOUND");
		await db.delete(dokumenPeserta).where(and(eq(dokumenPeserta.id, id), eq(dokumenPeserta.pesertaId, profile.id)));
		return { success: true };
	}
}
