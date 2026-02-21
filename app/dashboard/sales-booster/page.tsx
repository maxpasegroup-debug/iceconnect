"use client";

import { useEffect, useState } from "react";

interface Lead {
  _id: string;
  name: string;
  source: string;
  status: string;
  followUpDate: string | null;
  notes: string;
  createdAt: string;
}

interface Stats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  conversionRate: number;
  followUpsDueToday: number;
  overdueFollowUps: number;
}

export default function SalesBoosterPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    source: "WhatsApp",
    status: "Cold",
    followUpDate: "",
    notes: "",
  });

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const resetForm = () => {
    setFormData({ name: "", source: "WhatsApp", status: "Cold", followUpDate: "", notes: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert("Name is required");
      return;
    }

    const url = editingId ? `/api/leads/${editingId}` : "/api/leads";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      resetForm();
      fetchLeads();
    }
  };

  const handleEdit = (lead: Lead) => {
    setFormData({
      name: lead.name,
      source: lead.source,
      status: lead.status,
      followUpDate: lead.followUpDate?.split("T")[0] || "",
      notes: lead.notes,
    });
    setEditingId(lead._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    await fetch(`/api/leads/${id}`, { method: "DELETE", credentials: "include" });
    fetchLeads();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchLeads();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot": return "bg-red-100 text-red-700 border-red-300";
      case "Warm": return "bg-yellow-100 text-yellow-700 border-yellow-300";
      default: return "bg-blue-100 text-blue-700 border-blue-300";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "WhatsApp": return "💬";
      case "Instagram": return "📸";
      case "Referral": return "👥";
      default: return "📌";
    }
  };

  const isFollowUpDue = (date: string | null) => {
    if (!date) return false;
    const followUp = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    followUp.setHours(0, 0, 0, 0);
    return followUp <= today;
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div data-testid="sales-booster-page">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Sales Booster - Leads</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
          data-testid="add-lead-btn"
        >
          + Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-4 rounded-xl text-white">
          <p className="text-sm opacity-80">Total Leads</p>
          <p className="text-3xl font-bold" data-testid="total-leads">{stats?.totalLeads || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-4 rounded-xl text-white">
          <p className="text-sm opacity-80">Conversion Rate</p>
          <p className="text-3xl font-bold">{stats?.conversionRate || 0}%</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-4 rounded-xl text-white">
          <p className="text-sm opacity-80">Follow-ups Today</p>
          <p className="text-3xl font-bold">{stats?.followUpsDueToday || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 p-4 rounded-xl text-white">
          <p className="text-sm opacity-80">Overdue</p>
          <p className="text-3xl font-bold">{stats?.overdueFollowUps || 0}</p>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Hot Leads</p>
            <p className="text-2xl font-bold text-red-600">{stats?.hotLeads || 0}</p>
          </div>
          <span className="text-3xl">🔥</span>
        </div>
        <div className="bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-500 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Warm Leads</p>
            <p className="text-2xl font-bold text-yellow-600">{stats?.warmLeads || 0}</p>
          </div>
          <span className="text-3xl">☀️</span>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500 flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Cold Leads</p>
            <p className="text-2xl font-bold text-blue-600">{stats?.coldLeads || 0}</p>
          </div>
          <span className="text-3xl">❄️</span>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingId ? "Edit Lead" : "Add Lead"}</h3>
            
            <div className="space-y-4">
              <input placeholder="Lead Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full border p-3 rounded-lg" data-testid="lead-name-input" />
              <select value={formData.source} onChange={(e) => setFormData({ ...formData, source: e.target.value })} className="w-full border p-3 rounded-lg">
                <option value="WhatsApp">WhatsApp</option>
                <option value="Instagram">Instagram</option>
                <option value="Referral">Referral</option>
              </select>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full border p-3 rounded-lg">
                <option value="Hot">Hot 🔥</option>
                <option value="Warm">Warm ☀️</option>
                <option value="Cold">Cold ❄️</option>
              </select>
              <input type="date" value={formData.followUpDate} onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })} className="w-full border p-3 rounded-lg" />
              <textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="w-full border p-3 rounded-lg" rows={3} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit} className="flex-1 bg-green-600 text-white py-3 rounded-lg" data-testid="save-lead-btn">{editingId ? "Update" : "Add Lead"}</button>
              <button onClick={resetForm} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Leads List */}
      <div className="bg-white rounded-2xl shadow" data-testid="leads-list">
        {leads.length === 0 && (
          <p className="p-6 text-center text-gray-500">No leads yet. Start adding leads to boost your sales!</p>
        )}
        {leads.map((lead) => (
          <div key={lead._id} className="p-4 border-b last:border-b-0 flex items-center justify-between" data-testid={`lead-row-${lead._id}`}>
            <div className="flex items-center gap-4">
              <span className="text-2xl">{getSourceIcon(lead.source)}</span>
              <div>
                <p className="font-semibold">{lead.name}</p>
                <p className="text-sm text-gray-500">
                  {lead.source} • {lead.followUpDate ? (
                    <span className={isFollowUpDue(lead.followUpDate) ? "text-red-600 font-semibold" : ""}>
                      Follow-up: {new Date(lead.followUpDate).toLocaleDateString()}
                      {isFollowUpDue(lead.followUpDate) && " ⚠️"}
                    </span>
                  ) : "No follow-up set"}
                </p>
                {lead.notes && <p className="text-sm text-gray-400 mt-1">{lead.notes}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(lead._id, e.target.value)}
                className={`px-3 py-2 rounded-lg border ${getStatusColor(lead.status)}`}
                data-testid={`lead-status-select-${lead._id}`}
              >
                <option value="Hot">🔥 Hot</option>
                <option value="Warm">☀️ Warm</option>
                <option value="Cold">❄️ Cold</option>
              </select>
              <button onClick={() => handleEdit(lead)} className="text-blue-600" data-testid={`edit-lead-${lead._id}`}>Edit</button>
              <button onClick={() => handleDelete(lead._id)} className="text-red-600" data-testid={`delete-lead-${lead._id}`}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
