'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

const POLL_SECONDS = 30

/**
 * useAdminRefresh — realtime + polling + manual refresh for admin pages.
 *
 * @param {object} opts
 * @param {object} opts.supabase     - Supabase client instance
 * @param {function} opts.onRefresh  - Async function to re-fetch page data
 * @param {string} opts.channelName  - Unique realtime channel name
 * @param {string} opts.table        - Supabase table to subscribe to
 * @param {string} [opts.event]      - Postgres event filter (default '*')
 */
export function useAdminRefresh({ supabase, onRefresh, channelName, table, event = '*' }) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [countdown, setCountdown] = useState(POLL_SECONDS)
  const [justUpdated, setJustUpdated] = useState(false)

  // Stable ref so closures always call the latest onRefresh
  const onRefreshRef = useRef(onRefresh)
  useEffect(() => { onRefreshRef.current = onRefresh })
  const justUpdatedTimer = useRef(null)

  const execute = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true)
    try { await onRefreshRef.current() } catch {}
    setLastUpdated(Date.now())
    setCountdown(POLL_SECONDS)
    setJustUpdated(true)
    clearTimeout(justUpdatedTimer.current)
    justUpdatedTimer.current = setTimeout(() => setJustUpdated(false), 3000)
    if (manual) setIsRefreshing(false)
  }, [])

  // Realtime subscription — primary trigger
  useEffect(() => {
    if (!supabase || !channelName || !table) return
    const ch = supabase
      .channel(channelName)
      .on('postgres_changes', { event, schema: 'public', table }, () => execute(false))
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED')
      })
    return () => {
      supabase.removeChannel(ch)
      setIsLive(false)
    }
  }, [supabase, channelName, table, event, execute])

  // Polling fallback — countdown ticks every second, pauses on hidden tab
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      setCountdown(prev => {
        if (prev <= 1) { execute(false); return POLL_SECONDS }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [execute])

  const manualRefresh = useCallback(() => execute(true), [execute])

  return { isRefreshing, isLive, lastUpdated, countdown, justUpdated, manualRefresh }
}
