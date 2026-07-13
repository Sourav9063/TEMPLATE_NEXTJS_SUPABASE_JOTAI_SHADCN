"use server";

import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { config } from "@/config/server";
import { PERMISSIONS } from "@/constants/permissions";
import { getCookie } from "@/lib/utils/server/cookie";
import { AuthService } from "@/services/auth";
import type { AuthUser } from "@/types/auth";

interface UserPayload {
  payload: {
    user: AuthUser;
    permissions: string[];
  };
  jti: string;
}

export async function verifyToken(token: string): Promise<UserPayload | null> {
  try {
    const decoded = jwt.verify(token, config.auth.JWT_SECRET, {
      algorithms: [config.auth.JWT_ALGORITHM],
    }) as UserPayload;
    if (!decoded.jti || !(await AuthService.isSessionActive(decoded.jti))) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export async function checkPermission(
  requiredPermissions: string[],
): Promise<boolean> {
  const token = await getCookie("access_token");
  if (typeof token !== "string") return false;
  const payload = await verifyToken(token);
  return requiredPermissions.some((permission) =>
    payload?.payload.permissions.includes(permission),
  );
}

export async function handlePermission(permissions: string[]): Promise<void> {
  if (!(await checkPermission(permissions))) redirect("/no-permission");
}

export async function handleAdminPermission(): Promise<void> {
  await handlePermission([PERMISSIONS.Admin]);
}

export async function handleReviewerPermission(): Promise<void> {
  await handlePermission([PERMISSIONS.Admin, PERMISSIONS.Reviewer]);
}

export async function handleUserPermission(): Promise<void> {
  await handlePermission([
    PERMISSIONS.Admin,
    PERMISSIONS.Reviewer,
    PERMISSIONS.User,
  ]);
}

export async function checkAdminPermission(): Promise<boolean> {
  return checkPermission([PERMISSIONS.Admin]);
}

export async function checkReviewerPermission(): Promise<boolean> {
  return checkPermission([PERMISSIONS.Admin, PERMISSIONS.Reviewer]);
}

export async function checkUserPermission(): Promise<boolean> {
  return checkPermission([
    PERMISSIONS.Admin,
    PERMISSIONS.Reviewer,
    PERMISSIONS.User,
  ]);
}
