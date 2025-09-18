import type { BalancesResponse, BalanceSummaryItem, GroupSummary, User } from "@/lib/types";

const EPSILON = 0.01;

interface SettlementEdge {
  from: User;
  to: User;
  amount: number;
}

interface IndividualBreakdownItem {
  groupId: string;
  groupName: string;
  currency: string;
  amount: number;
}

interface IndividualOverview {
  userId: string;
  name: string;
  netByCurrency: Record<string, number>;
  owedToMe: Record<string, number>;
  iOwe: Record<string, number>;
  breakdown: IndividualBreakdownItem[];
}

interface GroupMemberBalance {
  userId: string;
  name: string;
  balance: number;
}

interface GroupOverview {
  groupId: string;
  groupName: string;
  currency: string;
  net: number;
  owedToMe: number;
  iOwe: number;
  members: GroupMemberBalance[];
}

interface TotalsByCurrency {
  currency: string;
  theyOwe: number;
  youOwe: number;
  net: number;
}

export interface BalanceOverviewData {
  totals: TotalsByCurrency[];
  individuals: IndividualOverview[];
  groups: GroupOverview[];
}

type IndividualAccumulator = {
  user: User;
  amounts: Map<string, number>;
  breakdown: IndividualBreakdownItem[];
};

const roundCurrency = (value: number) => Math.round(value * 100) / 100;

const toRecord = (map: Map<string, number>): Record<string, number> => {
  const record: Record<string, number> = {};
  map.forEach((value, key) => {
    if (Math.abs(value) > EPSILON) {
      record[key] = roundCurrency(value);
    }
  });
  return record;
};

const ensureIndividual = (
  collection: Map<string, IndividualAccumulator>,
  user: User
) => {
  if (!collection.has(user.id)) {
    collection.set(user.id, {
      user,
      amounts: new Map<string, number>(),
      breakdown: [],
    });
  }
  return collection.get(user.id)!;
};

const pushAmount = (map: Map<string, number>, currency: string, delta: number) => {
  const current = map.get(currency) ?? 0;
  const next = roundCurrency(current + delta);
  if (Math.abs(next) < EPSILON) {
    map.delete(currency);
  } else {
    map.set(currency, next);
  }
};

const mergeBreakdown = (list: IndividualBreakdownItem[], item: IndividualBreakdownItem) => {
  const existing = list.find(
    (entry) => entry.groupId === item.groupId && entry.currency === item.currency
  );
  if (existing) {
    const next = roundCurrency(existing.amount + item.amount);
    if (Math.abs(next) < EPSILON) {
      const index = list.indexOf(existing);
      list.splice(index, 1);
    } else {
      existing.amount = next;
    }
  } else if (Math.abs(item.amount) > EPSILON) {
    list.push({ ...item, amount: roundCurrency(item.amount) });
  }
};

const computeSettlements = (summary: BalanceSummaryItem[]): SettlementEdge[] => {
  const debtors: { user: User; amount: number }[] = [];
  const creditors: { user: User; amount: number }[] = [];

  summary.forEach((item) => {
    const balance = roundCurrency(item.balance);
    if (balance > EPSILON) {
      creditors.push({ user: item.user, amount: balance });
    } else if (balance < -EPSILON) {
      debtors.push({ user: item.user, amount: Math.abs(balance) });
    }
  });

  const settlements: SettlementEdge[] = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const transfer = roundCurrency(Math.min(debtor.amount, creditor.amount));

    if (transfer > EPSILON) {
      settlements.push({
        from: debtor.user,
        to: creditor.user,
        amount: transfer,
      });
    }

    debtor.amount = roundCurrency(debtor.amount - transfer);
    creditor.amount = roundCurrency(creditor.amount - transfer);

    if (debtor.amount <= EPSILON) {
      debtorIndex += 1;
    }

    if (creditor.amount <= EPSILON) {
      creditorIndex += 1;
    }
  }

  return settlements;
};

