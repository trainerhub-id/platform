import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { peserta } from "../db/schema";

export type CreatePesertaInput = {
	clerkId: string;
	nama: string;
	email: string;
	noWa?: string | undefined;
	tShirtSize?: string | undefined;
};

export type UpdatePesertaInput = {
	nama?: string | undefined;
	noWa?: string | undefined;
	nik?: string | undefined;
	ttl?: string | undefined;
	jk?: "L" | "P" | undefined;
	alamat?: string | undefined;
	kota?: string | undefined;
	provinsi?: string | undefined;
	pendidikan?: string | undefined;
	pekerjaan?: string | undefined;
	tShirtSize?: string | undefined;
};

export class PesertaRepository {
	async create(input: CreatePesertaInput) {
		const [row] = await db.insert(peserta).values(input).returning();
		if (!row) throw new Error("PESERTA_CREATE_FAILED");
		return row;
	}

	async findByClerkId(clerkId: string) {
		const [row] = await db.select().from(peserta).where(eq(peserta.clerkId, clerkId)).limit(1);
		return row ?? null;
	}

	async findByEmail(email: string) {
		const [row] = await db.select().from(peserta).where(eq(peserta.email, email)).limit(1);
		return row ?? null;
	}

	async findById(id: string) {
		const [row] = await db.select().from(peserta).where(eq(peserta.id, id)).limit(1);
		return row ?? null;
	}

	async linkClerkId(id: string, clerkId: string) {
		await db.update(peserta).set({ clerkId, updatedAt: new Date() }).where(eq(peserta.id, id));
	}

	async update(id: string, input: UpdatePesertaInput) {
		const [row] = await db.update(peserta).set({ ...input, updatedAt: new Date() }).where(eq(peserta.id, id)).returning();
		if (!row) throw new Error("PESERTA_UPDATE_FAILED");
		return row;
	}
}
