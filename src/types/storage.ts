import { z } from "zod";

export const StoragePathSchema = z
  .string()
  .min(1, "Storage path is required")
  .max(1024, "Storage path is too long")
  .refine((value) => !value.includes("..") && !value.startsWith("/"), {
    message: "Invalid storage path",
  });

export interface UploadedFile {
  bucket: string;
  path: string;
  contentType: "image/webp";
  size: number;
  signedUrl: string;
}
