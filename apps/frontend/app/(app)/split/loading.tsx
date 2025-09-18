import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSplitPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <Skeleton className="h-12" />
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-56" />
          <Skeleton className="h-40" />
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </section>
    </div>
  );
}
