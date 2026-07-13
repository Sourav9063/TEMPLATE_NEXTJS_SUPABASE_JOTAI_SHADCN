import fs from "node:fs";
import path from "node:path";

export const validateEnv = () => {
  const envExamplePath = path.join(process.cwd(), ".env.example");
  if (!fs.existsSync(envExamplePath)) return;

  const required = [
    "DATABASE_URL",
    "JWT_SECRET",
    "SMTP_HOST",
    "SMTP_USER",
    "SMTP_PASS",
  ];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
};
