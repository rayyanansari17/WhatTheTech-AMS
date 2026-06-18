import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import TopNav from '@/components/layout/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Navigation, Train, Car, Plane, Wifi, Coffee, Utensils, Zap, BedDouble } from 'lucide-react'

const AMENITIES = [
  { icon: Wifi,      label: 'High-speed Wi-Fi',     desc: 'Dedicated hackathon network' },
  { icon: Utensils,  label: 'Meals Included',        desc: 'Breakfast, lunch & dinner' },
  { icon: Coffee,    label: 'Snacks & Beverages',    desc: '24/7 refreshment stations' },
  { icon: Zap,       label: 'Power Outlets',         desc: 'At every workstation' },
  { icon: BedDouble, label: 'Rest Area',             desc: 'Sleeping pods available' },
  { icon: Car,       label: 'Parking',               desc: 'Free on-campus parking' },
]

const GETTING_THERE = [
  {
    icon: Plane,
    title: 'By Air',
    desc: 'Rajiv Gandhi International Airport (HYD) - ~40 min drive. Cabs available via Ola/Uber.',
  },
  {
    icon: Train,
    title: 'By Train',
    desc: 'Secunderabad or Hyderabad Deccan station - ~35 min drive to campus.',
  },
  {
    icon: Car,
    title: 'By Road',
    desc: 'GMC Balayogi Indoor Stadium, Gachibowli, Hyderabad – 500032.',
  },
  {
    icon: Navigation,
    title: 'GPS',
    desc: 'Search "GMC Balayogi Indoor Stadium Gachibowli" on Google Maps for turn-by-turn directions.',
  },
]

export default async function VenuePage() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (!profile?.profile_complete) redirect('/register/profile')

  return (
    <div className="min-h-screen bg-muted/30">
      <TopNav showTabs showUser user={user} profile={profile} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-extrabold text-foreground">Venue</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="w-3.5 h-3.5" /> GMC Balayogi Indoor Stadium, Gachibowli, Hyderabad
          </p>
        </div>

        <div className="space-y-5">
          {/* Map embed */}
          <Card className="overflow-hidden">
            <div className="relative w-full" style={{ paddingBottom: '50%' }}>
              <iframe
                title="GMC Balayogi Indoor Stadium, Gachibowli"
                src="https://maps.google.com/maps?q=GMC+Balayogi+Indoor+Stadium,+Gachibowli,+Hyderabad&output=embed&z=15"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm font-medium text-foreground">GMC Balayogi Indoor Stadium</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Gachibowli, Hyderabad, Telangana – 500032
              </p>
              <a
                href="https://maps.google.com/?q=GMC+Balayogi+Indoor+Stadium+Gachibowli+Hyderabad"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-primary hover:underline"
              >
                <Navigation className="w-3.5 h-3.5" />
                Open in Google Maps
              </a>
            </CardContent>
          </Card>

          {/* Getting there */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Getting There</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {GETTING_THERE.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="flex items-start gap-4 px-6 py-4">
                      <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Amenities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {AMENITIES.map((a) => {
                  const Icon = a.icon
                  return (
                    <div key={a.label} className="flex flex-col gap-2 p-3 rounded-xl bg-muted/50 border border-border">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{a.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{a.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
