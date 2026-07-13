import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import { CustomToaster } from "@/components/custom-toaster";
import ProviderWrapper from "@/components/providers/provider-wrapper";
import "./globals.css";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8080";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "App Template", template: "%s | App Template" },
  description: "A reusable Next.js application template.",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <NextTopLoader color="var(--primary)" height={2} showSpinner={false} />
        <ProviderWrapper>
          {children}
          <CustomToaster />
        </ProviderWrapper>
      </body>
    </html>
  );
}
