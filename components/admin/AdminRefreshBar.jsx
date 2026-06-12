'use client'
import { useState, useEffect } from 'react'
import { RefreshCw } from 'lucide-react'

function useRelativeTime(ts) {
  const [, tick] = useState(0)
  useEffect(() => {
    if (!ts) return
    const id = setInterval(() => tick(n => n + 1), 5000)
    return () => clearInterval(id)
  }, [ts])
  if (!ts) return null
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  return `${Math.floor(s / 60)}m ago`
}

export default function AdminRefreshBar({ isRefreshing, isLive, lastUpdated, countdown, justUpdated, onRefresh }) {
  const relTime = useRelativeTime(lastUpdated)

  return (
    <div className="flex items-center gap-3 flex-shrink-0">
      {/* Live indicator */}
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isLive ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'
        }`} />
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {isLive ? 'Live' : 'Reconnecting…'}
        </span>
      </div>

      {/* Last updated */}
      {relTime && (
        <span className={`text-xs hidden sm:inline transition-colors ${
          justUpdated ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
        }`}>
          {justUpdated ? 'Updated just now' : `Updated ${relTime}`}
        </span>
      )}

      {/* Polling countdown */}
      <span className="text-xs text-muted-foreground tabular-nums hidden md:inline" title="Auto-refresh countdown">
        {countdown}s
      </span>

      {/* Manual refresh button */}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        title="Refresh"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
        <span className="hidden sm:inline">Refresh</span>
      </button>
    </div>
  )
}
