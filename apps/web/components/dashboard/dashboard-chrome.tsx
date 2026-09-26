"use client";

import { useState } from "react";
import type { OrgRole } from "@surveymasterai/database";
import { DashboardSidebar } from "./sidebar";
import { DashboardTopbar } from "./topbar";

export function DashboardChrome({
  role,
  organizationName,
  isSuperAdmin,
  userName,
  userEmail,
  children,
}: {
  role: OrgRole;
  organizationName: string;
  isSuperAdmin: boolean;
  userName: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
          aria-hidden="true"
        />
      )}
      <DashboardSidebar
        role={role}
        organizationName={organizationName}
        isSuperAdmin={isSuperAdmin}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardTopbar userName={userName} userEmail={userEmail} onMenuClick={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
