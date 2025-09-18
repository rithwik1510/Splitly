import type { GroupDetail } from "@/lib/types";

export function GroupMembersList({ members }: { members: GroupDetail["members"] }) {
  return (
    <div className="space-y-3">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white/80 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
        >
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">{member.user.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{member.user.email}</p>
          </div>
          <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{member.role}</span>
        </div>
      ))}
    </div>
  );
}
