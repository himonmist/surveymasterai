import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@surveymasterai/auth";

/**
 * Temporary diagnostic endpoint: runs the exact same lookup-and-verify logic
 * as the credentials authorize() callback, but reports back *why* it
 * succeeded or failed instead of collapsing everything into a generic
 * invalid-credentials result. Protected by SEED_SECRET; safe to leave
 * disabled (403) whenever that env var isn't set. Never returns the actual
 * password hash or password.
 */
export async function POST(request: Request) {
  const configuredSecret = process.env.SEED_SECRET;
  if (!configuredSecret) {
    return NextResponse.json({ error: "Diagnostics are not enabled in this environment." }, { status: 403 });
  }

  const provided = request.headers.get("x-seed-secret");
  if (provided !== configuredSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 422 });
  }

  let user: Awaited<ReturnType<typeof prisma.user.findUnique>> | null = null;
  let findError: string | null = null;
  try {
    user = await prisma.user.findUnique({ where: { email: String(body.email).toLowerCase() } });
  } catch (e) {
    findError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  if (findError) {
    return NextResponse.json({ step: "findUnique", error: findError });
  }
  if (!user) {
    return NextResponse.json({ step: "findUnique", found: false, queriedEmail: String(body.email).toLowerCase() });
  }

  const hasHash = Boolean(user.passwordHash);
  let valid = false;
  let compareError: string | null = null;
  if (user.passwordHash) {
    try {
      valid = await verifyPassword(user.passwordHash, String(body.password));
    } catch (e) {
      compareError = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    }
  }

  return NextResponse.json({
    step: "verifyPassword",
    found: true,
    userId: user.id,
    hasHash,
    hashPrefix: user.passwordHash?.slice(0, 7) ?? null,
    hashLength: user.passwordHash?.length ?? 0,
    passwordLength: String(body.password).length,
    valid,
    compareError,
    isSuperAdmin: user.isSuperAdmin,
  });
}
