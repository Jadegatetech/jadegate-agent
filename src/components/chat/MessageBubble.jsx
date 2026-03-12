import Avatar from '../ui/Avatar'

function formatTime(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, isOwn }) {
  const { text, imageUrl, sender, createdAt } = message

  if (isOwn) {
    return (
      <div className="flex justify-end mb-3 px-4">
        <div className="max-w-[75%]">
          <div className="bg-jade-400/15 rounded-2xl rounded-tr-sm px-4 py-2.5">
            {text && <p className="text-jade-50 text-sm leading-relaxed">{text}</p>}
            {imageUrl && (
              <img
                src={imageUrl}
                alt="sent"
                className="max-w-[240px] rounded-lg mt-1"
              />
            )}
          </div>
          <p className="text-[10px] text-jade-700/50 mt-1 text-right">{formatTime(createdAt)}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-end gap-2 mb-3 px-4">
      <Avatar
        src={sender?.profilePicture}
        name={sender?.fullName || sender?.username}
        size="sm"
        className="flex-shrink-0 mb-4"
      />
      <div className="max-w-[75%]">
        <p className="text-[11px] font-semibold text-jade-700 mb-1 ml-1">
          {sender?.fullName || sender?.username}
        </p>
        <div className="bg-jade-800 rounded-2xl rounded-tl-sm px-4 py-2.5">
          {text && <p className="text-jade-50 text-sm leading-relaxed">{text}</p>}
          {imageUrl && (
            <img
              src={imageUrl}
              alt="received"
              className="max-w-[240px] rounded-lg mt-1"
            />
          )}
        </div>
        <p className="text-[10px] text-jade-700/50 mt-1 ml-1">{formatTime(createdAt)}</p>
      </div>
    </div>
  )
}
