import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveApiSuperAdmin } from "@/lib/api";

export async function GET() {
  const ctx = await resolveApiSuperAdmin();
  if (ctx instanceof NextResponse) return ctx;

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ plans });
}
