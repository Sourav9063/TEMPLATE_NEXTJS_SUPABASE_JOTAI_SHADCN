import "server-only";

import nodemailer, { type Transporter } from "nodemailer";
import { config } from "@/config/server";

interface AccessEmailPayload {
  email: string;
  code: string;
  magicToken: string;
  redirectUrl: string;
}

let mailer: Transporter | undefined;

function getMailer(): Transporter {
  if (!config.email.HOST || !config.email.USER || !config.email.PASSWORD) {
    throw new Error("Email delivery is not configured");
  }
  if (mailer) return mailer;
  mailer = nodemailer.createTransport({
    host: config.email.HOST,
    port: config.email.PORT,
    secure: config.email.SECURE,
    auth: { user: config.email.USER, pass: config.email.PASSWORD },
    pool: true,
    maxConnections: 3,
    maxMessages: 100,
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
  return mailer;
}

export async function sendAccessEmail({
  email,
  code,
  magicToken,
  redirectUrl,
}: AccessEmailPayload): Promise<void> {
  const magicLink = new URL("/auth/callback", config.APP_URL);
  magicLink.searchParams.set("token", magicToken);
  magicLink.searchParams.set("redirect-url", redirectUrl);
  await getMailer().sendMail({
    from: config.email.FROM,
    to: email,
    subject: "Your sign-in link and code",
    text: `Use code ${code} to sign in, or open this link: ${magicLink.toString()}. Both expire in 10 minutes.`,
    html: `<p>Use this six-digit code to sign in:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${code}</p><p>Or <a href="${magicLink.toString()}">open this link to sign in</a>.</p><p>Both expire in 10 minutes.</p>`,
  });
}
