import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength } from "@surveymasterai/auth";
import { jsonError, recordAudit } from "@/lib/api";
import { getCurrentSession } from "@/lib/session";

const acceptSchema = z.object({
  name: z.string().min(2).optional(),
  password: z.string().min(8).optional(),
});

export async function POST(request: Request, { params }: { params: { token: string } }) {
  const invitation = await prisma.invitation.findUnique({ where: { token: params.token } });
  if (!invitation || invitation.status !== "PENDING") {
    return jsonError("This invitation is invalid or has already been used.", 404);
  }
  if (invitation.expiresAt < new Date()) {
    return jsonError("This invitation has expired.", 410);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = acceptSchema.safeParse(body);
  if (!parsed.success) return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);

  const session = await getCurrentSession();
  let userId: string;

  const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });

  if (session?.user && session.user.email?.toLowerCase() === invitation.email) {
    userId = session.user.id;
  } else if (existingUser) {
    return jsonError("An account already exists for this email. Please sign in first, then open this link again.", 409);
  } else {
    if (!parsed.data.name || !parsed.data.password) {
      return jsonError("Name and password are required to create your account.", 422);
    }
    const strength = validatePasswordStrength(parsed.data.password);
    if (!strength.valid) return jsonError(strength.reason ?? "Weak password", 422);

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: invitation.email,
        passwordHash,
        emailVerified: new Date(),
      },
    });
    userId = user.id;
  }

  await prisma.$transaction([
    prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: invitation.organizationId, userId } },
      update: { isActive: true, role: invitation.role },
      create: { organizationId: invitation.organizationId, userId, role: invitation.role },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { status: "ACCEPTED", acceptedAt: new Date() },
    }),
  ]);

  await recordAudit({
    organizationId: invitation.organizationId,
    userId,
    action: "invitation.accepted",
    entityType: "Invitation",
    entityId: invitation.id,
  });

  return NextResponse.json({ success: true, requiresLogin: !session?.user });
}
