import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { loginRequest } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

function JadegateLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="size-9 rounded-xl bg-jade-400 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.5C16.5 22.15 20 17.25 20 12V6l-8-4z"
            fill="#062022"
          />
          <path
            d="M9 12l2 2 4-4"
            stroke="#27EAAF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p className="text-jade-50 font-bold text-lg leading-tight tracking-tight">Jadegate</p>
        <p className="text-[10px] text-jade-700 font-semibold uppercase tracking-widest -mt-0.5">Agent Portal</p>
      </div>
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please enter your email and password')
      return
    }

    setLoading(true)
    try {
      const res = await loginRequest(email, password)
      const { accessToken, user } = res.data.data

      if (user.role !== 'agent') {
        toast.error('This portal is for agents only')
        return
      }

      login(user, accessToken)
      navigate('/sessions', { replace: true })
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Login failed. Please try again.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-dvh bg-jade-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <JadegateLogo />
        </div>

        {/* Card */}
        <div className="bg-jade-800 rounded-2xl border border-jade-700/20 p-6 shadow-xl">
          <h1 className="text-xl font-bold text-jade-50 mb-1">Welcome back</h1>
          <p className="text-sm text-jade-warm/60 mb-6">Sign in to your agent account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="agent@jadegate.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              className="w-full mt-2 py-3"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-jade-700/50 mt-6">
          Jadegate Agent Portal · Authorized access only
        </p>
      </div>
    </div>
  )
}
