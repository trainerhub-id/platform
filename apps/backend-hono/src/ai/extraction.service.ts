import { generateText } from "ai";
import { extractionResultSchema, type ExtractedPatch, type ExtractionResult } from "../interview/extraction.schemas";
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

export function extractExplicitMessagePatches(message: string, flow: "master" | "trainer"): ExtractedPatch[] {
	const phaseKey = flow === "trainer" ? "brainstorming" : "profile";
	const patches: ExtractedPatch[] = [];
	const trainerName = extractExplicitValue(message, [
		/\bnama\s+(?:pelatih|trainer|instruktur|narasumber)(?:nya)?\s*(?:adalah|=|:)?\s+([^.,;\n]+)/i,
		/\b(?:pelatih|trainer|instruktur|narasumber)(?:nya)?\s*(?:adalah|=|:)?\s+([^.,;\n]+)/i,
	]);

	if (trainerName) {
		patches.push({
			flow,
			phaseKey,
			fieldKey: "trainer_name",
			value: trainerName,
			source: "user_explicit",
			confidence: 0.95,
		});
	}

	if (flow === "trainer") {
		const expertise = extractExplicitValue(message, [
			/\b(?:bidang\s+keahlian(?:\s+utama)?|keahlian|expertise)(?:nya)?\s*(?:adalah|=|:)?\s+([^.,;\n]+)/i,
			/\bbidang\s+([^.,;\n]+)/i,
		]);

		if (expertise) {
			patches.push({
				flow,
				phaseKey: "brainstorming",
				fieldKey: "expertise",
				value: expertise,
				source: "user_explicit",
				confidence: 0.9,
			});
		}
	}

	return patches;
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
		const normalized = normalizeExtractionObject(extractJson(text), flow);
		const existingPatchKeys = new Set(normalized.patches.map((patch) => `${patch.flow}.${patch.phaseKey}.${patch.fieldKey}`));
		const fallbackPatches = extractExplicitMessagePatches(input.message, flow).filter(
			(patch) => !existingPatchKeys.has(`${patch.flow}.${patch.phaseKey}.${patch.fieldKey}`),
		);

		return {
			...normalized,
			patches: [...normalized.patches, ...fallbackPatches],
		};
	}
}

function extractExplicitValue(message: string, patterns: RegExp[]): string | null {
	for (const pattern of patterns) {
		const match = message.match(pattern);
		const value = cleanExplicitValue(match?.[1]);
		if (value) return value;
	}
	return null;
}

function cleanExplicitValue(value: string | undefined): string | null {
	const cleaned = value
		?.replace(/\*\*/g, "")
		.replace(/^["'`]+|["'`]+$/g, "")
		.trim();
	if (!cleaned || cleaned.length < 2) return null;
	return cleaned;
}
