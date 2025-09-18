import { SplitMode } from "@splitwise/shared";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/app-error";
import { Decimal, decimalSum, isApproximatelyEqual } from "../../utils/decimal";
import { ensureGroupMember } from "../groups/group.service";

export interface ShareInput {
  userId: string;
  amount: number;
  percent?: number | null;
  weight?: number | null;
}

export interface ExpenseInput {
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
  shares: ShareInput[];
}

function validateShares(input: ExpenseInput) {
  if (input.shares.length === 0) {
    throw new AppError("At least one share is required", 400, "SHARE_REQUIRED");
  }

  const seen = new Set<string>();
  for (const share of input.shares) {
    if (seen.has(share.userId)) {
      throw new AppError("Duplicate share user", 400, "SHARE_DUPLICATE");
    }
    seen.add(share.userId);
  }

  const baseAmount = new Decimal(input.baseAmount);
  const sum = decimalSum(input.shares.map((s) => s.amount));
  if (!isApproximatelyEqual(sum, baseAmount)) {
    throw new AppError("Share amounts must equal total base amount", 400, "SHARE_TOTAL_MISMATCH");
  }

  switch (input.splitMode) {
    case SplitMode.EQUAL: {
      const expected = baseAmount.div(input.shares.length);
      input.shares.forEach((share) => {
        if (!isApproximatelyEqual(share.amount, expected)) {
          throw new AppError("Equal split requires uniform share amounts", 400, "EQUAL_INVALID");
        }
      });
      break;
    }
    case SplitMode.PERCENT: {
      const totalPercent = decimalSum(input.shares.map((s) => s.percent ?? 0));
      if (!isApproximatelyEqual(totalPercent, 100)) {
        throw new AppError("Percent splits must total 100%", 400, "PERCENT_TOTAL_INVALID");
      }
      input.shares.forEach((share) => {
        if (share.percent === undefined || share.percent === null) {
          throw new AppError("Percent splits require percent values", 400, "PERCENT_MISSING");
        }
        const expected = baseAmount.mul(share.percent).div(100);
        if (!isApproximatelyEqual(share.amount, expected)) {
          throw new AppError("Share amount does not match percent", 400, "PERCENT_MISMATCH");
        }
      });
      break;
    }
    case SplitMode.SHARES: {
      const totalWeight = decimalSum(input.shares.map((s) => s.weight ?? 0));
      if (totalWeight.lte(0)) {
        throw new AppError("Share splits require positive weights", 400, "WEIGHT_TOTAL_INVALID");
      }
      input.shares.forEach((share) => {
        if (!share.weight) {
          throw new AppError("Each share must include weight", 400, "WEIGHT_MISSING");
        }
        const expected = baseAmount.mul(share.weight).div(totalWeight);
        if (!isApproximatelyEqual(share.amount, expected)) {
          throw new AppError("Share amount does not match weight", 400, "WEIGHT_MISMATCH");
        }
      });
      break;
    }
    case SplitMode.UNEQUAL:
    default:
      break;
  }
}

function toPrismaShares(shares: ShareInput[]) {
  return shares.map((share) => ({
    user: { connect: { id: share.userId } },
    amount: new Decimal(share.amount),
    percent: share.percent !== undefined && share.percent !== null ? new Decimal(share.percent) : undefined,
    weight: share.weight !== undefined && share.weight !== null ? new Decimal(share.weight) : undefined,
  }));
}

export async function createExpense(userId: string, input: ExpenseInput) {
  await ensureGroupMember(input.groupId, userId);
  await ensureGroupMember(input.groupId, input.paidById);
  await Promise.all(input.shares.map((share) => ensureGroupMember(input.groupId, share.userId)));
  validateShares(input);

  return prisma.expense.create({
    data: {
      group: { connect: { id: input.groupId } },
      description: input.description,
      notes: input.notes,
      currency: input.currency,
      amount: new Decimal(input.amount),
      baseCurrency: input.baseCurrency,
      baseAmount: new Decimal(input.baseAmount),
      fxRateUsed: new Decimal(input.fxRateUsed),
      paidBy: { connect: { id: input.paidById } },
      occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
      splitMode: input.splitMode,
      shares: {
        create: toPrismaShares(input.shares),
      },
    },
    include: {
      paidBy: true,
      shares: {
        include: { user: true },
      },
    },
  });
}

export async function updateExpense(userId: string, expenseId: string, input: ExpenseInput) {
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) {
    throw new AppError("Expense not found", 404, "EXPENSE_NOT_FOUND");
  }
  await ensureGroupMember(existing.groupId, userId);
  if (existing.groupId !== input.groupId) {
    throw new AppError("Cannot change group for expense", 400, "EXPENSE_GROUP_IMMUTABLE");
  }

  await ensureGroupMember(input.groupId, input.paidById);
  await Promise.all(input.shares.map((share) => ensureGroupMember(input.groupId, share.userId)));
  validateShares(input);

  return prisma.$transaction(async (tx) => {
    await tx.expenseShare.deleteMany({ where: { expenseId } });
    return tx.expense.update({
      where: { id: expenseId },
      data: {
        description: input.description,
        notes: input.notes,
        currency: input.currency,
        amount: new Decimal(input.amount),
        baseCurrency: input.baseCurrency,
        baseAmount: new Decimal(input.baseAmount),
        fxRateUsed: new Decimal(input.fxRateUsed),
        paidById: input.paidById,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : undefined,
        splitMode: input.splitMode,
        shares: {
          create: toPrismaShares(input.shares),
        },
      },
      include: {
        paidBy: true,
        shares: { include: { user: true } },
      },
    });
  });
}

export async function deleteExpense(userId: string, expenseId: string) {
  const existing = await prisma.expense.findUnique({ where: { id: expenseId } });
  if (!existing) {
    throw new AppError("Expense not found", 404, "EXPENSE_NOT_FOUND");
  }
  await ensureGroupMember(existing.groupId, userId);

  await prisma.$transaction(async (tx) => {
    await tx.expenseShare.deleteMany({ where: { expenseId } });
    await tx.expense.delete({ where: { id: expenseId } });
  });
}

export async function listExpensesForUser(userId: string) {
  return prisma.expense.findMany({
    where: {
      OR: [
        { paidById: userId },
        { shares: { some: { userId } } },
      ],
    },
    include: {
      group: true,
      paidBy: true,
      shares: {
        include: { user: true },
      },
    },
    orderBy: {
      occurredAt: "desc",
    },
    take: 50,
  });
}

export async function listExpensesForGroup(groupId: string, userId: string) {
  await ensureGroupMember(groupId, userId);
  return prisma.expense.findMany({
    where: { groupId },
    include: {
      paidBy: true,
      shares: {
        include: { user: true },
      },
    },
    orderBy: {
      occurredAt: "desc",
    },
  });
}