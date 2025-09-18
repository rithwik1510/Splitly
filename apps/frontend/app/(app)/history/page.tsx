"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueries, type UseQueryResult } from "@tanstack/react-query";
import { ArrowUpRight, Loader2, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { fetchGroups, getGroupDetail } from "@/lib/groups";
import type { GroupDetail } from "@/lib/types";

interface HistoryItem {
  id: string;
  description: string;
  amount: number;
  currency: string;
  occurredAt: string;
  groupName: string;
  paidBy: string;
}

export default function HistoryPage() {
  const { user } = useAuth({ requireAuth: true });
  const router = useRouter();

  const groupsQuery = useQuery({
    queryKey: ["history", "groups"],
    queryFn: fetchGroups,
    enabled: Boolean(user),
  });

  const groups = groupsQuery.data ?? [];

  const groupDetails = useQueries({
    queries: groups.map((group) => ({
      queryKey: ["history", "group", group.id],
      queryFn: () => getGroupDetail(group.id),
      enabled: groups.length > 0,
      staleTime: 1000 * 60 * 5,
    })),
  }) as UseQueryResult<GroupDetail, unknown>[];

  const detailsLoading = groupDetails.some((query) => query.isLoading);
  const detailsError = groupDetails.some((query) => query.isError);

  const historyItems = useMemo<HistoryItem[]>(() => {
    return groupDetails
      .map((query) => query.data)
      .filter((detail): detail is GroupDetail => Boolean(detail))
      .flatMap((detail) =>
        detail.expenses.map((expense) => ({
          id: expense.id,
          description: expense.description || "Untitled expense",
          amount: expense.amount,
          currency: expense.currency,
          occurredAt: expense.occurredAt,
          groupName: detail.name,
          paidBy: expense.paidBy.name,
        }))
      )
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [groupDetails]);

  const uniqueGroupCount = groups.length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Expense history</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Review everything you have tracked and jump back into the right group with a click.
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/split")}>
          Back to dashboard
        </Button>
      </header>

      <section className="grid gap-6 md:grid-cols-2" aria-live="polite">
        <Card className="space-y-3 p-5" aria-label="Tracked expenses summary">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Receipt className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Tracked expenses</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{historyItems.length}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Each row below shows who paid, for which group, and when it happened.
          </p>
        </Card>
        <Card className="space-y-3 p-5" aria-label="Active groups summary">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
              <ArrowUpRight className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Active groups</p>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{uniqueGroupCount}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Filter by group directly inside the list when you want to focus on one trip.
          </p>
        </Card>
      </section>

      <section>
        <Card className="space-y-4" aria-live="polite">
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">All expenses</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ordered by most recent so it is easy to audit or export.
              </p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/split")}
              aria-label="Add a new expense"
            >
              Add expense
            </Button>
          </div>
          {groupsQuery.isLoading || detailsLoading ? (
            <div
              className="flex h-40 items-center justify-center gap-2 text-slate-500 dark:text-slate-400"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>Compiling your ledger...</span>
            </div>
          ) : groupsQuery.isError || detailsError ? (
            <div
              className="rounded-lg border border-red-200 bg-red-50/80 p-4 text-sm text-red-600 dark:border-red-700 dark:bg-red-950/60 dark:text-red-200"
              role="alert"
            >
              We could not load the full history right now. Try refreshing or checking your groups later.
            </div>
          ) : historyItems.length === 0 ? (
            <div
              className="rounded-lg border border-dashed border-slate-300/70 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-400"
              role="status"
            >
              No expenses logged yet. Head to the split page to create your first one.
            </div>
          ) : (
            <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {historyItems.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{item.description}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(item.occurredAt)} - {item.groupName}
                    </p>
                  </div>
                  <div className="flex flex-col items-start gap-1 text-sm sm:flex-row sm:items-center sm:gap-6">
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {item.currency} {item.amount.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Paid by {item.paidBy}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}


