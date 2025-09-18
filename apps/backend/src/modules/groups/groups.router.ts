import { Router } from "express";
import { z } from "zod";
import { GroupRole } from "@splitwise/shared";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { decimalToNumber } from "../../utils/decimal";
import {
  addMemberToGroup,
  createGroupForUser,
  getGroupDetail,
  listGroupsForUser,
} from "./group.service";

const router = Router();

const createGroupSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  baseCurrency: z.string().length(3),
});

const addMemberSchema = z.object({
  userId: z.string().cuid(),
});

router.get(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const groups = await listGroupsForUser(req.user!.sub);
    res.json({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        baseCurrency: group.baseCurrency,
        description: group.description,
        members: group.members.map((member) => ({
          id: member.id,
          role: member.role,
          user: {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
          },
        })),
      })),
    });
  })
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const body = createGroupSchema.parse(req.body);
    const group = await createGroupForUser(req.user!.sub, body);
    res.status(201).json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        baseCurrency: group.baseCurrency,
        members: group.members.map((member) => ({
          id: member.id,
          role: member.role as GroupRole,
          user: {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
          },
        })),
      },
    });
  })
);

router.post(
  "/:id/members",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().cuid() }).parse(req.params);
    const body = addMemberSchema.parse(req.body);
    const member = await addMemberToGroup(params.id, body.userId, req.user!.sub);
    res.status(201).json({
      member: {
        id: member.id,
        role: member.role,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
        },
      },
    });
  })
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = z.object({ id: z.string().cuid() }).parse(req.params);
    const group = await getGroupDetail(params.id, req.user!.sub);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }
    res.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        baseCurrency: group.baseCurrency,
        members: group.members.map((member) => ({
          id: member.id,
          role: member.role,
          user: {
            id: member.user.id,
            name: member.user.name,
            email: member.user.email,
          },
        })),
        expenses: group.expenses.map((expense) => ({
          id: expense.id,
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
        settlements: group.settlements.map((settlement) => ({
          id: settlement.id,
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
          amount: decimalToNumber(settlement.amount),
          currency: settlement.currency,
          note: settlement.note,
          createdAt: settlement.createdAt,
        })),
      },
    });
  })
);

export const groupsRouter = router;