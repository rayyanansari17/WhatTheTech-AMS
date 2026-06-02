'use client'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Check, Circle, Calendar, MapPin } from 'lucide-react'
import { HACKATHON_SCHEDULE } from '@/lib/constants'

const SECTIONS = [
  { key: 'about', label: 'About You' },
  { key: 'experience', label: 'Experience' },
  { key: 'links', label: 'Links' },
  { key: 'education', label: 'Education' },
  { key: 'contact', label: 'Contact' },
  { key: 'additional', label: 'Additional' },
  { key: 'agreements', label: 'Agreements' },
]

export default function ProgressSidebar({ completedSections, onSubmit, loading }) {
  const count = completedSections.length
  const total = SECTIONS.length
  const percent = Math.round((count / total) * 100)

  return (
    <div className="space-y-4">
      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">Application Progress</CardTitle>
            <span className="text-primary font-bold text-sm">{percent}%</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={percent} className="h-2" />
          <div className="space-y-2">
            {SECTIONS.map(section => {
              const done = completedSections.includes(section.key)
              return (
                <div key={section.key} className="flex items-center gap-2.5">
                  {done ? (
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${done ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                    {section.label}
                  </span>
                </div>
              )
            })}
          </div>

          <Button
            className="w-full mt-2"
            onClick={onSubmit}
            disabled={percent < 100}
            loading={loading}
            size="lg"
          >
            {percent < 100 ? `Complete All Sections (${count}/${total})` : 'Save & Continue →'}
          </Button>
          {percent < 100 && (
            <p className="text-xs text-muted-foreground text-center">
              Complete all sections to continue
            </p>
          )}
        </CardContent>
      </Card>

      {/* Event Schedule Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-primary" />
            </div>
            <div className="text-sm font-medium">Event Schedule</div>
          </div>
          <div className="space-y-0">
            {HACKATHON_SCHEDULE.map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  {i < HACKATHON_SCHEDULE.length - 1 && (
                    <div className="w-px flex-1 bg-border mt-1" />
                  )}
                </div>
                <div className="pb-3">
                  <div className="text-xs font-semibold text-foreground">{item.event}</div>
                  <div className="text-xs text-primary font-medium">{item.date}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 flex-shrink-0" />{item.venue}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
