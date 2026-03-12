function getInitials(name) {
  if (!name) return '?'
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getColor(name) {
  const colors = [
    'bg-jade-400/20 text-jade-400',
    'bg-jade-500/20 text-jade-500',
    'bg-jade-700/40 text-jade-100',
    'bg-jade-800 text-jade-400',
  ]
  if (!name) return colors[0]
  const idx = name.charCodeAt(0) % colors.length
  return colors[idx]
}

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'size-8 text-xs',
    md: 'size-10 text-sm',
    lg: 'size-16 text-xl',
    xl: 'size-24 text-3xl',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        className={`rounded-full object-cover ${sizes[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${getColor(name)} ${sizes[size]} ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}
