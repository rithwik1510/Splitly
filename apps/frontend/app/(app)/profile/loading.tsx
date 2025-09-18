import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingProfilePage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-12 w-52" />
        <Skeleton className="h-10 w-40" />
      </header>
      <section className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-64 lg:col-span-4" />
        <Skeleton className="h-96 lg:col-span-8" />
      </section>
      <section className="space-y-4">
        <Skeleton className="h-12 w-48" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24" />
          ))}
        </div>
      </section>
    </div>
  );
}
