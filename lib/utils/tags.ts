import type { Database } from "@/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export function normalizeTagName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Resolve tag names to tag IDs in a single DB roundtrip (RPC).
 * Returns a Map name -> id for all given names.
 */
export async function getOrCreateTagIds(
  supabase: SupabaseClient<Database>,
  tagNames: string[]
): Promise<Map<string, string>> {
  const idMap = new Map<string, string>();
  if (tagNames.length === 0) return idMap;

  const { data: rows, error } = await supabase.rpc("get_or_create_tag_ids", {
    tag_names: tagNames,
  });

  if (error) {
    throw new Error(`get_or_create_tag_ids: ${error.message}`);
  }

  for (const row of (rows ?? []) as { id: string; name: string }[]) {
    idMap.set(row.name, row.id);
  }

  return idMap;
}
