# AI Master Workspace Backend Integration Contract

Frontend talks only to `AiMasterApi` in `contracts.ts`.

## Expected backend endpoints

```txt
GET /api/ai-master/workspace/:documentId
POST /api/ai-master/workspace/:documentId/messages
PATCH /api/ai-master/workspace/:documentId/slots/:field
POST /api/ai-master/workspace/:documentId/skkni/search
POST /api/ai-master/workspace/:documentId/skkni/select
POST /api/ai-master/workspace/:documentId/documents/generate-all
```

## Rules

- Backend owns `AiMasterWorkspaceState`.
- LLM output is candidate data only, not direct committed state.
- Slots keep `status`, `source`, `confidence`, and `updatedAt`.
- Minimum intake only requires `organization_name`, `organization_focus`, `program_name`, `target_participants`, and `industry_problem`.
- Optional fields can remain `draft`, `skipped`, or `needs_review`.
