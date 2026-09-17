const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    ...options.headers,
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'API request failed';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || JSON.stringify(errJson);
    } catch {
      errorDetail = `Status ${response.status}: ${response.statusText}`;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Health & Stats
  getHealth: () => request('/health'),
  getStatistics: () => request('/statistics'),
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Ask Archive (RAG)
  askArchive: (data) => request('/ask', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Search Archive
  searchArchive: (data) => request('/search', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Documents
  getDocuments: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';
    return request(`/documents${queryString}`);
  },
  getDocument: (id) => request(`/documents/${id}`),
  getDocumentChunks: (id) => request(`/documents/${id}/chunks`),
  deleteDocument: (id) => request(`/documents/${id}`, { method: 'DELETE' }),
  reindexDocuments: () => request('/documents/reindex', { method: 'POST' }),

  uploadDocument: (formData) => request('/documents/upload', {
    method: 'POST',
    body: formData,
  }),

  // Sources & Surrounding Context
  getSource: (chunkId) => request(`/sources/${chunkId}`),

  // Research & Stories
  createResearch: (data) => request('/research', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  getStories: () => request('/stories'),
  getStory: (id) => request(`/stories/${id}`),

  // Timeline
  generateTimeline: (data) => request('/timeline', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Entity Research
  researchEntity: (name) => request(`/entity/research?name=${encodeURIComponent(name)}`),
};

export default api;
