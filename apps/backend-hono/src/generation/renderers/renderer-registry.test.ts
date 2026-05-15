import { describe, expect, it } from "vitest";
import type { DocumentRenderer, RenderContext, RenderInput, RenderResult } from "./renderer.types";
import { RendererNotFoundError, RendererRegistry } from "./renderer-registry";

class FakeRenderer implements DocumentRenderer {
	constructor(private readonly rendererName: string) {}
	supports(context: RenderContext) {
		return context.renderer === this.rendererName;
	}
	async render(_input: RenderInput): Promise<RenderResult> {
		return { bytes: new Uint8Array(), mimeType: "application/octet-stream", outputFormat: "docx" };
	}
}

describe("RendererRegistry", () => {
	it("selects renderer by manifest renderer name", () => {
		const registry = new RendererRegistry([new FakeRenderer("docx-template"), new FakeRenderer("react-pdf")]);

		expect(registry.getRenderer({ flow: "master", documentType: "bukti-1", renderer: "react-pdf", outputFormat: "pdf" })).toBeInstanceOf(FakeRenderer);
	});

	it("throws typed error when no renderer supports context", () => {
		const registry = new RendererRegistry([]);

		expect(() => registry.getRenderer({ flow: "master", documentType: "bukti-1", renderer: "docx-template", outputFormat: "docx" })).toThrow(RendererNotFoundError);
	});
});
