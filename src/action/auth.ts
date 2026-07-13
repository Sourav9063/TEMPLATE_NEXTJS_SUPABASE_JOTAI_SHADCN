"use server";

import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { config } from "@/config/server";
import { PERMISSIONS } from "@/constants/permissions";
import { createAction } from "@/lib/create-action";
import { deleteCookie, getCookie, setCookie } from "@/lib/utils/server/cookie";
import { AuthService } from "@/services/auth";
import type { AuthUser } from "@/types/auth";

function createSessionToken(user: AuthUser, sessionId: string): string {
  return jwt.sign(
    { payload: { user, permissions: [PERMISSIONS.User] } },
    config.auth.JWT_SECRET,
    {
      expiresIn: config.auth.JWT_MAX_AGE as jwt.SignOptions["expiresIn"],
      algorithm: config.auth.JWT_ALGORITHM,
      jwtid: sessionId,
    },
  );
}

async function startSession(user: AuthUser): Promise<void> {
  const sessionId = crypto.randomUUID();
  const token = createSessionToken(user, sessionId);
  const decoded = jwt.decode(token);
  if (
    !decoded ||
    typeof decoded === "string" ||
    typeof decoded.exp !== "number"
  ) {
    throw new Error("Could not create session");
  }
  await AuthService.createSession(
    sessionId,
    user.id,
    new Date(decoded.exp * 1000),
  );
  await setCookie({ access_token: token }, config.auth.JWT_MAX_AGE_SECONDS);
}

export const requestAccess = createAction.public(
  async (email: unknown, redirectUrl?: unknown) => {
    return AuthService.requestAccess(email, redirectUrl);
  },
);

export const googleSignIn = createAction.public(async (credential: unknown) => {
  const user = await AuthService.googleLogin(credential);
  await startSession(user);
  return user;
});

export const verifyAccessCode = createAction.public(
  async (email: unknown, code: unknown) => {
    const user = await AuthService.verifyCode(email, code);
    await startSession(user);
    return user;
  },
);

export const verifyMagicLink = createAction.public(async (token: unknown) => {
  const user = await AuthService.verifyMagicLink(token);
  await startSession(user);
  return user;
});

export async function handleLogout(): Promise<never> {
  const token = await getCookie("access_token");
  if (typeof token === "string") {
    try {
      const decoded = jwt.verify(token, config.auth.JWT_SECRET, {
        algorithms: [config.auth.JWT_ALGORITHM],
        ignoreExpiration: true,
      });
      if (typeof decoded !== "string" && typeof decoded.jti === "string") {
        await AuthService.revokeSession(decoded.jti);
      }
    } catch {
      // An invalid cookie still needs to be removed locally.
    }
  }
  await deleteCookie("access_token");
  redirect("/login");
}
