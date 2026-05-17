import { simulateReadableStream, type LanguageModel } from "ai";
import { MockLanguageModelV3 } from "ai/test";
import { describe, expect, it } from "vitest";
import { ResponseService } from "./response.service";

const usage = {
  inputTokens: { total: 3, noCache: 3, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 10, text: 10, reasoning: undefined },
};

describe("ResponseService", () => {
  it("uses an AI SDK tool call to search SKKNI units after unit search confirmation", async () => {
    let skkniInput: unknown;
    let streamCallCount = 0;
    const model = new MockLanguageModelV3({
      doStream: async () => {
        streamCallCount += 1;
        if (streamCallCount === 1) {
          return {
            stream: simulateReadableStream({
              chunks: [
                { type: "tool-call", toolCallId: "call_1", toolName: "search_skkni_units", input: "{}" },
                { type: "finish", finishReason: { unified: "tool-calls", raw: undefined }, usage, logprobs: undefined },
              ],
            }),
          };
        }

        return {
          stream: simulateReadableStream({
            chunks: [
              { type: "text-start", id: "text_1" },
              { type: "text-delta", id: "text_1", delta: "1. M.70MKT00.001.1 - Mengelola Kampanye Digital" },
              { type: "text-end", id: "text_1" },
              { type: "finish", finishReason: { unified: "stop", raw: undefined }, usage, logprobs: undefined },
            ],
          }),
        };
      },
    });
    const masterJson = {
      schema_key: "hono_trainer_alpha_v1",
      brainstorming: { expertise: "Marketing", audience: "Mahasiswa", outcome: "Membuat strategi pemasaran digital" },
    };
    const service = new ResponseService(
      { getLanguageModel: () => model as LanguageModel },
      {
        async searchMaster(input) {
          skkniInput = input;
          return [
            {
              id: "unit_1",
              unitCode: "M.70MKT00.001.1",
              title: "Mengelola Kampanye Digital",
              relevanceScore: 0.91,
              reason: "Sesuai konteks marketing",
              evidence: ["Rank 1"],
            },
          ];
        },
      },
    );

    const response = await service.stream({
      message: "yaa",
      phase: "unit_selection",
      readiness: { ready: true, missing: [] },
      nextField: null,
      flow: "trainer",
      masterJson,
    });

    await expect(response.text()).resolves.toContain("M.70MKT00.001.1");
    expect(skkniInput).toBe(masterJson);
    expect(model.doStreamCalls).toHaveLength(2);
    expect(model.doStreamCalls[0]?.toolChoice).toEqual({ type: "tool", toolName: "search_skkni_units" });
    expect(model.doStreamCalls[0]?.tools?.map((item) => item.name)).toEqual(["search_skkni_units"]);
  });
});
