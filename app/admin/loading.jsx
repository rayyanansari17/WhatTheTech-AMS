import { Skeleton } from '@/components/ui/skeleton'

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <div className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 bg-background z-10">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stat cards row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-8 w-14" />
            </div>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 flex-1 max-w-xs rounded-lg" />
          <Skeleton className="h-11 w-32 rounded-lg" />
          <Skeleton className="h-11 w-28 rounded-lg" />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-muted/50 border-b border-border">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-3.5 w-full max-w-[80px]" />
            ))}
          </div>
          {/* Table rows */}
          {[...Array(8)].map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 px-4 py-3.5 border-b border-border last:border-0 items-center">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
