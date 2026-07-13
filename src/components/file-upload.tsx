"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { uploadImage } from "@/action/storage";
import { Input } from "@/components/ui/input";

export function FileUpload() {
  const [isPending, startTransition] = useTransition();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setMessage(null);
    startTransition(async () => {
      const result = await uploadImage(file);
      if (!result.success) {
        setMessage(result.error.message);
        return;
      }
      setImageUrl(result.data.signedUrl);
      setMessage(
        `Uploaded ${Math.ceil(result.data.size / 1024)} KB WebP image`,
      );
    });
  }

  return (
    <div className="space-y-4">
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        disabled={isPending}
      />
      {isPending && <p className="text-sm text-muted-foreground">Uploading…</p>}
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
      {imageUrl && (
        <div className="relative aspect-video overflow-hidden rounded-lg border">
          <Image
            src={imageUrl}
            alt="Uploaded file"
            fill
            className="h-full w-full object-contain"
            unoptimized
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        Images are resized to 1600px and compressed to WebP.
      </p>
    </div>
  );
}
