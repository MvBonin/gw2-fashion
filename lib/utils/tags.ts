import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Resolve tag names to tag IDs (batch: 1 SELECT + optional 1 upsert).
 * Returns a Map name -> id for all given names (only includes resolved ids).
 */
export async function getOrCreateTagIds(
  supabase: SupabaseClient<Database>,
  tagNames: string[]
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  if (tagNames.length === 0) return idMap;

  const { data: existing } = await supabase
    .from("tags")
    .select("id, name")
    .in("name", tagNames);

  for (const row of existing ?? []) {
    idMap.set(row.name, row.id);
  }

  const missing = tagNames.filter((n) => !idMap.has(n));
  if (missing.length > 0) {
    const { data: upserted } = await supabase
      .from("tags")
      .upsert(missing.map((name) => ({ name })), { onConflict: "name" })
      .select("id, name");

    for (const row of upserted ?? []) {
      idMap.set(row.name, row.id);
    }
  }

  return idMap;
}
