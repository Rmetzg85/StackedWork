import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  async redirects() {
    return [
      { source: "/find-contractor", destination: "/", permanent: false },
      { source: "/advertise", destination: "/", permanent: false },
    ];
  },
};
export default nextConfig;
