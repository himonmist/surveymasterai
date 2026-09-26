import { requireSuperAdmin } from "@/lib/session";
import { AdminChrome } from "@/components/admin/admin-chrome";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return <AdminChrome>{children}</AdminChrome>;
}
