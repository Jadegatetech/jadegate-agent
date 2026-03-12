import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function InboxIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

function PersonIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export default function ProtectedLayout() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  if (!token) return <Navigate to="/login" replace />

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen min-h-dvh">
      <main className="flex-1 pb-[calc(4rem+env(safe-area-inset-bottom))] overflow-auto">
        <Outlet />
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 bg-jade-900 border-t border-jade-700/20 flex items-center"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <NavLink
          to="/sessions"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              isActive ? 'text-jade-400' : 'text-jade-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <InboxIcon active={isActive} />
              Sessions
            </>
          )}
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              isActive ? 'text-jade-400' : 'text-jade-700'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <PersonIcon active={isActive} />
              Profile
            </>
          )}
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-[10px] font-semibold uppercase tracking-wider text-jade-700 hover:text-jade-warm/80 transition-colors"
        >
          <LogoutIcon />
          Log out
        </button>
      </nav>
    </div>
  )
}
