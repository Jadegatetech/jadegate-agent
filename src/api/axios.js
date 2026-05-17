import axios from 'axios'

// AuthContext registers this so the socket can reconnect after a silent token refresh
let tokenRefreshCallback = null
export const setTokenRefreshCallback = (cb) => { tokenRefreshCallback = cb }

export const isServiceUnavailableError = (error) => error?.response?.status === 503

export const SERVICE_UNAVAILABLE_MESSAGE =
  'Service temporarily unavailable. Please try again.'

const getAuthValue = (payload, keys) => {
  for (const source of [payload, payload?.data]) {
    for (const key of keys) {
      if (source?.[key]) return source[key]
    }
  }
  return null
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agent_token')
  const sessionId = localStorage.getItem('agent_session_id')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (sessionId) {
    config.headers['x-session-id'] = sessionId
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    const refreshToken = localStorage.getItem('agent_refresh_token')
    const sessionId = localStorage.getItem('agent_session_id')

    if (error.response?.status === 503) {
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
      originalRequest._retry = true

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          { refreshToken, sessionId },
          sessionId ? { headers: { 'x-session-id': sessionId } } : undefined
        )

        const newToken = getAuthValue(res.data, ['token', 'accessToken'])
        const newRefreshToken = getAuthValue(res.data, ['refreshToken'])
        const newSessionId = getAuthValue(res.data, ['sessionId'])

        if (res.data?.success && newToken) {
          localStorage.setItem('agent_token', newToken)
          if (newRefreshToken) localStorage.setItem('agent_refresh_token', newRefreshToken)
          if (newSessionId) localStorage.setItem('agent_session_id', newSessionId)
          // Notify AuthContext so token state updates and socket useEffect re-fires
          tokenRefreshCallback?.({ token: newToken, refreshToken: newRefreshToken, sessionId: newSessionId })
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          if (newSessionId || sessionId) {
            originalRequest.headers['x-session-id'] = newSessionId || sessionId
          }
          return api(originalRequest)
        }
      } catch (refreshError) {
        if (refreshError.response?.status === 503) {
          return Promise.reject(refreshError)
        }
        // Refresh failed — fall through to logout
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('agent_token')
      localStorage.removeItem('agent_user')
      localStorage.removeItem('agent_refresh_token')
      localStorage.removeItem('agent_session_id')
      window.location.href = '/login'
    }

    return Promise.reject(error)
  }
)

export default api
