import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, validatePasswordStrength, generateSlug } from "@surveymasterai/auth";
import { jsonError, recordAudit } from "@/lib/api";

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8),
  organizationName: z.string().min(2, "Organization name is required"),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);
  }

  const { name, email, password, organizationName } = parsed.data;

  const strength = validatePasswordStrength(password);
  if (!strength.valid) {
    return jsonError(strength.reason ?? "Weak password", 422);
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) {
    return jsonError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(password);
  const freePlan = await prisma.plan.findUnique({ where: { slug: "free" } });
  if (!freePlan) {
    return jsonError("Platform is not fully configured yet (no default plan). Contact support.", 500);
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash,
        emailVerified: new Date(),
      },
    });

    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        slug: generateSlug(organizationName),
      },
    });

    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        role: "ORG_ADMIN",
      },
    });

    await tx.subscription.create({
      data: {
        organizationId: organization.id,
        planId: freePlan.id,
        status: "TRIALING",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    return { user, organization };
  });

  await recordAudit({
    organizationId: result.organization.id,
    userId: result.user.id,
    action: "user.registered",
    entityType: "Organization",
    entityId: result.organization.id,
  });

  return NextResponse.json({
    user: { id: result.user.id, email: result.user.email, name: result.user.name },
    organization: { id: result.organization.id, name: result.organization.name, slug: result.organization.slug },
  });
}
