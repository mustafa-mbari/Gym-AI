"use client";

import { createBrowserClient } from "@supabase/ssr";

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./config";

/**
 * Browser Supabase client for use in Client Components.
 * Returns `null` in demo mode so callers can degrade gracefully.
 */
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
