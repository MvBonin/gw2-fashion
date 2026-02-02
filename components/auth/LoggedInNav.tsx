"use client";

import { createClient } from "@/lib/supabase/client";
import { clearUserProfileCache } from "@/lib/utils/userCache";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Database } from "@/types/database.types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

interface LoggedInNavProps {
  profile: UserProfile;
}

export default function LoggedInNav({ profile }: LoggedInNavProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      clearUserProfileCache();
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error("Logout error:", error);
      }
      
      router.replace("/");
    } catch (error) {
      console.error("Unexpected logout error:", error);
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

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
          <Link href={`/profile/${profile?.username?.toLowerCase() ?? ""}`}>Profile</Link>
        </li>
        <li>
          <Link href="/profile/settings">Settings</Link>
        </li>
        <li>
          <Link href="/templates/upload">Upload Fashion-Template</Link>
        </li>
        <li>
          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}
          >
            {isLoggingOut ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Logging out...
              </>
            ) : (
              "Logout"
            )}
          </button>
        </li>
      </ul>
    </div>
  );
}

