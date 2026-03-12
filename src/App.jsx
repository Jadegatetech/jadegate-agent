import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import ProtectedLayout from './layouts/ProtectedLayout'
import Login from './pages/Login'
import Sessions from './pages/Sessions'
import Chat from './pages/Chat'
import Profile from './pages/Profile'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#193133',
                color: '#FEFCF7',
                border: '1px solid rgba(67,136,142,0.2)',
                borderRadius: '12px',
                fontFamily: 'Manrope, sans-serif',
                fontSize: '14px',
              },
              success: {
                iconTheme: { primary: '#27EAAF', secondary: '#062022' },
              },
              error: {
                iconTheme: { primary: '#f87171', secondary: '#062022' },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedLayout />}>
              <Route path="/sessions" element={<Sessions />} />
              <Route path="/sessions/:id" element={<Chat />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<Navigate to="/sessions" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/sessions" replace />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
