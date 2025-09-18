import type { GroupDetail } from "@/lib/types";
import dayjs from "dayjs";

export function SettlementHistory({ settlements }: { settlements: GroupDetail["settlements"] }) {
  if (settlements.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200/70 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent settlements</h3>
      <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {settlements.map((settlement) => (
          <li key={settlement.id} className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <span>
              {settlement.from.name} paid {settlement.to.name} {settlement.currency} {settlement.amount.toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {dayjs(settlement.createdAt).format("DD MMM YYYY")}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
