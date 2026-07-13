import { createClient } from "@supabase/supabase-js";
import { config } from "@/config/server";

function getStorageClient() {
  if (!config.storage.URL || !config.storage.SERVICE_ROLE_KEY) {
    throw new Error("Supabase Storage is not configured");
  }

  return createClient(config.storage.URL, config.storage.SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const StorageRepository = {
  async upload(
    path: string,
    content: Buffer,
    contentType: string,
  ): Promise<void> {
    const result = await getStorageClient()
      .storage.from(config.storage.BUCKET)
      .upload(path, content, { contentType, upsert: false });
    if (result.error) throw new Error(result.error.message);
  },

  async createSignedUrl(path: string, expiresIn: number): Promise<string> {
    const result = await getStorageClient()
      .storage.from(config.storage.BUCKET)
      .createSignedUrl(path, expiresIn);
    if (result.error || !result.data?.signedUrl) {
      throw new Error(result.error?.message || "Could not create file URL");
    }
    return result.data.signedUrl;
  },
};
