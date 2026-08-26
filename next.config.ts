import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/dashboard': ['./data/**/*'],
  },
};

export default nextConfig;
