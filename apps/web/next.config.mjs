import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // In a pnpm monorepo, Prisma's query engine binary lives in the pnpm
  // virtual store at the workspace root, not inside apps/web/node_modules.
  // Without pointing Next.js's file tracer at the real monorepo root, it
  // can fail to bundle that engine binary into some serverless functions
  // (inconsistently — some routes work, others throw
  // PrismaClientInitializationError at runtime). See:
  // https://pris.ly/d/engine-not-found-nextjs
  outputFileTracingRoot: path.join(__dirname, "../../"),
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
