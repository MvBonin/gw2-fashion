"use client";

import { useState } from "react";
import Image from "next/image";

interface ExtraImage {
  position: number;
  image_url: string;
}

interface TemplateExtraImagesGalleryProps {
  templateName: string;
  extraImages: ExtraImage[];
}

export default function TemplateExtraImagesGallery({
  templateName,
  extraImages,
}: TemplateExtraImagesGalleryProps) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  if (!extraImages || extraImages.length === 0) return null;

  const sorted = [...extraImages].sort((a, b) => a.position - b.position);

  return (
    <>
      <div className="mt-4">
        <p className="text-sm text-base-content/70 mb-2">Weitere Ansichten</p>
        <div className="flex flex-wrap gap-3">
          {sorted.map((img) => (
            <button
              key={img.position}
              type="button"
              className="relative w-20 h-20 rounded-lg overflow-hidden ring-1 ring-base-300 hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary shrink-0"
              onClick={() => setLightboxUrl(img.image_url)}
              aria-label={`Bild ${img.position} vergrößern`}
            >
              <Image
                src={img.image_url}
                alt={`${templateName} – Ansicht ${img.position}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      </div>

      {lightboxUrl && (
        <dialog
          open
          className="modal modal-open"
          onClose={() => setLightboxUrl(null)}
        >
          <div
            className="modal-box max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full aspect-[9/16] max-h-[85vh] bg-base-300">
              <Image
                src={lightboxUrl}
                alt={templateName}
                fill
                className="object-contain"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={() => setLightboxUrl(null)}
            onKeyDown={(e) => e.key === "Escape" && setLightboxUrl(null)}
            role="button"
            tabIndex={0}
            aria-label="Schließen"
          />
        </dialog>
      )}
    </>
  );
}
