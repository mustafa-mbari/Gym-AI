"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/supabase/config";

export type AuthState = {
  error?: string;
  message?: string;
  demo?: boolean;
} | null;

const DEMO_STATE: AuthState = {
  demo: true,
  message:
    "Accounts are disabled in demo mode. Connect a Supabase project to enable sign-in — meanwhile, explore the full app with sample data.",
};

export async function signInWithPassword(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  if (!supabase) return DEMO_STATE;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();

  if (!email || !password)
    return { error: "Email and password are required." };
  if (password.length < 8)
    return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  if (!supabase) return DEMO_STATE;

  // With the service key available, create the account pre-confirmed and log
  // straight in — no email verification round-trip.
  const admin = createAdminClient();
  if (admin) {
    const { error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName },
    });
    if (createErr) return { error: createErr.message };

    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signInErr) return { error: signInErr.message };

    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
      data: { first_name: firstName },
    },
  });
  if (error) return { error: error.message };

  // If email confirmation is disabled, a session is returned immediately.
  if (data.session) {
    revalidatePath("/", "layout");
    redirect("/onboarding");
  }

  return {
    message:
      "Almost there — check your inbox to confirm your email, then log in to build your plan.",
  };
}

export async function signInWithGoogle(): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return DEMO_STATE;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl}/auth/callback?next=/dashboard` },
  });
  if (error) return { error: error.message };
  if (data.url) redirect(data.url);
  return null;
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
