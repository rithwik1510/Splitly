import type { BalancesResponse, SimplifiedSettlement } from "@/lib/types";

interface BalanceSummaryProps {
  balances: BalancesResponse;
  simplified?: SimplifiedSettlement[];
}

export function BalanceSummary({ balances, simplified }: BalanceSummaryProps) {
  const userLookup = new Map(
    balances.summary.map((item) => [item.user.id, item.user.name])
  );

  return (
    <div className="space-y-4 rounded-xl border border-slate-200/70 bg-white/80 p-6 dark:border-slate-800 dark:bg-slate-900/60">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Balances</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Positive means the group owes them, negative means they owe the group.
        </p>
      </div>
      <div className="space-y-2 text-sm">
        {balances.summary.map((item) => (
          <div key={item.user.id} className="flex items-center justify-between">
            <span className="text-slate-600 dark:text-slate-300">{item.user.name}</span>
            <span
              className={
                item.balance >= 0
                  ? "font-medium text-emerald-500"
                  : "font-medium text-rose-500"
              }
            >
              {balances.group.baseCurrency} {item.balance.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
      {simplified && simplified.length > 0 && (
        <div className="rounded-lg border border-slate-200/70 bg-white/70 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/70">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Simplified settlements</h4>
          <ul className="mt-2 space-y-1 text-slate-600 dark:text-slate-300">
            {simplified.map((step, index) => (
              <li key={`${step.fromUserId}-${step.toUserId}-${index}`}>
                {userLookup.get(step.fromUserId) ?? step.fromUserId} pays {userLookup.get(step.toUserId) ?? step.toUserId} {balances.group.baseCurrency} {step.amount.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
