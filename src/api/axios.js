import axios from 'axios'

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

    // If we get a 401 and haven't already tried refreshing, attempt a token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem('agent_refresh_token')
    ) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('agent_refresh_token')
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh`,
          { refreshToken }
        )

        if (res.data?.success && res.data?.token) {
          const newToken = res.data.token
          localStorage.setItem('agent_token', newToken)
          originalRequest.headers.Authorization = `Bearer ${newToken}`
          return api(originalRequest)
        }
      } catch {
        // Refresh failed — force logout
      }
    }

    // If refresh also failed or no refresh token, clear everything and redirect
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
