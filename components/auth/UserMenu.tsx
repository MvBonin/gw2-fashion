"use client";

import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const { user, profile, loading } = useUser();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="dropdown dropdown-end">
        <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
          <div className="w-10 rounded-full">
            <div className="skeleton w-full h-full rounded-full shrink-0" />
          </div>
        </label>
      </div>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className="btn btn-primary">
        Login
      </Link>
    );
  }

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
        <div className="w-10 rounded-full">
          {profile?.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={profile.username}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center rounded-full text-lg font-medium">
              {profile?.username?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
      </label>
      <ul
        tabIndex={0}
        className="mt-3 z-1 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
      >
        <li className="menu-title">
          <span>{profile?.username}</span>
        </li>
        <li>
          <Link href={`/profile/${profile?.username ?? ""}`}>Profile</Link>
        </li>
        <li>
          <Link href="/profile/settings">Settings</Link>
        </li>
        <li>
          <Link href="/templates/upload">Upload Template</Link>
        </li>
        <li>
          <Link href="/wishlist/templates">Wishlist</Link>
        </li>
        <li>
          <button type="button" onClick={handleLogout}>
            Logout
          </button>
        </li>
      </ul>
    </div>
  );
}
