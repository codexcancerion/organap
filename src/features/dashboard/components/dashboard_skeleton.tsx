import { Card, Skeleton } from "@heroui/react";

/**
 * Dashboard-shaped skeleton matching the 4-KPI grid and dual operational panels.
 */
export function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="flex flex-col gap-6 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-lg" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="border border-border/40">
            <Card.Content className="flex items-start justify-between gap-3 p-5">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-28 rounded-lg" />
                <Skeleton className="h-8 w-16 rounded-lg" />
                <Skeleton className="h-3 w-32 rounded-lg" />
              </div>
              <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            </Card.Content>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, panelIndex) => (
          <Card key={panelIndex} className="border border-border/40">
            <Card.Header className="flex items-center justify-between gap-2 pb-2">
              <div className="space-y-2">
                <Skeleton className="h-5 w-44 rounded-lg" />
                <Skeleton className="h-3 w-56 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-20 rounded-xl" />
            </Card.Header>
            <Card.Content className="flex flex-col gap-3 pt-2">
              {Array.from({ length: 3 }).map((__, rowIndex) => (
                <div key={rowIndex} className="flex items-center justify-between gap-3 rounded-xl border border-border/30 p-3">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/2 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </Card.Content>
          </Card>
        ))}
      </div>
    </div>
  );
}
