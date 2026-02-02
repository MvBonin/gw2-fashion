"use client";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabaseClient = createClient();

    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabaseClient.auth.getUser();
      setUser(authUser);

      if (authUser) {
        const { data: profileData } = await supabaseClient
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        setProfile(profileData ?? null);
      } else {
        setProfile(null);
      }

      setLoading(false);
    };

    fetchUser();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const { data: profileData } = await supabaseClient
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();
        setProfile(profileData ?? null);
      } else {
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { user, profile, loading };
}
