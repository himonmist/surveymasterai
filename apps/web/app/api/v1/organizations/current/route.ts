import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { jsonError, recordAudit, requirePermissionOrError, resolveApiOrgContext } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  brandColor: z.string().regex(/^#([0-9a-fA-F]{6})$/).optional(),
  website: z.string().url().optional().or(z.literal("")),
  industry: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const organization = await prisma.organization.findUnique({ where: { id: ctx.organizationId } });
  return NextResponse.json({ organization });
}

export async function PATCH(request: Request) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const permError = requirePermissionOrError(ctx, "org:manage_settings");
  if (permError) return permError;

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const organization = await prisma.organization.update({
    where: { id: ctx.organizationId },
    data: parsed.data,
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "organization.updated",
    entityType: "Organization",
    entityId: ctx.organizationId,
  });

  return NextResponse.json({ organization });
}
