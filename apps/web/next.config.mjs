/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@surveymasterai/ai",
    "@surveymasterai/auth",
    "@surveymasterai/billing",
    "@surveymasterai/config",
    "@surveymasterai/database",
    "@surveymasterai/survey-engine",
  ],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client"],
  },
};

export default nextConfig;
