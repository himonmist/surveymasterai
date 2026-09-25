import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { prisma } from "./db";
import type { OrgRole } from "@surveymasterai/database";
import { can, type Permission } from "@surveymasterai/auth";

export async function getCurrentSession() {
  return getServerSession(authOptions);
}

export async function requireUser() {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");
  return session.user;
}

export interface OrgContext {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: OrgRole;
}

/**
 * Resolves the caller's active organization context. Users can belong to
 * multiple organizations; for now we use their first (oldest) active
 * membership as the active workspace. Super admins bypass this entirely on
 * platform-level (/admin) routes.
 */
export async function getOrgContext(userId: string): Promise<OrgContext | null> {
  const membership = await prisma.organizationMember.findFirst({
    where: { userId, isActive: true },
    orderBy: { createdAt: "asc" },
    include: { organization: true },
  });

  if (!membership) return null;

  return {
    organizationId: membership.organizationId,
    organizationName: membership.organization.name,
    organizationSlug: membership.organization.slug,
    role: membership.role,
  };
}

export async function requireOrgContext() {
  const user = await requireUser();
  const org = await getOrgContext(user.id);
  if (!org) {
    // Platform Super Admins operate at the platform level and typically
    // don't belong to any organization — send them to the admin console
    // instead of the "you're not part of an org" dead end.
    redirect(user.isSuperAdmin ? "/admin" : "/onboarding");
  }
  return { user, org };
}

export async function requirePermission(permission: Permission) {
  const { user, org } = await requireOrgContext();
  if (!can(org.role, permission)) {
    throw new Error(`Forbidden: role ${org.role} lacks permission ${permission}`);
  }
  return { user, org };
}

export async function requireSuperAdmin() {
  const user = await requireUser();
  if (!user.isSuperAdmin) redirect("/dashboard");
  return user;
}
