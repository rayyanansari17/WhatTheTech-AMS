import { Skeleton } from '@/components/ui/skeleton'

export default function TeamLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>

        {/* Create team card */}
        <div className="rounded-xl border border-border p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-28" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <Skeleton className="h-4 w-8" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Join team card */}
        <div className="rounded-xl border border-border p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-11 w-full rounded-lg" />
          </div>
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
