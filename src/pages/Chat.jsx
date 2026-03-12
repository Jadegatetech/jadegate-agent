import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { io } from 'socket.io-client'
import toast from 'react-hot-toast'
import { getMessages, closeSession, reopenSession, uploadImage } from '../api/chat'
import { useAuth } from '../context/AuthContext'
import MessageBubble from '../components/chat/MessageBubble'
import ChatInput from '../components/chat/ChatInput'
import Badge from '../components/ui/Badge'
import Avatar from '../components/ui/Avatar'
import Button from '../components/ui/Button'
import { SkeletonBlock } from '../components/ui/Skeleton'

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

export default function Chat() {
  const { id: sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, token } = useAuth()

  // Session data passed from the sessions list via navigation state
  const navSession = location.state?.session

  const [messages, setMessages] = useState([])
  const [sessionInfo, setSessionInfo] = useState(navSession || null)
  const [status, setStatus] = useState(navSession?.status || 'open')
  const [loading, setLoading] = useState(true)
  const [closingLoading, setClosingLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const socketRef = useRef(null)
  const bottomRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Load messages
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getMessages(sessionId)
      .then((res) => {
        if (cancelled) return
        const data = res.data?.data || res.data?.messages || res.data || []
        setMessages(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!cancelled) toast.error('Failed to load messages')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [sessionId])

  // Socket connection
  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join_chat', sessionId)
    })

    socket.on('new_message', (message) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === message._id)) return prev
        return [...prev, message]
      })
      // Auto mark as read if message is from the user (not from us)
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

    socket.on('error', (err) => {
      const msg = typeof err === 'string' ? err : err?.message || 'Socket error'
      if (msg.toLowerCase().includes('rate')) {
        toast.error('Slow down — too many messages. Try again in a moment.')
      } else {
        toast.error(msg)
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [sessionId, token, user?._id])

  // Scroll to bottom after messages load
  useEffect(() => {
    if (!loading) {
      setTimeout(scrollToBottom, 100)
    }
  }, [loading, scrollToBottom])

  // Scroll to bottom on new message
  useEffect(() => {
    scrollToBottom()
  }, [messages.length, scrollToBottom])

  const handleSend = useCallback((text) => {
    const socket = socketRef.current
    if (!socket) return

    // Optimistic update
    const tempId = `temp_${Date.now()}`
    const optimistic = {
      _id: tempId,
      text,
      sender: { _id: user?._id, fullName: user?.fullName, username: user?.username },
      createdAt: new Date().toISOString(),
      isRead: false,
      isTemp: true,
    }
    setMessages((prev) => [...prev, optimistic])

    socket.emit('send_message', { sessionId, text })
  }, [sessionId, user])

  const handleImageSelect = useCallback(async (file) => {
    const socket = socketRef.current
    if (!socket || uploadingImage) return

    setUploadingImage(true)
    try {
      const res = await uploadImage(file)
      const imageUrl = res.data?.data?.imageUrl || res.data?.imageUrl
      if (imageUrl) {
        socket.emit('send_message', { sessionId, imageUrl })
      }
    } catch {
      toast.error('Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }, [sessionId, uploadingImage])

  const handleToggleStatus = async () => {
    setClosingLoading(true)
    try {
      if (status === 'open') {
        await closeSession(sessionId)
        setStatus('closed')
        toast.success('Session closed')
      } else {
        await reopenSession(sessionId)
        setStatus('open')
        toast.success('Session reopened')
      }
    } catch {
      toast.error('Failed to update session status')
    } finally {
      setClosingLoading(false)
    }
  }

  // Prefer session info from navigation state (has profilePicture), fall back to message sender
  const sessionUser = sessionInfo?.user || messages.find((m) => m.sender?._id !== user?._id)?.sender
  const sessionUserName = sessionUser?.fullName || sessionUser?.username || 'User'

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
              <Badge variant={status === 'open' ? 'open' : 'closed'} className="flex-shrink-0">
                {status === 'open' ? 'Open' : 'Closed'}
              </Badge>
            </div>
          </div>

          <Button
            variant={status === 'open' ? 'danger' : 'ghost'}
            loading={closingLoading}
            onClick={handleToggleStatus}
            className="flex-shrink-0 text-xs px-3 py-1.5"
          >
            {status === 'open' ? 'Close' : 'Reopen'}
          </Button>
        </div>
      </header>

      {/* Messages area */}
      <main className="flex-1 overflow-y-auto py-4">
        {loading ? (
          <MessageSkeleton />
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

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onImageSelect={handleImageSelect}
        disabled={status === 'closed' || uploadingImage}
      />
    </div>
  )
}
