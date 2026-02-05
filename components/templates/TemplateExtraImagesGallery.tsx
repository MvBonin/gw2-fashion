"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";

interface ExtraImage {
  position: number;
  image_url: string;
}

interface TemplateExtraImagesGalleryProps {
  templateName: string;
  mainImageUrl: string | null;
  extraImages: ExtraImage[];
}

function buildImages(mainImageUrl: string | null, extraImages: ExtraImage[]): string[] {
  const sorted = [...extraImages].sort((a, b) => a.position - b.position);
  const extraUrls = sorted.map((e) => e.image_url);
  if (mainImageUrl) return [mainImageUrl, ...extraUrls];
  return extraUrls;
}

export default function TemplateExtraImagesGallery({
  templateName,
  mainImageUrl,
  extraImages,
}: TemplateExtraImagesGalleryProps) {
  const images = buildImages(mainImageUrl, extraImages ?? []);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lightboxIndexRef = useRef(0);
  const [lightboxIndex, setLightboxIndexState] = useState(0);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const lightboxContentRef = useRef<HTMLDivElement>(null);

  const setLightboxIndex = useCallback((i: number) => {
    lightboxIndexRef.current = i;
    setLightboxIndexState(i);
  }, []);

  const openLightbox = useCallback((index: number) => {
    if (images.length === 0) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, [images.length]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    requestAnimationFrame(() => {
      prevFocusRef.current?.focus?.();
    });
  }, []);

  const goPrevLightbox = useCallback(() => {
    if (images.length <= 1) return;
    setLightboxIndex((lightboxIndexRef.current - 1 + images.length) % images.length);
  }, [images.length]);

  const goNextLightbox = useCallback(() => {
    if (images.length <= 1) return;
    setLightboxIndex((lightboxIndexRef.current + 1) % images.length);
  }, [images.length]);

  // Pfeiltasten + Escape in der Lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrevLightbox();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNextLightbox();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, closeLightbox, goPrevLightbox, goNextLightbox]);

  // Fokus in Lightbox setzen
  useEffect(() => {
    if (lightboxOpen && lightboxContentRef.current) {
      const focusable = lightboxContentRef.current.querySelector<HTMLElement>(
        'button[aria-label="Previous image"], button[aria-label="Next image"], button[aria-label="Schließen"]'
      );
      focusable?.focus();
    }
  }, [lightboxOpen]);

  if (images.length === 0) return null;

  const coverUrl = images[0];
  const hasMultipleImages = images.length > 1;

  return (
    <>
      {/* Cover: ein großes statisches Bild, keine Pfeile/Slider; Klick öffnet Lightbox (Vergrößern) */}
      <button
        type="button"
        className="relative w-full aspect-[9/16] rounded-xl overflow-hidden ring-1 ring-base-300 shadow-lg bg-base-200 block cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-base-100"
        onClick={() => openLightbox(0)}
        aria-label="Bild vergrößern"
      >
        <Image
          src={coverUrl}
          alt={templateName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1024px"
          quality={100}
          priority
        />
      </button>

      {/* Thumbnails: nur bei mehreren Bildern; Klick öffnet Lightbox */}
      {hasMultipleImages && (
        <div className="mt-4">
          <p className="text-sm font-medium text-base-content/70 mb-2">Weitere Ansichten</p>
          <div className="flex flex-wrap gap-2">
            {images.map((url, idx) => (
              <button
                key={idx}
                type="button"
                className="relative w-24 h-24 rounded-xl overflow-hidden ring-2 ring-base-300 hover:ring-primary focus:ring-2 focus:ring-primary focus:outline-none transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                onClick={() => openLightbox(idx)}
                aria-label={idx === 0 ? "Hauptbild vergrößern" : `Ansicht ${idx + 1} vergrößern`}
              >
                <Image
                  src={url}
                  alt={idx === 0 ? templateName : `${templateName} – Ansicht ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="192px"
                  quality={100}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox: fast volle Breite/Höhe, DaisyUI */}
      {lightboxOpen && (
        <dialog
          open
          className="modal modal-open bg-base-content/80"
          onClose={closeLightbox}
          aria-modal="true"
          aria-label="Bildergalerie"
        >
          <div
            ref={lightboxContentRef}
            className="modal-box max-w-none w-[95vw] h-[95vh] sm:w-[92vw] sm:h-[92vh] p-2 sm:p-4 gap-2 sm:gap-4 flex flex-col bg-base-100 shadow-2xl rounded-2xl border border-base-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Zähler + Schließen */}
            <div className="flex items-center justify-between shrink-0 px-1">
              <span className="text-sm font-medium text-base-content/70">
                {lightboxIndex + 1} / {images.length}
              </span>
              <button
                type="button"
                className="btn btn-square btn-ghost btn-sm"
                onClick={closeLightbox}
                aria-label="Schließen"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Bildbereich: zentral, fast volle Höhe */}
            <div className="relative flex-1 min-h-0 flex items-center justify-center gap-2 sm:gap-4">
              {hasMultipleImages && (
                <button
                  type="button"
                  className="btn btn-circle btn-ghost shrink-0 bg-base-200/80 hover:bg-base-300"
                  onClick={goPrevLightbox}
                  aria-label="Previous image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <div className="relative w-full flex-1 min-w-0 h-full max-h-[calc(95vh-5rem)] bg-base-200 rounded-xl overflow-hidden">
                <Image
                  src={images[lightboxIndex]}
                  alt={lightboxIndex === 0 ? templateName : `${templateName} – Ansicht ${lightboxIndex + 1}`}
                  fill
                  className="object-contain"
                  sizes="95vw"
                  quality={100}
                />
              </div>
              {hasMultipleImages && (
                <button
                  type="button"
                  className="btn btn-circle btn-ghost shrink-0 bg-base-200/80 hover:bg-base-300"
                  onClick={goNextLightbox}
                  aria-label="Next image"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {/* Thumbnail-Streifen in der Lightbox (optional, für schnelles Springen) */}
            {hasMultipleImages && images.length <= 8 && (
              <div className="flex justify-center gap-1.5 shrink-0 overflow-x-auto py-2">
                {images.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 transition-all ${
                      idx === lightboxIndex
                        ? "ring-2 ring-primary ring-offset-2 ring-offset-base-100"
                        : "opacity-70 hover:opacity-100"
                    }`}
                    onClick={() => setLightboxIndex(idx)}
                    aria-label={`Zu Ansicht ${idx + 1}`}
                    aria-current={idx === lightboxIndex ? "true" : undefined}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div
            className="modal-backdrop bg-black/70"
            onClick={closeLightbox}
            onKeyDown={(e) => e.key === "Escape" && closeLightbox()}
            role="button"
            tabIndex={0}
            aria-label="Schließen"
          />
        </dialog>
      )}
    </>
  );
}
