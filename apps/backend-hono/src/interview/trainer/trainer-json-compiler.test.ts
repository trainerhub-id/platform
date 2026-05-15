import { describe, expect, it } from "vitest";
import { compileTrainerJson } from "./trainer-json-compiler";
import { completeTrainerStates } from "./trainer-readiness.test";

describe("compileTrainerJson", () => {
	it("compiles Trainer field states into trainer master_json", () => {
		const result = compileTrainerJson(completeTrainerStates());

		expect(result.schema_key).toBe("hono_trainer_alpha_v1");
		expect(result.brainstorming.trainer_name).toBe("Budi");
		expect(result.brainstorming.expertise).toBe("Digital Marketing");
		expect(result.training.name).toBe("Pelatihan Digital Marketing");
		expect(result.training.delivery_method).toBe("Offline");
		expect(result.training.duration.total_jp).toBe(16);
		expect(result.people.trainer.name).toBe("Budi");
		expect(result.unit.code).toBe("M.70MKT00.001.1");
		expect(result.competency_map.main_goal).toBe("Kampanye digital efektif");
	});
});
