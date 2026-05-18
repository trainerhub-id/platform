import { describe, expect, it, vi } from 'vitest'
import { CertificateService } from './certificate.service'

describe('CertificateService', () => {
  it('listForWorkspace returns certificates filtered by workspace', async () => {
    const rows = [
      { id: 'c1', workspaceId: 'ws_1', type: 'trainerhub', status: 'issued', fileUrl: null },
    ]
    const repository = {
      findByWorkspace: vi.fn().mockResolvedValue(rows),
    }
    const storage = { getPublicUrl: vi.fn().mockResolvedValue('https://cdn.example.com/cert.pdf') }
    const service = new CertificateService({ repository: repository as any, storage: storage as any })

    const result = await service.listForWorkspace('ws_1')

    expect(repository.findByWorkspace).toHaveBeenCalledWith('ws_1')
    expect(result).toHaveLength(1)
    expect(result[0]?.id).toBe('c1')
  })
})
