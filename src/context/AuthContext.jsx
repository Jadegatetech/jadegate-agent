import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('agent_token'))
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('agent_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback((userData, accessToken, refreshToken, sessionId) => {
    localStorage.setItem('agent_token', accessToken)
    localStorage.setItem('agent_user', JSON.stringify(userData))
    if (refreshToken) localStorage.setItem('agent_refresh_token', refreshToken)
    if (sessionId) localStorage.setItem('agent_session_id', sessionId)
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
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
