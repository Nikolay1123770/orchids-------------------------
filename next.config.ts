import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["jsonwebtoken", "bcryptjs"],
};

export default nextConfig;
