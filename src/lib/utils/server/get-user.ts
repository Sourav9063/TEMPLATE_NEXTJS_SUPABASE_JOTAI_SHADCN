import "server-only";

import { verifyToken } from "@/action/permission";
import { getPermisson } from "@/constants/permissions";
import { getCookie } from "@/lib/utils/server/cookie";

export async function getUser() {
  const token = await getCookie("access_token");
  if (typeof token !== "string") return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = payload.payload.user;
  return {
    ...user,
    permissions: payload.payload.permissions,
    permission: getPermisson(payload.payload.permissions),
  };
}
