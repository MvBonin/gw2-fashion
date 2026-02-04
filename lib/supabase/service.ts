import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { getSupabaseServiceRoleKey, getSupabaseUrl } from "./env";

/**
 * Supabase-Client mit Service-Role-Rechten (umgeht RLS).
 * Nur auf dem Server verwenden, z. B. für Fallback bei increment_copy_count.
 * Liefert null, wenn SUPABASE_SERVICE_ROLE_KEY nicht gesetzt ist.
 */
export async function createServiceClient(): Promise<SupabaseClient<Database> | null> {
  const key = getSupabaseServiceRoleKey();
  if (!key) return null;
  return createClient<Database>(getSupabaseUrl(), key);
}
