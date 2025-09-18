"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ExpenseEditor } from "@/components/expenses/expense-editor";
import { ExpenseList } from "@/components/expenses/expense-list";
import { AddMemberCard } from "@/components/groups/add-member-card";
import { BalanceSummary } from "@/components/groups/balance-summary";
import { GroupMembersList } from "@/components/groups/group-members-list";
import { SettlementHistory } from "@/components/groups/settlement-history";
import { SettleUpForm } from "@/components/groups/settle-up-form";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getGroupBalances, getGroupDetail, simplifyGroup } from "@/lib/groups";
import type { SimplifiedSettlement } from "@/lib/types";

export default function GroupDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth({ requireAuth: true });
  const groupId = String(params?.id);
  const queryClient = useQueryClient();
  const [simplified, setSimplified] = useState<SimplifiedSettlement[] | undefined>();

  const groupQuery = useQuery({
    queryKey: ["group", groupId],
    queryFn: () => getGroupDetail(groupId),
    enabled: Boolean(groupId),
  });

  const balancesQuery = useQuery({
    queryKey: ["balances", groupId],
    queryFn: () => getGroupBalances(groupId),
    enabled: Boolean(groupId),
  });

  const simplifyMutation = useMutation({
    mutationFn: () => simplifyGroup(groupId),
    onSuccess: (data) => {
      setSimplified(data.settlements);
      toast.success("Generated a minimal settlement plan");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "We could not simplify the balances. Try refreshing the page.");
    },
  });

  if (groupQuery.isLoading || balancesQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-slate-500 dark:text-slate-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading group...
      </div>
    );
  }

  if (!groupQuery.data || !balancesQuery.data) {
    return <p className="text-center text-sm text-red-500">Unable to load this group.</p>;
  }

  const group = groupQuery.data;
  const balances = balancesQuery.data;


  const settleWith = searchParams.get("settleWith");
  const settleMode = searchParams.get("settleMode");
  const settleDefaults = useMemo(() => {
    if (!user) {
      return {};
    }
    if (!settleWith) {
      return {};
    }
    const memberIds = group.members.map((member) => member.user.id);
    if (!memberIds.includes(settleWith)) {
      return {};
    }
    if (!memberIds.includes(user.id)) {
      return {};
    }
    const mode = settleMode === "pay" ? "pay" : "receive";
    return {
      defaultFromUserId: mode === "receive" ? settleWith : user.id,
      defaultToUserId: mode === "receive" ? user.id : settleWith,
    };
  }, [group.members, settleMode, settleWith, user]);

  const refreshGroup = () => {
    void queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    void queryClient.invalidateQueries({ queryKey: ["balances", groupId] });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 border-b border-slate-200/70 pb-6 dark:border-slate-800/70">
        <h1 className="text-3xl font-semibold text-slate-900 dark:text-white">{group.name}</h1>
        {group.description && <p className="text-sm text-slate-500 dark:text-slate-400">{group.description}</p>}
        <div className="flex gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>Base currency: {group.baseCurrency}</span>
          <span>{group.members.length} members</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ExpenseEditor group={group} onCreated={refreshGroup} />
          <ExpenseList groupId={groupId} expenses={group.expenses} />
        </div>
        <div className="space-y-6">
          <BalanceSummary balances={balances} simplified={simplified} />
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => simplifyMutation.mutate()}
            disabled={simplifyMutation.isPending}
          >
            {simplifyMutation.isPending ? "Computing..." : "Simplify balances"}
          </Button>
          <SettleUpForm
            group={group}
            defaultFromUserId={settleDefaults.defaultFromUserId}
            defaultToUserId={settleDefaults.defaultToUserId}
          />
          <AddMemberCard groupId={groupId} />
          <GroupMembersList members={group.members} />
        </div>
      </div>

      <SettlementHistory settlements={group.settlements} />
    </div>
  );
}












