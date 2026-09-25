import { NextResponse } from "next/server";
import { resolveApiSuperAdmin } from "@/lib/api";
import { getPlatformStats } from "@/lib/admin-stats";

export async function GET() {
  const ctx = await resolveApiSuperAdmin();
  if (ctx instanceof NextResponse) return ctx;

  const stats = await getPlatformStats();
  return NextResponse.json(stats);
}
