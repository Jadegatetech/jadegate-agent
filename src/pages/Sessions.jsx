import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { getSessions } from '../api/chat'
import { isServiceUnavailableError, SERVICE_UNAVAILABLE_MESSAGE } from '../api/axios'
import { useAuth } from '../context/useAuth'
import SessionCard from '../components/chat/SessionCard'
import { SkeletonSessionCard } from '../components/ui/Skeleton'
import Button from '../components/ui/Button'

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="size-16 rounded-2xl bg-jade-800 border border-jade-700/20 flex items-center justify-center mb-4">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#43888E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="text-jade-50 font-semibold mb-1">No conversations yet</p>
      <p className="text-sm text-jade-warm/50">New sessions assigned to you will appear here</p>
    </div>
  )
}

export default function Sessions() {
  const { token, sessionId: authSessionId } = useAuth()
  const queryClient = useQueryClient()

  const { data, error, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await getSessions(1, 20)
      return res.data?.data || res.data?.sessions || res.data || []
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })

  // Live session list updates via socket
  useEffect(() => {
    if (!token) return

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token, sessionId: authSessionId },
      transports: ['websocket', 'polling'],
    })

    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ['sessions'] })

    socket.on('unread_count_updated', invalidate)
    socket.on('chat_sessions_updated', invalidate)
    socket.on('session_status', invalidate)
    socket.on('session_reassigned', invalidate)
    socket.on('removed_from_session', invalidate)

    return () => {
      socket.disconnect()
    }
  }, [token, authSessionId, queryClient])

  const serviceUnavailable = isServiceUnavailableError(error)

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <h1 className="text-xl font-bold text-jade-50">Conversations</h1>
        <p className="text-sm text-jade-warm/50 mt-0.5">Your active sessions</p>
      </div>

      {/* Divider */}
      <div className="border-b border-jade-700/15" />

      {/* Content */}
      {isLoading && (
        <div className="divide-y divide-jade-700/10">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonSessionCard key={i} />
          ))}
        </div>
      )}

      {isError && (
        <div className="flex flex-col items-center justify-center gap-3 py-16 px-4 text-center">
          <p className="text-jade-warm/60 text-sm">
            {serviceUnavailable ? SERVICE_UNAVAILABLE_MESSAGE : 'Failed to load sessions'}
          </p>
          {serviceUnavailable && (
            <Button
              variant="ghost"
              loading={isFetching}
              onClick={() => refetch()}
              className="text-xs"
            >
              Retry
            </Button>
          )}
        </div>
      )}

      {!isLoading && !isError && data?.length === 0 && <EmptyState />}

      {!isLoading && !isError && data?.length > 0 && (
        <div className="divide-y divide-jade-700/10">
          {data.map((session) => (
            <SessionCard key={session._id} session={session} />
          ))}
        </div>
      )}
    </div>
  )
}
