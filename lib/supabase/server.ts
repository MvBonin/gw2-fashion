import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";

/** Same as middleware: persistent cookie lifetime so server-side session refresh keeps cookies across browser restarts. */
const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

type CookieOptions = { path?: string; maxAge?: number };

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
        set(name: string, value: string, options: CookieOptions) {
          try {
            const opts = {
              ...options,
              ...(value ? { maxAge: options.maxAge ?? AUTH_COOKIE_MAX_AGE } : { maxAge: 0 }),
            };
            cookieStore.set({ name, value, ...opts });
          } catch {
            // Called from Server Component; middleware will refresh session
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options, maxAge: 0 });
          } catch {
            // Called from Server Component; middleware will refresh session
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>;
};
