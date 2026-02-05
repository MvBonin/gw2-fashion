"use client";

import { useState, useCallback, useRef } from "react";
import Cropper, { type Area } from "react-easy-crop";
import Image from "next/image";
import { getCroppedImg, TEMPLATE_IMAGE_ASPECT } from "@/lib/utils/cropImage";
import "react-easy-crop/react-easy-crop.css";

interface ImageUploadProps {
  /** Edit mode: required. Create mode: omit. */
  templateId?: string;
  /** Preview / current image URL. Optional in Create mode. */
  currentImageUrl?: string | null;
  /** Edit mode: called after successful API upload. */
  onUploadSuccess?: (imageUrl: string) => void;
  /** Create mode: called with cropped/compressed file instead of uploading. */
  onFileReady?: (file: File) => void;
}

export default function ImageUpload({
  templateId,
  currentImageUrl = null,
  onUploadSuccess,
  onFileReady,
}: ImageUploadProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    setImageSrc(url);
    setCroppedAreaPixels(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    e.target.value = "";
  };

  const closeCrop = () => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    setCroppedAreaPixels(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    setUploading(true);
    setError(null);
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const file = new File([croppedBlob], "image.jpg", { type: "image/jpeg" });

      if (onFileReady) {
        onFileReady(file);
        closeCrop();
        return;
      }

      if (!templateId || !onUploadSuccess) return;
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/templates/${templateId}/image`, {
        method: "POST",
        body: formData,
      });

      let data: { error?: string; image_url?: string };
      try {
        data = await res.json();
      } catch {
        throw new Error(res.ok ? "Invalid response from server" : "Upload failed");
      }
      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }
      if (!data.image_url) {
        throw new Error("No image URL returned");
      }
      onUploadSuccess(data.image_url);
      closeCrop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="form-control">
      <div className="flex flex-col gap-3">
        {currentImageUrl && (
          <div className="relative w-full aspect-[9/16] rounded-lg overflow-hidden bg-base-300">
            <Image
              src={currentImageUrl}
              alt="Template"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 672px"
              quality={100}
            />
          </div>
        )}
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            {currentImageUrl ? "Change cover image" : "Upload cover image"}
          </button>
        </div>
      </div>

      {/* Crop modal */}
      {imageSrc && (
        <dialog
          open
          className="modal modal-open"
          onClose={closeCrop}
        >
          <div className="modal-box max-w-4xl w-full max-h-[90vh] flex flex-col p-0">
            <div className="relative w-full flex-1 min-h-[300px] bg-base-300">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={TEMPLATE_IMAGE_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="p-4 flex flex-col gap-2">
              <label className="label py-0">
                <span className="label-text">Zoom</span>
              </label>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="range range-sm"
              />
              {error && (
                <div className="alert alert-error text-sm">
                  <span>{error}</span>
                </div>
              )}
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={closeCrop}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUpload}
                  disabled={uploading || !croppedAreaPixels}
                >
                  {uploading ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Uploading...
                    </>
                  ) : (
                    "Done"
                  )}
                </button>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop"
            onClick={closeCrop}
            onKeyDown={(e) => e.key === "Escape" && closeCrop()}
            role="button"
            tabIndex={0}
            aria-label="Close modal"
          />
        </dialog>
      )}
    </div>
  );
}
