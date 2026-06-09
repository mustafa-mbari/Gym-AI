/**
 * Supabase configuration + a single source of truth for whether the backend
 * is wired up. When the env vars are absent the app runs in "demo mode":
 * the full UI is explorable with sample data, but nothing is persisted and
 * auth is bypassed. Add the keys to `.env.local` to switch on real accounts.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith("http")
);

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
