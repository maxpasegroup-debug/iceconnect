"use client";

import { useEffect, useState } from "react";

interface ReportData {
  totalTeam: number;
  totalCustomers: number;
  totalLeads: number;
  activeCustomers: number;
  monthlyNewMembers: number;
  monthlyNewLeads: number;
  totalMonthlyPV: number;
  totalRevenue: number;
  leadConversionRate: number;
  customerRetentionRate: number;
  pvTrend: { month: string; pv: number }[];
}

export default function ReportsPage() {
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) return <div className="p-6">Loading Reports...</div>;
  if (!report) return <div className="p-6 text-red-500">Failed to load reports</div>;

  const maxPV = Math.max(...report.pvTrend.map((t) => t.pv), 1);

  return (
    <div data-testid="reports-page">
      <h2 className="text-3xl font-bold mb-6">Reports Dashboard</h2>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white">
          <p className="text-sm opacity-80">Total Team</p>
          <p className="text-4xl font-bold mt-1" data-testid="report-total-team">{report.totalTeam}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white">
          <p className="text-sm opacity-80">Total Customers</p>
          <p className="text-4xl font-bold mt-1" data-testid="report-total-customers">{report.totalCustomers}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white">
          <p className="text-sm opacity-80">Total Leads</p>
          <p className="text-4xl font-bold mt-1" data-testid="report-total-leads">{report.totalLeads}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white">
          <p className="text-sm opacity-80">Monthly PV</p>
          <p className="text-4xl font-bold mt-1">{report.totalMonthlyPV}</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-xl shadow border-l-4 border-green-500">
          <p className="text-sm text-gray-500">Active Customers</p>
          <p className="text-2xl font-bold text-green-600">{report.activeCustomers}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border-l-4 border-blue-500">
          <p className="text-sm text-gray-500">New Members (Month)</p>
          <p className="text-2xl font-bold text-blue-600">+{report.monthlyNewMembers}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border-l-4 border-purple-500">
          <p className="text-sm text-gray-500">New Leads (Month)</p>
          <p className="text-2xl font-bold text-purple-600">+{report.monthlyNewLeads}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow border-l-4 border-orange-500">
          <p className="text-sm text-gray-500">Monthly Revenue</p>
          <p className="text-2xl font-bold text-orange-600">₹{report.totalRevenue}</p>
        </div>
      </div>

      {/* Conversion & Retention */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold mb-4">Lead Conversion Rate</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="48" cy="48" r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${report.leadConversionRate * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">{report.leadConversionRate}%</span>
              </div>
            </div>
            <div>
              <p className="text-gray-600">Hot leads converted</p>
              <p className="text-sm text-gray-400">From total {report.totalLeads} leads</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold mb-4">Customer Retention Rate</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                <circle
                  cx="48" cy="48" r="40"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${report.customerRetentionRate * 2.51} 251`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">{report.customerRetentionRate}%</span>
              </div>
            </div>
            <div>
              <p className="text-gray-600">Active subscriptions</p>
              <p className="text-sm text-gray-400">{report.activeCustomers} of {report.totalCustomers} customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* PV Trend Chart */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-4">Last 6 Months PV Trend</h3>
        <div className="flex items-end gap-4 h-48">
          {report.pvTrend.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all hover:from-green-600 hover:to-green-500"
                style={{ height: `${(item.pv / maxPV) * 100}%`, minHeight: "8px" }}
                title={`${item.pv} PV`}
              />
              <p className="text-xs text-gray-500 mt-2">{item.month}</p>
              <p className="text-sm font-semibold">{item.pv}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
