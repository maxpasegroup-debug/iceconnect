"use client";

import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-600 to-green-800 text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-green-900/80 backdrop-blur-md p-6 flex flex-col justify-between">

        <div>
          <h1 className="text-2xl font-bold mb-10">
            Herbalife CRM
          </h1>

          <nav className="space-y-3">

            <div className="bg-green-600 px-4 py-2 rounded-lg cursor-pointer">
              Dashboard
            </div>

            <div className="px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
              My Journey
            </div>

            <div className="px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
              My Team
            </div>

            <div className="px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
              My Customers
            </div>

            <div className="px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
              My Club
            </div>

            <div className="px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
              My Organization
            </div>

            <div className="px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
              Sales Booster
            </div>

            <div className="px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
              Reports
            </div>

            <div className="px-4 py-2 rounded-lg hover:bg-green-700 cursor-pointer">
              Settings
            </div>

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