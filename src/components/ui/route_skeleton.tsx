import { Card, Skeleton } from "@heroui/react";

/**
 * Shared fallback skeleton for authenticated routes during Next.js streaming navigation.
 */
export function RouteSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading page content" className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 rounded-lg" />
          <Skeleton className="h-4 w-80 max-w-full rounded-lg" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border border-border/40">
            <Card.Content className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-lg" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-4/5 rounded-lg" />
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-4 w-24 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-xl" />
              </div>
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  );
}
