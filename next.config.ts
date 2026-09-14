import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],

  typescript: {
    ignoreBuildErrors: false,
  },

  async redirects() {
    return [
      {
        source: "/account-statement",
        destination: "/invoices",
        permanent: false,
      },
    ];
  },

  webpack: config => {
    config.cache = false;
    return config;
  },
};

export default nextConfig;
