import { pdf } from "@react-pdf/renderer";
import type { DocumentRenderer, RenderContext, RenderInput, RenderResult } from "./renderer.types";
import { TemplateNotConfiguredError } from "./renderer.types";

export class ReactPdfRenderer implements DocumentRenderer {
	supports(context: RenderContext): boolean {
		return context.renderer === "react-pdf";
	}

	async render(input: RenderInput): Promise<RenderResult> {
		throw new TemplateNotConfiguredError(input.context.documentType);
	}

	protected createPdfRenderer() {
		return pdf;
	}
}
