import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { getMessages, closeSession, resolveSession, reopenSession, uploadImage } from '../api/chat'
import { isServiceUnavailableError, SERVICE_UNAVAILABLE_MESSAGE } from '../api/axios'
import { useAuth } from '../context/useAuth'
import MessageBubble from '../components/chat/MessageBubble'
import ChatInput from '../components/chat/ChatInput'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import { SkeletonBlock } from '../components/ui/Skeleton'

function displayName(user) {
  const full = [user?.firstName, user?.lastName].filter(Boolean).join(' ')
  return full || user?.username || user?.email || 'User'
}

const CHAT_ERROR_MESSAGES = {
  SESSION_REQUIRED: 'Session expired. Please log in again.',
  CLIENT_MESSAGE_ID_REQUIRED: 'Message ID missing. Please try again.',
  SESSION_CLOSED: 'This conversation is closed and cannot receive new messages.',
  UNAUTHORIZED_CHAT_ACCESS: 'You are not authorized to access this conversation.',
  INVALID_ATTACHMENT_URL: 'Invalid attachment. Please upload the image again.',
  ATTACHMENT_NOT_OWNED: 'This attachment belongs to another user.',
  ATTACHMENT_ALREADY_USED: 'This image has already been sent.',
  MESSAGE_NOT_FOUND: 'Message not found.',
  RATE_LIMITED: 'Too many messages. Please slow down.',
  CHAT_NOT_FOUND: 'Chat session not found.',
  AUTH_REQUIRED: 'Authentication required. Please log in again.',
  SESSION_EXPIRED: 'Your session has expired. Please log in again.',
  INVALID_SESSION_ID: 'Invalid session. Please go back and try again.',
  EMPTY_MESSAGE: 'Message cannot be empty.',
}

const AUTH_ERROR_CODES = ['SESSION_REQUIRED', 'AUTH_REQUIRED', 'SESSION_EXPIRED', 'INVALID_TOKEN']

// open and pending allow messaging; resolved and closed do not
const MESSAGE_ALLOWED = new Set(['open', 'pending'])

// Reasons where socket.io will NOT auto-reconnect
const NO_RECONNECT_REASONS = new Set(['io server disconnect', 'io client disconnect'])

const STATUS_BADGE = { open: 'open', pending: 'pending', resolved: 'resolved', closed: 'closed' }
const STATUS_LABEL = { open: 'Open', pending: 'Pending', resolved: 'Resolved', closed: 'Closed' }

function clientId() {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function MessageSkeleton() {
  return (
    <div className="space-y-4 px-4 py-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'justify-end' : ''}`}>
          {i % 2 !== 0 && <SkeletonBlock className="size-8 rounded-full flex-shrink-0" />}
          <SkeletonBlock className={`h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-56'}`} />
        </div>
      ))}
    </div>
  )
}

// 'connecting' → gray   'live' → green   'reconnecting' → amber pulse   'offline' → red
function SocketStatusChip({ status }) {
  if (status === 'live') return null // silent when healthy

  const config = {
    connecting: { dot: 'bg-jade-700 animate-pulse', label: 'Connecting…', text: 'text-jade-700' },
    reconnecting: { dot: 'bg-amber-400 animate-pulse', label: 'Reconnecting…', text: 'text-amber-400' },
    offline: { dot: 'bg-red-400', label: 'Offline', text: 'text-red-400' },
  }[status] ?? { dot: 'bg-jade-700', label: '', text: 'text-jade-700' }

  return (
    <div className={`flex items-center gap-1 mt-0.5 ${config.text}`}>
      <span className={`size-1.5 rounded-full flex-shrink-0 ${config.dot}`} />
      <span className="text-[10px] font-medium">{config.label}</span>
    </div>
  )
}

