import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-teal-50 to-white p-6 transition-colors duration-300 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <main className="w-full max-w-md space-y-8" role="main" aria-label="Authentication">
        {children}
      </main>
    </div>
  );
}
