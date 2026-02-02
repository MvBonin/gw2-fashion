import type { Database } from "@/types/database.types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

/**
 * Check if user has completed welcome
 * Welcome is complete if username_manually_set is true
 */
export function isWelcomeComplete(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  return userProfile.username_manually_set === true;
}

/**
 * Determine if user should be redirected to welcome
 */
export function shouldRedirectToWelcome(userProfile: UserProfile | null): boolean {
  return !isWelcomeComplete(userProfile);
}

