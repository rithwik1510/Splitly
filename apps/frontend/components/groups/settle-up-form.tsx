"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { settleGroup } from "@/lib/groups";
import type { GroupDetail } from "@/lib/types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Spinner } from "../ui/spinner";

interface SettleUpFormProps {
  group: GroupDetail;
  defaultFromUserId?: string;
  defaultToUserId?: string;
  defaultAmount?: number;
}

interface FormValues {
  fromUserId: string;
  toUserId: string;
  amount: number;
  note?: string;
}

export function SettleUpForm({ group, defaultFromUserId, defaultToUserId, defaultAmount }: SettleUpFormProps) {
  const queryClient = useQueryClient();

  const buildDefaults = useMemo(
    () => () => ({
      fromUserId: defaultFromUserId ?? group.members[0]?.user.id ?? "",
      toUserId:
        defaultToUserId ?? group.members[1]?.user.id ?? group.members[0]?.user.id ?? "",
      amount: defaultAmount ?? 0,
      note: "",
    }),
    [defaultAmount, defaultFromUserId, defaultToUserId, group.members]
  );

  const form = useForm<FormValues>({
    defaultValues: buildDefaults(),
  });

  useEffect(() => {
    form.reset(buildDefaults());
  }, [buildDefaults, form]);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => settleGroup(group.id, values),
    onSuccess: () => {
      toast.success("Settlement recorded");
      void queryClient.invalidateQueries({ queryKey: ["group", group.id] });
      void queryClient.invalidateQueries({ queryKey: ["balances", group.id] });
      form.reset(buildDefaults());
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "We could not record the settlement. Try again shortly.");
    },
  });

  const onSubmit = form.handleSubmit((values) => {
    if (values.fromUserId === values.toUserId) {
      toast.error("Please select two different people.");
      return;
    }
    mutation.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-xl border border-slate-200/70 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Record settlement</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Base currency: {group.baseCurrency}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="from">From</Label>
          <select
            id="from"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            {...form.register("fromUserId")}
          >
            {group.members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="to">To</Label>
          <select
            id="to"
            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            {...form.register("toUserId")}
          >
            {group.members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" type="number" step="0.01" min="0" {...form.register("amount", { valueAsNumber: true })} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note</Label>
          <Input id="note" placeholder="Optional" {...form.register("note")} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? <Spinner size={18} /> : "Record"}
        </Button>
      </div>
    </form>
  );
}
