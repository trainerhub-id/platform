import { Hono } from 'hono'
import { z } from 'zod'
import { type AuthVariables, requireAuth } from '../auth/auth.middleware'
import { errorResponse } from '../common/errors'
import { DocumentRepository, isDocumentOwner } from '../documents/document.repository'
import { FieldStateRepository } from '../interview/field-state.repository'
import type { FieldStateSnapshot } from '../interview/field-state.types'
import { compileMasterJson } from '../interview/master/master-json-compiler'
import { buildMasterReadiness } from '../interview/master/master-readiness'
import { getNextMasterPhase, getNextTrainerPhase } from '../interview/phase-router'
import { compileTrainerJson } from '../interview/trainer/trainer-json-compiler'
import { buildTrainerReadiness } from '../interview/trainer/trainer-readiness'
import { SkkniService } from './skkni.service'

const selectUnitSchema = z.object({
  unitCode: z.string().min(1).max(100),
})

type SkkniVariables = AuthVariables & { requestId: string }

type SkkniRouteDeps = {
  documents?: Pick<DocumentRepository, 'findById' | 'updateInterviewState'>
  fieldStates?: Pick<FieldStateRepository, 'list' | 'upsert'>
  skkni?: Pick<SkkniService, 'searchMaster' | 'getUnitDetail' | 'getCompetencyMap'>
}

function getUserId(c: { get(key: 'user'): AuthVariables['user'] }) {
  const user = c.get('user')
  return user?.id ?? null
}

export function createSkkniRoutes(deps: SkkniRouteDeps = {}) {
  const app = new Hono<{ Variables: SkkniVariables }>()
  const documents = deps.documents ?? new DocumentRepository()
  const fieldStates = deps.fieldStates ?? new FieldStateRepository()
  const skkni = deps.skkni ?? new SkkniService()

  app.post('/api/documents/:documentId/skkni/search', requireAuth, async (c) => {
    const userId = getUserId(c)
    if (!userId) return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
    const doc = await documents.findById(c.req.param('documentId'))
    if (!doc) return errorResponse(c, 404, 'DOCUMENT_NOT_FOUND', 'Document not found')
    if (!isDocumentOwner(doc, userId))
      return errorResponse(c, 403, 'FORBIDDEN', 'Document belongs to another user')
    if (doc.flow !== 'master' && doc.flow !== 'trainer')
      return errorResponse(
        c,
        400,
        'FLOW_NOT_SUPPORTED',
        'Only master/trainer SKKNI search is supported',
      )

    const candidates = await skkni.searchMaster(doc.masterJson)
    return c.json({ candidates })
  })

  app.post('/api/documents/:documentId/skkni/select', requireAuth, async (c) => {
    const userId = getUserId(c)
    if (!userId) return errorResponse(c, 401, 'UNAUTHORIZED', 'Authentication required')
    const doc = await documents.findById(c.req.param('documentId'))
    if (!doc) return errorResponse(c, 404, 'DOCUMENT_NOT_FOUND', 'Document not found')
    if (!isDocumentOwner(doc, userId))
      return errorResponse(c, 403, 'FORBIDDEN', 'Document belongs to another user')
    if (doc.flow !== 'master' && doc.flow !== 'trainer')
      return errorResponse(
        c,
        400,
        'FLOW_NOT_SUPPORTED',
        'Only master/trainer SKKNI selection is supported',
      )

    const parsed = selectUnitSchema.safeParse(await c.req.json())
    if (!parsed.success)
      return errorResponse(
        c,
        400,
        'VALIDATION_ERROR',
        parsed.error.issues.map((issue) => issue.message).join('; '),
      )

    const unit = await skkni.getUnitDetail(parsed.data.unitCode)
    const competencyMap = await skkni.getCompetencyMap(parsed.data.unitCode)

    await fieldStates.upsert({
      documentId: doc.id,
      flow: doc.flow as 'master' | 'trainer',
      phaseKey: 'unit_selection',
      fieldKey: 'selected_unit_code',
      value: unit.code,
      status: 'confirmed',
      source: 'user_confirmed',
    })
    await fieldStates.upsert({
      documentId: doc.id,
      flow: doc.flow as 'master' | 'trainer',
      phaseKey: 'unit_selection',
      fieldKey: 'selected_unit_title',
      value: unit.name,
      status: 'confirmed',
      source: 'user_confirmed',
    })
    await fieldStates.upsert({
      documentId: doc.id,
      flow: doc.flow as 'master' | 'trainer',
      phaseKey: 'unit_selection',
      fieldKey: 'unit_detail',
      value: unit,
      status: 'confirmed',
      source: 'imported',
    })
    await fieldStates.upsert({
      documentId: doc.id,
      flow: doc.flow as 'master' | 'trainer',
      phaseKey: 'competency_map',
      fieldKey: 'skkni_map',
      value: competencyMap,
      status: 'confirmed',
      source: 'imported',
    })

    const flow = doc.flow as 'master' | 'trainer'
    const states = (await fieldStates.list(doc.id, flow)) as FieldStateSnapshot[]
    const readiness =
      flow === 'master' ? buildMasterReadiness(states) : buildTrainerReadiness(states)
    const currentPhase =
      flow === 'master' ? getNextMasterPhase(states) : getNextTrainerPhase(states)
    const masterJson = flow === 'master' ? compileMasterJson(states) : compileTrainerJson(states)
    await documents.updateInterviewState(doc.id, { masterJson, readiness, currentPhase })

    return c.json({ unit, competencyMap, readiness, phase: currentPhase })
  })

  return app
}
