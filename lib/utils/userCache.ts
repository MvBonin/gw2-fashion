"use client";

import type { Database } from "@/types/database.types";
import { hasOptionalConsent } from "@/lib/utils/cookieConsent";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

const CACHE_KEY = "gw2-fashion:user-profile";
const CACHE_VERSION = 1;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

interface CachedProfile {
  profile: UserProfile;
  timestamp: number;
  version: number;
}

/**
 * Caches the user profile in localStorage (only when cookie consent is "Accept all").
 */
export function cacheUserProfile(profile: UserProfile | null): void {
  if (typeof window === "undefined") return;

  if (!profile) {
    localStorage.removeItem(CACHE_KEY);
    return;
  }

  if (!hasOptionalConsent()) return;

  const cached: CachedProfile = {
    profile,
    timestamp: Date.now(),
    version: CACHE_VERSION,
  };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cached));
  } catch (error) {
    console.warn("Failed to cache user profile:", error);
  }
}

/**
 * Liest das User-Profile aus dem localStorage (nur bei Cookie-Consent „Alle akzeptieren“).
 * Gibt null zurück, wenn kein Cache existiert, abgelaufen ist oder kein optionaler Consent vorliegt.
 */
export function getCachedUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  if (!hasOptionalConsent()) return null;

  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (!cachedStr) return null;

    const cached: CachedProfile = JSON.parse(cachedStr);

    // Check version
    if (cached.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Check expiry
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_EXPIRY_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return cached.profile;
  } catch (error) {
    console.warn("Failed to read cached user profile:", error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
}

/**
 * Clears the user profile cache.
 */
export function clearUserProfileCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}

