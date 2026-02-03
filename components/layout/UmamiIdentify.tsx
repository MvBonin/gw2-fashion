"use client";

import { useUser } from "@/lib/hooks/useUser";
import { hasOptionalConsent } from "@/lib/utils/cookieConsent";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    umami?: {
      identify: (
        userId: string,
        data?: Record<string, string | number | boolean>
      ) => void;
    };
  }
}

export default function UmamiIdentify() {
  const { profile, loading } = useUser();
  const identifiedRef = useRef(false);

  useEffect(() => {
    if (!profile) {
      identifiedRef.current = false;
      return;
    }
    if (loading || identifiedRef.current) return;

    const tryIdentify = () => {
      if (typeof window === "undefined" || !window.umami?.identify) return false;
      window.umami.identify(profile.id, {
        username: profile.username,
      });
      return true;
    };

    if (tryIdentify()) {
      identifiedRef.current = true;
      return;
    }

    const deadline = Date.now() + 3000;
    const interval = setInterval(() => {
      if (Date.now() > deadline || tryIdentify()) {
        clearInterval(interval);
        if (tryIdentify()) identifiedRef.current = true;
      }
    }, 200);

    return () => clearInterval(interval);
  }, [loading, profile]);

  return null;
}
