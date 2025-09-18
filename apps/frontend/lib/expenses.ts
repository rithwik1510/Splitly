import { SplitMode } from "@splitwise/shared";
import api from "./api-client";
import type { ExpenseView } from "./types";

export interface ExpensePayload {
  groupId: string;
  description: string;
  notes?: string | null;
  currency: string;
  amount: number;
  baseCurrency: string;
  baseAmount: number;
  fxRateUsed: number;
  paidById: string;
  occurredAt?: string | Date;
  splitMode: SplitMode;
  shares: Array<{
    userId: string;
    amount: number;
    percent?: number | null;
    weight?: number | null;
  }>;
}

export async function createExpense(payload: ExpensePayload): Promise<ExpenseView> {
  const { data } = await api.post<{ expense: ExpenseView }>("/expenses", payload);
  return data.expense;
}

export async function updateExpense(
  id: string,
  payload: ExpensePayload
): Promise<ExpenseView> {
  const { data } = await api.put<{ expense: ExpenseView }>(`/expenses/${id}`, payload);
  return data.expense;
}

export async function deleteExpense(id: string) {
  await api.delete(`/expenses/${id}`);
}
