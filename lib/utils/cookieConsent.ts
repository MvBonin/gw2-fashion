/**
 * Cookie consent for TTDSG/GDPR.
 * Use only in the browser (document.cookie).
 */

export const COOKIE_CONSENT_NAME = "cookie_consent";

export type ConsentValue = "necessary-only" | "all";

const MAX_AGE_DAYS = 365; // 12 months

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

export function getConsent(): ConsentValue | null {
  const raw = getCookie(COOKIE_CONSENT_NAME);
  if (raw === "necessary-only" || raw === "all") return raw;
  return null;
}

export function setConsent(value: ConsentValue): void {
  setCookie(COOKIE_CONSENT_NAME, value, MAX_AGE_DAYS);
}

export function clearConsent(): void {
  if (typeof document === "undefined") return;
  document.cookie =
    COOKIE_CONSENT_NAME + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
}

export function hasOptionalConsent(): boolean {
  return getConsent() === "all";
}
