import api from './axios'

export const loginRequest = (email, password) =>
  api.post('/api/auth/login', { email, password })
