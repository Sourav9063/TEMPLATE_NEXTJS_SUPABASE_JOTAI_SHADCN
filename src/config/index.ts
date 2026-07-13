export const config = {
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:8080",
  auth: {
    GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID || "",
  },
};
