import { describe, expect, it } from "vitest";
import { PaymentService } from "./payment.service";

describe("PaymentService", () => {
	it("returns public batch info", async () => {
		const service = new PaymentService({ repository: { getPublicBatchInfo: async () => ({ batch: { id: "batch_1" }, tiers: [] }) } as any });

		const result = await service.getPublicBatchInfo("batch-q1");

		expect(result.batch.id).toBe("batch_1");
	});

	it("checks duplicate registrations", async () => {
		const service = new PaymentService({
			repository: {
				getBatchBySlugOrId: async () => ({ id: "batch_1" }),
				findPaymentByEmailAndBatch: async () => ({ status: "paid" }),
			} as any,
		});

		const result = await service.checkDuplicate({ email: "budi@example.com", batchSlug: "batch_1" });

		expect(result.isDuplicate).toBe(true);
	});

	it("creates a manual registration session using the tier price from storage", async () => {
		let updatedPaymentUrl = "";
		const service = new PaymentService({
			repository: {
				getBatchBySlugOrId: async () => ({ id: "batch_1", namaBatch: "Batch Q1" }),
				getTierBySlugOrId: async () => ({ id: "tier_1", batchId: "batch_1", name: "VIP", price: 250000 }),
				findPaymentByEmailAndBatch: async () => null,
				createPaymentSession: async (input: any) => ({ id: "session_1", ...input }),
				updatePaymentSessionUrl: async (_sessionId: string, paymentUrl: string) => {
					updatedPaymentUrl = paymentUrl;
				},
			} as any,
			enrollmentService: {
				ensurePendingEnrollmentForPayment: async () => ({ id: "enroll_1", pesertaId: "peserta_1" }),
				markPaid: async () => ({ id: "enroll_1" }),
			} as any,
			now: () => 1000,
			createClaimToken: () => "token_1",
			frontendUrl: "https://app.example",
			paymentProvider: "manual",
		});

		const result = await service.createRegistration({
			email: "budi@example.com",
			whatsapp: "081234567890",
			batchSlug: "batch-q1",
			tierSlug: "vip",
			paymentMethod: "qris",
		});

		expect(result).toEqual({
			sessionId: "session_1",
			amount: 250000,
			status: "pending",
			paymentUrl: "https://app.example/payment/success?session=session_1&ref=TH-batch_1-1000&email=budi%40example.com&amount=250000&batchId=batch_1&tierId=tier_1&token=token_1",
			expiresAt: new Date(1000 + 24 * 60 * 60 * 1000).toISOString(),
			provider: "manual",
		});
		expect(updatedPaymentUrl).toBe(result.paymentUrl);
	});

	it("creates pending payment without activating enrollment access", async () => {
		const calls: string[] = [];
		const service = new PaymentService({
			paymentProvider: "manual",
			repository: {
				getBatchBySlugOrId: async () => ({ id: "batch_1", namaBatch: "Batch 22 Mei" }),
				getTierBySlugOrId: async () => ({ id: "tier_1", batchId: "batch_1", name: "Master", price: 2500000 }),
				findPaymentByEmailAndBatch: async () => null,
				createPaymentSession: async (input: any) => ({ id: "session_1", ...input }),
				updatePaymentSessionUrl: async () => undefined,
				getPublicBatchInfo: async () => ({ batch: {}, tiers: [] }),
				getPublicTierInfo: async () => ({ batch: {}, tier: {} }),
				getPaymentSessionById: async () => null,
				markClaimTokenUsed: async () => undefined,
				updateSessionFromScalev: async () => null,
				getTiersByBatch: async () => [],
				getTierById: async () => null,
				getTierTemplateById: async () => null,
				createTier: async () => ({ id: "tier_1", batchId: "batch_1", name: "Master", price: 2500000 }),
				updateTier: async () => null,
				deleteTier: async () => undefined,
				getPaymentsByBatch: async () => [],
			} as any,
			enrollmentService: {
				ensurePendingEnrollmentForPayment: async () => {
					calls.push("pending-enrollment");
					return { id: "enroll_1", pesertaId: "peserta_1" };
				},
				markPaid: async () => {
					calls.push("mark-paid");
					return { id: "enroll_1" };
				},
			} as any,
		});

		await service.createRegistration({ email: "budi@example.com", whatsapp: "081234567890", batchSlug: "batch-22-mei", tierSlug: "master" });

		expect(calls).toEqual(["pending-enrollment"]);
	});

	it("creates a Scalev registration and stores provider checkout data", async () => {
		const scalevCalls: string[] = [];
		const service = new PaymentService({
			repository: {
				getBatchBySlugOrId: async () => ({ id: "batch_1", namaBatch: "Batch Q1" }),
				getTierBySlugOrId: async () => ({
					id: "tier_1",
					batchId: "batch_1",
					name: "VIP",
					price: 250000,
					scalevStoreUniqueId: "store_1",
					scalevVariantUniqueId: "variant_1",
					scalevBundlePriceOptionUniqueId: null,
				}),
				findPaymentByEmailAndBatch: async () => null,
				createPaymentSession: async (input: any) => ({ id: "session_1", ...input }),
				updatePaymentSessionUrl: async () => undefined,
				updateSessionFromScalev: async (_sessionId: string, input: any) => ({
					id: "session_1",
					amount: 250000,
					status: input.status,
					provider: input.provider,
					providerPaymentMethod: input.providerPaymentMethod,
					providerSubPaymentMethod: input.providerSubPaymentMethod,
					providerCheckoutUrl: input.providerCheckoutUrl,
					providerQrString: input.providerQrString,
					providerVaNumber: input.providerVaNumber,
					providerExpiresAt: input.providerExpiresAt,
					providerOrderId: input.providerOrderId,
					providerOrderCode: input.providerOrderCode,
					providerReferenceId: input.providerReferenceId,
				}),
			} as any,
			enrollmentService: {
				ensurePendingEnrollmentForPayment: async () => ({ id: "enroll_1", pesertaId: "peserta_1" }),
				markPaid: async () => ({ id: "enroll_1" }),
			} as any,
			scalev: {
				createOrder: async () => {
					scalevCalls.push("createOrder");
					return { data: { id: 42, order_id: "ORD-42", payment_method: "qris", payment_status: "pending" } };
				},
				createPaymentForOrder: async () => {
					scalevCalls.push("createPaymentForOrder");
					return { data: { invoice_url: "https://pay.example/checkout", payment_method: { qr_code: { channel_properties: { qr_string: "QRDATA" } } } } };
				},
				normalizePaymentSession: () => ({
					provider: "scalev",
					providerOrderId: 42,
					providerOrderCode: "ORD-42",
					providerReferenceId: "REF-42",
					channel: "qris",
					subChannel: null,
					status: "pending",
					checkoutUrl: "https://pay.example/checkout",
					qrString: "QRDATA",
					vaNumber: null,
					expiresAt: "2026-05-16T00:00:00Z",
					rawPayload: { ok: true },
				}),
			} as any,
			paymentProvider: "scalev",
			now: () => 1000,
			createClaimToken: () => "token_1",
		});

		const result = await service.createRegistration({
			email: "budi@example.com",
			whatsapp: "081234567890",
			batchSlug: "batch-q1",
			tierSlug: "vip",
			paymentMethod: "qris",
		});

		expect(scalevCalls).toEqual(["createOrder", "createPaymentForOrder"]);
		expect(result).toMatchObject({
			sessionId: "session_1",
			amount: 250000,
			status: "pending",
			provider: "scalev",
			checkoutUrl: "https://pay.example/checkout",
			paymentUrl: "https://pay.example/checkout",
			qrString: "QRDATA",
			providerOrderId: 42,
		});
	});

	it("claims a paid payment session and marks the token as used", async () => {
		let markedSessionId = "";
		const service = new PaymentService({
			repository: {
				getPaymentSessionById: async () => ({
					id: "session_1",
					email: "budi@example.com",
					status: "paid",
					claimToken: "token_1",
					claimTokenUsed: false,
					clerkSignInToken: "sign_in_1",
					clerkTokenExpiry: new Date(Date.now() + 60000),
				}),
				markClaimTokenUsed: async (sessionId: string) => {
					markedSessionId = sessionId;
				},
			} as any,
		});

		const result = await service.claimPayment("session_1", "token_1");

		expect(markedSessionId).toBe("session_1");
		expect(result).toEqual({
			signInToken: "sign_in_1",
			email: "budi@example.com",
			paymentStatus: "paid",
			requiresLogin: false,
		});
	});

	it("claims a paid Better Auth payment session without requiring legacy Clerk token", async () => {
		let markedSessionId: string | null = null;
		const service = new PaymentService({
			repository: {
				getPaymentSessionById: async () => ({
					id: "session_1",
					email: "budi@example.com",
					status: "paid",
					claimToken: "token_1",
					claimTokenUsed: false,
				}),
				markClaimTokenUsed: async (sessionId: string) => {
					markedSessionId = sessionId;
				},
			} as any,
		});

		const result = await service.claimPayment("session_1", "token_1");

		expect(markedSessionId).toBe("session_1");
		expect(result).toEqual({
			signInToken: null,
			email: "budi@example.com",
			paymentStatus: "paid",
			requiresLogin: true,
		});
	});

	it("refreshes a Scalev payment session from the provider", async () => {
		const service = new PaymentService({
			repository: {
				getPaymentSessionById: async () => ({
					id: "session_1",
					email: "budi@example.com",
					amount: 250000,
					status: "pending",
					claimToken: "token_1",
					provider: "scalev",
					providerOrderId: 42,
				}),
				updateSessionFromScalev: async (_sessionId: string, input: any) => ({
					id: "session_1",
					email: "budi@example.com",
					amount: 250000,
					status: input.status,
					provider: input.provider,
					providerOrderId: input.providerOrderId,
					providerOrderCode: input.providerOrderCode,
					providerReferenceId: input.providerReferenceId,
					providerPaymentMethod: input.providerPaymentMethod,
					providerCheckoutUrl: input.providerCheckoutUrl,
				}),
			} as any,
			scalev: {
				getOrder: async () => ({ data: { id: 42, order_id: "ORD-42", payment_method: "qris", payment_status: "pending" } }),
				checkOrderPayment: async () => ({ ok: true }),
				normalizePaymentSession: () => ({
					provider: "scalev",
					providerOrderId: 42,
					providerOrderCode: "ORD-42",
					providerReferenceId: "REF-42",
					channel: "qris",
					subChannel: null,
					status: "paid",
					checkoutUrl: "https://pay.example/checkout",
					qrString: null,
					vaNumber: null,
					expiresAt: null,
					rawPayload: { ok: true },
				}),
			} as any,
		});

		const result = await service.refreshScalevPaymentStatus("session_1", "token_1", true);

		expect(result).toMatchObject({
			sessionId: "session_1",
			status: "paid",
			provider: "scalev",
			providerOrderId: 42,
			paymentUrl: "https://pay.example/checkout",
		});
	});
});
