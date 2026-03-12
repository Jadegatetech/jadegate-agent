import { useNavigate } from 'react-router-dom'
import Avatar from '../ui/Avatar'
import Badge from '../ui/Badge'

function formatRelativeTime(dateStr) {
  if (!dateStr) return ''
  const now = new Date()
  const date = new Date(dateStr)
  const diff = Math.floor((now - date) / 1000)

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function SessionCard({ session }) {
  const navigate = useNavigate()
  const { _id, user, topic, status, lastMessageAt, unreadCount } = session

  const userName = user?.fullName || user?.username || 'Unknown User'
  const username = user?.username ? `@${user.username}` : ''

  return (
    <button
      onClick={() => navigate(`/sessions/${_id}`)}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-jade-800/50 active:bg-jade-800 transition-colors text-left"
    >
      <div className="relative flex-shrink-0">
        <Avatar src={user?.profilePicture} name={userName} size="md" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 bg-jade-400 rounded-full flex items-center justify-center text-[9px] font-bold text-jade-900">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="font-semibold text-sm text-jade-50 truncate">{userName}</span>
          <span className="text-[11px] text-jade-700/60 flex-shrink-0">
            {formatRelativeTime(lastMessageAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {username && (
            <span className="text-[11px] text-jade-700/60 truncate">{username}</span>
          )}
          <span className="text-[11px] text-jade-warm/50 truncate flex-1">
            {topic || 'General Inquiry'}
          </span>
        </div>
      </div>

      <Badge variant={status === 'open' ? 'open' : 'closed'} className="flex-shrink-0 ml-1">
        {status === 'open' ? 'Open' : 'Closed'}
      </Badge>
    </button>
  )
}
