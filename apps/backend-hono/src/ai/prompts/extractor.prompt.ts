export const extractorPrompt = `Extract only explicitly stated or confirmed fields from the user's Indonesian message.
Do not infer final values from weak hints.
If the user asks a question only, return empty patches.
If the user asks for a recommendation, return pendingSuggestions, not final patches.
If the user confirms a previous pending suggestion, return confirmedPendingFields.
Return JSON matching the provided schema.`;
