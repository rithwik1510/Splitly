"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import dayjs from "dayjs";
import { toast } from "sonner";
import { deleteExpense } from "@/lib/expenses";
import type { GroupDetail } from "@/lib/types";
import { Button } from "../ui/button";

interface ExpenseListProps {
  groupId: string;
  expenses: GroupDetail["expenses"];
}

export function ExpenseList({ groupId, expenses }: ExpenseListProps) {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onSuccess: () => {
      toast.success("Expense deleted");
      void queryClient.invalidateQueries({ queryKey: ["group", groupId] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message ?? "We could not delete the expense. Try again in a moment.");
    },
  });

  if (expenses.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
        No expenses yet. Capture your first shared cost to keep everyone in sync.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {expenses.map((expense) => (
        <div
          key={expense.id}
          className="flex flex-col gap-2 rounded-xl border border-slate-200/70 bg-white/80 p-4 transition-colors dark:border-slate-800 dark:bg-slate-900/60 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">{expense.description}</h4>
              <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand dark:bg-brand/20">
                {expense.currency} {expense.amount.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Paid by {expense.paidBy.name} - {dayjs(expense.occurredAt).format("DD MMM YYYY")}
            </p>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              {expense.shares.map((share) => (
                <div key={share.id}>
                  {share.user.name}: {expense.baseCurrency} {share.amount.toFixed(2)}
                </div>
              ))}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="self-end text-rose-500 hover:bg-rose-500/10 hover:text-rose-400"
            onClick={() => deleteMutation.mutate(expense.id)}
            disabled={deleteMutation.isPending}
          >
            <Trash2 size={16} className="mr-1" /> Delete
          </Button>
        </div>
      ))}
    </div>
  );
}
