"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const menuItem = (href: string, label: string) => (
    <Link href={href}>
      <div
        className={`px-4 py-2 rounded-lg cursor-pointer transition ${
          pathname === href
            ? "bg-green-600"
            : "hover:bg-green-700"
        }`}
      >
        {label}
      </div>
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-600 to-green-800 text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-green-900/80 backdrop-blur-md p-6 flex flex-col justify-between">

        <div>
          <h1 className="text-2xl font-bold mb-10">
            Herbalife CRM
          </h1>

          <nav className="space-y-3">

            {menuItem("/dashboard", "Dashboard")}
            {menuItem("/dashboard/my-journey", "My Journey")}
            {menuItem("/dashboard/my-team", "My Team")}
            {menuItem("/dashboard/my-customers", "My Customers")}
            {menuItem("/dashboard/my-club", "My Club")}
            {menuItem("/dashboard/my-organization", "My Organization")}
            {menuItem("/dashboard/sales-booster", "Sales Booster")}
            {menuItem("/dashboard/reports", "Reports")}
            {menuItem("/dashboard/settings", "Settings")}

          </nav>
        </div>

        <div>
          <button className="w-full bg-yellow-400 text-black py-2 rounded-lg font-semibold">
            Help
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 bg-white text-gray-800 rounded-tl-3xl">
        {children}
      </main>
    </div>
  );
}