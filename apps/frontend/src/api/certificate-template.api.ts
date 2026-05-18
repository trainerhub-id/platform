import api from './axios'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface TemplateInfo {
  hasCustomTemplate: boolean
  id?: string
  name?: string
  createdAt?: string
}

export interface UploadTemplateRequest {
  name: string
  htmlContent: string
}

export interface UploadTemplateResponse {
  id: string
  name: string
  isActive: boolean
  createdAt: string
}

export const certificateTemplateApi = {
  validateTemplate: async (htmlContent: string): Promise<ValidationResult> => {
    const response = await api.post('/certificate-templates/validate', {
      htmlContent,
    })
    return response.data
  },

  previewTemplate: async (htmlContent: string): Promise<Blob> => {
    const response = await api.post(
      '/certificate-templates/preview',
      {
        htmlContent,
      },
      {
        responseType: 'blob',
      },
    )
    return response.data
  },

  uploadTemplate: async (data: UploadTemplateRequest): Promise<UploadTemplateResponse> => {
    const response = await api.post('/certificate-templates/upload', data)
    return response.data
  },

  getActiveTemplate: async (): Promise<TemplateInfo> => {
    const response = await api.get('/certificate-templates/active')
    return response.data
  },

  resetToDefault: async (): Promise<void> => {
    await api.post('/certificate-templates/reset')
  },

  downloadTemplate: async (id: string): Promise<Blob> => {
    const response = await api.get(`/certificate-templates/${id}/download`, {
      responseType: 'blob',
    })
    return response.data
  },
}
