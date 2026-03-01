import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  transpilePackages: [
    "@better-conversation/plugin-sse",
    "@better-conversation/plugin-presence",
    "@better-conversation/plugin-history",
    "@better-conversation/plugin-rate-limit",
  ],
  webpack: (config) => {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js"],
    };
    return config;
  },
};

export default config;
