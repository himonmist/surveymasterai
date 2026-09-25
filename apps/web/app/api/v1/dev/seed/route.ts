import { NextResponse } from "next/server";
import { prisma, seedDemoData } from "@surveymasterai/database";

/**
 * One-time / idempotent demo-data seeding endpoint for environments where a
 * direct database connection isn't available to run `pnpm db:seed` (e.g.
 * triggering it manually after a first production deploy). Protected by
 * SEED_SECRET — without it configured, this route always refuses.
 */
export async function POST(request: Request) {
  const configuredSecret = process.env.SEED_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: "Seeding is not enabled in this environment." }, { status: 403 });
  }

  const provided = request.headers.get("x-seed-secret");
  if (provided !== configuredSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const logs: string[] = [];
  await seedDemoData(prisma, (msg) => logs.push(msg));

  return NextResponse.json({ success: true, logs });
}
