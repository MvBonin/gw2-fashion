"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TagInput from "@/components/templates/TagInput";
import ImageUpload from "@/components/templates/ImageUpload";

type ArmorType = "light" | "medium" | "heavy";

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
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Check authentication
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Submit to API
      const response = await fetch("/api/templates/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          fashion_code: fashionCode.trim(),
          armor_type: armorType,
          description: description.trim() || null,
          tags: tags.length > 0 ? tags : null,
          is_private: isPrivate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create template");
        return;
      }

      if (pendingImageFile) {
        const formData = new FormData();
        formData.append("file", pendingImageFile);
        const imageRes = await fetch(`/api/templates/${data.id}/image`, {
          method: "POST",
          body: formData,
        });
        if (!imageRes.ok) {
          const imageData = await imageRes.json().catch(() => ({}));
          setError(imageData.error || "Template created, but image upload failed.");
        }
      }

      router.push(`/template/${data.slug}`);
    } catch (err) {
      console.error("Error creating template:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
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
          <label className="label">
            <span className="label-text font-semibold">Fashion Code *</span>
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
            <span className="label-text">Create as private (only visible to me)</span>
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
      </form>
    </div>
  );
}

