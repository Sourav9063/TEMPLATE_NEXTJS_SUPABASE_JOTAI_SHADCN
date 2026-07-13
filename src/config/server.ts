import "server-only";

function parseDuration(value: string): number {
  const match = /^(\d+)([smhd])?$/.exec(value.trim());
  if (!match) {
    throw new Error("JWT_MAX_AGE must be a duration such as 7d or 3600");
  }

  const amount = Number(match[1]);
  const multiplier =
    {
      s: 1,
      m: 60,
      h: 60 * 60,
      d: 24 * 60 * 60,
    }[match[2] || "s"] ?? 1;
  return amount * multiplier;
}

const jwtMaxAge = process.env.JWT_MAX_AGE || "7d";

export const config = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8080",
  auth: {
    JWT_SECRET: process.env.JWT_SECRET || "",
    JWT_MAX_AGE: jwtMaxAge,
    JWT_MAX_AGE_SECONDS: parseDuration(jwtMaxAge),
    JWT_ALGORITHM: (process.env.JWT_ALGORITHM || "HS256") as "HS256" | "RS256",
    GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || "",
  },
  email: {
    HOST: process.env.SMTP_HOST || "",
    PORT: Number(process.env.SMTP_PORT || 587),
    SECURE: process.env.SMTP_SECURE === "true",
    USER: process.env.SMTP_USER || "",
    PASSWORD: process.env.SMTP_PASS || "",
    FROM:
      process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@example.com",
  },
  storage: {
    URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    BUCKET: process.env.SUPABASE_STORAGE_BUCKET || "uploads",
  },
};
