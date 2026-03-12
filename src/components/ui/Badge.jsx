function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}

export default function Badge({ variant = 'open', children, className = '' }) {
  const styles = {
    open: 'bg-jade-400/10 text-jade-400 border-jade-400/20',
    closed: 'bg-jade-700/20 text-jade-700 border-jade-700/30',
    verified: 'bg-jade-400/10 text-jade-400 border-jade-400/20',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${styles[variant]} ${className}`}
    >
      {variant === 'verified' && <CheckIcon />}
      {children}
    </span>
  )
}
