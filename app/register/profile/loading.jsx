import { Skeleton } from '@/components/ui/skeleton'

function FieldSkeleton() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-3.5 w-28" />
      <Skeleton className="h-11 w-full rounded-lg" />
    </div>
  )
}

function SectionSkeleton({ fields = 2 }) {
  return (
    <div className="rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[...Array(fields)].map((_, i) => <FieldSkeleton key={i} />)}
      </div>
    </div>
  )
}

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* TopNav skeleton */}
      <div className="border-b border-border bg-background/95 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <div className="space-y-1.5">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Resume upload banner */}
        <div className="rounded-xl border-2 border-dashed border-border p-6 flex flex-col items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3.5 w-36" />
        </div>

        {/* Form sections */}
        <SectionSkeleton fields={3} />
        <SectionSkeleton fields={4} />
        <SectionSkeleton fields={2} />
        <SectionSkeleton fields={3} />

        {/* Submit button */}
        <Skeleton className="h-11 w-full rounded-lg" />
      </div>
    </div>
  )
}
