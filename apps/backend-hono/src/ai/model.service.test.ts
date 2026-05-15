import { describe, expect, it } from "vitest";
import { AiModelNotConfiguredError, ModelService } from "./model.service";

describe("ModelService", () => {
	it("throws when DeepSeek API key is missing", () => {
		const service = new ModelService({
			AI_PROVIDER: "deepseek",
			AI_MODEL: "deepseek-v4-flash",
			DEEPSEEK_API_KEY: undefined,
			DEEPSEEK_BASE_URL: "https://api.deepseek.com/v1",
		});

		expect(() => service.getLanguageModel()).toThrow(AiModelNotConfiguredError);
	});

	it("creates a DeepSeek model", () => {
		const service = new ModelService({
			AI_PROVIDER: "deepseek",
			AI_MODEL: "deepseek-v4-flash",
			DEEPSEEK_API_KEY: "sk-test",
			DEEPSEEK_BASE_URL: "https://api.deepseek.com/v1",
		});

		expect(service.getLanguageModel()).toBeTruthy();
	});
});
