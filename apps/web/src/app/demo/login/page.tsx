import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { readUser } from "@/lib/connector";
import { LoginPanel } from "@/components/demo/LoginPanel";
import { SREnityLogo } from "@/components/site/Logo";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

async function Login() {
  if (await readUser()) redirect("/demo");
  return <LoginPanel />;
}

export default function LoginPage() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="flex h-[3.25rem] items-center border-b border-border bg-card px-5 sm:px-8">
        <Link href="/" aria-label="SREnity home"><SREnityLogo size="sm" /></Link>
      </header>
      <main className="px-5 py-8 sm:px-8 sm:py-14">
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading sign in…</p>}><Login /></Suspense>
      </main>
    </div>
  );
}
