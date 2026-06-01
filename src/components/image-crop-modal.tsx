"use client";

import { useRef, useState, useCallback } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

interface ImageCropModalProps {
  url: string;
  userId: string;
  onDone: (newUrl: string) => void;
  onCancel: () => void;
}

export function ImageCropModal({ url, userId, onDone, onCancel }: ImageCropModalProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: "%",
    x: 10, y: 10, width: 80, height: 80,
  });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [applying, setApplying] = useState(false);

  const applyCrop = useCallback(async () => {
    const img = imgRef.current;
    if (!img || !completedCrop) return;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(completedCrop.width * scaleX);
    canvas.height = Math.round(completedCrop.height * scaleY);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0, 0, canvas.width, canvas.height
    );

    setApplying(true);
    canvas.toBlob(async (blob) => {
      if (!blob) { setApplying(false); return; }

      const supabase = createClient();
      const path = `${userId}/${Date.now()}_cropped.jpg`;
      const { error } = await supabase.storage
        .from("entry-images")
        .upload(path, blob, { contentType: "image/jpeg" });

      if (!error) {
        const { data: { publicUrl } } = supabase.storage
          .from("entry-images")
          .getPublicUrl(path);
        onDone(publicUrl);
      }
      setApplying(false);
    }, "image/jpeg", 0.92);
  }, [completedCrop, userId, onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-serif font-semibold text-gray-900">Crop photo</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6 flex justify-center bg-gray-50">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            className="max-h-[420px]"
          >
            <img
              ref={imgRef}
              src={url}
              alt=""
              className="max-h-[420px] object-contain"
            />
          </ReactCrop>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={applying}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={applyCrop}
            disabled={applying || !completedCrop}
            className="rounded-full px-6"
          >
            {applying ? "Applying..." : "Apply crop"}
          </Button>
        </div>
      </div>
    </div>
  );
}
