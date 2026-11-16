"use server";

import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/demoSession";
import { toUserMessage } from "@/lib/servicenow/errors";

export async function loginAction(_previous: string, form: FormData) {
  const email = form.get("email");
  const password = form.get("password");
  if (typeof email !== "string" || !email.trim() || email.length > 320 ||
      typeof password !== "string" || !password || password.length > 1024) {
    return "Enter your email and password.";
  }
  try { await signIn(email, password); }
  catch (error) { return toUserMessage(error); }
  redirect("/demo");
}

export async function logoutAction() {
  try { await signOut(); }
  catch (error) { return toUserMessage(error); }
  redirect("/demo/login");
}
