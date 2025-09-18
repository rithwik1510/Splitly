import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200/70 bg-white/90 p-4 shadow-lg shadow-slate-900/5 backdrop-blur-sm transition-colors sm:p-5 lg:p-6 dark:border-slate-800 dark:bg-slate-900/70",
        className
      )}
      {...props}
    />
  );
}
