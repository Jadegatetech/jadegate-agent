import { useQuery } from '@tanstack/react-query'
import { getAgents } from '../api/agents'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/ui/Avatar'
import Badge from '../components/ui/Badge'
import { SkeletonBlock } from '../components/ui/Skeleton'

function ProfileSkeleton() {
  return (
    <div className="px-4 py-6 space-y-6 animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <SkeletonBlock className="size-24 rounded-full" />
        <SkeletonBlock className="h-5 w-36 rounded" />
        <SkeletonBlock className="h-3.5 w-24 rounded" />
      </div>
      <div className="bg-jade-800 rounded-2xl p-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonBlock className="size-4 rounded" />
            <SkeletonBlock className="h-3.5 flex-1 max-w-[60%] rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3">
      <span className="text-jade-700 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-jade-700/60 mb-0.5">
          {label}
        </p>
        <p className="text-sm text-jade-50 break-words">{value}</p>
      </div>
    </div>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  )
}

function LocationIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function BioIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" />
      <line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" />
      <line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

export default function Profile() {
  const { user } = useAuth()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['agent-profile', user?._id],
    queryFn: async () => {
      const res = await getAgents()
      const agents = res.data?.data || res.data || []
      return agents.find((a) => a.user?._id === user?._id || a.user === user?._id) || null
    },
    enabled: !!user?._id,
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return <ProfileSkeleton />

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-jade-warm/60 text-sm">Failed to load profile</p>
      </div>
    )
  }

  const profile = data
  const displayName = profile?.user?.fullName || user?.fullName || 'Agent'
  const username = profile?.user?.username || user?.username
  const email = profile?.user?.email || user?.email
  const profilePicture = profile?.profilePicture || profile?.user?.profilePicture
  const location = profile?.location
  const bio = profile?.bio
  const expertise = profile?.expertise || []
  const isVerified = profile?.isVerified

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative mb-3">
          <Avatar src={profilePicture} name={displayName} size="xl" />
          {isVerified && (
            <div className="absolute bottom-0 right-0 size-7 bg-jade-400 rounded-full flex items-center justify-center border-2 border-jade-900">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#062022" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-jade-50">{displayName}</h1>
          {isVerified && <Badge variant="verified">Verified</Badge>}
        </div>

        {username && (
          <p className="text-sm text-jade-700 mb-1">@{username}</p>
        )}
      </div>

      {/* Info card */}
      <div className="bg-jade-800 rounded-2xl border border-jade-700/20 p-5 space-y-4">
        <InfoRow icon={<MailIcon />} label="Email" value={email} />
        <InfoRow icon={<LocationIcon />} label="Location" value={location} />
        {bio && (
          <div className="flex items-start gap-3">
            <span className="text-jade-700 mt-0.5 flex-shrink-0"><BioIcon /></span>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-jade-700/60 mb-0.5">
                Bio
              </p>
              <p className="text-sm text-jade-50 leading-relaxed">{bio}</p>
            </div>
          </div>
        )}
      </div>

      {/* Expertise tags */}
      {expertise.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-jade-700/60 mb-2.5">
            Expertise
          </p>
          <div className="flex flex-wrap gap-2">
            {expertise.map((tag) => (
              <span
                key={tag}
                className="bg-jade-400/10 text-jade-400 rounded-full px-2.5 py-0.5 text-xs font-medium border border-jade-400/20"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
