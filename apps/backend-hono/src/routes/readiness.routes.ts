import { Hono } from "hono";
import { readinessPreviewRequestSchema } from "../documents/document.schemas";
import type { FieldStateSnapshot } from "../interview/field-state.types";
import { getNextMasterPhase } from "../interview/phase-router";
import { buildMasterReadiness } from "../interview/master/master-readiness";

type ReadinessRouteVariables = {
  requestId: string;
};

export function createReadinessRoutes() {
  const app = new Hono<{ Variables: ReadinessRouteVariables }>();

  app.post("/api/interview/readiness/preview", async (c) => {
    const body = await c.req.json();
    const parsed = readinessPreviewRequestSchema.safeParse(body);

    if (!parsed.success) {
      return c.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues.map((issue) => issue.message).join("; "),
            requestId: c.get("requestId") ?? null,
          },
        },
        400,
      );
    }

    const fields: FieldStateSnapshot[] = parsed.data.fields.map((field) => ({
      ...field,
      value: field.value ?? null,
    }));
    const readiness = buildMasterReadiness(fields);
    const phase = getNextMasterPhase(fields);

    return c.json({
      ready: readiness.ready,
      phase,
      missing: readiness.missing,
      pendingConfirmation: readiness.pendingConfirmation,
      optionalGaps: readiness.optionalGaps,
      fields: fields.map((field) => ({
        phaseKey: field.phaseKey,
        fieldKey: field.fieldKey,
        status: field.status,
      })),
    });
  });

  return app;
}
