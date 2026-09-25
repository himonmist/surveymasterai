"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Settings,
  FileText,
  Sparkles,
  CreditCard,
  ClipboardList,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";
import type { OrgRole } from "@surveymasterai/database";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_BY_ROLE: Record<OrgRole, NavItem[]> = {
  ORG_ADMIN: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/surveys", label: "Surveys", icon: BarChart3 },
    { href: "/dashboard/templates", label: "Templates", icon: FileText },
    { href: "/dashboard/my-responses", label: "My Responses", icon: CheckSquare },
    { href: "/dashboard/team", label: "Team", icon: Users },
    { href: "/dashboard/subscription", label: "Subscription", icon: CreditCard },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
  ],
  MANAGER: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/surveys", label: "My Surveys", icon: BarChart3 },
    { href: "/dashboard/surveys/new", label: "Create Survey", icon: Sparkles },
    { href: "/dashboard/templates", label: "Templates", icon: FileText },
    { href: "/dashboard/my-responses", label: "My Responses", icon: CheckSquare },
  ],
  RESPONDENT: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/surveys", label: "Assigned Surveys", icon: ClipboardList },
    { href: "/dashboard/my-responses", label: "My Responses", icon: CheckSquare },
  ],
};

export function DashboardSidebar({
  role,
  organizationName,
  isSuperAdmin,
}: {
  role: OrgRole;
  organizationName: string;
  isSuperAdmin: boolean;
}) {
  const pathname = usePathname();
  const items = NAV_BY_ROLE[role];

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
      <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 font-bold text-white">
          S
        </span>
        <span className="text-base font-bold text-gray-900">SurveyMasterAI</span>
      </div>
      <div className="border-b border-gray-100 px-6 py-4">
        <p className="truncate text-sm font-semibold text-gray-900">{organizationName}</p>
        <p className="text-xs text-gray-400">{role.replace("_", " ").toLowerCase()}</p>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {items.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-brand-50 text-brand-700" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {isSuperAdmin && (
        <div className="border-t border-gray-100 p-3">
          <Link href="/admin" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ShieldCheck className="h-4 w-4" />
            Super Admin
          </Link>
        </div>
      )}
    </aside>
  );
}
