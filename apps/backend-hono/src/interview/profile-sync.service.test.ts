import { describe, expect, it } from 'vitest'
import type { FieldStateSnapshot } from './field-state.types'
import { buildMasterProfilePatchFromStates } from './profile-sync.service'

const confirmed = (phaseKey: string, fieldKey: string, value: unknown): FieldStateSnapshot => ({
  flow: 'master',
  phaseKey,
  fieldKey,
  status: 'confirmed',
  value,
})

describe('buildMasterProfilePatchFromStates', () => {
  it('maps profile and selected unit fields', () => {
    const patch = buildMasterProfilePatchFromStates([
      confirmed('profile', 'organization_name', 'PT Maju Jaya'),
      confirmed('profile', 'trainer_name', 'Budi'),
      confirmed('unit_selection', 'selected_unit_code', 'M.70MKT00.001.1'),
      confirmed('unit_selection', 'selected_unit_title', 'Mengelola Kampanye Digital'),
      confirmed('competency_map', 'skkni_map', { main_goal: 'Goal' }),
      confirmed('unit_selection', 'unit_detail', { elements: [1] }),
    ])

    expect(patch.organizationName).toBe('PT Maju Jaya')
    expect(patch.trainerName).toBe('Budi')
    expect(patch.selectedUnitCode).toBe('M.70MKT00.001.1')
    expect(patch.selectedUnitTitle).toBe('Mengelola Kampanye Digital')
    expect(patch.skkniMapReady).toBe(true)
    expect(patch.unitDetailReady).toBe(true)
  })

  it('does not sync pending suggestions as final values', () => {
    const patch = buildMasterProfilePatchFromStates([
      {
        flow: 'master',
        phaseKey: 'profile',
        fieldKey: 'program_name',
        status: 'pending_confirmation',
        value: 'Pelatihan Belum Final',
      },
    ])

    expect(patch.programName).toBeUndefined()
  })
})
