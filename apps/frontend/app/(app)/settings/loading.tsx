import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSettingsPage() {
  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-12 w-40" />
        <Skeleton className="h-10 w-36" />
      </header>
      <section className="grid gap-6 lg:grid-cols-12">
        <Skeleton className="h-[520px] lg:col-span-8" />
        <Skeleton className="h-56 lg:col-span-4" />
      </section>
    </div>
  );
}
