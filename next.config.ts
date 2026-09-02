import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],

  typescript: {
    ignoreBuildErrors: false,
  },

  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;