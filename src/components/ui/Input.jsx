import { forwardRef } from 'react'

const Input = forwardRef(function Input(
  { label, error, className = '', ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-[11px] font-semibold uppercase tracking-wider text-jade-700/60">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={`w-full bg-jade-900/60 border ${
          error ? 'border-red-500/50' : 'border-jade-700/30'
        } rounded-xl text-jade-50 placeholder:text-jade-700/50 px-4 py-3 text-sm focus:border-jade-400/50 focus:outline-none transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
})

export default Input
