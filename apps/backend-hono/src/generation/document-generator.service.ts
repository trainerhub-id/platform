import { RendererRegistry } from "./renderers/renderer-registry";
import type { RenderContext, RenderResult } from "./renderers/renderer.types";
import { DocxTemplateRenderer } from "./renderers/docx-template-renderer";
import { ProgrammaticDocxRenderer } from "./renderers/programmatic-docx-renderer";
import { ReactPdfRenderer } from "./renderers/react-pdf-renderer";
import { getTemplateManifestEntry } from "./templates/template-manifest";
import { PayloadSnapshotRepository } from "./payload-snapshot.repository";

export class GenerationValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "GenerationValidationError";
	}
}

type ReadyDocument = {
	id: string;
	flow: string;
	readiness: unknown;
	masterJson: unknown;
	schemaVersion?: string;
};

type PayloadSnapshotLike = Pick<PayloadSnapshotRepository, "save">;

type RendererRegistryLike = Pick<RendererRegistry, "getRenderer">;

export type GeneratedRenderResult = RenderResult & {
	documentType: string;
	filename: string;
};

function isReady(readiness: unknown): boolean {
	return !!readiness && typeof readiness === "object" && (readiness as { ready?: unknown }).ready === true;
}

export class DocumentGeneratorService {
	private readonly payloadSnapshots: PayloadSnapshotLike;
	private readonly rendererRegistry: RendererRegistryLike;

	constructor(deps: { payloadSnapshots?: PayloadSnapshotLike; rendererRegistry?: RendererRegistryLike } = {}) {
		this.payloadSnapshots = deps.payloadSnapshots ?? new PayloadSnapshotRepository();
		this.rendererRegistry = deps.rendererRegistry ?? new RendererRegistry([new DocxTemplateRenderer(), new ProgrammaticDocxRenderer(), new ReactPdfRenderer()]);
	}

	async generateFromJob(payload: unknown) {
		if (!payload || typeof payload !== "object") throw new GenerationValidationError("INVALID_GENERATION_JOB_PAYLOAD");
		const data = payload as { document?: ReadyDocument; documentTypes?: string[] };
		if (!data.document || !Array.isArray(data.documentTypes)) throw new GenerationValidationError("INVALID_GENERATION_JOB_PAYLOAD");
		return this.generate({ document: data.document, documentTypes: data.documentTypes });
	}

	async generate(input: { document: ReadyDocument; documentTypes: string[] }): Promise<GeneratedRenderResult[]> {
		if (!isReady(input.document.readiness)) {
			throw new GenerationValidationError("DOCUMENT_NOT_READY");
		}

		const results: GeneratedRenderResult[] = [];
		for (const documentType of input.documentTypes) {
			const manifest = getTemplateManifestEntry(documentType);
			if (!manifest) throw new GenerationValidationError(`UNKNOWN_DOCUMENT_TYPE:${documentType}`);

			const payload = input.document.masterJson;
			await this.payloadSnapshots.save({
				documentId: input.document.id,
				flow: input.document.flow,
				documentType,
				payload,
				schemaVersion: input.document.schemaVersion ?? "hono_alpha_v1",
			});

			const context: RenderContext = {
				flow: manifest.flow,
				documentType: manifest.documentType,
				renderer: manifest.renderer,
				outputFormat: manifest.outputFormat,
				templatePath: manifest.templatePath,
			};
			const renderer = this.rendererRegistry.getRenderer(context);
			const rendered = await renderer.render({ context, payload });
			results.push({
				...rendered,
				documentType,
				filename: manifest.filename({ documentType, title: input.document.id }),
			});
		}

		return results;
	}
}
