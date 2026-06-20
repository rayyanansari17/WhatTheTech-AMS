'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Search, QrCode, Check, UserCheck, Clock, Camera, CameraOff, XCircle, ScanLine, Users, RefreshCw, FlipHorizontal } from 'lucide-react'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useAdminRefresh } from '@/hooks/useAdminRefresh'
import AdminRefreshBar from '@/components/admin/AdminRefreshBar'

export default function AdminCheckinPage() {
  const supabase = getSupabaseClient()
  const [tab, setTab] = useState('scanner')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [checkins, setCheckins] = useState([])
  const [totalCheckins, setTotalCheckins] = useState(0)
  const [totalParticipants, setTotalParticipants] = useState(0)
  const [checkingIn, setCheckingIn] = useState(null)

  // Scanner state
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState('environment') // 'environment' | 'user'
  const [scanResult, setScanResult] = useState(null) // { type: 'success'|'duplicate'|'error'|'pending' }
  const [pendingCheckin, setPendingCheckin] = useState(null) // { teamId, teamName, members: [...] }
  const [confirmedIds, setConfirmedIds] = useState({}) // { user_id: bool }
  const [confirming, setConfirming] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [cameraError, setCameraError] = useState(null)
  const scannerRef = useRef(null)
  const resultTimer = useRef(null)

  async function refreshCheckins() {
    await loadCheckins()
    supabase.from('check_ins').select('team_id, user_id')
      .then(({ data }) => {
        const distinct = new Set((data || []).map(r => r.team_id ?? `solo:${r.user_id}`))
        setTotalCheckins(distinct.size)
      })
  }

  useEffect(() => {
    refreshCheckins()
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_complete', true)
      .then(({ count }) => setTotalParticipants(count || 0))
  }, [])

  const { isRefreshing, isLive, lastUpdated, countdown, justUpdated, manualRefresh } =
    useAdminRefresh({ supabase, onRefresh: refreshCheckins, channelName: 'admin-checkin-rt', table: 'check_ins', event: 'INSERT' })

  useEffect(() => {
    if (tab !== 'scanner') stopCamera()
  }, [tab])

  useEffect(() => {
    return () => {
      stopCamera()
      if (resultTimer.current) clearTimeout(resultTimer.current)
    }
  }, [])

  async function loadCheckins() {
    const { data } = await supabase
      .from('check_ins')
      .select('*, teams(team_name)')
      .order('checked_in_at', { ascending: false })
      .limit(60)
    const seen = new Set()
    const unique = []
    for (const c of (data || [])) {
      const key = c.team_id ?? `solo:${c.user_id}`
      if (!seen.has(key)) { seen.add(key); unique.push(c) }
    }
    setCheckins(unique.slice(0, 20))
  }

  // ── Manual search (by team name or team code) ─────────────────
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const timeout = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('teams')
        .select('id, team_name, team_code, member_count, track')
        .or(`team_name.ilike.%${search}%,team_code.ilike.%${search}%`)
        .limit(10)
      setResults(data || [])
      setSearching(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search])

  async function handleManualCheckin(team) {
    setCheckingIn(team.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data: existing } = await supabase
        .from('check_ins').select('id').eq('team_id', team.id).maybeSingle()
      if (existing) { toast.error(`${team.team_name} is already checked in!`); return }

      const { data: members } = await supabase
        .from('team_members').select('user_id').eq('team_id', team.id)
      if (!members?.length) { toast.error('No members found for this team'); return }

      const inserts = members.map(m => ({
        user_id: m.user_id,
        team_id: team.id,
        checked_in_by: user.id,
      }))
      const { error } = await supabase.from('check_ins').insert(inserts)
      if (error) throw error
      toast.success(`${team.team_name} checked in! (${inserts.length} member${inserts.length !== 1 ? 's' : ''})`)

      setSearch('')
      setResults([])
      refreshCheckins()
    } catch (err) {
      toast.error(err.message || 'Check-in failed')
    } finally {
      setCheckingIn(null)
    }
  }

  // ── QR Scanner ────────────────────────────────────────────────
  const handleQrScan = useCallback(async (token) => {
    if (processing) return
    setProcessing(true)
    // Do NOT pause camera - keep it running while we look up

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, mode: 'lookup' }),
      })
      const data = await res.json()

      if (res.status === 409) {
        setScanResult({ type: 'duplicate', name: data.name, checkedInAt: data.checkedInAt })
        scheduleResultClear()
        return
      }
      if (res.status === 404) {
        setScanResult({ type: 'error', msg: 'Invalid QR code' })
        scheduleResultClear()
        return
      }
      if (!res.ok) {
        setScanResult({ type: 'error', msg: data.error || 'Check-in failed' })
        scheduleResultClear()
        return
      }

      // Show verification overlay - admin confirms which members are present
      const initialConfirmed = {}
      for (const m of data.members) initialConfirmed[m.user_id] = true
      setConfirmedIds(initialConfirmed)
      setPendingCheckin({ token, teamId: data.teamId, teamName: data.teamName, members: data.members })
      setScanResult({ type: 'pending' })
    } catch {
      setScanResult({ type: 'error', msg: 'Network error. Try again.' })
      scheduleResultClear()
    }
  }, [processing])

  function scheduleResultClear() {
    if (resultTimer.current) clearTimeout(resultTimer.current)
    resultTimer.current = setTimeout(() => {
      setScanResult(null)
      setProcessing(false)
    }, 3000)
  }

  async function confirmCheckin() {
    if (!pendingCheckin) return
    setConfirming(true)

    const selectedIds = Object.entries(confirmedIds)
      .filter(([, v]) => v)
      .map(([uid]) => uid)

    if (selectedIds.length === 0) {
      toast.error('Select at least one member to check in.')
      setConfirming(false)
      return
    }

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: pendingCheckin.token, mode: 'confirm', confirmedUserIds: selectedIds }),
      })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Check-in failed')

      setScanResult({
        type: 'success',
        team: data.teamName,
        memberCount: data.memberCount,
        institution: data.institution,
      })
      setPendingCheckin(null)
      loadCheckins()
      setTotalCheckins(n => n + 1)
      scheduleResultClear()
    } catch (err) {
      toast.error(err.message || 'Check-in failed')
      setScanResult(null)
      setProcessing(false)
    } finally {
      setConfirming(false)
    }
  }

  function cancelCheckin() {
    setScanResult(null)
    setPendingCheckin(null)
    setConfirmedIds({})
    setProcessing(false)
  }

  async function startCamera(mode = facingMode) {
    setCameraReady(true)
    setFacingMode(mode)
  }

  useEffect(() => {
    if (!cameraReady || cameraOn) return
    let cancelled = false

    async function init() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return
        const scanner = new Html5Qrcode('qr-reader-container', { verbose: false })
        scannerRef.current = scanner
        await scanner.start(
          { facingMode },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          handleQrScan,
          undefined
        )
        if (!cancelled) { setCameraOn(true); setCameraError(null) }
      } catch (err) {
        if (!cancelled) {
          const name = err.name || ''
          if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
            setCameraError('blocked')
          } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
            setCameraError('notfound')
          } else if (name === 'NotReadableError') {
            setCameraError('inuse')
          } else {
            setCameraError(err.message || 'Failed to start scanner')
          }
          setCameraReady(false)
        }
        console.error(err)
      }
    }

    init()
    return () => { cancelled = true }
  }, [cameraReady, facingMode])

  async function stopCamera() {
    setCameraOn(false)
    setCameraReady(false)
    setCameraError(null)
    setScanResult(null)
    setPendingCheckin(null)
    setConfirmedIds({})
    setProcessing(false)
    if (resultTimer.current) clearTimeout(resultTimer.current)
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop()
        scannerRef.current.clear()
        scannerRef.current = null
      }
    } catch { /* already stopped */ }
  }

  async function flipCamera() {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    await stopCamera()
    // Small delay so the DOM container re-mounts cleanly
    setTimeout(() => startCamera(next), 150)
  }

  const confirmedCount = Object.values(confirmedIds).filter(Boolean).length

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold">Check-In</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Event day check-in management</p>
        </div>
        <AdminRefreshBar
          isRefreshing={isRefreshing} isLive={isLive} lastUpdated={lastUpdated}
          countdown={countdown} justUpdated={justUpdated} onRefresh={manualRefresh}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalCheckins}</p>
              <p className="text-xs text-muted-foreground">Teams Checked In</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalParticipants}</p>
              <p className="text-xs text-muted-foreground">Participants Registered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-5 w-fit">
        <button
          onClick={() => setTab('scanner')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'scanner' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ScanLine className="w-3.5 h-3.5" />Scan QR
        </button>
        <button
          onClick={() => setTab('manual')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
            tab === 'manual' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Search className="w-3.5 h-3.5" />Manual
        </button>
      </div>

      {/* Scanner Tab */}
      {tab === 'scanner' && (
        <Card className="mb-6">
          <CardContent className="pt-5">
            {!cameraReady ? (
              <div className="text-center py-8">
                {cameraError ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
                      <CameraOff className="w-8 h-8 text-destructive" />
                    </div>
                    {cameraError === 'blocked' && (
                      <>
                        <p className="font-semibold text-foreground mb-2">Camera Permission Blocked</p>
                        <div className="text-sm text-muted-foreground mb-5 max-w-xs mx-auto space-y-1.5 text-left bg-muted/50 rounded-xl p-4">
                          <p className="font-medium text-foreground">How to fix on Chrome / Edge:</p>
                          <p>1. Click the 🔒 lock icon in the address bar</p>
                          <p>2. Find <strong>Camera</strong> → set to <strong>Allow</strong></p>
                          <p>3. Reload the page and try again</p>
                          <p className="font-medium text-foreground mt-2">On mobile (Chrome):</p>
                          <p>Settings → Site Settings → Camera → find this site → Allow</p>
                        </div>
                      </>
                    )}
                    {cameraError === 'notfound' && (
                      <>
                        <p className="font-semibold text-foreground mb-2">No Camera Found</p>
                        <p className="text-sm text-muted-foreground mb-5">No camera detected on this device. Use the Manual tab instead.</p>
                      </>
                    )}
                    {cameraError === 'inuse' && (
                      <>
                        <p className="font-semibold text-foreground mb-2">Camera In Use</p>
                        <p className="text-sm text-muted-foreground mb-5">Another app is using the camera. Close it and try again.</p>
                      </>
                    )}
                    {cameraError !== 'blocked' && cameraError !== 'notfound' && cameraError !== 'inuse' && (
                      <>
                        <p className="font-semibold text-foreground mb-2">Camera Error</p>
                        <p className="text-sm text-muted-foreground mb-5 font-mono text-xs">{cameraError}</p>
                      </>
                    )}
                    <div className="flex gap-2 justify-center">
                      <Button onClick={() => { setCameraError(null); startCamera() }} className="gap-2">
                        <Camera className="w-4 h-4" />Try Again
                      </Button>
                      <Button variant="outline" onClick={() => setTab('manual')} className="gap-2">
                        <Search className="w-4 h-4" />Use Manual
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                      <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <p className="font-semibold text-foreground mb-1">QR Code Scanner</p>
                    <p className="text-sm text-muted-foreground mb-5">
                      Point the camera at a team's QR code. You'll verify members before confirming check-in.
                    </p>
                    <Button onClick={() => startCamera()} className="gap-2">
                      <Camera className="w-4 h-4" />Start Camera
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <div className="relative">
                {/* Camera view */}
                <div className="relative overflow-hidden rounded-xl bg-black">
                  <div id="qr-reader-container" className="w-full" />
                  {/* Scan frame overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[264px] h-[264px] border-2 border-primary/70 rounded-2xl" />
                  </div>
                </div>

                {/* Result / verification overlay */}
                {scanResult && (
                  <div className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3 p-5 text-center overflow-y-auto ${
                    scanResult.type === 'success'
                      ? 'bg-green-500/97'
                      : scanResult.type === 'duplicate'
                      ? 'bg-amber-500/97'
                      : scanResult.type === 'pending'
                      ? 'bg-background/97 border border-border'
                      : 'bg-red-500/97'
                  }`}>

                    {/* Verification overlay */}
                    {scanResult.type === 'pending' && pendingCheckin && (
                      <>
                        <div className="w-full">
                          <p className="font-extrabold text-lg text-foreground">{pendingCheckin.teamName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 mb-4">
                            Verify who is present, then confirm
                          </p>
                          <div className="space-y-2 mb-4 text-left">
                            {pendingCheckin.members.map(m => (
                              <label
                                key={m.user_id}
                                className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-muted/40 cursor-pointer hover:bg-muted/70 transition-colors"
                              >
                                <Checkbox
                                  checked={!!confirmedIds[m.user_id]}
                                  onCheckedChange={v =>
                                    setConfirmedIds(prev => ({ ...prev, [m.user_id]: !!v }))
                                  }
                                />
                                <span className="text-sm font-medium text-foreground">{m.full_name}</span>
                              </label>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={cancelCheckin}
                              disabled={confirming}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="flex-1 bg-green-600 hover:bg-green-700"
                              onClick={confirmCheckin}
                              loading={confirming}
                              disabled={confirmedCount === 0}
                            >
                              <Check className="w-3.5 h-3.5 mr-1" />
                              Check In ({confirmedCount})
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Success overlay */}
                    {scanResult.type === 'success' && (
                      <>
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                          <Check className="w-9 h-9 text-white" />
                        </div>
                        <p className="text-white font-extrabold text-xl leading-tight">
                          {scanResult.team}
                        </p>
                        {scanResult.memberCount > 1 && (
                          <p className="text-white/80 text-sm">{scanResult.memberCount} members checked in</p>
                        )}
                        {scanResult.institution && <p className="text-white/70 text-xs">{scanResult.institution}</p>}
                        <Badge className="bg-white/20 text-white border-0 text-xs">Checked In</Badge>
                      </>
                    )}

                    {/* Duplicate overlay */}
                    {scanResult.type === 'duplicate' && (
                      <>
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                          <UserCheck className="w-9 h-9 text-white" />
                        </div>
                        <p className="text-white font-bold text-lg">{scanResult.name}</p>
                        <p className="text-white/80 text-sm">Already checked in</p>
                        <p className="text-white/60 text-xs">
                          {new Date(scanResult.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </>
                    )}

                    {/* Error overlay */}
                    {scanResult.type === 'error' && (
                      <>
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                          <XCircle className="w-9 h-9 text-white" />
                        </div>
                        <p className="text-white font-semibold">{scanResult.msg}</p>
                      </>
                    )}
                  </div>
                )}

                {/* Camera controls */}
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={flipCamera}
                    className="gap-2 flex-1"
                    title={facingMode === 'environment' ? 'Switch to front camera' : 'Switch to rear camera'}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    {facingMode === 'environment' ? 'Front Camera' : 'Rear Camera'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={stopCamera}
                    className="gap-2 flex-1"
                  >
                    <CameraOff className="w-4 h-4" />Stop
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual Search Tab */}
      {tab === 'manual' && (
        <Card className="mb-6">
          <CardContent className="pt-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by team name or team code..." className="pl-9" autoFocus />
            </div>

            {searching && <p className="text-xs text-muted-foreground mt-2 px-1">Searching...</p>}

            {results.length > 0 && (
              <div className="mt-3 space-y-2">
                {results.map(team => (
                  <div key={team.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{team.team_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{team.team_code} · {team.member_count} member{team.member_count !== 1 ? 's' : ''}{team.track ? ` · ${team.track}` : ''}</p>
                    </div>
                    <Button size="sm" onClick={() => handleManualCheckin(team)} disabled={checkingIn === team.id}>
                      <Check className="w-3.5 h-3.5" />Check In
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {search && !searching && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No teams found</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent check-ins */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Recent Check-ins
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No check-ins yet</p>
          ) : (
            <div className="space-y-2">
              {checkins.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2">
                  <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.teams?.team_name || 'Individual'}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="approved" className="text-xs">
                      <Check className="w-2.5 h-2.5 mr-1" />Checked In
                    </Badge>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(c.checked_in_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
