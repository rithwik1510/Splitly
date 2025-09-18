import Link from "next/link";
import { Users } from "lucide-react";
import type { GroupSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface GroupCardProps {
  group: GroupSummary;
  className?: string;
}

export function GroupCard({ group, className }: GroupCardProps) {
  return (
    <Link
      href={`/groups/${group.id}`}
      className={cn(
        "block rounded-xl border border-slate-200/70 bg-white/80 p-6 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-lg dark:border-slate-800 dark:bg-slate-900/60",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{group.name}</h3>
          {group.description && <p className="text-sm text-slate-500 dark:text-slate-400">{group.description}</p>}
        </div>
        <span className="rounded-full bg-brand/10 px-3 py-1 text-xs font-medium text-brand dark:bg-brand/20">
          {group.baseCurrency}
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <Users size={16} />
        <span>{group.members.length} members</span>
      </div>
    </Link>
  );
}
