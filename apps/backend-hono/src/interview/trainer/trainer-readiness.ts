import type { FieldStateSnapshot, ReadinessResult } from "../field-state.types";
import { trainerBrainstormingOptionalFields, trainerBrainstormingRequiredFields, trainerSkkniRequiredFields, trainerTrainingDetailsGeneratedFields } from "./trainer-fields";

function hasUsableValue(value: unknown): boolean {
	if (typeof value === "string") return value.trim().length > 0;
	if (typeof value === "number") return Number.isFinite(value) && value > 0;
	if (typeof value === "boolean") return true;
	if (Array.isArray(value)) return value.length > 0;
	if (value && typeof value === "object") return Object.keys(value).length > 0;
	return false;
}

function keyOf(phaseKey: string, fieldKey: string): string {
	return `${phaseKey}.${fieldKey}`;
}

export function buildTrainerReadiness(states: FieldStateSnapshot[]): ReadinessResult {
	const byKey = new Map(states.map((state) => [keyOf(state.phaseKey, state.fieldKey), state]));
	const missing: string[] = [];
	const pendingConfirmation: string[] = [];
	const optionalGaps: string[] = [];

	const requireField = (phaseKey: string, fieldKey: string) => {
		const key = keyOf(phaseKey, fieldKey);
		const state = byKey.get(key);
		if (state?.status === "pending_confirmation") {
			pendingConfirmation.push(key);
			missing.push(key);
			return;
		}
		if (!state || !["captured", "confirmed"].includes(state.status) || !hasUsableValue(state.value)) missing.push(key);
	};

	for (const fieldKey of trainerBrainstormingRequiredFields) requireField("brainstorming", fieldKey);
	for (const requirement of trainerSkkniRequiredFields) requireField(requirement.phaseKey, requirement.fieldKey);
	for (const fieldKey of trainerTrainingDetailsGeneratedFields) {
		const state = byKey.get(keyOf("training_details", fieldKey));
		if (!state || !hasUsableValue(state.value)) optionalGaps.push(keyOf("training_details", fieldKey));
	}

	for (const fieldKey of trainerBrainstormingOptionalFields) {
		const state = byKey.get(keyOf("brainstorming", fieldKey));
		if (!state || !hasUsableValue(state.value)) optionalGaps.push(keyOf("brainstorming", fieldKey));
	}

	return { ready: missing.length === 0, missing, pendingConfirmation, optionalGaps };
}
