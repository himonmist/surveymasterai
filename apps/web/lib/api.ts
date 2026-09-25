import { NextResponse } from "next/server";
import { prisma } from "./db";
import { getCurrentSession } from "./session";
import { can, type Permission } from "@surveymasterai/auth";
import type { OrgRole } from "@surveymasterai/database";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export interface ApiOrgContext {
  userId: string;
  isSuperAdmin: boolean;
  organizationId: string;
  role: OrgRole;
}

/**
 * Resolves the authenticated user + their active organization for API route
 * handlers. Returns either the context or a ready-to-return NextResponse
 * describing the auth failure, so callers can do:
 *
 *   const ctx = await resolveApiOrgContext();
 *   if (ctx instanceof NextResponse) return ctx;
 */
export async function resolveApiOrgContext(): Promise<ApiOrgContext | NextResponse> {
  const session = await getCurrentSession();
  if (!session?.user) return jsonError("Unauthorized", 401);

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) {
    if (session.user.isSuperAdmin) {
      return { userId: session.user.id, isSuperAdmin: true, organizationId: "", role: "ORG_ADMIN" };
    }
    return jsonError("No organization found for this user", 403);
  }

  return {
    userId: session.user.id,
    isSuperAdmin: session.user.isSuperAdmin,
    organizationId: membership.organizationId,
    role: membership.role,
  };
}

export function requirePermissionOrError(ctx: ApiOrgContext, permission: Permission): NextResponse | null {
  if (ctx.isSuperAdmin) return null;
  if (!can(ctx.role, permission)) return jsonError("Forbidden", 403);
  return null;
}

export async function resolveApiSuperAdmin(): Promise<{ userId: string } | NextResponse> {
  const session = await getCurrentSession();
  if (!session?.user) return jsonError("Unauthorized", 401);
  if (!session.user.isSuperAdmin) return jsonError("Forbidden", 403);
  return { userId: session.user.id };
}

export async function recordAudit(params: {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      organizationId: params.organizationId ?? null,
      userId: params.userId ?? null,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId ?? null,
      metadata: (params.metadata ?? {}) as never,
    },
  });
}
