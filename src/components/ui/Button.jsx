export default function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  disabled,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold text-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none'

  const variants = {
    primary:
      'bg-jade-400 text-jade-900 hover:bg-jade-400/90 active:scale-[0.98] px-5 py-2.5',
    ghost:
      'text-jade-warm/80 hover:text-jade-50 px-3 py-2',
    danger:
      'bg-red-500/15 text-red-400 hover:bg-red-500/25 px-4 py-2',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="size-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
}
