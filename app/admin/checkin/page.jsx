'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Search, QrCode, Check, UserCheck, Clock, Camera, CameraOff, XCircle, ScanLine } from 'lucide-react'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import toast from 'react-hot-toast'

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
  const [cameraReady, setCameraReady] = useState(false) // true once container div is rendered
  const [scanResult, setScanResult] = useState(null) // { type: 'success'|'duplicate'|'error', name?, team?, msg? }
  const [processing, setProcessing] = useState(false)
  const scannerRef = useRef(null)
  const resultTimer = useRef(null)

  useEffect(() => {
    loadCheckins()
    supabase.from('check_ins').select('*', { count: 'exact', head: true })
      .then(({ count }) => setTotalCheckins(count || 0))
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('profile_complete', true)
      .then(({ count }) => setTotalParticipants(count || 0))

    // Real-time subscription
    const channel = supabase
      .channel('checkins-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'check_ins' }, () => {
        loadCheckins()
        setTotalCheckins(n => n + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Stop camera when switching to manual tab
  useEffect(() => {
    if (tab !== 'scanner') stopCamera()
  }, [tab])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
      if (resultTimer.current) clearTimeout(resultTimer.current)
    }
  }, [])

  async function loadCheckins() {
    const { data } = await supabase
      .from('check_ins')
      .select('*, profiles!check_ins_user_id_fkey(full_name, institution), teams(team_name)')
      .order('checked_in_at', { ascending: false })
      .limit(20)
    setCheckins(data || [])
  }

  // ── Manual search ──────────────────────────────────────────────
  useEffect(() => {
    if (!search.trim()) { setResults([]); return }
    const timeout = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('profiles')
        .select('*, team_members(teams(id, team_name, team_code))')
        .or(`full_name.ilike.%${search}%,email.ilike.%${search}%`)
        .eq('profile_complete', true)
        .limit(10)
      setResults(data || [])
      setSearching(false)
    }, 400)
    return () => clearTimeout(timeout)
  }, [search])

  async function handleManualCheckin(profile) {
    setCheckingIn(profile.id)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const team = profile.team_members?.[0]?.teams
      const { error } = await supabase.from('check_ins').insert({
        user_id: profile.id,
        team_id: team?.id || null,
        checked_in_by: user.id,
      })
      if (error) {
        if (error.code === '23505') toast.error('Already checked in!')
        else throw error
      } else {
        toast.success(`${profile.full_name} checked in!`)
        setSearch('')
        setResults([])
        loadCheckins()
        setTotalCheckins(n => n + 1)
      }
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

    // Stop scanning while we process
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.pause(true)
    }

    try {
      const res = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await res.json()

      if (res.status === 409) {
        setScanResult({ type: 'duplicate', name: data.name, checkedInAt: data.checkedInAt })
      } else if (res.status === 404) {
        setScanResult({ type: 'error', msg: 'Invalid QR code' })
      } else if (!res.ok) {
        setScanResult({ type: 'error', msg: data.error || 'Check-in failed' })
      } else {
        setScanResult({ type: 'success', name: data.name, team: data.teamName, institution: data.institution })
        loadCheckins()
        setTotalCheckins(n => n + 1)
      }
    } catch {
      setScanResult({ type: 'error', msg: 'Network error. Try again.' })
    }

    // Auto-clear result and resume scanning after 3s
    if (resultTimer.current) clearTimeout(resultTimer.current)
    resultTimer.current = setTimeout(async () => {
      setScanResult(null)
      setProcessing(false)
      if (scannerRef.current?.isScanning === false && cameraOn) {
        await scannerRef.current.resume()
      }
    }, 3000)
  }, [processing, cameraOn])

  async function startCamera() {
    // Render the container div first, then start scanner in the effect below
    setCameraReady(true)
  }

  // Start scanner only after container div is in the DOM
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
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          handleQrScan,
          undefined
        )
        if (!cancelled) setCameraOn(true)
      } catch (err) {
        if (!cancelled) {
          toast.error('Camera access denied or unavailable')
          setCameraReady(false)
        }
        console.error(err)
      }
    }

    init()
    return () => { cancelled = true }
  }, [cameraReady])

  async function stopCamera() {
    setCameraOn(false)
    setCameraReady(false)
    setScanResult(null)
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

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold">Check-In</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Event day check-in management</p>
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
              <p className="text-xs text-muted-foreground">Checked In</p>
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
              <p className="text-xs text-muted-foreground">Total Registered</p>
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
                <div className="w-16 h-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-foreground mb-1">QR Code Scanner</p>
                <p className="text-sm text-muted-foreground mb-5">Point the camera at a participant's QR code to check them in instantly.</p>
                <Button onClick={startCamera} className="gap-2">
                  <Camera className="w-4 h-4" />Start Camera
                </Button>
              </div>
            ) : (
              <div className="relative">
                {/* Camera view — container must be in DOM before scanner starts */}
                <div className="relative overflow-hidden rounded-xl bg-black">
                  <div id="qr-reader-container" className="w-full" />
                  {/* Scan frame overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-[264px] h-[264px] border-2 border-primary/70 rounded-2xl" />
                  </div>
                </div>

                {/* Result overlay */}
                {scanResult && (
                  <div className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-3 p-6 text-center ${
                    scanResult.type === 'success'
                      ? 'bg-green-500/95'
                      : scanResult.type === 'duplicate'
                      ? 'bg-amber-500/95'
                      : 'bg-red-500/95'
                  }`}>
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                      {scanResult.type === 'success' ? (
                        <Check className="w-9 h-9 text-white" />
                      ) : scanResult.type === 'duplicate' ? (
                        <UserCheck className="w-9 h-9 text-white" />
                      ) : (
                        <XCircle className="w-9 h-9 text-white" />
                      )}
                    </div>
                    {scanResult.type === 'success' && (
                      <>
                        <p className="text-white font-extrabold text-xl leading-tight">{scanResult.name}</p>
                        {scanResult.team && <p className="text-white/80 text-sm">{scanResult.team}</p>}
                        {scanResult.institution && <p className="text-white/70 text-xs">{scanResult.institution}</p>}
                        <Badge className="bg-white/20 text-white border-0 text-xs">Checked In ✓</Badge>
                      </>
                    )}
                    {scanResult.type === 'duplicate' && (
                      <>
                        <p className="text-white font-bold text-lg">{scanResult.name}</p>
                        <p className="text-white/80 text-sm">Already checked in</p>
                        <p className="text-white/60 text-xs">
                          {new Date(scanResult.checkedInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </>
                    )}
                    {scanResult.type === 'error' && (
                      <p className="text-white font-semibold">{scanResult.msg}</p>
                    )}
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={stopCamera}
                  className="mt-3 w-full gap-2"
                >
                  <CameraOff className="w-4 h-4" />Stop Camera
                </Button>
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
                placeholder="Search by name or email..." className="pl-9" autoFocus />
            </div>

            {searching && <p className="text-xs text-muted-foreground mt-2 px-1">Searching...</p>}

            {results.length > 0 && (
              <div className="mt-3 space-y-2">
                {results.map(p => {
                  const team = p.team_members?.[0]?.teams
                  return (
                    <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                      <Avatar className="h-9 w-9"><AvatarFallback>{getInitials(p.full_name)}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{p.full_name}</p>
                        <p className="text-xs text-muted-foreground">{p.email} · {team?.team_name || 'No team'}</p>
                      </div>
                      <Button size="sm" onClick={() => handleManualCheckin(p)} disabled={checkingIn === p.id}>
                        <Check className="w-3.5 h-3.5" />Check In
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}

            {search && !searching && results.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No participants found</p>
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
            {totalCheckins > 0 && (
              <Badge variant="outline" className="ml-auto font-label text-xs">
                {totalCheckins} / {totalParticipants}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {checkins.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No check-ins yet</p>
          ) : (
            <div className="space-y-2">
              {checkins.map(c => (
                <div key={c.id} className="flex items-center gap-3 py-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-xs">{getInitials(c.profiles?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{c.teams?.team_name || 'No team'}</p>
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
