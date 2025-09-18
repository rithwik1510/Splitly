import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import { asyncHandler } from "../../utils/async-handler";
import { getGroupBalances, recordSettlement, simplifyBalances } from "./balances.service";

const router = Router();

router.get(
  "/group/:groupId",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = z.object({ groupId: z.string().cuid() }).parse(req.params);
    const result = await getGroupBalances(params.groupId, req.user!.sub);
    res.json(result);
  })
);

router.get(
  "/group/:groupId/simplify",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = z.object({ groupId: z.string().cuid() }).parse(req.params);
    const balances = await getGroupBalances(params.groupId, req.user!.sub);
    const settlements = simplifyBalances(balances.summary);
    res.json({
      settlements,
      currency: balances.group.baseCurrency,
    });
  })
);

router.post(
  "/group/:groupId/settlements",
  requireAuth,
  asyncHandler(async (req, res) => {
    const params = z.object({ groupId: z.string().cuid() }).parse(req.params);
    const body = z
      .object({
        fromUserId: z.string().cuid(),
        toUserId: z.string().cuid(),
        amount: z.number().positive(),
        note: z.string().max(200).optional(),
      })
      .parse(req.body);
    const settlement = await recordSettlement(params.groupId, req.user!.sub, body);
    res.status(201).json({ settlement });
  })
);

export const balancesRouter = router;