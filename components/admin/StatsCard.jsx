import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default function StatsCard({ title, value, subtitle, icon: Icon, trend, color = 'primary' }) {
  const colorMap = {
    primary: 'bg-accent text-primary',
    green: 'bg-green-50 dark:bg-green-950/30 text-green-600',
    yellow: 'bg-yellow-50 dark:bg-yellow-950/30 text-yellow-600',
    red: 'bg-red-50 dark:bg-red-950/30 text-red-500',
    purple: 'bg-purple-50 dark:bg-purple-950/30 text-purple-600',
  }

  return (
    <Card className="card-hover">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold text-foreground mt-1.5 tabular-nums">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', colorMap[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
