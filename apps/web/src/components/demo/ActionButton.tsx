"use client";

import { useActionState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

export function ActionButton({ action, children, className, confirm }: {
  action: () => Promise<string>;
  children: ReactNode;
  className?: string;
  confirm?: string;
}) {
  const [error, submit, pending] = useActionState(async () => action(), "");
  return (
    <form action={submit} onSubmit={event => {
      if (confirm && !window.confirm(confirm)) event.preventDefault();
    }}>
      <button disabled={pending} className={className}>
        {pending && <Loader2 aria-label="Working" className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
      {error && <p role="alert" className="mt-2 max-w-56 text-xs text-alert">{error}</p>}
    </form>
  );
}
