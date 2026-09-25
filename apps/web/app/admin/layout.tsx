import Link from "next/link";
import { ShieldCheck, LayoutDashboard, Building2, CreditCard, ArrowLeft } from "lucide-react";
import { requireSuperAdmin } from "@/lib/session";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/plans", label: "Plans", icon: CreditCard },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireSuperAdmin();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-gray-900 text-white lg:flex">
        <div className="flex items-center gap-2 border-b border-white/10 px-6 py-5">
          <ShieldCheck className="h-5 w-5 text-brand-300" />
          <span className="text-sm font-bold">Super Admin</span>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10">
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-white/10">
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
