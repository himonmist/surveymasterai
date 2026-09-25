import { requireOrgContext } from "@/lib/session";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, org } = await requireOrgContext();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar role={org.role} organizationName={org.organizationName} isSuperAdmin={user.isSuperAdmin} />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardTopbar userName={user.name ?? user.email ?? "User"} userEmail={user.email ?? ""} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
