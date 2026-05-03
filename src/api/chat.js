import api from './axios'

export const getSessions = (page = 1, limit = 20) =>
  api.get('/api/chat/sessions', { params: { page, limit, type: 'marketplace' } })

export const getMessages = (sessionId, { limit = 20, before } = {}) => {
  const params = { limit }
  if (before) params.before = before
  return api.get(`/api/chat/sessions/${sessionId}/messages`, { params })
}

export const closeSession = (sessionId) =>
  api.patch(`/api/chat/sessions/${sessionId}/close`)

export const resolveSession = (sessionId) =>
  api.patch(`/api/chat/sessions/${sessionId}/resolve`)

export const reopenSession = (sessionId) =>
  api.patch(`/api/chat/sessions/${sessionId}/reopen`)

export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/api/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
