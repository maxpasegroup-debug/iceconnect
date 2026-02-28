"use client";

import { useEffect, useState, useCallback } from "react";

interface WhatsAppConfig {
  _id?: string;
  userId?: string;
  businessName?: string;
  whatsappNumber?: string;
  defaultMessage?: string;
  isConnected?: boolean;
}

interface FunnelItem {
  _id: string;
  name: string;
  type: string;
  isActive?: boolean;
}

interface LeadItem {
  _id: string;
  name: string;
  source: string;
  status: string;
  notes?: string;
  funnelId?: string;
  score?: number;
  answers?: string[];
  createdAt: string;
}

interface LeadStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
}

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "conversations", label: "Conversations" },
  { id: "funnels", label: "Funnels" },
  { id: "analytics", label: "Analytics" },
  { id: "settings", label: "Settings" },
] as const;

function formatWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && !digits.startsWith("0")) {
    return "91" + digits;
  }
  return digits || "91";
}

function getStatusBadgeClass(status: string): string {
  const s = (status || "").toLowerCase();
  if (s === "hot") return "bg-red-100 text-red-700";
  if (s === "warm") return "bg-amber-100 text-amber-700";
  if (s === "cold") return "bg-sky-100 text-sky-700";
  return "bg-gray-100 text-gray-700";
}

