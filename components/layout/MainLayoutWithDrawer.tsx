"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { clearUserProfileCache } from "@/lib/utils/userCache";
import { Menu } from "lucide-react";
import Footer from "@/components/layout/Footer";
import LoggedInNav from "@/components/auth/LoggedInNav";
import LoggedOutNav from "@/components/auth/LoggedOutNav";
import type { User as AuthUser } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

const DRAWER_ID = "main-drawer";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

function closeDrawer() {
  const el = document.getElementById(DRAWER_ID) as HTMLInputElement | null;
  if (el) el.checked = false;
}

interface MainLayoutWithDrawerProps {
  user: AuthUser | null;
  profile: UserProfile | null;
  children: React.ReactNode;
}

export default function MainLayoutWithDrawer({
  user,
  profile,
  children,
}: MainLayoutWithDrawerProps) {
  const router = useRouter();
  const supabase = createClient();

  const handleDrawerLogout = async () => {
    try {
      clearUserProfileCache();
      await supabase.auth.signOut();
      router.refresh();
      router.replace("/");
    } catch {
      router.refresh();
      router.replace("/");
    } finally {
      closeDrawer();
    }
  };

  return (
    <div className="drawer drawer-end">
      <input
        id={DRAWER_ID}
        type="checkbox"
        className="drawer-toggle"
        aria-label="Toggle menu"
      />
      <div className="drawer-content flex min-h-screen flex-col bg-base-100">
        <header className="navbar bg-base-100 shadow-lg px-4">
          <div className="navbar-start justify-start min-w-0 flex-1">
            <Link
              href="/"
              className="btn btn-ghost text-xl flex items-center normal-case p-0"
            >
              <Image
                src="/icon.png"
                alt="gw2-fashion.com Logo"
                width={265}
                height={265}
                className="h-16 w-16 flex-shrink-0"
                priority
              />
              <span className="">GW2 Fashion</span>
            </Link>
          </div>
          <div className="navbar-end flex items-center gap-2">
            <label
              htmlFor={DRAWER_ID}
              className="btn btn-ghost drawer-button lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </label>
            <div className="hidden lg:flex lg:items-center lg:gap-2">
            <Link href="/template/new" className="btn btn-primary btn-ghost">
              Add Fashion
            </Link>
            <Link href="/" className="btn btn-ghost">
              Fashion
            </Link>
            <Link href="/favourites" className="btn btn-ghost">
              Favourites
            </Link>
            {user && profile ? (
              <LoggedInNav profile={profile} />
            ) : (
              <LoggedOutNav />
            )}
            </div>
          </div>
        </header>
        <main className="flex-1 container mx-auto px-4 py-8 bg-base-100">
          {children}
        </main>
        <Footer />
      </div>
      <div className="drawer-side z-50">
        <label
          htmlFor={DRAWER_ID}
          aria-label="Close menu"
          className="drawer-overlay"
        />
        <ul className="menu p-4 w-72 min-h-full bg-base-100 text-base-content gap-2">
          <li>
            <Link href="/template/new" onClick={closeDrawer}>
              Add Fashion
            </Link>
          </li>
          <li>
            <Link href="/" onClick={closeDrawer}>
              Fashion
            </Link>
          </li>
          <li>
            <Link href="/favourites" onClick={closeDrawer}>
              Favourites
            </Link>
          </li>
          {user && profile ? (
            <>
              <li>
                <Link
                  href={`/profile/${profile?.username?.toLowerCase() ?? ""}`}
                  onClick={closeDrawer}
                >
                  My Fashion / Profile
                </Link>
              </li>
              <li>
                <Link href="/profile/settings" onClick={closeDrawer}>
                  Settings
                </Link>
              </li>
              <li>
                <button type="button" onClick={handleDrawerLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <li>
              <Link href="/login" onClick={closeDrawer} className="btn btn-primary">
                Login
              </Link>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
