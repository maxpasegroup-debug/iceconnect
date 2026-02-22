"use client";

import { useEffect, useState } from "react";

/* ===== TYPES (UNCHANGED) ===== */
interface Lead {
  _id: string;
  name: string;
  source: string;
  status: string;
  followUpDate: string | null;
  notes: string;
  createdAt: string;
}

interface LeadStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  conversionRate: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
}

interface DigitalLabData {
  isActive: boolean;
  subscription: {
    digitalLabActive: boolean;
    digitalLabExpiry: string | null;
    marketingSupportActive: boolean;
    onboardingFeePaid: boolean;
  };
  socialProfile: {
    instagram: string;
    facebook: string;
    whatsapp: string;
  } | null;
  funnelPage: {
    slug: string;
    headline: string;
    views: number;
    conversions: number;
  } | null;
  dmTemplates: any[];
  reminders: any[];
  stats: {
    totalFunnelLeads: number;
    conversionRate: number;
    pendingReminders: number;
  };
}

/* ===== COMPONENT ===== */

export default function SalesBoosterPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [digitalLab, setDigitalLab] = useState<DigitalLabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"leads" | "boost">("leads");

  useEffect(() => {
    fetch("/api/leads", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setLeads(data.leads || []);
        setStats(data.stats);
      });

    fetch("/api/digital-lab", { credentials: "include" })
      .then(res => res.json())
      .then(data => setDigitalLab(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Loading Sales Booster...
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800">
            Sales Booster
          </h1>
          <p className="text-gray-500 mt-2">
            Manage leads and grow your network with digital tools.
          </p>
        </div>

        {/* MAIN TABS */}
        <div className="flex gap-4 mb-10">
          <button
            onClick={() => setActiveTab("leads")}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === "leads"
                ? "bg-black text-white shadow-md"
                : "bg-white border text-gray-700"
            }`}
          >
            Leads
          </button>

          <button
            onClick={() => setActiveTab("boost")}
            className={`px-6 py-3 rounded-xl font-semibold transition ${
              activeTab === "boost"
                ? "bg-black text-white shadow-md"
                : "bg-white border text-gray-700"
            }`}
          >
            Boost Digitally
          </button>
        </div>

        {/* ===================== LEADS ===================== */}
        {activeTab === "leads" && (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              {[
                {
                  label: "Total Leads",
                  value: stats?.totalLeads || 0,
                },
                {
                  label: "Conversion Rate",
                  value: `${stats?.conversionRate || 0}%`,
                },
                {
                  label: "Follow-ups Today",
                  value: stats?.followUpsDueToday || 0,
                },
                {
                  label: "Overdue",
                  value: stats?.overdueFollowUps || 0,
                },
              ].map((card, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition"
                >
                  <p className="text-gray-500 text-sm">
                    {card.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>

            {/* LEADS TABLE */}
            <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
              {leads.length === 0 && (
                <div className="p-10 text-center text-gray-500">
                  No leads yet.
                </div>
              )}

              {leads.map((lead) => (
                <div
                  key={lead._id}
                  className="flex items-center justify-between px-6 py-4 border-b hover:bg-gray-50 transition"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {lead.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {lead.source}
                    </p>
                  </div>

                  <div>
                    <span className="px-3 py-1 rounded-full text-sm bg-gray-100">
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ===================== BOOST ===================== */}
        {activeTab === "boost" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* DIGITAL LAB */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition">
              <h3 className="text-xl font-semibold mb-4">
                Digital Lab
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Social links, funnel pages, templates & reminders.
              </p>

              {digitalLab?.isActive ? (
                <span className="text-green-600 font-semibold">
                  Active
                </span>
              ) : (
                <>
                  <p className="text-lg font-bold mb-4">
                    ₹999 / month
                  </p>
                  <button className="w-full bg-black text-white py-3 rounded-xl">
                    Upgrade
                  </button>
                </>
              )}
            </div>

            {/* ONBOARDING */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition">
              <h3 className="text-xl font-semibold mb-4">
                Onboarding
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Setup guidance and CRM configuration.
              </p>

              {digitalLab?.subscription?.onboardingFeePaid ? (
                <span className="text-green-600 font-semibold">
                  Completed
                </span>
              ) : (
                <>
                  <p className="text-lg font-bold mb-4">
                    ₹3000 One-Time
                  </p>
                  <button className="w-full bg-black text-white py-3 rounded-xl">
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* MARKETING SUPPORT */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border hover:shadow-md transition">
              <h3 className="text-xl font-semibold mb-4">
                Marketing Support
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Dedicated content & growth consultation.
              </p>

              <p className="text-lg font-bold mb-4">
                ₹4999 / month
              </p>

              <button className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl">
                Coming Soon
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}