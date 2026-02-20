"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const name = localStorage.getItem("user_name");

    if (!name) {
      router.push("/");
    } else {
      setUserName(name);
    }
  }, [router]);

  const getInitials = (name: string) => {
    if (!name) return "";
    const parts = name.split(" ");
    return parts.map((p) => p[0]).join("").toUpperCase();
  };

  return (
    <div>

      {/* TOP HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold">
            Welcome Back <span className="text-green-600">{userName}</span>
          </h2>
          <p className="text-gray-500 mt-2">
            Here's an overview of your business today.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-green-100 p-2 rounded-full">🔔</div>

          <div className="bg-green-600 text-white w-10 h-10 flex items-center justify-center rounded-full">
            {getInitials(userName)}
          </div>

          <button
            onClick={() => {
              localStorage.clear();
              router.push("/");
            }}
            className="bg-red-500 text-white px-4 py-2 rounded-lg"
          >
            Logout
          </button>
        </div>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-3 gap-6 mb-10">

        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold">Today's Follow Ups</h3>
          <div className="text-4xl text-green-600 font-bold mt-2">12</div>
          <p className="text-gray-500">Pending Follow Ups</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold">New Leads</h3>
          <div className="text-4xl text-green-600 font-bold mt-2">7</div>
          <p className="text-gray-500">Acquired Today</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold">This Month's Volume</h3>
          <div className="text-4xl text-green-600 font-bold mt-2">3,450 PV</div>
          <p className="text-gray-500">Total Personal Volume</p>
        </div>

      </div>

      {/* TABLE SECTION */}
      <div className="grid grid-cols-2 gap-6">

        {/* Recent Leads */}
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-4 text-green-600">
            New Leads
          </h3>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span>Sarah P.</span>
              <span className="text-sm text-gray-500">WhatsApp</span>
            </div>

            <div className="flex justify-between">
              <span>Mark S.</span>
              <span className="text-sm text-gray-500">Instagram</span>
            </div>

            <div className="flex justify-between">
              <span>David R.</span>
              <span className="text-sm text-gray-500">Referral</span>
            </div>

            <div className="flex justify-between">
              <span>Lisa M.</span>
              <span className="text-sm text-gray-500">Facebook</span>
            </div>

          </div>
        </div>

        {/* Team Activity */}
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-4">
            Team Activity
          </h3>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span>Sarah P.</span>
              <span className="text-green-600">Hot</span>
            </div>

            <div className="flex justify-between">
              <span>Mark S.</span>
              <span className="text-yellow-500">Warm</span>
            </div>

            <div className="flex justify-between">
              <span>David R.</span>
              <span className="text-blue-500">Cold</span>
            </div>

            <div className="flex justify-between">
              <span>Lisa M.</span>
              <span className="text-gray-500">New</span>
            </div>

          </div>
        </div>

      </div>

      {/* Bottom Cards */}
      <div className="grid grid-cols-2 gap-6 mt-10">

        <div className="bg-green-600 text-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold">Subscribers</h3>
          <div className="text-3xl font-bold mt-2">28</div>
          <p>My Active Customers</p>
        </div>

        <div className="bg-yellow-400 text-black p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold">Expiring Soon</h3>
          <div className="text-3xl font-bold mt-2">2</div>
          <p>Soon-to-Expire Subscriptions</p>
        </div>

      </div>

    </div>
  );
}