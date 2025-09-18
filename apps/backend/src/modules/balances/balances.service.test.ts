import { describe, expect, it } from "vitest";
import { simplifyBalances } from "./balances.service";

describe("simplifyBalances", () => {
  it("creates minimal settlement steps", () => {
    const summary = [
      { user: { id: "a", name: "A", email: "a@example.com" }, balance: -50 },
      { user: { id: "b", name: "B", email: "b@example.com" }, balance: 20 },
      { user: { id: "c", name: "C", email: "c@example.com" }, balance: 30 },
    ];

    const settlements = simplifyBalances(summary);
    expect(settlements).toEqual([
      { fromUserId: "a", toUserId: "b", amount: 20 },
      { fromUserId: "a", toUserId: "c", amount: 30 },
    ]);
  });
});