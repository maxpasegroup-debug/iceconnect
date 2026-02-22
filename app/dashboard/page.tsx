"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  name: string;
  phone: string;
  role?: string;
}

interface ReportData {
  totalTeam: number;
  totalCustomers: number;
  totalLeads: number;
  activeCustomers: number;
  monthlyNewMembers: number;
  monthlyNewLeads: number;
  totalMonthlyPV: number;
}

interface LeadStats {
  followUpsDueToday: number;
  overdueFollowUps: number;
}

interface Lead {
  _id: string;
  name: string;
  source: string;
  status: string;
  createdAt: string;
}

interface TeamMember {
  _id: string;
  name: string;
  status: string;
  performanceTag: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<ReportData | null>(null);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [recentTeam, setRecentTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch session
        const sessionRes = await fetch("/api/session", { credentials: "include" });
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setUser(sessionData.user);
        }

        // Fetch reports
        const reportsRes = await fetch("/api/reports", { credentials: "include" });
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          setReports(reportsData);
        }

        // Fetch leads for stats and recent list
        const leadsRes = await fetch("/api/leads", { credentials: "include" });
        if (leadsRes.ok) {
          const leadsData = await leadsRes.json();
          setLeadStats(leadsData.stats);
          setRecentLeads((leadsData.leads || []).slice(0, 3));
        }

        // Fetch team for recent activity
        const teamRes = await fetch("/api/team", { credentials: "include" });
        if (teamRes.ok) {
          const teamData = await teamRes.json();
          setRecentTeam((teamData.members || []).slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading Dashboard...</div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page">

      {/* TOP HEADER */}
      <div className="mb-10 pr-32">
        <h2 className="text-3xl font-bold">
          Welcome Back{" "}
          <span className="text-green-600">{user?.name || "User"}</span>
        </h2>
        <p className="text-gray-500 mt-2">
          Here&apos;s an overview of your business today.
        </p>
      </div>

      {/* STATS CARDS - REAL DATA */}
      <div className="grid grid-cols-3 gap-6 mb-10">

        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold">Today&apos;s Follow Ups</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="followups-count">
            {leadStats?.followUpsDueToday || 0}
          </div>
          <p className="text-gray-500">
            {leadStats?.overdueFollowUps ? (
              <span className="text-red-500">{leadStats.overdueFollowUps} overdue</span>
            ) : (
              "No pending follow ups"
            )}
          </p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold">New Leads</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="new-leads-count">
            {reports?.monthlyNewLeads || 0}
          </div>
          <p className="text-gray-500">This month</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold">This Month&apos;s Volume</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="monthly-pv">
            {reports?.totalMonthlyPV || 0} PV
          </div>
          <p className="text-gray-500">Total Personal Volume</p>
        </div>

      </div>

      {/* ADDITIONAL STATS ROW */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Total Team</p>
          <p className="text-2xl font-bold text-green-600">{reports?.totalTeam || 0}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total Customers</p>
          <p className="text-2xl font-bold text-blue-600">{reports?.totalCustomers || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Total Leads</p>
          <p className="text-2xl font-bold text-purple-600">{reports?.totalLeads || 0}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Active Customers</p>
          <p className="text-2xl font-bold text-orange-600">{reports?.activeCustomers || 0}</p>
        </div>
      </div>

      {/* TABLE SECTION */}
      <div className="grid grid-cols-2 gap-6">

        {/* Recent Leads */}
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-green-600">Recent Leads</h3>
            <Link href="/dashboard/sales-booster">
              <span className="text-sm text-green-600 hover:underline cursor-pointer">View All →</span>
            </Link>
          </div>

          {recentLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No leads yet</p>
              <p className="text-sm text-gray-500">Start by adding your first lead</p>
              <Link href="/dashboard/sales-booster">
                <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                  + Add Lead
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentLeads.map((lead) => (
                <div key={lead._id} className="flex justify-between items-center">
                  <span className="font-medium">{lead.name}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    lead.status === "Hot" ? "bg-red-100 text-red-600" :
                    lead.status === "Warm" ? "bg-yellow-100 text-yellow-600" :
                    "bg-blue-100 text-blue-600"
                  }`}>
                    {lead.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Activity */}
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Team Activity</h3>
            <Link href="/dashboard/my-team">
              <span className="text-sm text-green-600 hover:underline cursor-pointer">View All →</span>
            </Link>
          </div>

          {recentTeam.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">No team members yet</p>
              <p className="text-sm text-gray-500">Build your team to grow your business</p>
              <Link href="/dashboard/my-team">
                <button className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                  + Add Team Member
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTeam.map((member) => (
                <div key={member._id} className="flex justify-between items-center">
                  <span className="font-medium">{member.name}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    member.status === "Active" ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                  }`}>
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* QUICK ACTIONS */}
      <div className="mt-10">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="flex gap-4">
          <Link href="/dashboard/sales-booster">
            <button className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition">
              + Add Lead
            </button>
          </Link>
          <Link href="/dashboard/my-customers">
            <button className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition">
              + Add Customer
            </button>
          </Link>
          <Link href="/dashboard/my-team">
            <button className="bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition">
              + Add Team Member
            </button>
          </Link>
        </div>
      </div>

    </div>
  );
}
