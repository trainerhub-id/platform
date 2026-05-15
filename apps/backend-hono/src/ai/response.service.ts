import { streamText } from "ai";
import { ModelService } from "./model.service";
import { interviewerPrompt } from "./prompts/interviewer.prompt";

export type ResponseInput = {
  message: string;
  phase: string;
  readiness: unknown;
  nextField: string | null;
};

export interface ResponseServiceLike {
  stream(input: ResponseInput): Promise<Response>;
}

export class ResponseService implements ResponseServiceLike {
  constructor(private readonly modelService = new ModelService()) {}

  async stream(input: ResponseInput): Promise<Response> {
    const result = streamText({
      model: this.modelService.getLanguageModel(),
      system: interviewerPrompt,
      prompt: JSON.stringify(input),
    });

    return result.toTextStreamResponse();
  }
}
