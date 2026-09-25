"use client";

import { signOut } from "next-auth/react";
import { Search, Bell, LogOut } from "lucide-react";
import { useState } from "react";

export function DashboardTopbar({ userName, userEmail }: { userName: string; userEmail: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = userName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="relative hidden max-w-sm flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input placeholder="Search surveys, users..." className="input pl-9" />
      </div>
      <div className="ml-auto flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </button>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white"
          >
            {initials}
          </button>
          {menuOpen && (
            <div className="absolute right-0 z-10 mt-2 w-56 rounded-lg border border-gray-200 bg-white p-2 shadow-panel">
              <div className="px-3 py-2">
                <p className="text-sm font-medium text-gray-900">{userName}</p>
                <p className="truncate text-xs text-gray-400">{userEmail}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
