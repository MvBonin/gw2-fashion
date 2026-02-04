"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TagInput from "@/components/templates/TagInput";
import ImageUpload from "@/components/templates/ImageUpload";
import PendingExtraImageSlot from "@/components/templates/PendingExtraImageSlot";

type ArmorType = "light" | "medium" | "heavy";
type ExtraPosition = 1 | 2 | 3;
const EXTRA_POSITIONS: ExtraPosition[] = [1, 2, 3];

export default function NewTemplatePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [fashionCode, setFashionCode] = useState("");
  const [armorType, setArmorType] = useState<ArmorType>("light");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showHowtoModal, setShowHowtoModal] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<string | null>(null);
  const [pendingExtraFiles, setPendingExtraFiles] = useState<Record<ExtraPosition, File | null>>({
    1: null,
    2: null,
    3: null,
  });
  const [pendingExtraPreviewUrls, setPendingExtraPreviewUrls] = useState<
    Record<ExtraPosition, string | null>
  >({ 1: null, 2: null, 3: null });

  const extraPreviewUrlsRef = useRef(pendingExtraPreviewUrls);
  useEffect(() => {
    extraPreviewUrlsRef.current = pendingExtraPreviewUrls;
  }, [pendingExtraPreviewUrls]);
  useEffect(() => {
    return () => {
      EXTRA_POSITIONS.forEach((pos) => {
        const url = extraPreviewUrlsRef.current[pos];
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const handleFileReady = useCallback((file: File) => {
    setPendingImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setPendingImageFile(file);
  }, []);

  const removePendingImage = useCallback(() => {
    if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl);
    setPendingImagePreviewUrl(null);
    setPendingImageFile(null);
  }, [pendingImagePreviewUrl]);

  const handleExtraFileSelect = useCallback((position: ExtraPosition, file: File) => {
    setPendingExtraPreviewUrls((prev) => {
      const old = prev[position];
      if (old) URL.revokeObjectURL(old);
      return { ...prev, [position]: URL.createObjectURL(file) };
    });
    setPendingExtraFiles((prev) => ({ ...prev, [position]: file }));
  }, []);

  const handleExtraRemove = useCallback((position: ExtraPosition) => {
    setPendingExtraPreviewUrls((prev) => {
      const old = prev[position];
      if (old) URL.revokeObjectURL(old);
      return { ...prev, [position]: null };
    });
    setPendingExtraFiles((prev) => ({ ...prev, [position]: null }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        router.push("/login");
        return;
      }

      const createAbort = new AbortController();
      const createTimeout = setTimeout(() => createAbort.abort(), 30_000);

      let response: Response;
      try {
        console.log("[create] client: sending request…");
        response = await fetch("/api/templates/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            fashion_code: fashionCode.trim(),
            armor_type: armorType,
            description: description.trim() || null,
            tags,
            is_private: isPrivate,
          }),
          signal: createAbort.signal,
        });
      } finally {
        clearTimeout(createTimeout);
      }

      console.log("[create] client: got response", response.status);

      let data: { id?: string; slug?: string; error?: string };
      try {
        data = await response.json();
      } catch {
        setLoading(false);
        setError(response.ok ? "Invalid response from server" : "Failed to create template");
        return;
      }

      if (!response.ok) {
        console.log("[create] client: error", data.error);
        setLoading(false);
        setError(data.error || "Failed to create template");
        return;
      }

      console.log("[create] client: template created", data.id);

      if (pendingImageFile && data.id) {
        const formData = new FormData();
        formData.append("file", pendingImageFile);
        const imageAbort = new AbortController();
        const imageTimeout = setTimeout(() => imageAbort.abort(), 60_000);
        try {
          const imageRes = await fetch(`/api/templates/${data.id}/image`, {
            method: "POST",
            body: formData,
            signal: imageAbort.signal,
          });
          if (!imageRes.ok) {
            const imageData = await imageRes.json().catch(() => ({}));
            setLoading(false);
            setError((imageData as { error?: string }).error || "Template created, but image upload failed.");
            return;
          }
        } catch (imgErr) {
          setLoading(false);
          if (imgErr instanceof Error && imgErr.name === "AbortError") {
            setError("Image upload took too long. Template was created.");
          } else {
            setError("Template created, but image upload failed.");
          }
          return;
        } finally {
          clearTimeout(imageTimeout);
        }
      }

      for (const pos of EXTRA_POSITIONS) {
        const file = pendingExtraFiles[pos];
        if (!file || !data.id) continue;

        const formData = new FormData();
        formData.append("file", file);
        formData.append("position", String(pos));

        const extraAbort = new AbortController();
        const extraTimeout = setTimeout(() => extraAbort.abort(), 60_000);
        try {
          const extraRes = await fetch(`/api/templates/${data.id}/extra-image`, {
            method: "POST",
            body: formData,
            signal: extraAbort.signal,
          });
          if (!extraRes.ok) {
            const extraData = await extraRes.json().catch(() => ({}));
            setLoading(false);
            setError(
              (extraData as { error?: string }).error ||
                `Template was created, but extra image ${pos} could not be uploaded.`
            );
            return;
          }
        } catch (extraErr) {
          setLoading(false);
          if (extraErr instanceof Error && extraErr.name === "AbortError") {
            setError("Template was created, but an extra image upload took too long.");
          } else {
            setError(`Template was created, but extra image ${pos} could not be uploaded.`);
          }
          return;
        } finally {
          clearTimeout(extraTimeout);
        }
      }

      router.push(`/template/${data.slug}`);
    } catch (err) {
      console.error("Error creating template:", err);
      setLoading(false);
      if (err instanceof Error && err.name === "AbortError") {
        setError("Request took too long. Please try again.");
      } else {
        setError("An unexpected error occurred");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Create New Template</h1>

      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template Name */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Template Name *</span>
          </label>
          <input
            type="text"
            placeholder="e.g., Dark Thief"
            className="input input-bordered w-full"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={3}
            maxLength={255}
          />
        </div>

        {/* Fashion Code */}
        <div className="form-control">
          <label className="label justify-between">
            <span className="label-text font-semibold">Fashion Code *</span>
            <button
              type="button"
              className="btn btn-ghost btn-secondary"
              onClick={() => setShowHowtoModal(true)}
            >
              How do I find my fashion code?
            </button>
          </label>
          <input
            type="text"
            className="input input-bordered w-full font-mono text-sm"
            placeholder="Paste your fashion code here..."
            value={fashionCode}
            onChange={(e) => setFashionCode(e.target.value)}
            required
          />
        </div>

        {/* Armor Type */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Armor Type *</span>
          </label>
          <div className="join w-full">
            <input
              type="radio"
              name="armor-type"
              className="join-item btn"
              aria-label="Light"
              checked={armorType === "light"}
              onChange={() => setArmorType("light")}
            />
            <input
              type="radio"
              name="armor-type"
              className="join-item btn"
              aria-label="Medium"
              checked={armorType === "medium"}
              onChange={() => setArmorType("medium")}
            />
            <input
              type="radio"
              name="armor-type"
              className="join-item btn"
              aria-label="Heavy"
              checked={armorType === "heavy"}
              onChange={() => setArmorType("heavy")}
            />
          </div>
        </div>

        {/* Description */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Description (optional)</span>
          </label>
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="Describe your fashion template..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
        </div>

        {/* Tags */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Tags (optional)</span>
          </label>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="z.B. dark, thief, shadow – tippen für Vorschläge"
          />
        </div>

        <div className="form-control">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="checkbox"
            />
            <span className="label-text">Create as private (only visible to yourself)</span>
          </label>
          <p className="text-sm text-base-content/60 mt-1">
            Private templates do not appear on the homepage or your public profile.
          </p>
        </div>

        <div className="form-control flex flex-col gap-2">
          <ImageUpload
            currentImageUrl={pendingImagePreviewUrl}
            onFileReady={handleFileReady}
          />
          {pendingImageFile && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={removePendingImage}
            >
              Remove image
            </button>
          )}
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Additional images (optional)</span>
          </label>
          <p className="text-sm text-base-content/70 mb-2">
            Up to 3 more images. Only the main image appears on the card.
          </p>
          <div className="flex flex-wrap gap-6">
            {EXTRA_POSITIONS.map((pos) => (
              <PendingExtraImageSlot
                key={pos}
                position={pos}
                file={pendingExtraFiles[pos]}
                previewUrl={pendingExtraPreviewUrls[pos]}
                onFileSelect={(file) => handleExtraFileSelect(pos, file)}
                onRemove={() => handleExtraRemove(pos)}
              />
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="form-control mt-8">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading || !name.trim() || !fashionCode.trim()}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner"></span>
                Creating...
              </>
            ) : (
              "Create Template"
            )}
          </button>
        </div>

        {/* Howto modal */}
        {showHowtoModal && (
          <dialog
            open
            className="modal modal-open"
            aria-modal="true"
            aria-label="How to find your fashion code"
          >
            <div className="modal-box max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col p-4">
              <div className="relative w-full min-h-[200px] flex-1">
                <Image
                  src="/howto.png"
                  alt="How to find your fashion code in Guild Wars 2"
                  fill
                  className="object-contain"
                  sizes="(max-width: 896px) 100vw, 672px"
                />
              </div>
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowHowtoModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
            <div
              className="modal-backdrop"
              onClick={() => setShowHowtoModal(false)}
              onKeyDown={(e) => e.key === "Escape" && setShowHowtoModal(false)}
              role="button"
              tabIndex={0}
              aria-label="Close"
            />
          </dialog>
        )}
      </form>
    </div>
  );
}

