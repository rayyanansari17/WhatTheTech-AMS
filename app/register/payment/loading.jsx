import { Skeleton } from '@/components/ui/skeleton'

export default function PaymentLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-background/95 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>

      <div className="max-w-md mx-auto px-4 py-8 space-y-5">
        <div className="space-y-1.5 text-center">
          <Skeleton className="h-7 w-40 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>

        <div className="rounded-xl border border-border p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
          <div className="border-t border-border pt-3 flex justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>

        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  )
}
