import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import TopNav from '@/components/layout/TopNav'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, MapPin, Trophy, Zap, Users } from 'lucide-react'
import { HACKATHON_DATES, HACKATHON_VENUE } from '@/lib/constants'

const SCHEDULE = [
  {
    date: 'Jul 6, 2026',
    day: 'Day 1',
    events: [
      { time: '08:00 AM', title: 'Registration & Check-in', description: 'Collect your badges and settle in', icon: Users, type: 'logistics' },
      { time: '09:30 AM', title: 'Opening Ceremony', description: 'Welcome address and keynote speakers', icon: Zap, type: 'ceremony' },
      { time: '11:00 AM', title: 'Hacking Begins', description: '24-hour build sprint kicks off', icon: Clock, type: 'main' },
      { time: '01:00 PM', title: 'Lunch Break', description: 'Meals provided on-site', icon: Calendar, type: 'logistics' },
      { time: '06:00 PM', title: 'Mentor Sessions', description: 'Office hours with industry mentors', icon: Users, type: 'session' },
      { time: '08:00 PM', title: 'Dinner & Networking', description: 'Connect with fellow hackers', icon: Users, type: 'logistics' },
    ],
  },
  {
    date: 'Jul 7, 2026',
    day: 'Day 2',
    events: [
      { time: '08:00 AM', title: 'Breakfast', description: 'Fuel up for final submissions', icon: Calendar, type: 'logistics' },
      { time: '10:00 AM', title: 'Submission Deadline', description: 'All projects must be submitted', icon: Clock, type: 'main' },
      { time: '11:00 AM', title: 'Project Demos', description: 'Present your project to judges', icon: Zap, type: 'main' },
      { time: '02:00 PM', title: 'Judging Panel', description: 'Final evaluation by jury', icon: Users, type: 'session' },
      { time: '04:30 PM', title: 'Awards Ceremony', description: 'Winners announced and prizes distributed', icon: Trophy, type: 'ceremony' },
      { time: '06:00 PM', title: 'Closing & Farewell', description: 'Thank you and wrap-up', icon: Calendar, type: 'ceremony' },
    ],
  },
  {
    date: 'Jul 8, 2026',
    day: 'Final Showdown',
    events: [
      { time: '10:00 AM', title: 'Top Teams Showcase', description: 'Best projects presented at Google for Startups', icon: Zap, type: 'main' },
      { time: '12:00 PM', title: 'Investor Pitches', description: 'Selected teams pitch to investors', icon: Trophy, type: 'main' },
      { time: '03:00 PM', title: 'Grand Prize Announcement', description: 'Overall winner revealed', icon: Trophy, type: 'ceremony' },
    ],
  },
]

const TYPE_STYLES = {
  main:      'bg-primary/10 text-primary border-primary/20',
  ceremony:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  session:   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800',
  logistics: 'bg-muted text-muted-foreground border-border',
}

export default async function SchedulePage() {
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
          <h1 className="text-2xl font-bold text-foreground">Event Schedule</h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
            <MapPin className="w-3.5 h-3.5" /> {HACKATHON_VENUE} · {HACKATHON_DATES}
          </p>
        </div>

        <div className="space-y-6">
          {SCHEDULE.map((day) => (
            <Card key={day.day}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{day.day}</CardTitle>
                  <span className="text-xs text-muted-foreground font-medium">{day.date}</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {day.events.map((event, i) => {
                    const Icon = event.icon
                    return (
                      <div key={i} className="flex items-start gap-4 px-6 py-3.5">
                        <div className="w-20 flex-shrink-0 pt-0.5">
                          <span className="text-xs font-mono text-muted-foreground">{event.time}</span>
                        </div>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${TYPE_STYLES[event.type]}`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{event.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{event.description}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-6">
          Schedule is subject to change. Check back for updates.
        </p>
      </div>
    </div>
  )
}
