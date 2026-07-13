"use client";

import { atom } from "jotai";
import type { PermissionValues } from "@/constants/permissions";

export type ClientAuthUser = {
  id: string;
  email: string;
  name: string;
  picture: string | null;
  permissions: string[];
  permission: Record<PermissionValues, boolean>;
};

export const userAtom = atom<ClientAuthUser | null>(null);
userAtom.debugLabel = "userAtom";
