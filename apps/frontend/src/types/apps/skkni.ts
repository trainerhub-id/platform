export interface SkkniUnit {
  id: string
  documentId: string
  code: string
  title: string
  availability: 'applied' | 'cancelled'
}

export interface SkkniDocument {
  id: string
  title: string
  number: string
  sector: string
  availability: 'applied' | 'cancelled'
  notes: string | null
  publishedAt: string
  unitCount: number
  units: SkkniUnit[]
}

export interface SkkniSearchResponse {
  documents: SkkniDocument[]
  pagination: {
    currentPage: number
    totalPages: number
    total: number
    perPage: number
  }
}

export interface SkkniConfirmationData {
  id: string
  documentId: string
  documentTitle: string
  documentNumber: string
  sector: string
  unitId: string
  unitCode: string
  unitTitle: string
  unitAvailability: 'applied' | 'cancelled'
}

export interface SkkniConfirmationResult {
  confirmed: boolean
  selectionData?: SkkniConfirmationData
}
