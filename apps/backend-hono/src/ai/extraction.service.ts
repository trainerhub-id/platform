import { generateText } from "ai";
import { extractionResultSchema, type ExtractionResult } from "../interview/extraction.schemas";
import { ModelService } from "./model.service";
import { extractorPrompt } from "./prompts/extractor.prompt";

export type ExtractionInput = {
	message: string;
	phase: string;
	recentMessages: Array<{ role: string; content: string }>;
};

export interface ExtractionServiceLike {
	extract(input: ExtractionInput): Promise<ExtractionResult>;
}

const legacyPatchPathMap: Record<"master" | "trainer", Record<string, { phaseKey: string; fieldKey: string }>> = {
	master: {
		"/institutionName": { phaseKey: "profile", fieldKey: "organization_name" },
		"/organizationName": { phaseKey: "profile", fieldKey: "organization_name" },
		"/trainerName": { phaseKey: "profile", fieldKey: "trainer_name" },
		"/programName": { phaseKey: "profile", fieldKey: "program_name" },
		"/targetParticipants": { phaseKey: "profile", fieldKey: "target_participants" },
		"/industryProblem": { phaseKey: "profile", fieldKey: "industry_problem" },
	},
	trainer: {
		"/trainerName": { phaseKey: "brainstorming", fieldKey: "trainer_name" },
		"/expertise": { phaseKey: "brainstorming", fieldKey: "expertise" },
		"/audience": { phaseKey: "brainstorming", fieldKey: "audience" },
		"/outcome": { phaseKey: "brainstorming", fieldKey: "outcome" },
		"/institution": { phaseKey: "brainstorming", fieldKey: "institution" },
		"/activities": { phaseKey: "brainstorming", fieldKey: "activities" },
		"/trainingObjective": { phaseKey: "brainstorming", fieldKey: "training_objective" },
		"/trainingDate": { phaseKey: "brainstorming", fieldKey: "training_date" },
		"/programName": { phaseKey: "training_details", fieldKey: "program_name" },
		"/deliveryMethod": { phaseKey: "training_details", fieldKey: "delivery_method" },
		"/durationJp": { phaseKey: "training_details", fieldKey: "duration_jp" },
	},
};

function extractJson(text: string): unknown {
	const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
	const raw = fenced?.[1] ?? text;
	const start = raw.indexOf("{");
	const end = raw.lastIndexOf("}");
	if (start === -1 || end === -1 || end < start) {
		throw new Error("AI_EXTRACTION_JSON_NOT_FOUND");
	}
	return JSON.parse(raw.slice(start, end + 1));
}

export function normalizeExtractionObject(value: unknown, defaultFlow: "master" | "trainer" = "master"): ExtractionResult {
	const native = extractionResultSchema.safeParse(value);
	if (native.success) return native.data;

	if (!value || typeof value !== "object") {
		return extractionResultSchema.parse({});
	}

	const raw = value as { patches?: unknown };
	const patches = Array.isArray(raw.patches)
		? raw.patches.flatMap((patch) => {
				if (!patch || typeof patch !== "object") return [];
				const item = patch as { path?: unknown; value?: unknown };
				if (typeof item.path !== "string") return [];
				const mapped = legacyPatchPathMap[defaultFlow][item.path];
				if (!mapped) return [];
				return [
					{
						flow: defaultFlow,
						phaseKey: mapped.phaseKey,
						fieldKey: mapped.fieldKey,
						value: item.value,
						source: "user_explicit" as const,
						confidence: 0.8,
					},
				];
			})
		: [];

	return extractionResultSchema.parse({
		patches,
		pendingSuggestions: [],
		confirmedPendingFields: [],
		generateConfirmed: false,
	});
}

export class ExtractionService implements ExtractionServiceLike {
	constructor(private readonly modelService = new ModelService()) {}

	async extract(input: ExtractionInput): Promise<ExtractionResult> {
		const { text } = await generateText({
			model: this.modelService.getLanguageModel(),
			system: extractorPrompt,
			prompt: JSON.stringify(input),
		});

		const flow = input.phase === "brainstorming" || input.phase === "training_details" ? "trainer" : "master";
		return normalizeExtractionObject(extractJson(text), flow);
	}
}
