export type OrgRole = "ORG_ADMIN" | "MANAGER" | "RESPONDENT";

export type Permission =
  | "org:manage_settings"
  | "org:manage_members"
  | "org:invite_members"
  | "org:view_billing"
  | "org:manage_billing"
  | "org:view_audit_logs"
  | "survey:create"
  | "survey:edit_any"
  | "survey:delete_any"
  | "survey:publish"
  | "survey:view_analytics"
  | "survey:export"
  | "survey:ai_generate"
  | "survey:respond";

const ROLE_PERMISSIONS: Record<OrgRole, Permission[]> = {
  ORG_ADMIN: [
    "org:manage_settings",
    "org:manage_members",
    "org:invite_members",
    "org:view_billing",
    "org:manage_billing",
    "org:view_audit_logs",
    "survey:create",
    "survey:edit_any",
    "survey:delete_any",
    "survey:publish",
    "survey:view_analytics",
    "survey:export",
    "survey:ai_generate",
    "survey:respond",
  ],
  MANAGER: [
    "org:invite_members",
    "survey:create",
    "survey:edit_any",
    "survey:delete_any",
    "survey:publish",
    "survey:view_analytics",
    "survey:export",
    "survey:ai_generate",
    "survey:respond",
  ],
  RESPONDENT: ["survey:respond"],
};

export function can(role: OrgRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function permissionsForRole(role: OrgRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Platform Super Admin is a flag on the user record, independent of any
 * organization membership, and implicitly bypasses org-level RBAC checks.
 */
export function isPlatformSuperAdmin(user: { isSuperAdmin: boolean }): boolean {
  return user.isSuperAdmin;
}
