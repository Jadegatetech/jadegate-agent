export function SkeletonBlock({ className = '' }) {
  return <div className={`skeleton-shimmer ${className}`} />
}

export function SkeletonSessionCard() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <SkeletonBlock className="size-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-3.5 w-32 rounded" />
        <SkeletonBlock className="h-3 w-48 rounded" />
      </div>
      <SkeletonBlock className="h-3 w-10 rounded" />
    </div>
  )
}
