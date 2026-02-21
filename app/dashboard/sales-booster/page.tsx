"use client";

import { useEffect, useState } from "react";

interface Lead {
  _id: string;
  name: string;
  source: string;
  status: string;
  followUpDate: string | null;
  notes: string;
}

export default function SalesBoosterPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [name, setName] = useState("");
  const [source, setSource] = useState("WhatsApp");
  const [status, setStatus] = useState("Cold");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("");

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/leads", {
        credentials: "include",
      });

      if (!res.ok) {
        console.log("Fetch failed", res.status);
        return;
      }

      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleAdd = async () => {
    if (!name) {
      alert("Name is required");
      return;
    }

    const res = await fetch("/api/leads", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        source,
        status,
        followUpDate: followUpDate || null,
        notes,
      }),
    });

    if (!res.ok) {
      alert("Failed to add lead");
      return;
    }

    setName("");
    setSource("WhatsApp");
    setStatus("Cold");
    setFollowUpDate("");
    setNotes("");
    fetchLeads();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: newStatus }),
    });

    if (!res.ok) {
      alert("Failed to update lead");
      return;
    }

    setEditingId(null);
    fetchLeads();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;

    await fetch(`/api/leads/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    fetchLeads();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot":
        return "bg-red-100 text-red-700";
      case "Warm":
        return "bg-yellow-100 text-yellow-700";
      case "Cold":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "WhatsApp":
        return "💬";
      case "Instagram":
        return "📸";
      case "Referral":
        return "👥";
      default:
        return "📌";
    }
  };

  return (
    <div data-testid="sales-booster-page">
      <h2 className="text-3xl font-bold mb-6">Sales Booster - Leads</h2>

      {/* ADD LEAD */}
      <div className="bg-white p-6 rounded-2xl shadow mb-8 max-w-2xl">
        <h3 className="text-xl font-semibold mb-4">Add New Lead</h3>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Lead Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="lead-name-input"
          />

          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="lead-source-select"
          >
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="Referral">Referral</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="lead-status-select"
          >
            <option value="Hot">Hot</option>
            <option value="Warm">Warm</option>
            <option value="Cold">Cold</option>
          </select>

          <input
            type="date"
            placeholder="Follow Up Date"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="lead-followup-input"
          />

          <textarea
            placeholder="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border p-3 rounded-lg col-span-2"
            rows={2}
            data-testid="lead-notes-input"
          />
        </div>

        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-6 py-3 rounded-lg mt-4"
          data-testid="add-lead-btn"
        >
          Add Lead
        </button>
      </div>

      {/* LEAD LIST */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4">Lead List</h3>

        {loading && <p>Loading...</p>}

        {!loading && leads.length === 0 && (
          <p className="text-gray-500">No leads added yet.</p>
        )}

        <div className="space-y-4" data-testid="lead-list">
          {leads.map((lead) => (
            <div
              key={lead._id}
              className="flex justify-between items-start border-b pb-4"
              data-testid={`lead-item-${lead._id}`}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getSourceIcon(lead.source)}</span>
                  <p className="font-semibold">{lead.name}</p>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Source: {lead.source} • Follow Up: {formatDate(lead.followUpDate)}
                </p>
                {lead.notes && (
                  <p className="text-sm text-gray-400 mt-1">Notes: {lead.notes}</p>
                )}
              </div>

              <div className="flex items-center space-x-3">
                {editingId === lead._id ? (
                  <div className="flex items-center gap-2">
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="border p-2 rounded-lg text-sm"
                      data-testid={`edit-status-select-${lead._id}`}
                    >
                      <option value="Hot">Hot</option>
                      <option value="Warm">Warm</option>
                      <option value="Cold">Cold</option>
                    </select>
                    <button
                      onClick={() => handleUpdateStatus(lead._id, editStatus)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                      data-testid={`save-status-btn-${lead._id}`}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-500 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer ${getStatusColor(
                        lead.status
                      )}`}
                      onClick={() => {
                        setEditingId(lead._id);
                        setEditStatus(lead.status);
                      }}
                      data-testid={`lead-status-${lead._id}`}
                    >
                      {lead.status}
                    </span>

                    <button
                      onClick={() => handleDelete(lead._id)}
                      className="text-red-500 text-sm hover:underline"
                      data-testid={`delete-lead-${lead._id}`}
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
