import { describe, expect, it } from 'vitest'
import type { FieldStateSnapshot } from './field-state.types'
import { getNextMasterPhase, getNextTrainerPhase } from './phase-router'
import { completeTrainerStates } from './trainer/trainer-readiness.test'

const confirmed = (phaseKey: string, fieldKey: string, value: unknown): FieldStateSnapshot => ({
  flow: 'master',
  phaseKey,
  fieldKey,
  status: 'confirmed',
  value,
})

const completeProfile = (): FieldStateSnapshot[] => [
  confirmed('profile', 'organization_name', 'PT Maju Jaya'),
  confirmed('profile', 'trainer_name', 'Budi'),
  confirmed('profile', 'organization_city', 'Bekasi'),
  confirmed('profile', 'organization_focus', 'Digital Marketing'),
  confirmed('profile', 'program_name', 'Pelatihan Digital Marketing'),
  confirmed('profile', 'program_goal', 'Meningkatkan penjualan'),
  confirmed('profile', 'target_participants', 'Owner UMKM'),
  confirmed('profile', 'industry_problem', 'Iklan boros'),
  confirmed('profile', 'training_location', 'Bekasi'),
  confirmed('profile', 'training_duration', '2 hari'),
]

describe('getNextMasterPhase', () => {
  it('starts at profile', () => {
    expect(getNextMasterPhase([])).toBe('profile')
  })

  it('moves Master to unit selection after only core profile fields are complete', () => {
    const states: FieldStateSnapshot[] = [
      confirmed('profile', 'trainer_name', 'Budi Santoso'),
      confirmed('profile', 'organization_name', 'PT LSP'),
      confirmed('profile', 'organization_focus', 'Digital Marketing'),
      confirmed('profile', 'target_participants', 'Owner UMKM'),
      confirmed('profile', 'industry_problem', 'Iklan boros tapi hasil minim'),
      confirmed('profile', 'program_goal', 'Meningkatkan penjualan UMKM melalui strategi digital'),
      confirmed('profile', 'training_location', 'Bekasi'),
      confirmed('profile', 'training_duration', '2 hari'),
    ]

    expect(getNextMasterPhase(states)).toBe('unit_selection')
  })

  it('moves to unit selection after profile fields', () => {
    expect(getNextMasterPhase(completeProfile())).toBe('unit_selection')
  })

  it('moves to competency map after unit selection and detail', () => {
    const states = [
      ...completeProfile(),
      confirmed('unit_selection', 'selected_unit_code', 'M.70MKT00.001.1'),
      confirmed('unit_selection', 'unit_detail', { elements: [1] }),
    ]

    expect(getNextMasterPhase(states)).toBe('competency_map')
  })
})

describe('getNextTrainerPhase', () => {
  it('starts at brainstorming', () => {
    expect(getNextTrainerPhase([])).toBe('brainstorming')
  })

  it('moves Trainer to unit selection before generated training details exist', () => {
    const states: FieldStateSnapshot[] = [
      confirmed('brainstorming', 'trainer_name', 'Ujang Abdus Salam'),
      confirmed('brainstorming', 'institution', 'Mandiri'),
      confirmed('brainstorming', 'expertise', 'Marketing'),
      confirmed('brainstorming', 'audience', 'UMKM yang mau naik kelas'),
      confirmed('brainstorming', 'outcome', 'UMKM bisa membuat strategi pemasaran sendiri'),
    ]

    expect(getNextTrainerPhase(states)).toBe('unit_selection')
  })

  it('moves to unit selection after brainstorming', () => {
    const states = completeTrainerStates().filter((state) => state.phaseKey === 'brainstorming')
    expect(getNextTrainerPhase(states)).toBe('unit_selection')
  })

  it('moves to generation ready after SKKNI and competency map', () => {
    const states = completeTrainerStates().filter((state) => state.phaseKey !== 'training_details')
    expect(getNextTrainerPhase(states)).toBe('generation_ready')
  })

  it('is generation ready when all required Trainer fields are complete', () => {
    expect(getNextTrainerPhase(completeTrainerStates())).toBe('generation_ready')
  })
})
