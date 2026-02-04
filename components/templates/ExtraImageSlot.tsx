"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";

interface ExtraImageSlotProps {
  templateId: string;
  position: 1 | 2 | 3;
  currentImageUrl: string | null;
  onUploadSuccess: (url: string) => void;
  onRemove: () => void;
}

const MAX_FILE_BYTES = 3 * 1024 * 1024; // 3MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ExtraImageSlot({
  templateId,
  position,
  currentImageUrl,
  onUploadSuccess,
  onRemove,
}: ExtraImageSlotProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !file.type.startsWith("image/")) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Nur JPEG, PNG oder WebP.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("Max. 3 MB.");
      return;
    }

    setUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        initialQuality: 0.95,
        useWebWorker: true,
      });

      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("position", String(position));

      const res = await fetch(`/api/templates/${templateId}/extra-image`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Upload fehlgeschlagen");
      }
      if (!data.image_url) {
        throw new Error("Keine Bild-URL erhalten");
      }
      onUploadSuccess(data.image_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setError(null);
    setUploading(true);
    try {
      const res = await fetch(
        `/api/templates/${templateId}/extra-image?position=${position}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Löschen fehlgeschlagen");
      }
      onRemove();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Löschen fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-base-300 shrink-0">
        {currentImageUrl ? (
          <Image
            src={currentImageUrl}
            alt={`Zusatzbild ${position}`}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-content/30">
            <span className="text-xs">Bild {position + 1}</span>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-1">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="btn btn-xs btn-ghost"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {currentImageUrl ? "Ändern" : "Hochladen"}
        </button>
        {currentImageUrl && (
          <button
            type="button"
            className="btn btn-xs btn-ghost text-error"
            onClick={handleRemove}
            disabled={uploading}
          >
            Entfernen
          </button>
        )}
      </div>
      {uploading && (
        <span className="text-xs text-base-content/60">…</span>
      )}
      {error && (
        <p className="text-xs text-error">{error}</p>
      )}
    </div>
  );
}
