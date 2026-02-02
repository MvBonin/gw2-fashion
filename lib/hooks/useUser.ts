"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import {
  cacheUserProfile,
  getCachedUserProfile,
  clearUserProfileCache,
} from "@/lib/utils/userCache";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export function useUser() {
  // Initialisiere konsistent für SSR (immer null/true, damit Server und Client gleich sind)
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const supabaseClient = createClient();

    // Lade gecachte Daten sofort auf dem Client (nur beim ersten Render)
    if (!hasInitialized) {
      const cachedProfile = getCachedUserProfile();
      if (cachedProfile) {
        setProfile(cachedProfile);
        setLoading(false);
      }
      setHasInitialized(true);
    }

    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabaseClient.auth.getUser();
      setUser(authUser);

      if (authUser) {
        // Lade Profile-Daten und aktualisiere Cache
        const { data: profileData } = await supabaseClient
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        const profile = profileData ?? null;
        setProfile(profile);
        cacheUserProfile(profile);
      } else {
        setProfile(null);
        clearUserProfileCache();
      }

      setLoading(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        // Lade Profile-Daten und aktualisiere Cache
        const { data: profileData } = await supabaseClient
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        const profile = profileData ?? null;
        setProfile(profile);
        cacheUserProfile(profile);
      } else {
        setProfile(null);
        clearUserProfileCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
