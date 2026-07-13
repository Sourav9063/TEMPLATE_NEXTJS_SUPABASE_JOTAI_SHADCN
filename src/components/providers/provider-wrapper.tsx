"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { config } from "@/config";
import { StoreProvider } from "@/stores/provider";

export default function ProviderWrapper({
  children,
}: Readonly<{ children?: React.ReactNode }>) {
  const content = (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <StoreProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </StoreProvider>
    </ThemeProvider>
  );

  const clientId = config.auth.GOOGLE_CLIENT_ID;
  return clientId ? (
    <GoogleOAuthProvider clientId={clientId}>{content}</GoogleOAuthProvider>
  ) : (
    content
  );
}
