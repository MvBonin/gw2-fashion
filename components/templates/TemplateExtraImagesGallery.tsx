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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lightboxIndexRef = useRef(0);
  const [lightboxIndex, setLightboxIndexState] = useState(0);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const lightboxContentRef = useRef<HTMLDivElement>(null);

  const setLightboxIndex = useCallback((i: number) => {
    lightboxIndexRef.current = i;
    setLightboxIndexState(i);
  }, []);

  const openLightbox = useCallback(() => {
    if (images.length === 0) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    setLightboxIndex(currentIndex);
    setLightboxOpen(true);
  }, [images.length, currentIndex]);

  const closeLightbox = useCallback(() => {
    setLightboxOpen(false);
    setCurrentIndex(lightboxIndexRef.current);
    requestAnimationFrame(() => {
      prevFocusRef.current?.focus?.();
    });
  }, []);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((i) => (i + 1) % images.length);
  }, [images.length]);

  const goPrevLightbox = useCallback(() => {
    if (images.length <= 1) return;
    setLightboxIndex((lightboxIndexRef.current - 1 + images.length) % images.length);
  }, [images.length]);

  const goNextLightbox = useCallback(() => {
    if (images.length <= 1) return;
    setLightboxIndex((lightboxIndexRef.current + 1) % images.length);
  }, [images.length]);

  // Pfeiltasten in der Galerie (nur wenn Lightbox zu)
  useEffect(() => {
    if (lightboxOpen || images.length <= 1) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName)) return;
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxOpen, images.length, goPrev, goNext]);

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
        'button[aria-label="Previous image"], button[aria-label="Next image"]'
      );
      focusable?.focus();
    }
  }, [lightboxOpen]);

  if (images.length === 0) return null;

  const showNav = images.length > 1;

  return (
    <>
      {/* Galerie: ein großes Bild + Pfeile */}
      <div className="relative w-full aspect-[9/16] rounded-xl overflow-hidden ring-1 ring-base-300 shadow-lg bg-base-200">
        <button
          type="button"
          className="absolute inset-0 w-full h-full cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset"
          onClick={openLightbox}
          aria-label="Open image in lightbox"
        >
          <Image
            src={images[currentIndex]}
            alt={currentIndex === 0 ? templateName : `${templateName} – view ${currentIndex + 1}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1024px"
            quality={100}
            priority={currentIndex === 0}
          />
        </button>

        {showNav && (
          <>
            <button
              type="button"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost bg-base-content/20 hover:bg-base-content/30 text-base-100 border-0"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 btn btn-circle btn-sm btn-ghost bg-base-content/20 hover:bg-base-content/30 text-base-100 border-0"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {showNav && (
        <div className="mt-4">
          <p className="text-sm text-base-content/70 mb-2">More views</p>
          <div className="flex flex-wrap gap-3">
            {images.map((url, idx) => (
              <button
                key={idx}
                type="button"
                className={`relative w-20 h-20 rounded-lg overflow-hidden ring-2 shrink-0 focus:outline-none focus:ring-2 focus:ring-primary ${
                  idx === currentIndex ? "ring-primary" : "ring-base-300 hover:ring-primary"
                }`}
                onClick={() => {
                  setCurrentIndex(idx);
                  setLightboxIndex(idx);
                  setLightboxOpen(true);
                }}
                aria-label={idx === 0 ? "Main image" : `View ${idx + 1}`}
                aria-current={idx === currentIndex ? "true" : undefined}
              >
                <Image
                  src={url}
                  alt={idx === 0 ? templateName : `${templateName} – view ${idx + 1}`}
                  fill
                  className="object-cover"
                  sizes="160px"
                  quality={100}
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <dialog
          open
          className="modal modal-open"
          onClose={closeLightbox}
          aria-modal="true"
          aria-label="Image lightbox"
        >
          <div
            ref={lightboxContentRef}
            className="modal-box max-w-4xl w-full max-h-[90vh] p-0 overflow-hidden flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {showNav && (
              <button
                type="button"
                className="btn btn-circle btn-ghost shrink-0"
                onClick={goPrevLightbox}
                aria-label="Previous image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="relative w-full aspect-[9/16] max-h-[85vh] bg-base-300 flex-1 min-w-0">
              <Image
                src={images[lightboxIndex]}
                alt={lightboxIndex === 0 ? templateName : `${templateName} – view ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                quality={100}
              />
            </div>
            {showNav && (
              <button
                type="button"
                className="btn btn-circle btn-ghost shrink-0"
                onClick={goNextLightbox}
                aria-label="Next image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          <div
            className="modal-backdrop"
            onClick={closeLightbox}
            onKeyDown={(e) => e.key === "Escape" && closeLightbox()}
            role="button"
            tabIndex={0}
            aria-label="Close"
          />
        </dialog>
      )}
    </>
  );
}
