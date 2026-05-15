import { env } from "../config/env";

export type MasterSkkniContext = {
	expertise?: string | undefined;
	activities?: string | undefined;
	audience?: string | undefined;
	outcome?: string | undefined;
	domain_hint?: string | undefined;
	inferred_goal_label?: string | undefined;
};

export type SkkniCandidate = {
	id: string;
	unitCode: string;
	title: string;
	relevanceScore: number;
	reason: string;
	evidence: string[];
};

type SemanticSearchResponse = {
	results?: Array<{
		rank?: number;
		unit_code: string;
		document_id?: string;
		unit_title: string;
		unit_description?: string;
		score?: number;
		rerank_score?: number;
		confidence?: string;
		match_type?: string;
	}>;
};

type WspUnitData = {
	unit_code: string;
	unit_title: string;
	unit_description?: string;
	competency_elements?: Array<{
		element_number: number;
		element_title: string;
		performance_criteria?: Array<{ code: string; description: string }>;
	}>;
	variable_constraints?: unknown;
	assessment_guide?: unknown;
	number?: string;
	number_kepmen?: string;
	source_signature?: { document_id?: string; document_title?: string };
};

type CompetencyMapApi = {
	tujuan_utama?: string | null;
	fungsi_kunci?: string | null;
	fungsi_utama?: string | null;
	sub_fungsi_utama?: string | null;
	matched_fungsi_dasar?: string | null;
};

function clean(value: unknown): string | undefined {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

export function buildMasterSkkniContext(masterJson: unknown): MasterSkkniContext {
	const source = (masterJson && typeof masterJson === "object" ? (masterJson as any).brainstorming_master : {}) ?? {};
	return {
		expertise: clean(source.organization_focus) ?? clean(source.program_name),
		activities: clean(source.program_goal),
		audience: clean(source.target_participants),
		outcome: clean(source.industry_problem),
		domain_hint: clean(source.program_name),
		inferred_goal_label: clean(source.program_goal),
	};
}

export function transformSemanticSearch(response: SemanticSearchResponse): SkkniCandidate[] {
	return (response.results ?? []).slice(0, 10).map((item, index) => ({
		id: item.document_id ? `${item.document_id}:${item.unit_code}` : item.unit_code,
		unitCode: item.unit_code,
		title: item.unit_title,
		relevanceScore: Number(item.rerank_score ?? item.score ?? 0),
		reason: [item.confidence, item.match_type, item.unit_description].filter(Boolean).join(" — ") || "Relevan dengan konteks program.",
		evidence: [`Rank ${item.rank ?? index + 1}`, item.document_id ? `Dokumen ${item.document_id}` : ""].filter(Boolean),
	}));
}

export function normalizeUnitDetail(data: WspUnitData) {
	return {
		code: data.unit_code,
		name: data.unit_title,
		description: data.unit_description ?? "",
		number: data.number ?? "",
		number_kepmen: data.number_kepmen ?? "",
		source_document: {
			document_id: data.source_signature?.document_id ?? "",
			document_title: data.source_signature?.document_title ?? "",
		},
		variable_constraints: data.variable_constraints ?? {},
		assessment_guide: data.assessment_guide ?? {},
		elements: (data.competency_elements ?? []).map((element) => ({
			element_number: element.element_number,
			element_text: element.element_title,
			kuk: (element.performance_criteria ?? []).map((criteria) => ({
				kuk_code: criteria.code,
				kuk_text: criteria.description,
			})),
		})),
	};
}

export function normalizeCompetencyMap(data: CompetencyMapApi) {
	return {
		main_goal: data.tujuan_utama ?? "",
		key_function: data.fungsi_kunci ?? "",
		main_function: data.fungsi_utama ?? "",
		basic_function: data.sub_fungsi_utama ?? data.matched_fungsi_dasar ?? "",
	};
}

export class SkkniService {
	constructor(private readonly baseUrl = env.WSP_API_URL) {}

	async searchMaster(masterJson: unknown): Promise<SkkniCandidate[]> {
		const context = buildMasterSkkniContext(masterJson);
		const payload = {
			...context,
			query_text: [context.expertise, context.activities, context.audience, context.outcome].filter(Boolean).join(" dan "),
			top_k: 5,
			debug: false,
			include_explanations: true,
		};

		const response = await fetch(`${this.baseUrl}/search/semantic`, {
			method: "POST",
			headers: { "content-type": "application/json", accept: "application/json" },
			body: JSON.stringify(payload),
		});
		if (!response.ok) throw new Error(`SKKNI_SEARCH_FAILED_${response.status}`);
		return transformSemanticSearch((await response.json()) as SemanticSearchResponse);
	}

	async getUnitDetail(unitCode: string) {
		const response = await fetch(`${this.baseUrl}/unit/${encodeURIComponent(unitCode)}`, {
			headers: { accept: "application/json" },
		});
		if (!response.ok) throw new Error(`SKKNI_UNIT_FAILED_${response.status}`);
		const json = (await response.json()) as { success?: boolean; data?: WspUnitData } | WspUnitData;
		const data = "data" in json && json.data ? json.data : (json as WspUnitData);
		return normalizeUnitDetail(data);
	}

	async getCompetencyMap(unitCode: string) {
		const response = await fetch(`${this.baseUrl}/map/${encodeURIComponent(unitCode)}`, {
			headers: { accept: "application/json" },
		});
		if (!response.ok) throw new Error(`SKKNI_MAP_FAILED_${response.status}`);
		return normalizeCompetencyMap((await response.json()) as CompetencyMapApi);
	}
}
