"use client";

import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { GroupCard } from "@/components/groups/group-card";
import { useAuth } from "@/hooks/useAuth";
import { fetchGroups } from "@/lib/groups";

export default function GroupsPage() {
  const { isLoading: authLoading, user } = useAuth({ requireAuth: true });
  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    enabled: !authLoading && Boolean(user),
  });

  if (authLoading || groupsQuery.isLoading) {
    return (
      <div
        className="flex min-h-[50vh] items-center justify-center gap-2 text-slate-500 dark:text-slate-400"
        role="status"
        aria-live="polite"
      >
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
        <span>Loading your groups...</span>
      </div>
    );
  }

  if (groupsQuery.isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-xl border border-amber-200 bg-amber-50/80 p-6 text-center text-amber-800 dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-100">
          <h2 className="mb-2 text-lg font-semibold">We could not load your groups.</h2>
          <p className="mb-4 text-sm">Check your connection and try again. If the issue persists, try refreshing the page.</p>
          <button
            type="button"
            onClick={() => void groupsQuery.refetch()}
            className="rounded-md border border-amber-300 bg-white/80 px-4 py-1.5 text-sm font-medium text-amber-800 transition hover:bg-white dark:border-amber-600/60 dark:bg-transparent dark:text-amber-100 dark:hover:bg-amber-900/30"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Your groups</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Create groups for trips, roommates, or anything else you share expenses for.
          </p>
        </div>
        <CreateGroupForm />
      </section>

      <section aria-live="polite">
        {groupsQuery.data && groupsQuery.data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {groupsQuery.data.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-500 transition-colors dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400"
            role="status"
          >
            <p>No groups yet. Create your first one to start sharing expenses.</p>
          </div>
        )}
      </section>
    </div>
  );
}


