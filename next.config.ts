import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // تقليل عدد عمال البناء لمنع انهيار الذاكرة مع SQLite
  experimental: {
    cpus: 1,
  },
  webpack: (config) => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
