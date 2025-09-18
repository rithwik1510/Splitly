import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingHistoryPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-12 w-56" />
        <Skeleton className="h-10 w-32" />
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </section>
      <section className="space-y-4">
        <Skeleton className="h-12" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      </section>
    </div>
  );
}
