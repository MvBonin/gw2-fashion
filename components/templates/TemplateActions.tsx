"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface TemplateActionsProps {
  templateId: string;
  slug: string;
  isOwner: boolean;
  isPrivate?: boolean;
  /** When "header", actions are right-aligned with no bottom margin for use in a top strip. */
  variant?: "default" | "header";
}

export default function TemplateActions({
  templateId,
  slug,
  isOwner,
  isPrivate = false,
  variant = "default",
}: TemplateActionsProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [updatingPrivate, setUpdatingPrivate] = useState(false);

  if (!isOwner) return null;

  const handleTogglePrivate = async () => {
    const nextPrivate = !isPrivate;
    const message = nextPrivate
      ? "Make this template private? Only you will be able to see it."
      : "Make this template public? It will appear on your profile and in search.";
    if (!window.confirm(message)) return;
    setUpdatingPrivate(true);
    try {
      const res = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_private: nextPrivate }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error("Toggle private failed:", err);
    } finally {
      setUpdatingPrivate(false);
    }
  };

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
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isPrivate}
          onChange={handleTogglePrivate}
          disabled={updatingPrivate}
          className="checkbox checkbox-sm"
          title={isPrivate ? "Private (only you can see it)" : "Public"}
        />
        <span className="text-sm select-none">Private</span>
      </label>
      <Link
        href={`/template/${slug}/edit`}
        className="btn btn-ghost btn-sm"
        data-umami-event="template_edit_click"
      >
        Edit
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        className="btn btn-ghost btn-sm text-error"
        data-umami-event="template_delete_click"
      >
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
