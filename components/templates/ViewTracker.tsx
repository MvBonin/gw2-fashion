"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getViewedIds, addViewedId } from "@/lib/utils/trackingStorage";

interface ViewTrackerProps {
  templateId: string;
  templateUserId: string | null;
}

export default function ViewTracker({
  templateId,
  templateUserId,
}: ViewTrackerProps) {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (cancelled) return;
      if (templateUserId && user?.id === templateUserId) return;
      if (getViewedIds().includes(templateId)) return;

      const res = await fetch(`/api/templates/${templateId}/view`, {
        method: "POST",
      });
      if (cancelled) return;
      if (res.ok) addViewedId(templateId);
    })();

    return () => {
      cancelled = true;
    };
  }, [templateId, templateUserId]);

  return null;
}
