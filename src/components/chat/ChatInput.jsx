import { useState, useRef } from 'react'

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

export default function ChatInput({ onSend, onImageSelect, disabled }) {
  const [text, setText] = useState('')
  const fileRef = useRef(null)

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onImageSelect(file)
      e.target.value = ''
    }
  }

  return (
    <div
      className="bg-jade-900 border-t border-jade-700/20 px-4 py-3"
      style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="flex-shrink-0 size-10 rounded-xl bg-jade-800 flex items-center justify-center text-jade-700 hover:text-jade-400 transition-colors disabled:opacity-50"
        >
          <ImageIcon />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 bg-jade-800 border border-jade-700/30 rounded-xl text-jade-50 placeholder:text-jade-700/50 px-4 py-2.5 text-sm focus:border-jade-400/50 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
          style={{ minHeight: '42px', maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="flex-shrink-0 size-10 rounded-xl bg-jade-400 flex items-center justify-center text-jade-900 hover:bg-jade-400/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SendIcon />
        </button>
      </div>
    </div>
  )
}
