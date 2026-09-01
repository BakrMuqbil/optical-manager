import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
