"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  useQuery,
  useQueryClient,
  useQueries,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronDown,
  Gauge,
  Loader2,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ExpenseEditor } from "@/components/expenses/expense-editor";
import { CreateGroupForm } from "@/components/groups/create-group-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { buildBalanceOverview, type BalanceOverviewData } from "@/lib/balances";
import { fetchGroups, getGroupBalances, getGroupDetail, GROUPS_STALE_TIME } from "@/lib/groups";
import type { BalancesResponse, GroupDetail, GroupSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const LAST_GROUP_STORAGE_KEY = "splitly:last-split-group-id";
const EPSILON = 0.01;
const ENABLE_DEMO_PREVIEW = process.env.NEXT_PUBLIC_ENABLE_DEMO_PREVIEW !== "false";

type BalanceFilter = "all" | "owedToMe" | "iOwe";
type BalanceTab = "individuals" | "groups";

const FILTER_OPTIONS: { key: BalanceFilter; label: string }[] = [
  { key: "owedToMe", label: "You are owed" },
  { key: "iOwe", label: "You owe" },
  { key: "all", label: "All" },
];

const TAB_OPTIONS: { key: BalanceTab; label: string }[] = [
  { key: "individuals", label: "Individuals" },
  { key: "groups", label: "Groups" },
];

type IndividualRow = BalanceOverviewData["individuals"][number];
type GroupRow = BalanceOverviewData["groups"][number];

type SettleNavigationPayload = {
  groupId: string;
  counterpartyId?: string;
  mode?: "receive" | "pay";
};
const DEMO_BALANCE_OVERVIEW: BalanceOverviewData = {
  totals: [
    { currency: "USD", theyOwe: 75.25, youOwe: 45.25, net: 30 },
    { currency: "EUR", theyOwe: 32.1, youOwe: 0, net: 32.1 },
  ],
  individuals: [
    {
      userId: "demo-amelia",
      name: "Amelia Chen",
      netByCurrency: { USD: 75.25 },
      owedToMe: { USD: 75.25 },
      iOwe: {},
      breakdown: [
        {
          groupId: "demo-trip",
          groupName: "Barcelona Getaway",
          currency: "USD",
          amount: 75.25,
        },
      ],
    },
    {
      userId: "demo-mateo",
      name: "Mateo Ruiz",
      netByCurrency: { USD: -45.25 },
      owedToMe: {},
      iOwe: { USD: 45.25 },
      breakdown: [
        {
          groupId: "demo-trip",
          groupName: "Barcelona Getaway",
          currency: "USD",
          amount: -45.25,
        },
      ],
    },
    {
      userId: "demo-sasha",
      name: "Sasha Patel",
      netByCurrency: { EUR: 32.1 },
      owedToMe: { EUR: 32.1 },
      iOwe: {},
      breakdown: [
        {
          groupId: "demo-roommates",
          groupName: "Roommate Essentials",
          currency: "EUR",
          amount: 32.1,
        },
      ],
    },
  ],
  groups: [
    {
      groupId: "demo-trip",
      groupName: "Barcelona Getaway",
      currency: "USD",
      net: 30,
      owedToMe: 75.25,
      iOwe: 45.25,
      members: [
        { userId: "demo-amelia", name: "Amelia Chen", balance: 75.25 },
        { userId: "demo-mateo", name: "Mateo Ruiz", balance: -45.25 },
      ],
    },
    {
      groupId: "demo-roommates",
      groupName: "Roommate Essentials",
      currency: "EUR",
      net: 32.1,
      owedToMe: 32.1,
      iOwe: 0,
      members: [
        { userId: "demo-sasha", name: "Sasha Patel", balance: 32.1 },
      ],
    },
  ],
};


export default function SplitExpensePage() {
  const { user, isLoading: authLoading } = useAuth({ requireAuth: true });
  const router = useRouter();
  const queryClient = useQueryClient();

  const groupsQuery = useQuery({
    queryKey: ["groups"],
    queryFn: fetchGroups,
    staleTime: GROUPS_STALE_TIME,
    enabled: !authLoading,
  });

  const groups = groupsQuery.data ?? [];
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  useEffect(() => {
    if (!groups.length && !isDemoMode) {
      setSelectedGroupId(null);
      return;
    }

    setSelectedGroupId((current) => {
      if (current && groups.some((group) => group.id === current)) {
        return current;
      }
      if (typeof window !== "undefined") {
        const stored = window.localStorage.getItem(LAST_GROUP_STORAGE_KEY);
        if (stored && groups.some((group) => group.id === stored)) {
          return stored;
        }
      }
      return groups[0].id;
    });
  }, [groups]);

  useEffect(() => {
    if (selectedGroupId && typeof window !== "undefined") {
      window.localStorage.setItem(LAST_GROUP_STORAGE_KEY, selectedGroupId);
    }
  }, [selectedGroupId]);

  const selectedGroupSummary = groups.find((group) => group.id === selectedGroupId);

  const groupDetailQuery = useQuery({
    queryKey: ["group", selectedGroupId],
    queryFn: () => getGroupDetail(selectedGroupId!),
    enabled: Boolean(selectedGroupId),
  });

  const groupDetail = groupDetailQuery.data;

  const balanceQueries = useQueries({
    queries: groups.map((group) => ({
      queryKey: ["group-balance", group.id],
      queryFn: () => getGroupBalances(group.id),
      enabled: !authLoading && groups.length > 0,
      staleTime: 1000 * 30,
    })),
  }) as UseQueryResult<BalancesResponse, unknown>[];

  const balancesLoading =
    groups.length > 0 && balanceQueries.some((query) => query.isLoading || query.isFetching);
  const balancesError = balanceQueries.some((query) => query.isError);

  const balanceData = useMemo(
    () =>
      balanceQueries
        .map((query) => query.data)
        .filter((value): value is BalancesResponse => Boolean(value)),
    [balanceQueries]
  );

  const balanceOverview = useMemo(
    () => buildBalanceOverview({ currentUserId: user?.id, groupBalances: balanceData, groups }),
    [balanceData, groups, user?.id]
  );

  const [filterMode, setFilterMode] = useState<BalanceFilter>("owedToMe");
  const [activeTab, setActiveTab] = useState<BalanceTab>("individuals");
  const [expandedIndividualId, setExpandedIndividualId] = useState<string | null>(null);
  const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null);

  const isDemoMode =
    ENABLE_DEMO_PREVIEW &&
    !authLoading &&
    !groupsQuery.isLoading &&
    groups.length === 0 &&
    !balancesLoading &&
    !balancesError;

  const overviewForDisplay = isDemoMode ? DEMO_BALANCE_OVERVIEW : balanceOverview;
  const canSettle = !isDemoMode;

  useEffect(() => {
    setExpandedIndividualId(null);
    setExpandedGroupId(null);
  }, [filterMode, activeTab]);

  const filteredIndividuals = useMemo(
    () => filterIndividuals(overviewForDisplay, filterMode),
    [overviewForDisplay, filterMode]
  );

  const filteredGroups = useMemo(
    () => filterGroups(overviewForDisplay.groups, filterMode),
    [overviewForDisplay, filterMode]
  );

  const handleExpenseCreated = () => {
    if (!selectedGroupId) return;
    void queryClient.invalidateQueries({ queryKey: ["group", selectedGroupId] });
    void queryClient.invalidateQueries({ queryKey: ["balances", selectedGroupId] });
    void queryClient.invalidateQueries({ queryKey: ["group-balance"] });
    void queryClient.invalidateQueries({ queryKey: ["groups"] });
  };

  const handleGroupSelected = (groupId: string) => {
    if (groupId === selectedGroupId) return;
    setSelectedGroupId(groupId);
  };

  const handleGroupCreated = (group: GroupSummary) => {
    setSelectedGroupId(group.id);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(LAST_GROUP_STORAGE_KEY, group.id);
    }
    void queryClient.prefetchQuery({
      queryKey: ["group", group.id],
      queryFn: () => getGroupDetail(group.id),
    });
    void queryClient.prefetchQuery({
      queryKey: ["group-balance", group.id],
      queryFn: () => getGroupBalances(group.id),
    });
  };

  const refetchBalances = () =>
    Promise.all(balanceQueries.map((query) => query.refetch())).then(() => undefined);

  const handleNavigateToSettle = ({ groupId, counterpartyId, mode }: SettleNavigationPayload) => {
    const params = new URLSearchParams();
    if (counterpartyId) {
      params.set("settleWith", counterpartyId);
    }
    if (mode) {
      params.set("settleMode", mode);
    }
    const query = params.toString();
    router.push(`/groups/${groupId}${query ? `?${query}` : ""}`);
  };

  if (authLoading || groupsQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> Loading your people...
      </div>
    );
  }

  if (groupsQuery.isError) {
    return (
      <Card className="flex min-h-[50vh] flex-col items-center justify-center space-y-4 text-center">
        <h1 className="text-xl font-semibold text-slate-900 dark:text-white">We hit a snag loading your groups.</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">Please refresh or try again in a moment.</p>
        <Button variant="secondary" onClick={() => groupsQuery.refetch()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (!groups.length && !isDemoMode) {
    return (
      <div className="space-y-6">
        <Card className="space-y-4 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-brand" />
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Start your first split</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Create a group or pick a friend to begin tracking shared expenses. Once you have members, we will pull them right into your editor.
            </p>
          </div>
        </Card>
        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Create a group</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Groups can be anything from roommates to trips or one-off dinners. Add people now or invite them later.
            </p>
          </div>
          <CreateGroupForm onCreated={handleGroupCreated} />
        </Card>
      </div>
    );
  }

  const latestExpense = groupDetail?.expenses?.[0];
  const latestActivityLabel = latestExpense
    ? `${latestExpense.description || "Recent expense"} - ${
        groupDetail?.baseCurrency ?? selectedGroupSummary?.baseCurrency
      } ${latestExpense.baseAmount.toFixed(2)}`
    : "No expenses yet";

  return (
    <div className="space-y-8">
      <Card className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {user ? `Welcome back, ${user.name}.` : "Welcome back."}
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">Split an expense</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Enter the amount, choose who is involved, and fine-tune the split without friction.
            </p>
          </div>
          <Sparkles className="h-10 w-10 text-brand" />
        </div>
        {selectedGroupSummary && (
          <div className="flex flex-wrap gap-3 text-sm text-slate-500 dark:text-slate-400">
            <SnapshotChip icon={Users} label="Participants" value={`${selectedGroupSummary.members.length} ready`} />
            <SnapshotChip icon={Wallet} label="Base currency" value={selectedGroupSummary.baseCurrency} />
            {groupDetail && (
              <SnapshotChip icon={Gauge} label="Latest activity" value={latestActivityLabel} />
            )}
          </div>
        )}
      </Card>

      <BalanceOverviewSection
        overview={overviewForDisplay}
        loading={balancesLoading}
        error={balancesError}
        filterMode={filterMode}
        onFilterChange={setFilterMode}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        individuals={filteredIndividuals}
        groups={filteredGroups}
        expandedIndividualId={expandedIndividualId}
        onToggleIndividual={setExpandedIndividualId}
        expandedGroupId={expandedGroupId}
        onToggleGroup={setExpandedGroupId}
        onRetry={refetchBalances}
        onSettle={handleNavigateToSettle}
        demoMode={isDemoMode}
        canSettle={canSettle}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <GroupSelector
            groups={groups}
            selectedGroupId={selectedGroupId}
            onSelect={handleGroupSelected}
          />
          <GroupSnapshot summary={selectedGroupSummary} detail={groupDetail} />
        </div>
        <div className="space-y-4 lg:col-span-8">
          {groupDetailQuery.isLoading && (
            <Card className="flex min-h-[420px] items-center justify-center text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> Preparing split editor...
            </Card>
          )}
          {groupDetailQuery.isError && (
            <Card className="space-y-2 border-red-200 bg-red-50/80 text-red-600 dark:border-red-700 dark:bg-red-950/60 dark:text-red-200">
              <h2 className="text-lg font-semibold">Unable to load that group</h2>
              <p className="text-sm">Please pick another group or try again in a moment.</p>
            </Card>
          )}
          {groupDetail && <ExpenseEditor group={groupDetail} onCreated={handleExpenseCreated} />}
        </div>
      </div>
    </div>
  );
}

interface BalanceOverviewSectionProps {
  overview: BalanceOverviewData;
  loading: boolean;
  error: boolean;
  filterMode: BalanceFilter;
  onFilterChange: (filter: BalanceFilter) => void;
  activeTab: BalanceTab;
  onTabChange: (tab: BalanceTab) => void;
  individuals: IndividualRow[];
  groups: GroupRow[];
  expandedIndividualId: string | null;
  onToggleIndividual: (id: string | null) => void;
  expandedGroupId: string | null;
  onToggleGroup: (groupId: string | null) => void;
  onRetry: () => void;
  onSettle: (payload: SettleNavigationPayload) => void;
  demoMode: boolean;
  canSettle: boolean;
}

function BalanceOverviewSection({
  overview,
  loading,
  error,
  filterMode,
  onFilterChange,
  activeTab,
  onTabChange,
  individuals,
  groups,
  expandedIndividualId,
  onToggleIndividual,
  expandedGroupId,
  onToggleGroup,
  onRetry,
  onSettle,
  demoMode,
  canSettle,
}: BalanceOverviewSectionProps) {
  const totalsDisplay = formatTotals(overview);
  const owesMeTotals = overview.totals.filter((item) => item.theyOwe > EPSILON);
  const iOweTotals = overview.totals.filter((item) => item.youOwe > EPSILON);

  return (
    <Card className="space-y-6" role="region" aria-label="Balance overview">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Balance overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Track what's outstanding before you log the next split.
          </p>
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          <p className="text-base font-semibold text-emerald-500">
            {owesMeTotals.length > 0
              ? `You are owed: ${formatAmountList(
                  owesMeTotals.map((item) => ({
                    currency: item.currency,
                    amount: item.theyOwe,
                  }))
                )}`
              : "You are owed: 0"}
          </p>
          {iOweTotals.length > 0 && (
            <p className="text-xs text-rose-500">
              You owe: {formatAmountList(
                iOweTotals.map((item) => ({
                  currency: item.currency,
                  amount: item.youOwe,
                }))
              )}
            </p>
          )}
          {totalsDisplay && (
            <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
              Net: {totalsDisplay}
            </p>
          )}
        </div>
      </div>

      {demoMode && (
        <div
          className="rounded-lg border border-dashed border-brand/40 bg-brand/10 px-3 py-2 text-xs text-slate-600 dark:border-brand/30 dark:bg-brand/20 dark:text-slate-200"
          role="status"
        >
          <span className="font-semibold text-brand">Demo preview:</span>{" "}
          We added realistic sample balances so you can see the new owed and owing labels in action.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3" role="group" aria-label="Filter balances by owed status">
        {FILTER_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => onFilterChange(option.key)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition",
              "border-slate-200/70 text-slate-600 hover:border-brand hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand",
              filterMode === option.key &&
                "border-brand bg-brand/10 text-slate-900 dark:border-brand dark:bg-brand/20 dark:text-white"
            )}
            aria-pressed={filterMode === option.key}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div
        className="flex rounded-lg border border-slate-200/70 p-1 text-sm dark:border-slate-800"
        role="tablist"
        aria-label="Balance view"
      >
        {TAB_OPTIONS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "flex-1 rounded-md px-3 py-1.5 font-medium transition",
                isActive
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
              aria-pressed={isActive}
              role="tab"
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-200 bg-amber-50/80 p-4 text-center text-amber-700 dark:border-amber-700/60 dark:bg-amber-900/40 dark:text-amber-200">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="h-4 w-4" /> Unable to load balances right now.
          </div>
          <Button variant="secondary" size="sm" onClick={() => void onRetry()}>
            Retry
          </Button>
        </div>
      ) : loading ? (
        <div className="flex min-h-[160px] items-center justify-center text-slate-500 dark:text-slate-400" role="status" aria-live="polite">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" /> Crunching balances...
        </div>
      ) : activeTab === "individuals" ? (
        <IndividualsList
          rows={individuals}
          expandedId={expandedIndividualId}
          onToggle={onToggleIndividual}
          filterMode={filterMode}
          onSettle={onSettle}
          canSettle={canSettle}
        />
      ) : (
        <GroupsList
          rows={groups}
          expandedId={expandedGroupId}
          onToggle={onToggleGroup}
          filterMode={filterMode}
          onSettle={onSettle}
          canSettle={canSettle}
        />
      )}
    </Card>
  );
}

interface IndividualsListProps {
  rows: IndividualRow[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
  filterMode: BalanceFilter;
  onSettle: (payload: SettleNavigationPayload) => void;
  canSettle: boolean;
}

function IndividualsList({
  rows,
  expandedId,
  onToggle,
  filterMode,
  onSettle,
  canSettle,
}: IndividualsListProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300/70 bg-white/70 p-6 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-400">
        Nothing outstanding here right now.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const isExpanded = expandedId === row.userId;
        const panelId = `individual-${row.userId}`;
        const display = getDisplayAmounts(row, filterMode);
        const positiveTotal = display.positive.reduce((sum, entry) => sum + entry.amount, 0);
        const negativeTotal = display.negative.reduce((sum, entry) => sum + entry.amount, 0);
        const headerCanSettle =
          canSettle && row.breakdown.length === 1 && (positiveTotal > EPSILON || negativeTotal > EPSILON);
        const defaultMode: "receive" | "pay" =
          filterMode === "iOwe"
            ? "pay"
            : filterMode === "owedToMe"
            ? "receive"
            : positiveTotal >= negativeTotal
            ? "receive"
            : "pay";

        return (
          <div
            key={row.userId}
            className="rounded-xl border border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <button
              type="button"
              onClick={() => onToggle(isExpanded ? null : row.userId)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
              aria-expanded={isExpanded}
              aria-controls={panelId}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Tap to view breakdown</p>
              </div>
              <div className="flex items-end gap-3">
                {headerCanSettle && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSettle({
                        groupId: row.breakdown[0].groupId,
                        counterpartyId: row.userId,
                        mode: defaultMode,
                      });
                    }}
                    aria-label={`Start settling with ${row.name}`}
                  >
                    Settle up
                  </Button>
                )}
                <AmountDisplay {...display} />
                <ChevronDown
                  className={cn("h-5 w-5 text-slate-400 transition-transform", isExpanded && "rotate-180")}
                />
              </div>
            </button>
            {isExpanded && (
              <div
                id={panelId}
                className="space-y-2 border-t border-slate-200/70 px-4 py-3 text-sm dark:border-slate-800"
              >
                {row.breakdown.map((item) => (
                  <div
                    key={`${item.groupId}-${item.currency}`}
                    className="flex flex-wrap items-center justify-between gap-3 text-slate-600 dark:text-slate-300"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{item.groupName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {item.amount >= 0 ? "You are owed in this group" : "You owe in this group"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={item.amount >= 0 ? "text-emerald-500" : "text-rose-500"}>
                        {item.currency} {Math.abs(item.amount).toFixed(2)}
                      </span>
                      {canSettle && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSettle({
                              groupId: item.groupId,
                              counterpartyId: row.userId,
                              mode: item.amount >= 0 ? "receive" : "pay",
                            });
                          }}
                          aria-label={`Settle ${item.currency} ${Math.abs(item.amount).toFixed(2)} in ${item.groupName}`}
                        >
                          Settle
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface GroupsListProps {
  rows: GroupRow[];
  expandedId: string | null;
  onToggle: (id: string | null) => void;
  filterMode: BalanceFilter;
  onSettle: (payload: SettleNavigationPayload) => void;
  canSettle: boolean;
}

function GroupsList({ rows, expandedId, onToggle, filterMode, onSettle, canSettle }: GroupsListProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300/70 bg-white/70 p-6 text-center text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-400">
        No group balances to highlight right now.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const isExpanded = expandedId === row.groupId;
        const panelId = `group-${row.groupId}`;
        const display = getGroupDisplay(row, filterMode);
        const canSettleGroup = canSettle && Math.abs(row.net) > EPSILON;
        const defaultMode: "receive" | "pay" = row.net >= 0 ? "receive" : "pay";

        return (
          <div
            key={row.groupId}
            className="rounded-xl border border-slate-200/70 bg-white/80 dark:border-slate-800 dark:bg-slate-900/60"
          >
            <button
              type="button"
              onClick={() => onToggle(isExpanded ? null : row.groupId)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
              aria-expanded={isExpanded}
              aria-controls={panelId}
            >
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{row.groupName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{row.currency}-based</p>
              </div>
              <div className="flex items-end gap-3">
                {canSettleGroup && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSettle({ groupId: row.groupId, mode: defaultMode });
                    }}
                    aria-label={`Open settle flow for ${row.groupName}`}
                  >
                    Settle up
                  </Button>
                )}
                <AmountDisplay {...display} />
                <ChevronDown
                  className={cn("h-5 w-5 text-slate-400 transition-transform", isExpanded && "rotate-180")}
                />
              </div>
            </button>
            {isExpanded && (
              <div
                id={panelId}
                className="space-y-2 border-t border-slate-200/70 px-4 py-3 text-sm dark:border-slate-800"
              >
                {row.members.length === 0 ? (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Everyone is squared up in this group.
                  </p>
                ) : (
                  row.members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between text-slate-600 dark:text-slate-300"
                    >
                      <span>{member.name}</span>
                      <span className={member.balance >= 0 ? "text-emerald-500" : "text-rose-500"}>
                        {row.currency} {Math.abs(member.balance).toFixed(2)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface AmountDisplayProps {
  positive: { currency: string; amount: number }[];
  negative: { currency: string; amount: number }[];
  net: { currency: string; amount: number }[];
  mode: BalanceFilter;
}

type AmountTone = "positive" | "negative" | "neutral";

interface LabeledAmountProps {
  label: string;
  tone: AmountTone;
  value: string;
}

function AmountDisplay({ positive, negative, net, mode }: AmountDisplayProps) {
  const positiveValue = formatAmountList(positive) || "0";
  const negativeValue = formatAmountList(negative) || "0";
  const netValue = formatNetAmountList(net) || "0";

  if (mode === "owedToMe") {
    return <LabeledAmount label="You are owed" tone="positive" value={positiveValue} />;
  }

  if (mode === "iOwe") {
    return <LabeledAmount label="You owe" tone="negative" value={negativeValue} />;
  }

  const hasPositive = net.some((item) => item.amount > EPSILON);
  const hasNegative = net.some((item) => item.amount < -EPSILON);

  let label: string = "Net balance";
  let tone: AmountTone = "neutral";

  if (hasPositive && !hasNegative) {
    label = "You are owed";
    tone = "positive";
  } else if (hasNegative && !hasPositive) {
    label = "You owe";
    tone = "negative";
  }

  return <LabeledAmount label={label} tone={tone} value={netValue} />;
}

function LabeledAmount({ label, tone, value }: LabeledAmountProps) {
  return (
    <span className="flex flex-col items-end text-right">
      <span
        className={cn(
          "text-[11px] font-medium uppercase tracking-wide",
          tone === "positive"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "negative"
            ? "text-rose-600 dark:text-rose-400"
            : "text-slate-500 dark:text-slate-400"
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-semibold",
          tone === "positive"
            ? "text-emerald-500"
            : tone === "negative"
            ? "text-rose-500"
            : "text-slate-600 dark:text-slate-200"
        )}
      >
        {value}
      </span>
    </span>
  );
}

function getDisplayAmounts(
  row: IndividualRow,
  filterMode: BalanceFilter
): AmountDisplayProps {
  const positive = Object.entries(row.owedToMe).map(([currency, amount]) => ({ currency, amount }));
  const negative = Object.entries(row.iOwe).map(([currency, amount]) => ({ currency, amount }));
  const net = Object.entries(row.netByCurrency).map(([currency, amount]) => ({
    currency,
    amount,
  }));

  return {
    positive,
    negative,
    net,
    mode: filterMode,
  };
}

function getGroupDisplay(row: GroupRow, filterMode: BalanceFilter): AmountDisplayProps {
  const positive = row.owedToMe > EPSILON ? [{ currency: row.currency, amount: row.owedToMe }] : [];
  const negative = row.iOwe > EPSILON ? [{ currency: row.currency, amount: row.iOwe }] : [];
  const net = Math.abs(row.net) > EPSILON ? [{ currency: row.currency, amount: row.net }] : [];

  return {
    positive,
    negative,
    net,
    mode: filterMode,
  };
}

function filterIndividuals(overview: BalanceOverviewData, filter: BalanceFilter) {
  return overview.individuals.filter((item) => {
    const owed = Object.values(item.owedToMe).reduce((sum: number, value: number) => sum + value, 0);
    const owe = Object.values(item.iOwe).reduce((sum: number, value: number) => sum + value, 0);
    if (filter === "owedToMe") {
      return owed > EPSILON;
    }
    if (filter === "iOwe") {
      return owe > EPSILON;
    }
    return owed > EPSILON || owe > EPSILON;
  });
}

function filterGroups(groups: BalanceOverviewData["groups"], filter: BalanceFilter) {
  return groups.filter((group) => {
    if (filter === "owedToMe") {
      return group.owedToMe > EPSILON;
    }
    if (filter === "iOwe") {
      return group.iOwe > EPSILON;
    }
    return Math.abs(group.net) > EPSILON;
  });
}

function formatTotals(overview: BalanceOverviewData) {
  if (!overview.totals.length) {
    return "";
  }
  return overview.totals
    .map((item) => `${item.currency} ${item.net >= 0 ? "" : "-"}${Math.abs(item.net).toFixed(2)}`)
    .join(" \u2022 ");
}

function formatAmountList(values: { currency: string; amount: number }[]) {
  if (!values.length) {
    return "";
  }
  return values
    .map((value) => `${value.currency} ${value.amount.toFixed(2)}`)
    .join(" \u2022 ");
}

function formatNetAmountList(values: { currency: string; amount: number }[]) {
  if (!values.length) {
    return "";
  }
  return values
    .map((value) => `${value.currency} ${value.amount >= 0 ? "" : "-"}${Math.abs(value.amount).toFixed(2)}`)
    .join(" \u2022 ");
}

interface GroupSelectorProps {
  groups: GroupSummary[];
  selectedGroupId: string | null;
  onSelect: (groupId: string) => void;
}

function GroupSelector({ groups, selectedGroupId, onSelect }: GroupSelectorProps) {
  const hasGroups = groups.length > 0;

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Who's sharing?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Switch groups to pull in the right people instantly.
          </p>
        </div>
        <Button variant="secondary" size="sm" asChild>
          <Link href="/groups">Manage</Link>
        </Button>
      </div>
      <div className="grid gap-2">
        {hasGroups ? (
          groups.map((group) => {
            const isActive = group.id === selectedGroupId;
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => onSelect(group.id)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand",
                  "border-slate-200/70 bg-white/80 hover:border-brand/80 hover:bg-brand/10 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-brand dark:hover:bg-brand/20",
                  isActive && "border-brand bg-brand/15 text-slate-900 dark:border-brand dark:text-white"
                )}
                aria-pressed={isActive}
              >
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-medium text-slate-900 dark:text-white">{group.name}</p>
                    {group.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{group.description}</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {group.members.length} {group.members.length === 1 ? "member" : "members"}
                  </div>
                </div>
              </button>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300/70 bg-white/70 p-4 text-sm text-slate-500 dark:border-slate-700/70 dark:bg-slate-900/50 dark:text-slate-400">
            No groups yet. Create your first one from the <Link href="/groups" className="font-medium text-brand underline-offset-2 hover:underline">Groups page</Link> to unlock quick switching.
          </div>
        )}
      </div>
    </Card>
  );
}

interface GroupSnapshotProps {
  summary?: GroupSummary;
  detail?: GroupDetail;
}

function GroupSnapshot({ summary, detail }: GroupSnapshotProps) {
  if (!summary) {
    return null;
  }

  const memberCount = detail?.members.length ?? summary.members.length;
  const totalExpenses = detail?.expenses.length ?? 0;
  const settlements = detail?.settlements.length ?? 0;

  return (
    <Card className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Snapshot</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Keep tabs on the essentials before you add a new expense.
        </p>
      </div>
      <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
        <div className="flex items-center justify-between">
          <span>Base currency</span>
          <span className="font-medium text-slate-900 dark:text-white">{detail?.baseCurrency ?? summary.baseCurrency}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Active participants</span>
          <span className="font-medium text-slate-900 dark:text-white">
            {memberCount} {memberCount === 1 ? "person" : "people"}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Recorded expenses</span>
          <span className="font-medium text-slate-900 dark:text-white">{totalExpenses}</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Settlements logged</span>
          <span className="font-medium text-slate-900 dark:text-white">{settlements}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Can't find someone? Use the search field in the editor to invite them on the fly before saving the split.
      </p>
    </Card>
  );
}

interface SnapshotChipProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function SnapshotChip({ icon: Icon, label, value }: SnapshotChipProps) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
      <Icon className="h-4 w-4 text-brand" />
      <span className="uppercase tracking-wide text-[11px] text-slate-400 dark:text-slate-500">{label}</span>
      <span className="text-slate-700 dark:text-slate-200">{value}</span>
    </span>
  );
}







































