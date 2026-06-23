import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Fixed identifier for the single shared trip (no-login model).
 * Every row is scoped to this id.
 */
export const TRIP_ID = "trip_thailand_2026";

export const MEDIA_BUCKET = "trip-media";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** True when both env vars are present, so the app can talk to Supabase. */
export const isSupabaseConfigured = Boolean(url && anonKey);

let client: SupabaseClient | null = null;

/**
 * Returns a singleton Supabase browser client, or `null` when the project
 * isn't configured yet. Callers must handle the null case and fall back to
 * local-only behaviour.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!client) {
    client = createClient(url!, anonKey!, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return client;
}
