'use client'
import { useState, useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import { getSupabaseClient } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QrCode, Check, Download } from 'lucide-react'

export default function CheckinQR({ profile, team }) {
  const [checkedIn, setCheckedIn] = useState(null)
  const supabase = getSupabaseClient()
  const isPaid = team?.payment_status === 'paid'

  useEffect(() => {
    if (!isPaid || !profile?.id) return
    supabase
      .from('check_ins')
      .select('checked_in_at')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data }) => setCheckedIn(data || false))
  }, [profile?.id, isPaid])

  function downloadQR() {
    const svg = document.getElementById('checkin-qr-svg')
    if (!svg) return
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const size = 320
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      ctx.drawImage(img, 0, 0, size, size)
      const link = document.createElement('a')
      link.download = 'wtt-checkin-qr.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  // No team yet
  if (!team) return null

  // Payment not done - show locked placeholder
  if (!isPaid) {
    return (
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
              <QrCode className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Event Check-in QR</p>
              <p className="text-xs text-muted-foreground">Available after payment</p>
            </div>
          </div>
          <div className="bg-muted/40 rounded-xl p-6 flex items-center justify-center opacity-40 select-none">
            <QrCode className="w-20 h-20 text-muted-foreground" />
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">Complete payment to unlock your QR</p>
        </CardContent>
      </Card>
    )
  }

  // Already checked in
  if (checkedIn) {
    return (
      <Card className="border-green-200 dark:border-green-900">
        <CardContent className="pt-5 pb-5">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-3">
              <Check className="w-7 h-7 text-green-600" />
            </div>
            <p className="font-bold text-green-600 text-base">You're Checked In!</p>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(checkedIn.checked_in_at).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            </p>
            <p className="text-xs text-muted-foreground mt-2">Welcome to What The Tech Hackathon!</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show QR (checkedIn === false - confirmed not checked in yet)
  // Also show while loading (checkedIn === null) to avoid layout shift
  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <QrCode className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium">Event Check-in QR</p>
            <p className="text-xs text-muted-foreground">Show this at the venue entrance</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 flex items-center justify-center">
          <QRCode
            id="checkin-qr-svg"
            value={team.checkin_token || ''}
            size={192}
            level="M"
            fgColor="#1A1A2E"
            bgColor="#ffffff"
          />
        </div>

        <div className="mt-3 text-center space-y-0.5">
          <p className="text-xs font-semibold text-foreground">{team.team_name}</p>
          <p className="text-xs text-muted-foreground">One QR for the whole team</p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-2 text-xs h-8"
          onClick={downloadQR}
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Save QR as Image
        </Button>
      </CardContent>
    </Card>
  )
}
