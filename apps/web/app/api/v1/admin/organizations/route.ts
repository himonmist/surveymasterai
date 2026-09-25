import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveApiSuperAdmin } from "@/lib/api";

export async function GET() {
  const ctx = await resolveApiSuperAdmin();
  if (ctx instanceof NextResponse) return ctx;

  const organizations = await prisma.organization.findMany({
    include: {
      subscription: { include: { plan: true } },
      _count: { select: { members: true, surveys: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    organizations: organizations.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      createdAt: org.createdAt,
      memberCount: org._count.members,
      surveyCount: org._count.surveys,
      planName: org.subscription?.plan.name ?? "No plan",
      subscriptionStatus: org.subscription?.status ?? "NONE",
    })),
  });
}
