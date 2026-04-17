import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const isDev = process.env.NODE_ENV === "development";

const baseConfig: NextConfig = {
  reactStrictMode: true,
  // Silences the Turbopack warning triggered by Serwist's webpack hook.
  turbopack: {},
};

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: isDev,
  reloadOnOnline: true,
  cacheOnNavigation: true,
});

// Only wrap the config with Serwist's webpack plugin in production builds,
// so Turbopack-powered `next dev` stays clean.
const nextConfig: NextConfig = isDev ? baseConfig : withSerwist(baseConfig);

export default nextConfig;
