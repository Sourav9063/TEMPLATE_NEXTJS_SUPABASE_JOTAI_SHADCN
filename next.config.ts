import type { NextConfig } from "next";
import { validateEnv } from "./validate-env";

validateEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseHostname = supabaseUrl ? new URL(supabaseUrl).hostname : null;

const nextConfig: NextConfig = {
  reactCompiler: true,
  cacheComponents: true,
  output: "standalone",
  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: "https",
            hostname: supabaseHostname,
            pathname: "/storage/v1/object/**",
          },
        ]
      : [],
  },
  transpilePackages: ["jotai-devtools"],
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb",
    },
    staleTimes: {
      dynamic: 5 * 60,
      static: 5 * 60,
    },
  },
};

export default nextConfig;
