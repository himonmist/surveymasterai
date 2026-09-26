import { requireOrgContext } from "@/lib/session";
import { DashboardChrome } from "@/components/dashboard/dashboard-chrome";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireOrgContext();

  return (
    <DashboardChrome
      role={org.role}
      organizationName={org.organizationName}
      isSuperAdmin={user.isSuperAdmin}
      userName={user.name ?? user.email ?? "User"}
      userEmail={user.email ?? ""}
    >
      {children}
    </DashboardChrome>
  );
}
