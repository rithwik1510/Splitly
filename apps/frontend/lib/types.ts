import { GroupRole, SplitMode } from "@splitwise/shared";

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface GroupMember {
  id: string;
  role: GroupRole;
  user: User;
}

export interface GroupSummary {
  id: string;
  name: string;
  description?: string | null;
  baseCurrency: string;
  members: GroupMember[];
}

export interface ExpenseShareView {
  id: string;
  user: User;
  amount: number;
  percent: number | null;
  weight: number | null;
}

export interface ExpenseView {
  id: string;
  groupId: string;
  description: string;
  notes?: string | null;
  currency: string;
  amount: number;
  baseCurrency: string;
  baseAmount: number;
  fxRateUsed: number;
  paidBy: User;
  occurredAt: string;
  splitMode: SplitMode;
  shares: ExpenseShareView[];
}

export interface SettlementView {
  id: string;
  amount: number;
  currency: string;
  note?: string | null;
  createdAt: string;
  from: User;
  to: User;
}

export interface GroupDetail extends GroupSummary {
  expenses: ExpenseView[];
  settlements: SettlementView[];
}

export interface BalanceSummaryItem {
  user: User;
  balance: number;
}

export interface BalancesResponse {
  group: {
    id: string;
    name: string;
    baseCurrency: string;
  };
  summary: BalanceSummaryItem[];
  settlements: SettlementView[];
}

export interface SimplifiedSettlement {
  fromUserId: string;
  toUserId: string;
  amount: number;
}

export interface SimplifyResponse {
  settlements: SimplifiedSettlement[];
  currency: string;
}