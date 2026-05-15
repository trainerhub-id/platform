import { and, desc, eq, type SQL } from "drizzle-orm";
import { db } from "../db/client";
import { auditLogs, type NewAuditLog } from "../db/schema";

export type AuditLogFilter = {
	batchId?: string;
	enrollmentId?: string;
	pesertaId?: string;
	limit?: number;
};

export class AuditLogRepository {
	async create(input: NewAuditLog) {
		const [row] = await db.insert(auditLogs).values(input).returning();
		if (!row) throw new Error("AUDIT_LOG_CREATE_FAILED");
		return row;
	}

	async findMany(filter: AuditLogFilter = {}) {
		const conditions: SQL[] = [];
		if (filter.batchId) conditions.push(eq(auditLogs.batchId, filter.batchId));
		if (filter.enrollmentId) conditions.push(eq(auditLogs.enrollmentId, filter.enrollmentId));
		if (filter.pesertaId) conditions.push(eq(auditLogs.pesertaId, filter.pesertaId));

		const query = db.select().from(auditLogs);
		const scoped = conditions.length > 0 ? query.where(and(...conditions)) : query;
		return scoped.orderBy(desc(auditLogs.createdAt)).limit(filter.limit ?? 100);
	}
}
