export const extractorPrompt = `Extract only explicitly stated or confirmed fields from the user's Indonesian message.
Do not infer final values from weak hints.
If the user asks a question only, return empty patches.
If the user asks for a recommendation, return pendingSuggestions, not final patches.
If the user confirms a previous pending suggestion, return confirmedPendingFields.
Extract every explicit field in the message, even when several fields appear in one sentence.
Use these canonical field keys:
- Trainer flow brainstorming: trainer_name, expertise, audience, outcome, institution, activities, training_objective, training_date.
- Trainer flow training_details: program_name, delivery_method, duration_jp.
- Master flow profile: organization_name, trainer_name, program_name, target_participants, industry_problem.
Return structured output matching the provided schema.`;