export default function SalesBoosterPage() {
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig | { isConnected: false } | null>(null);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [leadStats, setLeadStats] = useState<LeadStats | null>(null);
  const [funnels, setFunnels] = useState<FunnelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [connectModalOpen, setConnectModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [connectForm, setConnectForm] = useState({
    businessName: "",
    whatsappNumber: "",
    defaultMessage: "",
  });
  const [connectSubmitting, setConnectSubmitting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});

  const fetchWhatsApp = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setWhatsappConfig(data.isConnected === false ? data : data);
      } else {
        setWhatsappConfig({ isConnected: false });
      }
    } catch {
      setWhatsappConfig({ isConnected: false });
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch("/api/leads", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setLeadStats(data.stats || null);
      }
    } catch {
      setLeads([]);
    }
  }, []);

  const fetchFunnels = useCallback(async () => {
    try {
      const res = await fetch("/api/funnels", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFunnels(Array.isArray(data) ? data : []);
      }
    } catch {
      setFunnels([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchWhatsApp(), fetchLeads(), fetchFunnels()]);
      setLoading(false);
    };
    load();
  }, [fetchWhatsApp, fetchLeads, fetchFunnels]);

  const isConnected = Boolean(
    whatsappConfig &&
      typeof whatsappConfig === "object" &&
      "whatsappNumber" in whatsappConfig &&
      (whatsappConfig as WhatsAppConfig).whatsappNumber
  );

  const todayLeads = leads.filter((l) => {
    const d = new Date(l.createdAt);
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }).length;

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectForm.whatsappNumber.trim()) {
      setConnectError("WhatsApp number is required");
      return;
    }
    setConnectError(null);
    setConnectSubmitting(true);
    try {
      const res = await fetch("/api/whatsapp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: connectForm.businessName.trim(),
          whatsappNumber: connectForm.whatsappNumber.trim(),
          defaultMessage: connectForm.defaultMessage.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappConfig(data);
        setConnectModalOpen(false);
        setConnectForm({ businessName: "", whatsappNumber: "", defaultMessage: "" });
      } else {
        const data = await res.json().catch(() => ({}));
        setConnectError(data.message || "Failed to save");
      }
    } catch {
      setConnectError("Something went wrong");
    } finally {
      setConnectSubmitting(false);
    }
  };

  const selectedLead = selectedLeadId ? leads.find((l) => l._id === selectedLeadId) : null;
  const funnelMap = Object.fromEntries(funnels.map((f) => [f._id, f.name]));
  const selectedFunnelName = selectedLead?.funnelId ? funnelMap[selectedLead.funnelId] ?? "—" : "—";

  const buildWhatsAppUrl = (lead: LeadItem): string => {
    const config = whatsappConfig && "whatsappNumber" in whatsappConfig ? whatsappConfig : null;
    const number = config?.whatsappNumber ? formatWhatsAppNumber(config.whatsappNumber) : "91";
    const funnelName = lead.funnelId ? funnelMap[lead.funnelId] ?? "" : "";
    const answersSummary = Array.isArray(lead.answers) && lead.answers.length
      ? lead.answers.map((a, i) => `Q${i + 1}: ${a}`).join("\n")
      : "No answers";
    const message = [
      `Lead: ${lead.name}`,
      `Status: ${lead.status} | Score: ${lead.score ?? 0}`,
      funnelName ? `Funnel: ${funnelName}` : "",
      "",
      "Answers:",
      answersSummary,
    ]
      .filter(Boolean)
      .join("\n");
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div data-testid="sales-booster-page" className="flex flex-col h-full pb-8">
      {/* Top Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden>💬</span>
            <span className="font-semibold text-gray-800">WhatsApp</span>
            {isConnected ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                Connected
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                Not Connected
              </span>
            )}
          </div>
          {!isConnected ? (
            <button
              type="button"
              onClick={() => setConnectModalOpen(true)}
              className="px-4 py-2 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition shadow-sm"
            >
              Connect WhatsApp
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setManageModalOpen(true)}
              className="px-4 py-2 rounded-xl font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
            >
              Manage
            </button>
          )}
          <div className="flex items-center gap-6 text-sm">
            <span className="text-gray-600">
              <strong className="text-gray-800">{todayLeads}</strong> Today
            </span>
            <span className="text-gray-600">
              <strong className="text-gray-800">{leadStats?.totalLeads ?? 0}</strong> Active
            </span>
            <span className="text-gray-600">
              <strong className="text-red-600">{leadStats?.hotLeads ?? 0}</strong> Hot
            </span>
          </div>
        </div>
      </div>

      {/* Top Menu Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 rounded-xl font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? "bg-green-600 text-white shadow-sm"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview: Main WhatsApp-style layout */}
      {activeTab === "overview" && (
        <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
          {/* Left Panel - Lead list */}
          <div className="w-full lg:w-[30%] flex flex-col bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Leads</h3>
            </div>
            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {leads.length === 0 ? (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No leads yet. Capture leads from your funnels.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <li key={lead._id}>
                      <button
                        type="button"
                        onClick={() => setSelectedLeadId(lead._id)}
                        className={`w-full text-left p-4 hover:bg-gray-50 transition ${
                          selectedLeadId === lead._id ? "bg-green-50 border-l-4 border-green-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium text-gray-800 truncate">{lead.name}</span>
                          <span
                            className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(lead.status)}`}
                          >
                            {lead.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {lead.funnelId ? funnelMap[lead.funnelId] ?? "Funnel" : "—"}
                        </p>
                        {typeof lead.score === "number" && (
                          <p className="text-xs text-gray-400 mt-0.5">Score: {lead.score}</p>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Right Panel - Lead detail or empty state */}
          <div className="flex-1 w-full lg:w-[70%] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            {!selectedLead ? (
              <div className="flex-1 flex items-center justify-center p-8 text-center">
                <div>
                  <p className="text-gray-500 text-lg font-medium">Select a lead to view details</p>
                  <p className="text-gray-400 text-sm mt-1">Click a lead from the list</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">{selectedLead.name}</h2>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${getStatusBadgeClass(selectedLead.status)}`}>
                        {selectedLead.status}
                      </span>
                      {typeof selectedLead.score === "number" && (
                        <span className="text-sm text-gray-500">Score: {selectedLead.score}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Funnel</p>
                    <p className="text-gray-800">{selectedFunnelName}</p>
                  </div>
                  {Array.isArray(selectedLead.answers) && selectedLead.answers.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Answers</p>
                      <ul className="space-y-1.5">
                        {selectedLead.answers.map((a, i) => (
                          <li key={i} className="text-sm text-gray-700 flex gap-2">
                            <span className="text-gray-400 shrink-0">Q{i + 1}:</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Notes</p>
                    <textarea
                      value={localNotes[selectedLead._id] ?? selectedLead.notes ?? ""}
                      onChange={(e) => setLocalNotes((prev) => ({ ...prev, [selectedLead._id]: e.target.value }))}
                      placeholder="Add notes (local only for now)"
                      className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 min-h-[100px]"
                      rows={4}
                    />
                  </div>
                  <div className="pt-2">
                    <a
                      href={buildWhatsAppUrl(selectedLead)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium bg-green-600 text-white hover:bg-green-700 transition shadow-sm"
                    >
                      Open in WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Placeholder tabs */}
      {activeTab !== "overview" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <p className="text-gray-500 font-medium">{TABS.find((t) => t.id === activeTab)?.label ?? activeTab}</p>
          <p className="text-gray-400 text-sm mt-1">Coming soon</p>
        </div>
      )}

      {/* Connect WhatsApp Modal */}
      {connectModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Connect WhatsApp</h3>
              <button
                type="button"
                onClick={() => {
                  setConnectModalOpen(false);
                  setConnectError(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleConnectSubmit} className="p-6 space-y-4">
              {connectError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-sm">
                  {connectError}
                </div>
              )}
              <div>
                <label htmlFor="wa-business" className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  id="wa-business"
                  type="text"
                  value={connectForm.businessName}
                  onChange={(e) => setConnectForm((f) => ({ ...f, businessName: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="My Business"
                />
              </div>
              <div>
                <label htmlFor="wa-number" className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number *
                </label>
                <input
                  id="wa-number"
                  type="text"
                  value={connectForm.whatsappNumber}
                  onChange={(e) => setConnectForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="919876543210"
                />
              </div>
              <div>
                <label htmlFor="wa-default" className="block text-sm font-medium text-gray-700 mb-1">
                  Default Message
                </label>
                <textarea
                  id="wa-default"
                  value={connectForm.defaultMessage}
                  onChange={(e) => setConnectForm((f) => ({ ...f, defaultMessage: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Hi, I got your details..."
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConnectModalOpen(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectSubmitting}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {connectSubmitting ? "Saving..." : "Connect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage WhatsApp Modal (simple view / edit) */}
      {manageModalOpen && whatsappConfig && "whatsappNumber" in whatsappConfig && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">WhatsApp Configuration</h3>
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <p><span className="text-gray-500">Business:</span> {whatsappConfig.businessName || "—"}</p>
              <p><span className="text-gray-500">Number:</span> {whatsappConfig.whatsappNumber || "—"}</p>
              <p><span className="text-gray-500">Default message:</span> {(whatsappConfig.defaultMessage || "").slice(0, 50)}{(whatsappConfig.defaultMessage?.length ?? 0) > 50 ? "…" : ""}</p>
            </div>
            <div className="p-6 pt-0">
              <button
                type="button"
                onClick={() => setManageModalOpen(false)}
                className="w-full py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
