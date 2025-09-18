import type { Express, Request, Response } from "express";
import { authRouter } from "../modules/auth/auth.router";
import { balancesRouter } from "../modules/balances/balances.router";
import { expensesRouter } from "../modules/expenses/expenses.router";
import { groupsRouter } from "../modules/groups/groups.router";
import { usersRouter } from "../modules/users/users.router";

export function registerRoutes(app: Express) {
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/auth", authRouter);
  app.use("/users", usersRouter);
  app.use("/groups", groupsRouter);
  app.use("/expenses", expensesRouter);
  app.use("/balances", balancesRouter);
}