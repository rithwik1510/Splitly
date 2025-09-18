import type { Group } from "@prisma/client";
import { Decimal, decimalToNumber } from "../../utils/decimal";
import { AppError } from "../../utils/app-error";
import { prisma } from "../../config/prisma";
import { ensureGroupMember } from "../groups/group.service";

// Export a type alias to satisfy linter for future type expansions
export type __InternalGroupTypeReference = Group;

interface BalanceResult {
  userId: string;
  amount: Decimal;
}

export async function getGroupBalances(groupId: string, userId: string) {
  await ensureGroupMember(groupId, userId);
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: { include: { user: true } },
      expenses: {
        include: {
          shares: true,
        },
      },
      settlements: {
        include: {
          from: true,
          to: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!group) {
    throw new AppError("Group not found", 404, "GROUP_NOT_FOUND");
  }

  const balances = new Map<string, Decimal>();
  group.members.forEach((member) => {
    balances.set(member.userId, new Decimal(0));
  });

  group.expenses.forEach((expense) => {
    const baseAmount = new Decimal(expense.baseAmount);
    const paidBalance = balances.get(expense.paidById) ?? new Decimal(0);
    balances.set(expense.paidById, paidBalance.add(baseAmount));
    expense.shares.forEach((share) => {
      const current = balances.get(share.userId) ?? new Decimal(0);
      balances.set(share.userId, current.sub(new Decimal(share.amount)));
    });
  });

  const summary = group.members.map((member) => ({
    user: {
      id: member.user.id,
      name: member.user.name,
      email: member.user.email,
    },
    balance: decimalToNumber(balances.get(member.userId) ?? 0),
  }));

  return {
    group: {
      id: group.id,
      name: group.name,
      baseCurrency: group.baseCurrency,
    },
    summary,
    settlements: group.settlements.map((settlement) => ({
      id: settlement.id,
      amount: decimalToNumber(settlement.amount),
      currency: settlement.currency,
      note: settlement.note,
      createdAt: settlement.createdAt,
      from: {
        id: settlement.from.id,
        name: settlement.from.name,
        email: settlement.from.email,
      },
      to: {
        id: settlement.to.id,
        name: settlement.to.name,
        email: settlement.to.email,
      },
    })),
  };
}

export function simplifyBalances(summary: { user: { id: string; name: string; email: string }; balance: number }[]) {
  const debtors: BalanceResult[] = [];
  const creditors: BalanceResult[] = [];

  summary.forEach((item) => {
    const amount = new Decimal(item.balance);
    if (amount.gt(0.01)) {
      creditors.push({ userId: item.user.id, amount });
    } else if (amount.lt(-0.01)) {
      debtors.push({ userId: item.user.id, amount: amount.abs() });
    }
  });

  const settlements: { fromUserId: string; toUserId: string; amount: number }[] = [];

  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const transfer = Decimal.min(debtor.amount, creditor.amount);
    settlements.push({
      fromUserId: debtor.userId,
      toUserId: creditor.userId,
      amount: decimalToNumber(transfer),
    });

    debtor.amount = debtor.amount.sub(transfer);
    creditor.amount = creditor.amount.sub(transfer);

    if (debtor.amount.lte(0.01)) {
      i += 1;
    }
    if (creditor.amount.lte(0.01)) {
      j += 1;
    }
  }

  return settlements;
}

export async function recordSettlement(
  groupId: string,
  userId: string,
  input: { fromUserId: string; toUserId: string; amount: number; note?: string }
) {
  await ensureGroupMember(groupId, userId);
  await ensureGroupMember(groupId, input.fromUserId);
  await ensureGroupMember(groupId, input.toUserId);

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    throw new AppError("Group not found", 404, "GROUP_NOT_FOUND");
  }

  const settlement = await prisma.settlement.create({
    data: {
      group: { connect: { id: groupId } },
      from: { connect: { id: input.fromUserId } },
      to: { connect: { id: input.toUserId } },
      amount: new Decimal(input.amount),
      currency: group.baseCurrency,
      note: input.note,
    },
    include: {
      from: true,
      to: true,
    },
  });

  return {
    id: settlement.id,
    amount: decimalToNumber(settlement.amount),
    currency: settlement.currency,
    note: settlement.note,
    createdAt: settlement.createdAt,
    from: {
      id: settlement.from.id,
      name: settlement.from.name,
      email: settlement.from.email,
    },
    to: {
      id: settlement.to.id,
      name: settlement.to.name,
      email: settlement.to.email,
    },
  };
}
