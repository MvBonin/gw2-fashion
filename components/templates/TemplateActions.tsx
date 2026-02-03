"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TemplateActionsProps {
  templateId: string;
  slug: string;
  isOwner: boolean;
  /** When "header", actions are right-aligned with no bottom margin for use in a top strip. */
  variant?: "default" | "header";
}

export default function TemplateActions({
  templateId,
  slug,
  isOwner,
  variant = "default",
}: TemplateActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  if (!isOwner) return null;

  const handleDelete = async () => {
    const first = window.confirm(
      "Delete this template? It will be hidden from the list."
    );
    if (!first) return;

    const second = window.confirm("Are you sure? This cannot be undone.");
    if (!second) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: false }),
      });
      if (res.ok) {
        router.push("/");
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${variant === "header" ? "ml-auto" : "mb-4"}`}>
      <Link
        href={`/template/${slug}/edit`}
        className="btn btn-ghost btn-sm"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="btn btn-ghost btn-sm text-error"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
