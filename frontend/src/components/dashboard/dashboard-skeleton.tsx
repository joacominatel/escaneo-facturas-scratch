import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-4 md:grid-cols-4">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-md" />
          ))}
      </div>
      <Skeleton className="h-[450px] rounded-md" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Skeleton className="h-[300px] rounded-md lg:col-span-4" />
        <Skeleton className="h-[300px] rounded-md lg:col-span-3" />
      </div>
    </div>
  )
}
