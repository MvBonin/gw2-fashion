/**
 * Cookie consent for TTDSG/GDPR.
 * Use only in the browser (document.cookie).
 * Persists in both cookie and localStorage so the banner stays closed after choice.
 */

export const COOKIE_CONSENT_NAME = "cookie_consent";

const CONSENT_STORAGE_KEY = "gw2fashion_cookie_consent";

export type ConsentValue = "necessary-only" | "all";

const MAX_AGE_DAYS = 365; // 12 months

const VALID_CONSENT = new Set<ConsentValue>(["necessary-only", "all"]);

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + name.replace(/[^.*+?^${}()|[\]\\]/g, "\\$&") + "=([^;]*)")
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number): void {
  if (typeof document === "undefined") return;
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie =
    name +
    "=" +
    encodeURIComponent(value) +
    "; expires=" +
    expires.toUTCString() +
    "; path=/; SameSite=Lax";
}

function getFromStorage(): ConsentValue | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (raw === "necessary-only" || raw === "all") return raw;
  } catch {
    // ignore
  }
  return null;
}

function setInStorage(value: ConsentValue): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value);
  } catch {
    // ignore
  }
}

export function getConsent(): ConsentValue | null {
  const fromCookie = getCookie(COOKIE_CONSENT_NAME);
  if (VALID_CONSENT.has(fromCookie as ConsentValue)) return fromCookie as ConsentValue;
  const fromStorage = getFromStorage();
  if (fromStorage) {
    // Restore cookie if it was lost so next read is consistent
    setCookie(COOKIE_CONSENT_NAME, fromStorage, MAX_AGE_DAYS);
    return fromStorage;
  }
  return null;
}

export function setConsent(value: ConsentValue): void {
  setCookie(COOKIE_CONSENT_NAME, value, MAX_AGE_DAYS);
  setInStorage(value);
}

export function clearConsent(): void {
  if (typeof document === "undefined") return;
  document.cookie =
    COOKIE_CONSENT_NAME + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  try {
    if (typeof localStorage !== "undefined") localStorage.removeItem(CONSENT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function hasOptionalConsent(): boolean {
  return getConsent() === "all";
}
