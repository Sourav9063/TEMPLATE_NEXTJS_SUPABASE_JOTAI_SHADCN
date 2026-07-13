"use server";

import { createAction } from "@/lib/create-action";
import { StorageService } from "@/services/storage";

export const uploadImage = createAction.user(async (user, file: unknown) =>
  StorageService.uploadImage(user.id, file),
);

export const getFileUrl = createAction.user(async (user, path: unknown) =>
  StorageService.createSignedUrl(user.id, path),
);
