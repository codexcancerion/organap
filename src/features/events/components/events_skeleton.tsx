import { Card, Skeleton } from "@heroui/react";

/**
 * Events catalog skeleton matching the view toggle header, filter bar, and 6-card grid.
 */
export function EventsSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading events catalog" className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-10 w-40 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border border-border/40">
            <Card.Content className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-5/6 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
              </div>
              <div className="space-y-2 pt-1">
                <Skeleton className="h-3 w-2/3 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-border/20">
                <Skeleton className="h-4 w-20 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  );
}
