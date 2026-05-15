export type CertificatePdfData = {
	pesertaName: string;
	courseName: string;
	certificateNumber: string;
	completedAt: Date;
	issuedAt: Date;
	trainerName: string;
	qrCodeDataUri: string;
	courseDuration?: string;
	templateName?: string | null;
	previewNote?: string;
};

type ReactPdfDocument = unknown;

type CertificatePdfDeps = {
	createDocument?: (input: CertificatePdfData) => Promise<ReactPdfDocument>;
	renderToBuffer?: (document: ReactPdfDocument) => Promise<Buffer>;
};

function normalizeText(value: unknown, fallback = ""): string {
	const text = String(value ?? "").trim();
	return text || fallback;
}

function formatDate(value: Date | string | undefined): string {
	const date = value instanceof Date ? value : new Date(value ?? Date.now());
	if (Number.isNaN(date.getTime())) return "-";
	return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function getPalette(templateName?: string | null) {
	const normalized = normalizeText(templateName).toLowerCase();
	if (normalized.includes("modern")) return { frame: "#0f172a", accent: "#14b8a6", soft: "#ccfbf1", ink: "#0f172a", muted: "#334155" };
	if (normalized.includes("elegant")) return { frame: "#581c87", accent: "#c026d3", soft: "#fae8ff", ink: "#1f1534", muted: "#5b4b73" };
	return { frame: "#7a5a1f", accent: "#c39341", soft: "#faf5e8", ink: "#1b1b1b", muted: "#6f6f6f" };
}

async function createReactPdfDocument(input: CertificatePdfData) {
	const React = await import("react");
	const { Document, Image, Page, StyleSheet, Text, View } = await import("@react-pdf/renderer");
	const palette = getPalette(input.templateName);
	const styles = StyleSheet.create({
		page: { padding: 18, backgroundColor: "#ffffff", fontFamily: "Times-Roman" },
		frame: { flexGrow: 1, borderWidth: 3, borderColor: palette.frame, borderRadius: 18, padding: 18, justifyContent: "space-between" },
		title: { textAlign: "center", color: palette.accent, fontSize: 26, letterSpacing: 4, fontFamily: "Helvetica-Bold", marginBottom: 8 },
		subtitle: { textAlign: "center", color: palette.muted, fontSize: 11, marginBottom: 18 },
		recipient: { textAlign: "center", fontSize: 28, color: palette.ink, marginTop: 8, marginBottom: 8 },
		line: { height: 2, backgroundColor: palette.accent, borderRadius: 999, width: 340, alignSelf: "center", marginBottom: 16 },
		body: { textAlign: "center", fontSize: 13, lineHeight: 1.5, color: palette.ink, marginHorizontal: 44, marginBottom: 18 },
		card: { borderWidth: 1, borderColor: palette.accent, borderRadius: 14, backgroundColor: palette.soft, padding: 14, marginBottom: 18 },
		label: { fontSize: 9, color: palette.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
		value: { fontSize: 12, color: palette.ink, marginBottom: 8 },
		qr: { width: 82, height: 82, alignSelf: "center", marginBottom: 8 },
		footer: { color: palette.muted, fontSize: 8.5, textAlign: "center" },
	});

	return React.createElement(
		Document,
		null,
		React.createElement(
			Page,
			{ size: "A4", orientation: "landscape", style: styles.page },
			React.createElement(
				View,
				{ style: styles.frame },
				React.createElement(
					View,
					null,
					React.createElement(Text, { style: styles.title }, "SERTIFIKAT"),
					React.createElement(Text, { style: styles.subtitle }, "TRAINERHUB COURSE COMPLETION"),
					React.createElement(Text, { style: styles.body }, "Diberikan kepada"),
					React.createElement(Text, { style: styles.recipient }, normalizeText(input.pesertaName, "Peserta")),
					React.createElement(View, { style: styles.line }),
					React.createElement(Text, { style: styles.body }, `Telah menyelesaikan pelatihan ${normalizeText(input.courseName, "- ")} dengan baik.`),
					React.createElement(
						View,
						{ style: styles.card },
						React.createElement(Text, { style: styles.label }, "Nomor Sertifikat"),
						React.createElement(Text, { style: styles.value }, normalizeText(input.certificateNumber, "-")),
						React.createElement(Text, { style: styles.label }, "Tanggal Selesai"),
						React.createElement(Text, { style: styles.value }, formatDate(input.completedAt)),
						React.createElement(Text, { style: styles.label }, "Tanggal Terbit"),
						React.createElement(Text, { style: styles.value }, formatDate(input.issuedAt)),
					),
					input.qrCodeDataUri ? React.createElement(Image, { src: input.qrCodeDataUri, style: styles.qr }) : null,
				),
				React.createElement(Text, { style: styles.footer }, `Diterbitkan oleh ${normalizeText(input.trainerName, "TrainerHub Team")}`),
			),
		),
	);
}

export class CertificatePdfService {
	private readonly createDocument: (input: CertificatePdfData) => Promise<ReactPdfDocument>;
	private readonly renderToBuffer: (document: ReactPdfDocument) => Promise<Buffer>;

	constructor(deps: CertificatePdfDeps = {}) {
		this.createDocument = deps.createDocument ?? createReactPdfDocument;
		this.renderToBuffer = deps.renderToBuffer ?? (async (document) => {
			const { renderToBuffer } = await import("@react-pdf/renderer");
			return renderToBuffer(document as never);
		});
	}

	async render(input: CertificatePdfData): Promise<Buffer> {
		const document = await this.createDocument(input);
		return this.renderToBuffer(document);
	}
}
