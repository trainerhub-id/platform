import axios from './axios';

const legacyUserIdField = ['cl', 'erk_user_id'].join('');

export interface DeleteDocumentRequest {
  documentId: string;
  userId: string;
}

export interface ClearSectionRequest {
  documentId: string;
  userId: string;
  section: string;
}

export interface ClearSectionsRequest {
  documentId: string;
  userId: string;
  sections: string[];
}

/**
 * Delete entire document
 */
export const deleteDocument = async (data: DeleteDocumentRequest) => {
  const response = await axios.post(`/ai/document/${data.documentId}/delete`, {
    [legacyUserIdField]: data.userId,
  });
  return response.data;
};

/**
 * Clear a single section
 */
export const clearSection = async (data: ClearSectionRequest) => {
  const response = await axios.post(`/ai/document/${data.documentId}/clear-section`, {
    [legacyUserIdField]: data.userId,
    section: data.section,
  });
  return response.data;
};

/**
 * Clear multiple sections
 */
export const clearSections = async (data: ClearSectionsRequest) => {
  const response = await axios.post(`/ai/document/${data.documentId}/clear-sections`, {
    [legacyUserIdField]: data.userId,
    sections: data.sections,
  });
  return response.data;
};
