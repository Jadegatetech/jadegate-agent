import { useState, useCallback, useEffect } from 'react'
import { setTokenRefreshCallback } from '../api/axios'
import AuthContext from './auth-context'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('agent_token'))
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('agent_session_id'))
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('agent_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback((userData, accessToken, refreshToken, newSessionId) => {
    localStorage.setItem('agent_token', accessToken)
    localStorage.setItem('agent_user', JSON.stringify(userData))
    if (refreshToken) localStorage.setItem('agent_refresh_token', refreshToken)
    if (newSessionId) {
      localStorage.setItem('agent_session_id', newSessionId)
      setSessionId(newSessionId)
    }
    setToken(accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('agent_token')
    localStorage.removeItem('agent_user')
    localStorage.removeItem('agent_refresh_token')
    localStorage.removeItem('agent_session_id')
    setToken(null)
    setUser(null)
    setSessionId(null)
  }, [])

  // Called by axios interceptor after a silent token refresh so sockets
  // reconnect with the latest access token and session state.
  const updateAuthSession = useCallback(({ token: newToken, refreshToken, sessionId: newSessionId }) => {
    if (newToken) {
      localStorage.setItem('agent_token', newToken)
      setToken(newToken)
    }
    if (refreshToken) {
      localStorage.setItem('agent_refresh_token', refreshToken)
    }
    if (newSessionId) {
      localStorage.setItem('agent_session_id', newSessionId)
      setSessionId(newSessionId)
    }
  }, [])

  useEffect(() => {
    setTokenRefreshCallback(updateAuthSession)
    return () => setTokenRefreshCallback(null)
  }, [updateAuthSession])

  return (
    <AuthContext.Provider value={{ user, token, sessionId, login, logout, updateAuthSession }}>
      {children}
    </AuthContext.Provider>
  )
}
