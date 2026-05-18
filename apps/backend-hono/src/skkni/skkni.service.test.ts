import { describe, expect, it } from 'vitest'
import {
  buildMasterSkkniContext,
  buildSkkniContext,
  normalizeCompetencyMap,
  normalizeUnitDetail,
  transformSemanticSearch,
} from './skkni.service'

describe('skkni service helpers', () => {
  it('builds Master SKKNI semantic context from master json', () => {
    const context = buildMasterSkkniContext({
      brainstorming_master: {
        organization_focus: 'Digital Marketing',
        program_goal: 'Meningkatkan penjualan',
        target_participants: 'Owner UMKM',
        industry_problem: 'Iklan boros',
        program_name: 'Pelatihan Digital Marketing UMKM',
      },
    })

    expect(context.expertise).toBe('Digital Marketing')
    expect(context.audience).toBe('Owner UMKM')
    expect(context.domain_hint).toBe('Pelatihan Digital Marketing UMKM')
  })

  it('transforms semantic search results to candidates', () => {
    const result = transformSemanticSearch({
      results: [
        {
          rank: 1,
          unit_code: 'M.70MKT00.001.1',
          unit_title: 'Mengelola Kampanye Digital',
          score: 0.91,
          confidence: 'high',
        },
      ],
    })

    expect(result[0]).toMatchObject({
      unitCode: 'M.70MKT00.001.1',
      title: 'Mengelola Kampanye Digital',
      relevanceScore: 0.91,
    })
  })

  it('normalizes unit detail into master_json unit shape', () => {
    const unit = normalizeUnitDetail({
      unit_code: 'M.70MKT00.001.1',
      unit_title: 'Mengelola Kampanye Digital',
      unit_description: 'Unit pemasaran digital',
      competency_elements: [
        {
          element_number: 1,
          element_title: 'Menyiapkan kampanye',
          performance_criteria: [{ code: '1.1', description: 'Kebutuhan kampanye diidentifikasi' }],
        },
      ],
    })

    expect(unit.code).toBe('M.70MKT00.001.1')
    expect(unit.elements[0]?.kuk[0]?.kuk_text).toBe('Kebutuhan kampanye diidentifikasi')
  })

  it('normalizes competency map', () => {
    const map = normalizeCompetencyMap({
      tujuan_utama: 'Meningkatkan penjualan',
      fungsi_kunci: 'Pemasaran',
      fungsi_utama: 'Digital marketing',
      sub_fungsi_utama: 'Kampanye digital',
    })

    expect(map.main_goal).toBe('Meningkatkan penjualan')
    expect(map.basic_function).toBe('Kampanye digital')
  })

  it('builds Trainer SKKNI semantic context from trainer json', () => {
    const context = buildSkkniContext({
      schema_key: 'hono_trainer_alpha_v1',
      brainstorming: {
        trainer_name: 'Ujang Abdus Salam',
        institution: 'Mandiri',
        expertise: 'Marketing',
        audience: 'UMKM yang mau naik kelas',
        outcome: 'UMKM bisa membuat strategi pemasaran sendiri',
      },
    })

    expect(context).toEqual({
      expertise: 'Marketing',
      activities: 'UMKM bisa membuat strategi pemasaran sendiri',
      audience: 'UMKM yang mau naik kelas',
      outcome: 'UMKM bisa membuat strategi pemasaran sendiri',
      domain_hint: 'Marketing',
      inferred_goal_label: 'UMKM bisa membuat strategi pemasaran sendiri',
    })
  })

  it('limits semantic candidates to 10 results', () => {
    const response = {
      results: Array.from({ length: 12 }, (_, index) => ({
        rank: index + 1,
        unit_code: `CODE.${index + 1}`,
        unit_title: `Unit ${index + 1}`,
        score: 1 - index * 0.01,
      })),
    }

    expect(transformSemanticSearch(response)).toHaveLength(10)
  })
})
