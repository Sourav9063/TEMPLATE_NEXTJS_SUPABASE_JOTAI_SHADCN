import { createHash, randomBytes, randomInt } from "node:crypto";
import { z } from "zod";
import { config } from "@/config/server";
import { sendAccessEmail } from "@/lib/email";
import { AppError } from "@/lib/utils/error";
import { getSafeRedirectPath } from "@/lib/utils/redirect";
import { AuthRepository } from "@/repository/auth";
import {
  AuthRequestSchema,
  type AuthUser,
  AuthVerifySchema,
  GoogleCredentialSchema,
  type GoogleIdentity,
  GoogleIdentitySchema,
  type UserRow,
} from "@/types/auth";

const MagicTokenSchema = z.string().regex(/^[a-f0-9]{64}$/);

function hashValue(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function mapUser(row: UserRow, identity?: GoogleIdentity): AuthUser {
  return {
    id: row.id,
    email: row.email,
    name: identity?.name || row.display_name || row.email,
    picture: identity?.picture || row.avatar_url,
  };
}

async function verifyGoogleToken(
  rawCredential: unknown,
): Promise<GoogleIdentity> {
  const credential = GoogleCredentialSchema.safeParse(rawCredential);
  if (!credential.success)
    throw new AppError(400, "Google credential is missing");
  if (!config.auth.GOOGLE_CLIENT_ID) {
    throw new AppError(503, "Google sign-in is not configured");
  }

  const response = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential.data)}`,
    { cache: "no-store" },
  );
  if (!response.ok) throw new AppError(401, "Failed to verify Google sign-in");

  const parsed = GoogleIdentitySchema.safeParse(await response.json());
  if (!parsed.success || parsed.data.aud !== config.auth.GOOGLE_CLIENT_ID) {
    throw new AppError(401, "Google sign-in is invalid");
  }
  return parsed.data;
}

export const AuthService = {
  async requestAccess(
    rawInput: unknown,
    rawRedirectUrl?: unknown,
  ): Promise<{ email: string }> {
    const parsed = AuthRequestSchema.safeParse({ email: rawInput });
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0]?.message);
    }
    if (!config.email.HOST || !config.email.USER || !config.email.PASSWORD) {
      throw new AppError(503, "Email delivery is not configured");
    }
    await AuthRepository.cleanupExpiredData();
    const user = await AuthRepository.findOrCreateUser(parsed.data.email);
    const code = String(randomInt(100000, 1000000));
    const magicToken = randomBytes(32).toString("hex");
    await AuthRepository.createChallenge(
      user.id,
      hashValue(code),
      hashValue(magicToken),
      new Date(Date.now() + 10 * 60 * 1000),
    );
    await sendAccessEmail({
      email: user.email,
      code,
      magicToken,
      redirectUrl: getSafeRedirectPath(rawRedirectUrl),
    });
    return { email: user.email };
  },

  async verifyCode(email: unknown, code: unknown): Promise<AuthUser> {
    const parsed = AuthVerifySchema.safeParse({ email, code });
    if (!parsed.success) {
      throw new AppError(400, parsed.error.issues[0]?.message);
    }
    const user = await AuthRepository.consumeCode(
      parsed.data.email,
      hashValue(parsed.data.code),
    );
    if (!user) throw new AppError(401, "The code is invalid or expired");
    return mapUser(user);
  },

  async verifyMagicLink(token: unknown): Promise<AuthUser> {
    const parsed = MagicTokenSchema.safeParse(token);
    if (!parsed.success) throw new AppError(400, "Invalid sign-in link");
    const user = await AuthRepository.consumeMagicToken(hashValue(parsed.data));
    if (!user)
      throw new AppError(401, "The sign-in link is invalid or expired");
    return mapUser(user);
  },

  async googleLogin(rawCredential: unknown): Promise<AuthUser> {
    const identity = await verifyGoogleToken(rawCredential);
    const user = await AuthRepository.findOrCreateUser(identity.email, {
      displayName: identity.name,
      avatarUrl: identity.picture,
    });
    return mapUser(user, identity);
  },

  createSession: AuthRepository.createSession,
  isSessionActive: AuthRepository.isSessionActive,
  revokeSession: AuthRepository.revokeSession,
};
