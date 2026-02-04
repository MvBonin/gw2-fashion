"use client";

import { createClient } from "@/lib/supabase/client";
import { clearUserProfileCache } from "@/lib/utils/userCache";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { User } from "lucide-react";
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

      router.refresh();
      router.replace("/");
    } catch (error) {
      console.error("Unexpected logout error:", error);
      router.refresh();
      router.replace("/");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <label tabIndex={0} className="btn btn-ghost normal-case flex items-center gap-2">
        <User className="w-5 h-5" />
        <span>{profile?.username}</span>
      </label>
      <ul
        tabIndex={0}
        className="mt-3 z-1 p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52"
      >

        <li>
          <Link href={`/profile/${profile?.username?.toLowerCase() ?? ""}`}>My Fashion / Profile</Link>
        </li>
        <li>
          <Link href="/profile/settings">Settings</Link>
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

