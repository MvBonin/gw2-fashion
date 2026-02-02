"use client";

import type { Database } from "@/types/database.types";

type UserProfile = Database["public"]["Tables"]["users"]["Row"];

const CACHE_KEY = "gw2-fashion:user-profile";
const CACHE_VERSION = 1;
const CACHE_EXPIRY_MS = 5 * 60 * 1000; // 5 Minuten

interface CachedProfile {
  profile: UserProfile;
  timestamp: number;
  version: number;
}

/**
 * Speichert das User-Profile im localStorage
 */
export function cacheUserProfile(profile: UserProfile | null): void {
  if (typeof window === "undefined") return;

  if (!profile) {
    localStorage.removeItem(CACHE_KEY);
    return;
  }

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
 * Liest das User-Profile aus dem localStorage
 * Gibt null zurück, wenn kein Cache existiert oder abgelaufen ist
 */
export function getCachedUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;

  try {
    const cachedStr = localStorage.getItem(CACHE_KEY);
    if (!cachedStr) return null;

    const cached: CachedProfile = JSON.parse(cachedStr);

    // Prüfe Version
    if (cached.version !== CACHE_VERSION) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    // Prüfe Ablaufzeit
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
 * Löscht den User-Profile-Cache
 */
export function clearUserProfileCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CACHE_KEY);
}

