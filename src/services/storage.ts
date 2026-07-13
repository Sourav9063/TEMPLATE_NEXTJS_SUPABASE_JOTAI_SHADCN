import sharp from "sharp";
import { config } from "@/config/server";
import { AppError } from "@/lib/utils/error";
import { StorageRepository } from "@/repository/storage";
import { StoragePathSchema, type UploadedFile } from "@/types/storage";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const SIGNED_URL_TTL_SECONDS = 60 * 60;
const IMAGE_FORMATS = ["jpeg", "png", "webp"];

async function compressImage(file: File): Promise<Buffer> {
  if (file.size > MAX_FILE_SIZE) {
    throw new AppError(400, "Image must be 5 MB or smaller");
  }

  try {
    const image = sharp(Buffer.from(await file.arrayBuffer()), {
      limitInputPixels: MAX_INPUT_PIXELS,
    });
    const metadata = await image.metadata();
    if (!metadata.format || !IMAGE_FORMATS.includes(metadata.format)) {
      throw new Error("Unsupported image format");
    }

    return image
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    throw new AppError(400, "Only valid JPEG, PNG, or WebP images are allowed");
  }
}

export const StorageService = {
  async uploadImage(userId: string, value: unknown): Promise<UploadedFile> {
    if (!(value instanceof File)) {
      throw new AppError(400, "An image file is required");
    }

    const compressed = await compressImage(value);
    const path = `${userId}/${crypto.randomUUID()}.webp`;
    await StorageRepository.upload(path, compressed, "image/webp");
    const signedUrl = await StorageRepository.createSignedUrl(
      path,
      SIGNED_URL_TTL_SECONDS,
    );

    return {
      bucket: config.storage.BUCKET,
      path,
      contentType: "image/webp",
      size: compressed.byteLength,
      signedUrl,
    };
  },

  async createSignedUrl(userId: string, value: unknown): Promise<string> {
    const parsed = StoragePathSchema.safeParse(value);
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0]?.message);
    }
    if (!parsed.data.startsWith(`${userId}/`)) {
      throw new AppError(403, "You cannot access this file");
    }
    return StorageRepository.createSignedUrl(
      parsed.data,
      SIGNED_URL_TTL_SECONDS,
    );
  },
};
