import { z } from "zod";

export const EmailSchema = z
  .email("Enter a valid email address")
  .max(254, "Email address is too long")
  .transform((value) => value.toLowerCase());

export const AuthCodeSchema = z
  .string()
  .regex(/^\d{6}$/, "Enter the six-digit code from your email");

export const AuthRequestSchema = z.object({
  email: EmailSchema,
});

export const AuthVerifySchema = z.object({
  email: EmailSchema,
  code: AuthCodeSchema,
});

export const GoogleCredentialSchema = z.string().min(1);

export const GoogleIdentitySchema = z.object({
  sub: z.string().min(1),
  email: EmailSchema,
  email_verified: z.preprocess(
    (value) => value === true || value === "true",
    z.literal(true),
  ),
  aud: z.string().min(1),
  name: z.string().trim().max(160).optional(),
  picture: z.url().optional(),
});

export type GoogleIdentity = z.infer<typeof GoogleIdentitySchema>;

export interface UserRow {
  id: string;
  email: string;
  created_at: Date;
  last_seen_at: Date | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  picture: string | null;
}
