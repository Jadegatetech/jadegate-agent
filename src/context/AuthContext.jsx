import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { setTokenRefreshCallback } from '../api/axios'

const AuthContext = createContext(null)

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

  // Called by axios interceptor after a silent token refresh so that any
  // socket useEffect that depends on `token` will reconnect automatically.
  const updateToken = useCallback((newToken) => {
    localStorage.setItem('agent_token', newToken)
    setToken(newToken)
  }, [])

  useEffect(() => {
    setTokenRefreshCallback(updateToken)
    return () => setTokenRefreshCallback(null)
  }, [updateToken])

  return (
    <AuthContext.Provider value={{ user, token, sessionId, login, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
