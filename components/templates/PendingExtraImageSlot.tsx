"use client";

import { useState, useRef } from "react";
import Image from "next/image";

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB (server compresses)
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

interface PendingExtraImageSlotProps {
  position: 1 | 2 | 3;
  file: File | null;
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  error?: string | null;
}

export default function PendingExtraImageSlot({
  position,
  file,
  previewUrl,
  onFileSelect,
  onRemove,
  error: externalError = null,
}: PendingExtraImageSlotProps) {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const error = externalError ?? localError;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError(null);
    const rawFile = e.target.files?.[0];
    e.target.value = "";
    if (!rawFile || !rawFile.type.startsWith("image/")) return;
    if (!ALLOWED_TYPES.includes(rawFile.type)) {
      setLocalError("Use JPEG, PNG, WebP or AVIF only.");
      return;
    }
    if (rawFile.size > MAX_FILE_BYTES) {
      setLocalError("Max. 10 MB.");
      return;
    }

    setLoading(true);
    try {
      onFileSelect(rawFile);
    } catch {
      setLocalError("Image could not be processed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-base-300 shrink-0">
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt={`Extra image ${position}`}
            fill
            className="object-cover"
            sizes="96px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-base-content/30">
            <span className="text-xs">Image {position + 1}</span>
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
          disabled={loading}
        >
          {file ? "Change" : "Upload"}
        </button>
        {file && (
          <button
            type="button"
            className="btn btn-xs btn-ghost text-error"
            onClick={onRemove}
            disabled={loading}
          >
            Remove
          </button>
        )}
      </div>
      {loading && <span className="text-xs text-base-content/60">…</span>}
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
