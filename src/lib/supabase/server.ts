import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Server Supabase client for Server Components, Server Actions and Route
 * Handlers. `cookies()` is async in Next.js 16, hence the await.
 *
 * Returns `null` in demo mode.
 */
export async function createClient() {
  if (!isSupabaseConfigured) return null;

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // `setAll` is called from a Server Component where mutating cookies
          // is not allowed. Safe to ignore — the proxy refreshes the session.
        }
      },
    },
  });
}

/**
 * Service-role admin client (server-only — never expose to the browser).
 * Returns `null` when the service key isn't configured; callers fall back
 * to the regular flow.
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isSupabaseConfigured || !serviceKey) return null;
  return createSupabaseClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Returns the authenticated user, or `null` (also `null` in demo mode). */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
