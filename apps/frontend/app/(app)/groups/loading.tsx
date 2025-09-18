import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingGroupsPage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-44" />
      </section>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40" />
        ))}
      </section>
    </div>
  );
}
