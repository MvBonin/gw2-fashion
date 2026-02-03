import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

export const createClient = async (): Promise<SupabaseClient<Database>> => {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: { path?: string }) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Called from Server Component; middleware will refresh session
          }
        },
        remove(name: string, options: { path?: string }) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // Called from Server Component; middleware will refresh session
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
};
