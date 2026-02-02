import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Database } from "@/types/database.types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

interface ProfilePageProps {
  params: Promise<{
    username: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params;
  const supabase = await createClient();

  // Case-insensitive search: Load all users and filter in memory
  // Since usernames are unique (case-insensitive), we can safely do this
  const { data: users, error } = await supabase
    .from("users")
    .select("username, gw2_account_name, gw2_account_name_public")
    .limit(1000); // Reasonable limit for small to medium user base

  if (error) {
    console.error("Error fetching users:", error);
    notFound();
  }

  // Find user case-insensitively
  const lowerUsername = username.toLowerCase();
  const user = users?.find(
    (u) => u.username.toLowerCase() === lowerUsername
  ) as UserProfile | undefined;

  if (!user) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-4">{user.username}</h1>
      {user.gw2_account_name_public && user.gw2_account_name && (
        <div className="mt-4">
          <p className="text-lg text-base-content/70">
            GW2-Account: {user.gw2_account_name}
          </p>
        </div>
      )}
    </div>
  );
}

