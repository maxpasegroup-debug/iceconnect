"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  name: string;
  phone: string;
  role?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch("/api/session");

        if (!res.ok) {
          router.push("/");
          return;
        }

        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-xl">
        Loading Dashboard...
      </div>
    );
  }

  if (!user) return null;

  return (
    <div>

      {/* TOP HEADER */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold">
            Welcome Back{" "}
            <span className="text-green-600">{user.name}</span>
          </h2>
          <p className="text-gray-500 mt-2">
            Here's an overview of your business today.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="bg-green-100 p-2 rounded-full">🔔</div>

          <div className="bg-green-600 text-white w-10 h-10 flex items-center justify-center rounded-full">
            {getInitials(user.name)}
          </div>

          <button
            onClick={handleLogout}
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
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-4">
            Team Activity
          </h3>

          <div className="space-y-4">
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

    </div>
  );
}