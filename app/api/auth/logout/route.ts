import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

type CookieToSet = { name: string; value: string; options: Record<string, unknown> };

/**
 * Server-side logout so auth cookies are cleared in the response.
 * Client-side signOut() alone can leave SSR-set cookies intact, so logout didn't work reliably.
 */
export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? requestUrl.origin;

  const redirectResponse = NextResponse.redirect(baseUrl, 303);

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookiesToSet: CookieToSet[]) {
          for (const { name, value, options } of cookiesToSet) {
            redirectResponse.cookies.set({
              name,
              value: value ?? "",
              path: "/",
              ...options,
              ...(value ? {} : { maxAge: 0 }),
            });
          }
        },
      },
    }
  );

  await supabase.auth.signOut();
  return redirectResponse;
}
