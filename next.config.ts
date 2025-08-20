import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  // Ensure Next.js doesn't treat files in example as part of the app
  // by ignoring them in pageExtensions (no effect if none match)
  // and by not transpiling that directory.
  transpilePackages: [],
};

export default nextConfig;
