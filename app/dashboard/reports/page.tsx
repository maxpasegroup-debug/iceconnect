"use client";

import { useEffect, useState } from "react";

interface ReportData {
  totalTeam: number;
  totalCustomers: number;
  totalLeads: number;
  activeCustomers: number;
  monthlyNewMembers: number;
  monthlyNewLeads: number;
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports", {
        credentials: "include",
      });

      if (!res.ok) {
        console.log("Fetch failed", res.status);
        return;
      }

      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-xl">Loading Reports...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="text-center text-red-500">
        Failed to load reports. Please try again.
      </div>
    );
  }

  return (
    <div data-testid="reports-page">
      <h2 className="text-3xl font-bold mb-6">Reports Dashboard</h2>

      {/* OVERVIEW STATS */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl shadow text-white">
          <h3 className="text-lg font-medium opacity-90">Total Team Members</h3>
          <div className="text-4xl font-bold mt-2" data-testid="total-team">
            {report.totalTeam}
          </div>
          <p className="text-sm opacity-75 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl shadow text-white">
          <h3 className="text-lg font-medium opacity-90">Total Customers</h3>
          <div className="text-4xl font-bold mt-2" data-testid="total-customers">
            {report.totalCustomers}
          </div>
          <p className="text-sm opacity-75 mt-1">All time</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl shadow text-white">
          <h3 className="text-lg font-medium opacity-90">Total Leads</h3>
          <div className="text-4xl font-bold mt-2" data-testid="total-leads">
            {report.totalLeads}
          </div>
          <p className="text-sm opacity-75 mt-1">All time</p>
        </div>
      </div>

      {/* SECONDARY STATS */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-green-500">
          <h3 className="text-lg font-semibold text-gray-700">Active Customers</h3>
          <div className="text-3xl font-bold text-green-600 mt-2" data-testid="active-customers">
            {report.activeCustomers}
          </div>
          <p className="text-sm text-gray-500 mt-1">With active subscriptions</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-blue-500">
          <h3 className="text-lg font-semibold text-gray-700">New Members (This Month)</h3>
          <div className="text-3xl font-bold text-blue-600 mt-2" data-testid="monthly-new-members">
            {report.monthlyNewMembers}
          </div>
          <p className="text-sm text-gray-500 mt-1">Team growth this month</p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow border-l-4 border-purple-500">
          <h3 className="text-lg font-semibold text-gray-700">New Leads (This Month)</h3>
          <div className="text-3xl font-bold text-purple-600 mt-2" data-testid="monthly-new-leads">
            {report.monthlyNewLeads}
          </div>
          <p className="text-sm text-gray-500 mt-1">Sales pipeline this month</p>
        </div>
      </div>

      {/* SUMMARY CARD */}
      <div className="mt-8 bg-gray-50 p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4">Quick Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-gray-700">
          <div className="flex justify-between border-b pb-2">
            <span>Customer Retention Rate</span>
            <span className="font-semibold text-green-600">
              {report.totalCustomers > 0
                ? Math.round((report.activeCustomers / report.totalCustomers) * 100)
                : 0}%
            </span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>Team Size</span>
            <span className="font-semibold">{report.totalTeam} members</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>Lead Pipeline</span>
            <span className="font-semibold">{report.totalLeads} leads</span>
          </div>
          <div className="flex justify-between border-b pb-2">
            <span>Monthly Growth (Team)</span>
            <span className="font-semibold text-blue-600">+{report.monthlyNewMembers}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
