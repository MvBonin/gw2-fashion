"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUpload from "./ImageUpload";
import ExtraImageSlot from "./ExtraImageSlot";
import TagInput from "./TagInput";

type ArmorType = "light" | "medium" | "heavy";

export type ExtraImage = { position: number; image_url: string };

interface TemplateEditFormProps {
  templateId: string;
  slug: string;
  initialName: string;
  initialFashionCode: string;
  initialArmorType: ArmorType;
  initialDescription: string;
  initialTags: string[];
  initialImageUrl: string | null;
  initialExtraImages?: ExtraImage[];
}

function extraImagesToRecord(extra: ExtraImage[] | undefined): Record<1 | 2 | 3, string | null> {
  const record: Record<1 | 2 | 3, string | null> = { 1: null, 2: null, 3: null };
  if (!extra) return record;
  for (const { position, image_url } of extra) {
    if (position >= 1 && position <= 3) record[position as 1 | 2 | 3] = image_url;
  }
  return record;
}

export default function TemplateEditForm({
  templateId,
  slug,
  initialName,
  initialFashionCode,
  initialArmorType,
  initialDescription,
  initialTags,
  initialImageUrl,
  initialExtraImages,
}: TemplateEditFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(initialImageUrl);
  const [extraImages, setExtraImages] = useState<Record<1 | 2 | 3, string | null>>(
    () => extraImagesToRecord(initialExtraImages)
  );

  const [name, setName] = useState(initialName);
  const [fashionCode, setFashionCode] = useState(initialFashionCode);
  const [armorType, setArmorType] = useState<ArmorType>(initialArmorType);
  const [description, setDescription] = useState(initialDescription);
  const [tags, setTags] = useState<string[]>(initialTags);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          fashion_code: fashionCode.trim(),
          armor_type: armorType,
          description: description.trim() || null,
          tags: tags.length > 0 ? tags : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update template");
        return;
      }

      router.push(`/template/${slug}`);
    } catch (err) {
      console.error("Error updating template:", err);
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageUpload
          templateId={templateId}
          currentImageUrl={imageUrl}
          onUploadSuccess={setImageUrl}
        />

        <div className="form-control">
          <label className="label">
            <span className="label-text font-semibold">Zusätzliche Bilder (optional)</span>
          </label>
          <p className="text-sm text-base-content/70 mb-2">
            Bis zu 3 weitere Bilder, um den Charakter besser zu zeigen. Nur das Hauptbild erscheint auf der Karte.
          </p>
          <div className="flex flex-wrap gap-6">
            {([1, 2, 3] as const).map((pos) => (
              <ExtraImageSlot
                key={pos}
                templateId={templateId}
                position={pos}
                currentImageUrl={extraImages[pos]}
                onUploadSuccess={(url) => setExtraImages((prev) => ({ ...prev, [pos]: url }))}
                onRemove={() => setExtraImages((prev) => ({ ...prev, [pos]: null }))}
              />
            ))}
          </div>
        </div>

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

        <div className="form-control mt-8">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading || !name.trim() || !fashionCode.trim()}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner"></span>
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </>
  );
}
