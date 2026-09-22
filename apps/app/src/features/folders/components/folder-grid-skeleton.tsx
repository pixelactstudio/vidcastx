import { Skeleton } from "@vidcastx/ui/components/skeleton";

const GRID_CLASSES = "grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

export function FolderGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className={GRID_CLASSES}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-video w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
