"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  getConsent,
  setConsent,
  clearConsent,
} from "@/lib/utils/cookieConsent";
import { clearOptionalTracking } from "@/lib/utils/trackingStorage";
import { clearUserProfileCache } from "@/lib/utils/userCache";

const COOKIE_SETTINGS_KEY = "gw2fashion_cookie_settings_open";
const OPEN_EVENT = "gw2fashion-open-cookie-settings";

function clearSettingsFlag(): void {
  try {
    sessionStorage.removeItem(COOKIE_SETTINGS_KEY);
  } catch {
    // ignore
  }
}

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    const consent = getConsent();
    const settingsOpen = sessionStorage.getItem(COOKIE_SETTINGS_KEY) === "1";
    if (consent === null || settingsOpen) {
      setShow(true);
    }
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;

    const handleOpen = () => setShow(true);
    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, [mounted]);

  useEffect(() => {
    if (show && firstFocusRef.current) {
      firstFocusRef.current.focus({ preventScroll: true });
    }
  }, [show]);

  const handleAcceptAll = () => {
    setConsent("all");
    clearSettingsFlag();
    setShow(false);
    window.dispatchEvent(new CustomEvent("cookie-consent-updated"));
  };

  const handleNecessaryOnly = () => {
    setConsent("necessary-only");
    clearOptionalTracking();
    clearUserProfileCache();
    clearSettingsFlag();
    setShow(false);
    window.dispatchEvent(new CustomEvent("cookie-consent-updated"));
  };

  if (!mounted || !show) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cookie settings"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none"
    >
      <div className="w-full max-w-2xl pointer-events-auto">
        <div className="card bg-base-200 text-base-content shadow-xl border border-base-300">
          <div className="card-body p-4 sm:p-5 gap-3">
            <h2 className="card-title text-lg font-semibold">
              Cookies &amp; local storage
            </h2>
            <p className="text-sm text-base-content/90">
              We use cookies and local storage to run the site (e.g. sign-in).
              With your consent we also store data for convenience features like
              &ldquo;recently viewed&rdquo; and profile cache. See our{" "}
              <Link
                href="/legal#cookies"
                className="link link-primary underline"
                onClick={(e) => e.stopPropagation()}
              >
                privacy and cookie overview
              </Link>
              .
            </p>
            <div className="card-actions justify-end flex-wrap gap-2 mt-1">
              <button
                type="button"
                ref={firstFocusRef}
                onClick={handleNecessaryOnly}
                className="btn btn-ghost btn-sm"
              >
                Necessary only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="btn btn-primary btn-sm"
              >
                Accept all
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Reopens the cookie banner (e.g. to change or withdraw consent). Clears consent and shows the banner. */
export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  clearConsent();
  try {
    sessionStorage.setItem(COOKIE_SETTINGS_KEY, "1");
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}