export default function Chat() {
  const { id: sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token, sessionId: authSessionId } = useAuth()

  const navSession = location.state?.session

  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState(navSession?.status || 'open')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null) // 'close' | 'resolve' | 'reopen' | null
  const [uploadingImage, setUploadingImage] = useState(false)
  const [joined, setJoined] = useState(false)
  const [socketStatus, setSocketStatus] = useState('connecting') // 'connecting'|'live'|'reconnecting'|'offline'
  const [nextCursor, setNextCursor] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(null)
  const [retryIndex, setRetryIndex] = useState(0)

  const socketRef = useRef(null)
  const bottomRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const prevScrollHeightRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Load initial messages
  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(null)

    getMessages(sessionId, { limit: 20 })
      .then((res) => {
        if (cancelled) return
        const msgs = res.data?.messages || res.data?.data || []
        setMessages(Array.isArray(msgs) ? msgs : [])
        setNextCursor(res.data?.nextCursor ?? null)
        setHasMore(res.data?.hasMore ?? false)
      })
      .catch((err) => {
        if (cancelled) return
        const serviceUnavailable = isServiceUnavailableError(err)
        const msg = serviceUnavailable
          ? SERVICE_UNAVAILABLE_MESSAGE
          : err.response?.data?.message || 'Failed to load messages'
        setLoadError({ serviceUnavailable, message: msg })
        toast.error(msg)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [sessionId, retryIndex])

  // Socket connection — re-fires when token changes (e.g. after silent refresh)
  useEffect(() => {
    if (!token) return

    setSocketStatus('connecting')

    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token, sessionId: authSessionId },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    // ── Manager-level reconnect events ──────────────────────────────────────
    const onReconnectAttempt = () => setSocketStatus('reconnecting')
    const onReconnectFailed = () => setSocketStatus('offline')
    socket.io.on('reconnect_attempt', onReconnectAttempt)
    socket.io.on('reconnect_failed', onReconnectFailed)

    // ── Socket events ────────────────────────────────────────────────────────
    socket.on('connect', () => {
      setSocketStatus('live')
      socket.emit('join_chat', { sessionId })
    })

    socket.on('disconnect', (reason) => {
      setJoined(false)
      setSocketStatus(NO_RECONNECT_REASONS.has(reason) ? 'offline' : 'reconnecting')
    })

    socket.on('connect_error', (err) => {
      const code = err?.data?.code
      if (AUTH_ERROR_CODES.includes(code)) {
        toast.error('Connection failed. Please log in again.')
        navigate('/login', { replace: true })
      } else {
        setSocketStatus('reconnecting')
      }
    })

    socket.on('chat_joined', ({ sessionId: joinedId }) => {
      if (joinedId?.toString() === sessionId?.toString()) {
        setJoined(true)
      }
    })

    socket.on('message_sent', (message) => {
      setMessages((prev) => {
        const idx = prev.findIndex(
          (m) => m.clientMessageId && m.clientMessageId === message.clientMessageId
        )
        if (idx !== -1) {
          const next = [...prev]
          next[idx] = message
          return next
        }
        if (prev.some((m) => m._id === message._id)) return prev
        return [...prev, message]
      })
      scrollToBottom()
    })

    socket.on('new_message', (message) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev
        return [...prev, message]
      })
      scrollToBottom()
      if (message.sender?._id !== user?._id) {
        socket.emit('mark_read', { messageId: message._id, sessionId })
      }
    })

    socket.on('message_read', ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === messageId ? { ...m, isRead: true } : m))
      )
    })

    socket.on('session_status', ({ status: newStatus }) => {
      setStatus(newStatus)
    })

    socket.on('session_reassigned', (payload) => {
      if (payload.sessionId?.toString() !== sessionId?.toString()) return

      const meId = user?._id?.toString()
      // payload.agent is the new agent ID (string) set by the backend
      const newAgent = payload.agent?.toString?.() ?? payload.newAgent?.toString?.()

      // Only redirect if we know for sure we are no longer the agent
      if (meId && newAgent && meId !== newAgent) {
        toast.error('This chat has been reassigned to another agent.')
        navigate('/sessions', { replace: true })
      }
    })

    socket.on('removed_from_session', ({ sessionId: removedId }) => {
      // Backend sends ObjectId — compare as strings
      if (removedId?.toString() === sessionId?.toString()) {
        toast.error('This chat has been reassigned. You no longer have access.')
        navigate('/sessions', { replace: true })
      }
    })

    socket.on('chat_error', ({ code, message: errMsg }) => {
      const msg = CHAT_ERROR_MESSAGES[code] || errMsg || 'Chat error. Please try again.'
      toast.error(msg)
      if (AUTH_ERROR_CODES.includes(code)) {
        navigate('/login', { replace: true })
      }
    })

    socket.on('error', (err) => {
      const msg = typeof err === 'string' ? err : err?.message || 'Socket error'
      const code = typeof err === 'object' ? err?.code : null
      if (AUTH_ERROR_CODES.includes(code)) {
        toast.error('Connection error. Please log in again.')
        navigate('/login', { replace: true })
      } else if (CHAT_ERROR_MESSAGES[code]) {
        toast.error(CHAT_ERROR_MESSAGES[code])
      } else if (msg.toLowerCase().includes('rate')) {
        toast.error('Too many messages. Please slow down.')
      } else {
        toast.error(msg)
      }
    })

    return () => {
      setJoined(false)
      setSocketStatus('connecting')
      socket.io.off('reconnect_attempt', onReconnectAttempt)
      socket.io.off('reconnect_failed', onReconnectFailed)
      socket.disconnect()
    }
  }, [sessionId, token, authSessionId, user?._id, navigate, scrollToBottom])

  // Scroll to bottom once initial load finishes
  useEffect(() => {
    if (!loading) setTimeout(scrollToBottom, 100)
  }, [loading, scrollToBottom])

  // Restore scroll after loading earlier messages (runs synchronously after DOM paint)
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current && messagesContainerRef.current) {
      const el = messagesContainerRef.current
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = null
    }
  })

  const handleSend = useCallback((text) => {
    const socket = socketRef.current
    if (!socket || !joined) return

    const id = clientId()
    const optimistic = {
      _id: id,
      clientMessageId: id,
      text,
      sender: {
        _id: user?._id,
        firstName: user?.firstName,
        lastName: user?.lastName,
        username: user?.username,
      },
      createdAt: new Date().toISOString(),
      isRead: false,
    }
    setMessages((prev) => [...prev, optimistic])
    socket.emit('send_message', { sessionId, text, clientMessageId: id })
    scrollToBottom()
  }, [sessionId, user, joined, scrollToBottom])

  const handleImageSelect = useCallback(async (file) => {
    const socket = socketRef.current
    if (!socket || !joined || uploadingImage) return

    setUploadingImage(true)
    try {
      const res = await uploadImage(file)
      const data = res.data?.data || res.data || {}
      const { imageUrl, publicId, attachmentId } = data

      if (!imageUrl) {
        toast.error('Image upload failed. Please try again.')
        return
      }

      const id = clientId()
      const optimistic = {
        _id: id,
        clientMessageId: id,
        imageUrl,
        sender: {
          _id: user?._id,
          firstName: user?.firstName,
          lastName: user?.lastName,
          username: user?.username,
        },
        createdAt: new Date().toISOString(),
        isRead: false,
      }
      setMessages((prev) => [...prev, optimistic])
      socket.emit('send_message', { sessionId, imageUrl, publicId, attachmentId, clientMessageId: id })
      scrollToBottom()
    } catch (err) {
      const msg = isServiceUnavailableError(err)
        ? SERVICE_UNAVAILABLE_MESSAGE
        : err.response?.data?.message || 'Failed to upload image'
      toast.error(msg)
    } finally {
      setUploadingImage(false)
    }
  }, [sessionId, user, joined, uploadingImage, scrollToBottom])

  const handleLoadEarlier = async () => {
    if (!hasMore || loadingMore || !nextCursor) return

    if (messagesContainerRef.current) {
      prevScrollHeightRef.current = messagesContainerRef.current.scrollHeight
    }
    setLoadingMore(true)

    try {
      const res = await getMessages(sessionId, { limit: 20, before: nextCursor })
      const older = res.data?.messages || res.data?.data || []
      setMessages((prev) => [
        ...older.filter((m) => !prev.some((p) => p._id === m._id)),
        ...prev,
      ])
      setNextCursor(res.data?.nextCursor ?? null)
      setHasMore(res.data?.hasMore ?? false)
    } catch (err) {
      toast.error(isServiceUnavailableError(err) ? SERVICE_UNAVAILABLE_MESSAGE : 'Failed to load earlier messages')
      prevScrollHeightRef.current = null
    } finally {
      setLoadingMore(false)
    }
  }

  const handleAction = async (action) => {
    if (actionLoading) return
    setActionLoading(action)
    try {
      if (action === 'close') {
        await closeSession(sessionId)
        setStatus('closed')
        toast.success('Session closed')
      } else if (action === 'resolve') {
        await resolveSession(sessionId)
        setStatus('resolved')
        toast.success('Session resolved')
      } else if (action === 'reopen') {
        await reopenSession(sessionId)
        setStatus('open')
        toast.success('Session reopened')
      }
    } catch (err) {
      const msg =
        (isServiceUnavailableError(err) && SERVICE_UNAVAILABLE_MESSAGE) ||
        err.response?.data?.message ||
        err.response?.data?.code ||
        `Failed to ${action} session`
      toast.error(msg)
    } finally {
      setActionLoading(null)
    }
  }

  const sessionUser =
    navSession?.user ||
    messages.find((m) => m.sender?._id !== user?._id)?.sender
  const sessionUserName = displayName(sessionUser)

  const canSend = MESSAGE_ALLOWED.has(status) && joined && !uploadingImage
  const isClosed = !MESSAGE_ALLOWED.has(status)

  return (
    <div className="flex flex-col h-screen h-dvh">
      {/* Header */}
      <header className="flex-shrink-0 bg-jade-900 border-b border-jade-700/20 px-4 py-3">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/sessions')}
            className="size-9 rounded-xl bg-jade-800 flex items-center justify-center text-jade-50 hover:bg-jade-700/40 transition-colors flex-shrink-0"
          >
            <BackIcon />
          </button>

          <Avatar
            src={sessionUser?.profilePicture}
            name={sessionUserName}
            size="sm"
            className="flex-shrink-0"
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-jade-50 text-sm truncate">{sessionUserName}</h2>
              <Badge variant={STATUS_BADGE[status] ?? 'closed'} className="flex-shrink-0">
                {STATUS_LABEL[status] ?? status}
              </Badge>
            </div>
            <SocketStatusChip status={socketStatus} />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {MESSAGE_ALLOWED.has(status) ? (
              <>
                <Button
                  variant="ghost"
                  loading={actionLoading === 'resolve'}
                  disabled={!!actionLoading}
                  onClick={() => handleAction('resolve')}
                  className="text-xs px-3 py-1.5"
                >
                  Resolve
                </Button>
                <Button
                  variant="danger"
                  loading={actionLoading === 'close'}
                  disabled={!!actionLoading}
                  onClick={() => handleAction('close')}
                  className="text-xs px-3 py-1.5"
                >
                  Close
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                loading={actionLoading === 'reopen'}
                disabled={!!actionLoading}
                onClick={() => handleAction('reopen')}
                className="text-xs px-3 py-1.5"
              >
                Reopen
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Messages area */}
      <main ref={messagesContainerRef} className="flex-1 overflow-y-auto py-4">
        {/* Load earlier button */}
        {!loading && hasMore && (
          <div className="flex justify-center px-4 pb-3">
            <button
              onClick={handleLoadEarlier}
              disabled={loadingMore}
              className="text-xs text-jade-400 hover:text-jade-400/80 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? 'Loading earlier messages…' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {loading ? (
          <MessageSkeleton />
        ) : loadError ? (
          <div className="flex flex-col items-center justify-center gap-3 h-full px-4 text-center">
            <p className="text-jade-warm/60 text-sm">{loadError.message}</p>
            {loadError.serviceUnavailable && (
              <Button
                variant="ghost"
                onClick={() => setRetryIndex((value) => value + 1)}
                className="text-xs"
              >
                Retry
              </Button>
            )}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-jade-warm/40 text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message._id}
                message={message}
                isOwn={message.sender?._id === user?._id}
              />
            ))}
            <div ref={bottomRef} className="h-4" />
          </>
        )}
      </main>

      {/* Closed / resolved banner */}
      {isClosed && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-jade-800/60 border-t border-jade-700/20 text-center">
          <p className="text-sm text-jade-warm/60">
            This conversation is{' '}
            <span className="font-semibold text-jade-warm/80">{status}</span>.{' '}
            <button
              onClick={() => handleAction('reopen')}
              disabled={!!actionLoading}
              className="text-jade-400 underline underline-offset-2 hover:text-jade-400/80 transition-colors disabled:opacity-50"
            >
              {actionLoading === 'reopen' ? 'Reopening…' : 'Reopen'}
            </button>
          </p>
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onImageSelect={handleImageSelect}
        disabled={!canSend}
      />
    </div>
  )
}
