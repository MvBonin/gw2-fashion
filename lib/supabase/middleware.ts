import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAnonKey, getSupabaseUrl } from "./env";
import { shouldRedirectToWelcome } from "@/lib/utils/welcome";
import type { Database } from "@/types/database.types";

/** Same as auth callback: persistent cookie lifetime (400 days) so session refresh keeps cookies across browser restarts. */
const AUTH_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

type CookieOptions = { path?: string; maxAge?: number };

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const opts = {
            ...options,
            ...(value ? { maxAge: options.maxAge ?? AUTH_COOKIE_MAX_AGE } : { maxAge: 0 }),
          };
          request.cookies.set({ name, value, ...opts });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...opts });
        },
        remove(name: string, options: CookieOptions) {
          const opts = { ...options, maxAge: 0 };
          request.cookies.set({ name, value: "", ...opts });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: "", ...opts });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api");

  // API routes: only refresh session (getUser above), no profile fetch or redirects
  if (isApiRoute) {
    return response;
  }

  // Base URL for redirects (production: NEXT_PUBLIC_SITE_URL, else request origin)
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    new URL(request.url).origin;

  const isWelcomePage = pathname === "/welcome";
  const isAuthCallback = pathname === "/auth/callback";
  const isLoginPage = pathname === "/login";
  const isLegalPage = pathname === "/legal";

  // If user is authenticated, check welcome status (pages only)
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (isWelcomePage && profile && !shouldRedirectToWelcome(profile)) {
      return NextResponse.redirect(new URL("/", baseUrl));
    }

    if (!isWelcomePage && !isAuthCallback && !isLoginPage && !isLegalPage) {
      if (shouldRedirectToWelcome(profile)) {
        return NextResponse.redirect(new URL("/welcome", baseUrl));
      }
    }
  }

  return response;
}
