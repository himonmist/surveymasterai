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
    // outputFileTracingRoot alone isn't enough: Prisma's query engine
    // binary is loaded via a dynamically-constructed path at runtime, not a
    // static require()/import, so Next's file tracer (@vercel/nft) can
    // never discover it through normal dependency analysis. It has to be
    // force-included explicitly. In Next 14.2, this option only takes
    // effect under `experimental` (it wasn't promoted to top-level until
    // Next 15). These MUST be plain relative strings, not path.join()'d
    // absolute paths: Vercel's build re-joins each pattern onto the
    // directory containing next.config.mjs using path.join, which (unlike
    // path.resolve) does not reset to root for an absolute second argument
    // — an absolute pattern here gets silently double-prefixed instead.
    outputFileTracingIncludes: {
      "/api/**/*": [
        "../../node_modules/.pnpm/@prisma+client@*/node_modules/.prisma/client/**/*",
        "../../node_modules/.prisma/client/**/*",
        "./node_modules/.prisma/client/**/*",
      ],
    },
  },
};

export default nextConfig;
