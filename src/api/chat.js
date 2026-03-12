import api from './axios'

export const getSessions = (page = 1, limit = 20) =>
  api.get('/api/chat/sessions', { params: { page, limit } })

export const getMessages = (sessionId) =>
  api.get(`/api/chat/sessions/${sessionId}/messages`)

export const closeSession = (sessionId) =>
  api.patch(`/api/chat/sessions/${sessionId}/close`)

export const reopenSession = (sessionId) =>
  api.patch(`/api/chat/sessions/${sessionId}/reopen`)

export const uploadImage = (file) => {
  const formData = new FormData()
  formData.append('image', file)
  return api.post('/api/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
