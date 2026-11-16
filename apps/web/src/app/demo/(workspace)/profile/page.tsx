import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { logoutAction } from "@/app/demo/authActions";
import { ActionButton } from "@/components/demo/ActionButton";
import { readUser } from "@/lib/connector";

export const metadata: Metadata = { title: "Profile settings", robots: { index: false, follow: false } };
export const instant = false;

export default function Page() {
  return <Suspense fallback={<p className="p-5 text-sm text-muted-foreground">Loading profile…</p>}><Profile /></Suspense>;
}

async function Profile() {
  const user = await readUser();
  if (!user) redirect("/demo/login");
  return (
    <main id="demo-content" className="px-3 py-4 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="px-1 font-display text-2xl font-semibold tracking-tight sm:px-0 sm:text-4xl">Profile settings</h1>
        <section aria-label="Account" className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 sm:mt-7 sm:p-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-signal-soft text-signal"><UserRound size={19} /></span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">Account email</h2>
              <p className="break-all text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <ActionButton action={logoutAction} className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50">
            <LogOut size={15} /> Sign out
          </ActionButton>
        </section>
      </div>
    </main>
  );
}