export function buildBalanceOverview({
  currentUserId,
  groupBalances,
  groups,
}: {
  currentUserId?: string;
  groupBalances: BalancesResponse[];
  groups: GroupSummary[];
}): BalanceOverviewData {
  if (!currentUserId || groupBalances.length === 0) {
    return { totals: [], individuals: [], groups: [] };
  }

  const totals = new Map<string, { theyOwe: number; youOwe: number }>();
  const individuals = new Map<string, IndividualAccumulator>();
  const groupSummaries: GroupOverview[] = [];

  const groupNameLookup = new Map(groups.map((group) => [group.id, group.name]));

  groupBalances.forEach((balanceResponse) => {
    const { group, summary } = balanceResponse;
    const currency = group.baseCurrency;
    const groupName = groupNameLookup.get(group.id) ?? group.name;

    const me = summary.find((item) => item.user.id === currentUserId);
    const net = roundCurrency(me?.balance ?? 0);
    const owedToMe = net > EPSILON ? net : 0;
    const iOwe = net < -EPSILON ? Math.abs(net) : 0;

    if (!totals.has(currency)) {
      totals.set(currency, { theyOwe: 0, youOwe: 0 });
    }
    const totalEntry = totals.get(currency)!;
    totalEntry.theyOwe = roundCurrency(totalEntry.theyOwe + owedToMe);
    totalEntry.youOwe = roundCurrency(totalEntry.youOwe + iOwe);

    const members: GroupMemberBalance[] = summary
      .filter((item) => item.user.id !== currentUserId && Math.abs(item.balance) > EPSILON)
      .map((item) => ({
        userId: item.user.id,
        name: item.user.name,
        balance: roundCurrency(item.balance),
      }))
      .sort((a, b) => Math.abs(b.balance) - Math.abs(a.balance));

    groupSummaries.push({
      groupId: group.id,
      groupName,
      currency,
      net,
      owedToMe,
      iOwe,
      members,
    });

    const settlements = computeSettlements(summary);

    settlements.forEach((settlement) => {
      if (settlement.to.id === currentUserId) {
        const entry = ensureIndividual(individuals, settlement.from);
        pushAmount(entry.amounts, currency, settlement.amount);
        mergeBreakdown(entry.breakdown, {
          groupId: group.id,
          groupName,
          currency,
          amount: settlement.amount,
        });
      } else if (settlement.from.id === currentUserId) {
        const entry = ensureIndividual(individuals, settlement.to);
        pushAmount(entry.amounts, currency, -settlement.amount);
        mergeBreakdown(entry.breakdown, {
          groupId: group.id,
          groupName,
          currency,
          amount: -settlement.amount,
        });
      }
    });
  });

  const individualSummaries: IndividualOverview[] = Array.from(individuals.values())
    .map((entry) => {
      const netByCurrency = toRecord(entry.amounts);
      const owedToMe: Record<string, number> = {};
      const iOwe: Record<string, number> = {};

      Object.entries(netByCurrency).forEach(([currency, amount]) => {
        if (amount > EPSILON) {
          owedToMe[currency] = roundCurrency(amount);
        } else if (amount < -EPSILON) {
          iOwe[currency] = Math.abs(roundCurrency(amount));
        }
      });

      const breakdown = entry.breakdown
        .slice()
        .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

      return {
        userId: entry.user.id,
        name: entry.user.name,
        netByCurrency,
        owedToMe,
        iOwe,
        breakdown,
      };
    })
    .filter((item) => Object.keys(item.netByCurrency).length > 0)
    .sort((a, b) => {
      const owedA = Object.values(a.owedToMe).reduce((sum, value) => sum + value, 0);
      const owedB = Object.values(b.owedToMe).reduce((sum, value) => sum + value, 0);
      const owedDiff = owedB - owedA;
      if (Math.abs(owedDiff) > EPSILON) {
        return owedDiff;
      }
      const oweA = Object.values(a.iOwe).reduce((sum, value) => sum + value, 0);
      const oweB = Object.values(b.iOwe).reduce((sum, value) => sum + value, 0);
      return oweA - oweB;
    });

  const totalsArray: TotalsByCurrency[] = Array.from(totals.entries())
    .map(([currency, amounts]) => ({
      currency,
      theyOwe: roundCurrency(amounts.theyOwe),
      youOwe: roundCurrency(amounts.youOwe),
      net: roundCurrency(amounts.theyOwe - amounts.youOwe),
    }))
    .sort((a, b) => b.net - a.net);

  return {
    totals: totalsArray,
    individuals: individualSummaries,
    groups: groupSummaries.sort((a, b) => b.net - a.net),
  };
}
