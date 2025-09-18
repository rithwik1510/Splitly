"use client";

import { SUPPORTED_CURRENCIES, SplitMode } from "@splitwise/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { addGroupMember } from "@/lib/groups";
import { createExpense } from "@/lib/expenses";
import { searchUsers } from "@/lib/users";
import type { GroupDetail, GroupMember } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";

interface ExpenseEditorProps {
  group: GroupDetail;
  onCreated: () => void;
}

interface FormValues {
  description: string;
  amount: number;
  currency: string;
  fxRateUsed: number;
  incurredOn: string;
  paidById: string;
  splitMode: SplitMode;
  notes?: string;
}

interface ShareRow {
  userId: string;
  amount: number;
  percent: number;
  weight: number;
}

const createInitialShares = (members: GroupMember[]): ShareRow[] =>
  members.map((member) => ({
    userId: member.user.id,
    amount: 0,
    percent: 0,
    weight: 1,
  }));

export function ExpenseEditor({ group, onCreated }: ExpenseEditorProps) {
  const queryClient = useQueryClient();
  const [participants, setParticipants] = useState<GroupMember[]>(group.members);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    group.members.map((member) => member.user.id)
  );
  const [shares, setShares] = useState<ShareRow[]>(createInitialShares(group.members));
  const [userSearch, setUserSearch] = useState("");

  const form = useForm<FormValues>({
    defaultValues: {
      description: "",
      amount: 0,
      currency: group.baseCurrency,
      fxRateUsed: 1,
      incurredOn: new Date().toISOString().slice(0, 10),
      paidById: group.members[0]?.user.id ?? "",
      splitMode: SplitMode.EQUAL,
      notes: "",
    },
  });

  useEffect(() => {
    setParticipants(group.members);
    const memberIds = group.members.map((member) => member.user.id);
    setSelectedMembers(memberIds);
    setShares(createInitialShares(group.members));
    form.reset({
      description: "",
      amount: 0,
      currency: group.baseCurrency,
      fxRateUsed: 1,
      incurredOn: new Date().toISOString().slice(0, 10),
      paidById: group.members[0]?.user.id ?? "",
      splitMode: SplitMode.EQUAL,
      notes: "",
    });
  }, [group, form]);

  const amount = form.watch("amount");
  const splitMode = form.watch("splitMode");
  const currency = form.watch("currency");
  const fxRateUsed = form.watch("fxRateUsed");

  useEffect(() => {
    if (currency === group.baseCurrency) {
      form.setValue("fxRateUsed", 1, { shouldDirty: true });
    }
  }, [currency, group.baseCurrency, form]);

  useEffect(() => {
    const paidBy = form.getValues("paidById");
    if (participants.length === 0) {
      return;
    }
    if (!paidBy || !participants.some((member) => member.user.id === paidBy)) {
      form.setValue("paidById", participants[0].user.id, { shouldDirty: false });
    }
  }, [participants, form]);

  useEffect(() => {
    if (shares.length === 0 || selectedMembers.length === 0) return;
    const count = selectedMembers.length || 1;

    if (splitMode === SplitMode.EQUAL) {
      const perHead = amount > 0 ? Number((amount / count).toFixed(2)) : 0;
      setShares((prev) =>
        prev.map((share) => ({
          ...share,
          amount: selectedMembers.includes(share.userId) ? perHead : 0,
          percent:
            selectedMembers.includes(share.userId) && amount > 0
              ? Number((100 / count).toFixed(4))
              : 0,
          weight: 1,
        }))
      );
    } else if (splitMode === SplitMode.PERCENT) {
      setShares((prev) =>
        prev.map((share) => ({
          ...share,
          percent: selectedMembers.includes(share.userId)
            ? Number((100 / count).toFixed(4))
            : 0,
          amount:
            selectedMembers.includes(share.userId) && amount > 0
              ? Number(((amount * (100 / count)) / 100).toFixed(2))
              : 0,
          weight: 1,
        }))
      );
    } else if (splitMode === SplitMode.SHARES) {
      setShares((prev) =>
        prev.map((share) => ({
          ...share,
          weight: selectedMembers.includes(share.userId) ? 1 : 0,
          amount:
            selectedMembers.includes(share.userId) && amount > 0
              ? Number((amount / count).toFixed(2))
              : 0,
          percent:
            selectedMembers.includes(share.userId) && amount > 0
              ? Number((100 / count).toFixed(4))
              : 0,
        }))
      );
    }
  }, [amount, splitMode, selectedMembers, shares.length]);

  const baseAmount = useMemo(() => Number((amount * fxRateUsed).toFixed(2)), [amount, fxRateUsed]);

  const totals = useMemo(() => {
    const relevantShares = shares.filter((share) => selectedMembers.includes(share.userId));
    const amountSum = relevantShares.reduce((acc, share) => acc + share.amount, 0);
    const percentSum = relevantShares.reduce((acc, share) => acc + share.percent, 0);
    const weightSum = relevantShares.reduce((acc, share) => acc + share.weight, 0);
    return {
      amountSum: Number(amountSum.toFixed(2)),
      percentSum: Number(percentSum.toFixed(2)),
      weightSum: Number(weightSum.toFixed(2)),
    };
  }, [selectedMembers, shares]);

  const expenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast.success("Expense saved");
      onCreated();
      setSelectedMembers(participants.map((member) => member.user.id));
      setShares(createInitialShares(participants));
      form.reset({
        description: "",
        amount: 0,
        currency: group.baseCurrency,
        fxRateUsed: 1,
        incurredOn: new Date().toISOString().slice(0, 10),
        paidById: participants[0]?.user.id ?? "",
        splitMode: SplitMode.EQUAL,
        notes: "",
      });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "We could not save this expense. Review the fields and try again.");
    },
  });

  const toggleMember = (userId: string) => {
    setSelectedMembers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const updateShare = (userId: string, field: keyof ShareRow, value: number) => {
    setShares((prev) =>
      prev.map((share) => (share.userId === userId ? { ...share, [field]: value } : share))
    );
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one participant.");
      return;
    }
    const payload = {
      groupId: group.id,
      description: values.description,
      notes: values.notes,
      currency: values.currency,
      amount: Number(values.amount),
      baseCurrency: group.baseCurrency,
      baseAmount,
      fxRateUsed: values.fxRateUsed,
      paidById: values.paidById,
      occurredAt: values.incurredOn,
      splitMode: values.splitMode,
      shares: shares
        .filter((share) => selectedMembers.includes(share.userId))
        .map((share) => ({
          userId: share.userId,
          amount: Number(share.amount),
          percent: values.splitMode === SplitMode.PERCENT ? Number(share.percent) : null,
          weight: values.splitMode === SplitMode.SHARES ? Number(share.weight) : null,
        })),
    };
    expenseMutation.mutate(payload);
  });

  const resultsQuery = useQuery({
    queryKey: ["user-search", userSearch],
    queryFn: () => searchUsers(userSearch),
    enabled: userSearch.trim().length > 1,
  });

  const filteredResults = useMemo(
    () =>
      (resultsQuery.data ?? []).filter(
        (user) => !participants.some((member) => member.user.id === user.id)
      ),
    [resultsQuery.data, participants]
  );

  const addParticipantMutation = useMutation({
    mutationFn: (userId: string) => addGroupMember(group.id, userId),
    onSuccess: (member) => {
      toast.success(`Added ${member.user.name} to this group`);
      setParticipants((prev) => {
        if (prev.some((existing) => existing.user.id === member.user.id)) {
          return prev;
        }
        return [...prev, member];
      });
      setShares((prev) => {
        if (prev.some((share) => share.userId === member.user.id)) {
          return prev;
        }
        return [...prev, { userId: member.user.id, amount: 0, percent: 0, weight: 1 }];
      });
      setSelectedMembers((prev) =>
        prev.includes(member.user.id) ? prev : [...prev, member.user.id]
      );
      if (!form.getValues("paidById")) {
        form.setValue("paidById", member.user.id, { shouldDirty: true });
      }
      setUserSearch("");
      void queryClient.invalidateQueries({ queryKey: ["group", group.id] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "We could not add that participant. Refresh the page and try again.");
    },
  });

  return (
    <Card className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add expense</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Track what was paid, who participated, and how you split the cost.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input id="description" placeholder="Dinner at Spice Hub" {...form.register("description")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paidBy">Paid by</Label>
            <select
              id="paidBy"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              {...form.register("paidById")}
            >
              {participants.map((member) => (
                <option key={member.user.id} value={member.user.id}>
                  {member.user.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input id="amount" type="number" step="0.01" min="0" {...form.register("amount", { valueAsNumber: true })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              {...form.register("currency")}
            >
              {SUPPORTED_CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          {currency !== group.baseCurrency && (
            <div className="space-y-2">
              <Label htmlFor="fxRate">FX rate to {group.baseCurrency}</Label>
              <Input
                id="fxRate"
                type="number"
                step="0.0001"
                min="0"
                {...form.register("fxRateUsed", { valueAsNumber: true })}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="incurred">Date</Label>
            <Input id="incurred" type="date" {...form.register("incurredOn")} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" placeholder="Optional details" {...form.register("notes")} />
          </div>
        </div>

        <div className="space-y-3">
          <Label>Split mode</Label>
          <div className="flex flex-wrap gap-2">
            {Object.values(SplitMode).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => form.setValue("splitMode", mode, { shouldDirty: true })}
                className={cn(
                  "rounded-full border px-4 py-1 text-sm capitalize transition-colors",
                  splitMode === mode
                    ? "border-brand bg-brand/10 text-brand dark:bg-brand/20"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                )}
              >
                {mode.toLowerCase()}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Base amount ({group.baseCurrency}): {baseAmount.toFixed(2)} &middot; Participants: {selectedMembers.length}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="participant-search">Add participants</Label>
          <Input
            id="participant-search"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
            placeholder="Search by name or email"
          />
          {userSearch.trim().length > 1 && (
            <div className="rounded-lg border border-slate-200/70 bg-white/80 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/70">
              {resultsQuery.isFetching ? (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Spinner size={16} /> Searching...
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="space-y-2">
                  {filteredResults.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => addParticipantMutation.mutate(user.id)}
                        disabled={addParticipantMutation.isPending}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">No new users found. Participants already in the group are hidden.</p>
              )}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200/70 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 text-left">Include</th>
                <th className="px-4 py-2 text-left">Participant</th>
                <th className="px-4 py-2 text-left">Amount</th>
                {splitMode === SplitMode.PERCENT && <th className="px-4 py-2 text-left">Percent</th>}
                {splitMode === SplitMode.SHARES && <th className="px-4 py-2 text-left">Weight</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm dark:divide-slate-800">
              {participants.map((member) => {
                const share = shares.find((item) => item.userId === member.user.id) ?? {
                  userId: member.user.id,
                  amount: 0,
                  percent: 0,
                  weight: 1,
                };
                const included = selectedMembers.includes(member.user.id);
                return (
                  <tr key={member.user.id} className={!included ? "opacity-60" : undefined}>
                    <td className="px-4 py-2">
                      <input
                        type="checkbox"
                        checked={included}
                        onChange={() => toggleMember(member.user.id)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-slate-900 dark:text-white">{member.user.name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{member.user.email}</div>
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={share.amount}
                        disabled={splitMode !== SplitMode.UNEQUAL || !included}
                        onChange={(event) => updateShare(member.user.id, "amount", Number(event.target.value))}
                      />
                    </td>
                    {splitMode === SplitMode.PERCENT && (
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={share.percent}
                          disabled={!included}
                          onChange={(event) => updateShare(member.user.id, "percent", Number(event.target.value))}
                        />
                      </td>
                    )}
                    {splitMode === SplitMode.SHARES && (
                      <td className="px-4 py-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={share.weight}
                          disabled={!included}
                          onChange={(event) => updateShare(member.user.id, "weight", Number(event.target.value))}
                        />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="flex flex-wrap justify-end gap-6 bg-slate-100 px-4 py-2 text-xs text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
            <span>Total amount: {totals.amountSum.toFixed(2)}</span>
            {splitMode === SplitMode.PERCENT && <span>Total percent: {totals.percentSum.toFixed(2)}%</span>}
            {splitMode === SplitMode.SHARES && <span>Total weight: {totals.weightSum.toFixed(2)}</span>}
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={expenseMutation.isPending}>
            {expenseMutation.isPending ? <Spinner size={18} /> : "Save expense"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
