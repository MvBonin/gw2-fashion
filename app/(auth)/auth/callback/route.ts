import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import type { Database } from "@/types/database.types";
import { getSupabaseAnonKey, getSupabaseUrl } from "@/lib/supabase/env";

type CookieToSet = { name: string; value: string; options: Record<string, unknown> };

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? requestUrl.origin;
  const next = requestUrl.searchParams.get("next") ?? "/";
  const isLocalhost = baseUrl.includes("localhost");

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/`);
  }

  const html = `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="1;url=${baseUrl}${next}"></head><body>Redirecting...</body></html>`;
  const response = new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  const cookieOptions = {
    path: "/",
    ...(isLocalhost && { secure: false, sameSite: "lax" as const, httpOnly: false }),
  };

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
            response.cookies.set({
              name,
              value: value ?? "",
              ...cookieOptions,
              ...options,
              ...(value ? {} : { maxAge: 0 }),
            });
          }
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Auth callback error:", error.message);
    return NextResponse.redirect(`${baseUrl}/login?error=${encodeURIComponent(error.message)}`);
  }

  // Redirect to welcome after successful auth
  // Middleware will handle redirecting to home if welcome is already complete
  // Create redirect and copy cookies from the session response
  const redirectResponse = NextResponse.redirect(`${baseUrl}/welcome`);
  
  // Copy all cookies from the session response to maintain authentication
  response.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set({
      name: cookie.name,
      value: cookie.value,
      ...cookieOptions,
    });
  });

  return redirectResponse;
}
