import { Router } from "express";
import { z } from "zod";
import { SplitMode } from "@splitwise/shared";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { decimalToNumber } from "../../utils/decimal";
import {
  createExpense,
  deleteExpense,
  listExpensesForGroup,
  listExpensesForUser,
  updateExpense,
  type ExpenseInput,
} from "./expenses.service";

const router = Router();

const shareSchema = z.object({
  userId: z.string().cuid(),
  amount: z.number().min(0),
  percent: z.number().min(0).max(100).nullable().optional(),
  weight: z.number().min(0).nullable().optional(),
});

const expenseSchema = z.object({
  groupId: z.string().cuid(),
  description: z.string().min(1).max(250),
  notes: z.string().max(500).nullable().optional(),
  currency: z.string().length(3),
  amount: z.number().positive(),
  baseCurrency: z.string().length(3),
  baseAmount: z.number().positive(),
  fxRateUsed: z.number().positive(),
  paidById: z.string().cuid(),
  occurredAt: z.coerce.date().optional(),
  splitMode: z.nativeEnum(SplitMode),
  shares: z.array(shareSchema).min(1),
});

function serializeExpense(expense: Awaited<ReturnType<typeof createExpense>>) {
  return {
    id: expense.id,
    groupId: expense.groupId,
    description: expense.description,
    notes: expense.notes,
    currency: expense.currency,
    amount: decimalToNumber(expense.amount),
    baseCurrency: expense.baseCurrency,
    baseAmount: decimalToNumber(expense.baseAmount),
    fxRateUsed: Number(expense.fxRateUsed),
    paidBy: {
      id: expense.paidBy.id,
      name: expense.paidBy.name,
      email: expense.paidBy.email,
    },
    occurredAt: expense.occurredAt,
    splitMode: expense.splitMode,
    shares: expense.shares.map((share) => ({
      id: share.id,
      user: {
        id: share.user.id,
        name: share.user.name,
        email: share.user.email,
      },
      amount: decimalToNumber(share.amount),
      percent: share.percent ? Number(share.percent) : null,
      weight: share.weight ? Number(share.weight) : null,
    })),
  };
}

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const expenses = await listExpensesForUser(req.user!.sub);
    res.json({
      expenses: expenses.map((expense) => ({
        id: expense.id,
        group: {
          id: expense.group.id,
          name: expense.group.name,
          baseCurrency: expense.group.baseCurrency,
        },
        description: expense.description,
        notes: expense.notes,
        currency: expense.currency,
        amount: decimalToNumber(expense.amount),
        baseCurrency: expense.baseCurrency,
        baseAmount: decimalToNumber(expense.baseAmount),
        fxRateUsed: Number(expense.fxRateUsed),
        paidBy: {
          id: expense.paidBy.id,
          name: expense.paidBy.name,
          email: expense.paidBy.email,
        },
        occurredAt: expense.occurredAt,
        splitMode: expense.splitMode,
        shares: expense.shares.map((share) => ({
          id: share.id,
          user: {
            id: share.user.id,
            name: share.user.name,
            email: share.user.email,
          },
          amount: decimalToNumber(share.amount),
          percent: share.percent ? Number(share.percent) : null,
          weight: share.weight ? Number(share.weight) : null,
        })),
      })),
    });
  })
);

router.get(
  "/group/:groupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = z.object({ groupId: z.string().cuid() }).parse(req.params);
    const expenses = await listExpensesForGroup(params.groupId, req.user!.sub);
    res.json({ expenses: expenses.map(serializeExpense) });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = expenseSchema.parse(req.body) as ExpenseInput;
    const expense = await createExpense(req.user!.sub, body);
    res.status(201).json({ expense: serializeExpense(expense) });
  })
);

router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().cuid() }).parse(req.params);
    const body = expenseSchema.parse(req.body) as ExpenseInput;
    const expense = await updateExpense(req.user!.sub, params.id, body);
    res.json({ expense: serializeExpense(expense) });
  })
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().cuid() }).parse(req.params);
    await deleteExpense(req.user!.sub, params.id);
    res.status(204).send();
  })
);

export const expensesRouter = router;