import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateToken } from "@surveymasterai/auth";
import { jsonError, recordAudit, requirePermissionOrError, resolveApiOrgContext } from "@/lib/api";
import { assertWithinTeamLimit } from "@/lib/limits";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ORG_ADMIN", "MANAGER", "RESPONDENT"]),
});

export async function GET() {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const invitations = await prisma.invitation.findMany({
    where: { organizationId: ctx.organizationId, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ invitations });
}

export async function POST(request: Request) {
  const ctx = await resolveApiOrgContext();
  if (ctx instanceof NextResponse) return ctx;

  const permError = requirePermissionOrError(ctx, "org:invite_members");
  if (permError) return permError;

  const body = await request.json().catch(() => null);
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const limitError = await assertWithinTeamLimit(ctx.organizationId);
  if (limitError) return jsonError(limitError, 402);

  const existingMember = await prisma.organizationMember.findFirst({
    where: { organizationId: ctx.organizationId, user: { email: parsed.data.email.toLowerCase() } },
  });
  if (existingMember) return jsonError("This person is already a member of your organization.", 409);

  const invitation = await prisma.invitation.create({
    data: {
      organizationId: ctx.organizationId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      token: generateToken(24),
      invitedById: ctx.userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "invitation.created",
    entityType: "Invitation",
    entityId: invitation.id,
    metadata: { email: invitation.email, role: invitation.role },
  });

  // No email provider configured by default: return the invite link directly
  // so the UI can display/copy it (see EMAIL_PROVIDER in .env.example).
  return NextResponse.json({
    invitation,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/invite/${invitation.token}`,
  });
}
