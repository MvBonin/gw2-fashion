import type { Database } from "@/types/database.types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

/**
 * Check if user has completed welcome.
 * Requires username_manually_set and terms_accepted_at (ToS confirmed).
 */
export function isWelcomeComplete(userProfile: UserProfile | null): boolean {
  if (!userProfile) return false;
  return (
    userProfile.username_manually_set === true &&
    userProfile.terms_accepted_at != null
  );
}

/**
 * Determine if user should be redirected to welcome (e.g. new user or ToS not yet accepted).
 */
export function shouldRedirectToWelcome(userProfile: UserProfile | null): boolean {
  return !isWelcomeComplete(userProfile);
}

