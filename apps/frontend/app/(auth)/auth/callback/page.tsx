"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/useAuth";

function CallbackContent() {
  const params = useSearchParams();
  const { refetchUser } = useAuth();

  useEffect(() => {
    const status = params.get("status");
    if (status === "success") {
      toast.success("Connected your account successfully");
      void refetchUser();
    } else {
      toast.error("We could not finish connecting your account");
    }
  }, [params, refetchUser]);

  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-4">
        <Spinner size={28} />
        <p className="text-sm text-slate-500 dark:text-slate-400">Finishing sign in...</p>
      </div>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" role="status" aria-live="polite"><Spinner size={28} /></div>}>
      <CallbackContent />
    </Suspense>
  );
}
