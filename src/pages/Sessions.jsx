import { useQuery } from '@tanstack/react-query'
import { getSessions } from '../api/chat'
import SessionCard from '../components/chat/SessionCard'
import { SkeletonSessionCard } from '../components/ui/Skeleton'

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
  const { data, isLoading, isError } = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const res = await getSessions(1, 20)
      return res.data?.data || res.data?.sessions || res.data || []
    },
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  })

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
        <div className="flex items-center justify-center py-16">
          <p className="text-jade-warm/60 text-sm">Failed to load sessions</p>
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
