import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/dashboard': ['./data/**/*'],
    },
  },
};

export default nextConfig;
