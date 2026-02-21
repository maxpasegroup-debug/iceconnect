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
  dmTemplates: Array<{
    _id: string;
    name: string;
    category: string;
    content: string;
    usageCount: number;
  }>;
  reminders: Array<{
    _id: string;
    leadName: string;
    reminderDate: string;
    status: string;
  }>;
  stats: {
    totalFunnelLeads: number;
    conversionRate: number;
    pendingReminders: number;
  };
}

export default function SalesBoosterPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [digitalLab, setDigitalLab] = useState<DigitalLabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"leads" | "boost">("leads");
  const [boostTab, setBoostTab] = useState<"overview" | "social" | "funnel" | "templates" | "reminders">("overview");

  const [formData, setFormData] = useState({
    name: "",
    source: "WhatsApp",
    status: "Cold",
    followUpDate: "",
    notes: "",
  });

  // Social profile form
  const [socialForm, setSocialForm] = useState({
    instagram: "",
    facebook: "",
    whatsapp: "",
  });

  // Template form
  const [templateForm, setTemplateForm] = useState({
    name: "",
    category: "introduction",
    content: "",
  });

  // Reminder form
  const [reminderForm, setReminderForm] = useState({
    leadName: "",
    reminderDate: "",
    reminderTime: "10:00",
    message: "",
    source: "WhatsApp",
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
    }
  };

  const fetchDigitalLab = async () => {
    try {
      const res = await fetch("/api/digital-lab", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDigitalLab(data);
        if (data.socialProfile) {
          setSocialForm({
            instagram: data.socialProfile.instagram || "",
            facebook: data.socialProfile.facebook || "",
            whatsapp: data.socialProfile.whatsapp || "",
          });
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchDigitalLab();
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

  const handleActivateSubscription = async (type: string) => {
    const res = await fetch("/api/subscription", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, paymentId: "mock_payment" }),
    });
    if (res.ok) {
      alert("Subscription activated!");
      fetchDigitalLab();
    }
  };

  const handleSaveSocial = async () => {
    const res = await fetch("/api/digital-lab/social", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(socialForm),
    });
    if (res.ok) {
      alert("Social profiles saved!");
      fetchDigitalLab();
    }
  };

  const handleAddTemplate = async () => {
    if (!templateForm.name || !templateForm.content) {
      alert("Name and content required");
      return;
    }
    const res = await fetch("/api/digital-lab/templates", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(templateForm),
    });
    if (res.ok) {
      setTemplateForm({ name: "", category: "introduction", content: "" });
      fetchDigitalLab();
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    await fetch(`/api/digital-lab/templates/${id}`, { method: "DELETE", credentials: "include" });
    fetchDigitalLab();
  };

  const handleCopyTemplate = async (template: { _id: string; content: string }) => {
    navigator.clipboard.writeText(template.content);
    await fetch(`/api/digital-lab/templates/${template._id}`, { method: "PUT", credentials: "include" });
    alert("Copied to clipboard!");
    fetchDigitalLab();
  };

  const handleAddReminder = async () => {
    if (!reminderForm.leadName || !reminderForm.reminderDate) {
      alert("Lead name and date required");
      return;
    }
    const res = await fetch("/api/digital-lab/reminders", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reminderForm),
    });
    if (res.ok) {
      setReminderForm({ leadName: "", reminderDate: "", reminderTime: "10:00", message: "", source: "WhatsApp" });
      fetchDigitalLab();
    }
  };

  const handleCompleteReminder = async (id: string) => {
    await fetch(`/api/digital-lab/reminders/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed" }),
    });
    fetchDigitalLab();
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
      <h2 className="text-3xl font-bold mb-6">Sales Booster</h2>

      {/* Main Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === "leads" ? "bg-green-600 text-white" : "bg-gray-100"}`}
          data-testid="tab-leads"
        >
          📋 Leads
        </button>
        <button
          onClick={() => setActiveTab("boost")}
          className={`px-6 py-3 rounded-lg font-semibold transition ${activeTab === "boost" ? "bg-purple-600 text-white" : "bg-gray-100"}`}
          data-testid="tab-boost"
        >
          🚀 Boost Digitally
        </button>
      </div>

      {/* LEADS TAB */}
      {activeTab === "leads" && (
        <>
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

          {/* Add Lead Button */}
          <div className="mb-6">
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-green-600 text-white px-4 py-2 rounded-lg"
              data-testid="add-lead-btn"
            >
              + Add Lead
            </button>
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
                  >
                    <option value="Hot">🔥 Hot</option>
                    <option value="Warm">☀️ Warm</option>
                    <option value="Cold">❄️ Cold</option>
                  </select>
                  <button onClick={() => handleEdit(lead)} className="text-blue-600">Edit</button>
                  <button onClick={() => handleDelete(lead._id)} className="text-red-600">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* BOOST DIGITALLY TAB */}
      {activeTab === "boost" && (
        <div data-testid="boost-digitally-section">
          {/* Sub Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {["overview", "social", "funnel", "templates", "reminders"].map((tab) => (
              <button
                key={tab}
                onClick={() => setBoostTab(tab as typeof boostTab)}
                className={`px-4 py-2 rounded-lg capitalize ${boostTab === tab ? "bg-purple-600 text-white" : "bg-gray-100"}`}
                data-testid={`boost-tab-${tab}`}
              >
                {tab === "overview" && "📊 "}{tab === "social" && "🔗 "}{tab === "funnel" && "🎯 "}{tab === "templates" && "📝 "}{tab === "reminders" && "⏰ "}
                {tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {boostTab === "overview" && (
            <div className="space-y-6">
              {/* Free Visibility Layer */}
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4">🚀 Boost Your Business Digitally</h3>
                <p className="text-gray-600 mb-4">Unlock powerful digital tools to generate more leads and grow your network marketing business.</p>
                
                <div className="grid grid-cols-3 gap-4">
                  {/* Digital Lab */}
                  <div className={`bg-white p-4 rounded-xl shadow ${digitalLab?.isActive ? "border-2 border-green-500" : ""}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold">Digital Lab</h4>
                      {digitalLab?.isActive ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">₹999/mo</span>
                      )}
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li>✓ Social profile links</li>
                      <li>✓ Auto-generated funnel page</li>
                      <li>✓ Lead capture form</li>
                      <li>✓ DM template manager</li>
                      <li>✓ Follow-up reminders</li>
                      <li>✓ Source tracking</li>
                    </ul>
                    {!digitalLab?.isActive && (
                      <button
                        onClick={() => handleActivateSubscription("digital_lab")}
                        className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm"
                        data-testid="activate-digital-lab"
                      >
                        Upgrade Now
                      </button>
                    )}
                  </div>

                  {/* Onboarding */}
                  <div className={`bg-white p-4 rounded-xl shadow ${digitalLab?.subscription?.onboardingFeePaid ? "border-2 border-green-500" : ""}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold">Onboarding</h4>
                      {digitalLab?.subscription?.onboardingFeePaid ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Paid</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">₹3000</span>
                      )}
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li>✓ Step-by-step setup guide</li>
                      <li>✓ Profile optimization</li>
                      <li>✓ CRM configuration</li>
                      <li>✓ Template setup</li>
                      <li>✓ Funnel customization</li>
                    </ul>
                    {!digitalLab?.subscription?.onboardingFeePaid ? (
                      <button
                        onClick={() => handleActivateSubscription("onboarding")}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm"
                        data-testid="activate-onboarding"
                      >
                        Get Started
                      </button>
                    ) : (
                      <a href="/dashboard/onboarding" className="block w-full bg-green-600 text-white py-2 rounded-lg text-sm text-center">
                        View Progress
                      </a>
                    )}
                  </div>

                  {/* Marketing Support */}
                  <div className={`bg-white p-4 rounded-xl shadow ${digitalLab?.subscription?.marketingSupportActive ? "border-2 border-green-500" : ""}`}>
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold">Marketing Support</h4>
                      {digitalLab?.subscription?.marketingSupportActive ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Active</span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">₹4999/mo</span>
                      )}
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1 mb-4">
                      <li>✓ Content creation support</li>
                      <li>✓ Marketing strategy</li>
                      <li>✓ Campaign planning</li>
                      <li>✓ Growth consultation</li>
                      <li>✓ Priority support</li>
                    </ul>
                    {!digitalLab?.subscription?.marketingSupportActive && (
                      <button
                        onClick={() => handleActivateSubscription("marketing_support")}
                        className="w-full bg-orange-600 text-white py-2 rounded-lg text-sm"
                        data-testid="activate-marketing"
                      >
                        Coming Soon
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats for Active Users */}
              {digitalLab?.isActive && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-purple-500">
                    <p className="text-sm text-gray-500">Funnel Leads</p>
                    <p className="text-2xl font-bold text-purple-600">{digitalLab.stats?.totalFunnelLeads || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-green-500">
                    <p className="text-sm text-gray-500">Conversion Rate</p>
                    <p className="text-2xl font-bold text-green-600">{digitalLab.stats?.conversionRate || 0}%</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-blue-500">
                    <p className="text-sm text-gray-500">Funnel Views</p>
                    <p className="text-2xl font-bold text-blue-600">{digitalLab.funnelPage?.views || 0}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl shadow border-l-4 border-orange-500">
                    <p className="text-sm text-gray-500">Pending Reminders</p>
                    <p className="text-2xl font-bold text-orange-600">{digitalLab.stats?.pendingReminders || 0}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SOCIAL PROFILES */}
          {boostTab === "social" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-xl font-bold mb-4">🔗 Social Profile Links</h3>
              {!digitalLab?.isActive ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Upgrade to Digital Lab to manage your social profiles</p>
                  <button onClick={() => handleActivateSubscription("digital_lab")} className="bg-purple-600 text-white px-6 py-2 rounded-lg">
                    Upgrade Now - ₹999/mo
                  </button>
                </div>
              ) : (
                <div className="space-y-4 max-w-md">
                  <div>
                    <label className="text-sm text-gray-600">Instagram URL</label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/yourprofile"
                      value={socialForm.instagram}
                      onChange={(e) => setSocialForm({ ...socialForm, instagram: e.target.value })}
                      className="w-full border p-3 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Facebook URL</label>
                    <input
                      type="url"
                      placeholder="https://facebook.com/yourprofile"
                      value={socialForm.facebook}
                      onChange={(e) => setSocialForm({ ...socialForm, facebook: e.target.value })}
                      className="w-full border p-3 rounded-lg mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">WhatsApp Number</label>
                    <input
                      type="text"
                      placeholder="919876543210"
                      value={socialForm.whatsapp}
                      onChange={(e) => setSocialForm({ ...socialForm, whatsapp: e.target.value })}
                      className="w-full border p-3 rounded-lg mt-1"
                    />
                  </div>
                  <button onClick={handleSaveSocial} className="bg-green-600 text-white px-6 py-3 rounded-lg">
                    Save Social Profiles
                  </button>
                </div>
              )}
            </div>
          )}

          {/* FUNNEL PAGE */}
          {boostTab === "funnel" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-xl font-bold mb-4">🎯 Your Funnel Landing Page</h3>
              {!digitalLab?.isActive ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Upgrade to Digital Lab to get your auto-generated funnel page</p>
                  <button onClick={() => handleActivateSubscription("digital_lab")} className="bg-purple-600 text-white px-6 py-2 rounded-lg">
                    Upgrade Now - ₹999/mo
                  </button>
                </div>
              ) : (
                <div>
                  <div className="bg-gray-50 p-4 rounded-xl mb-4">
                    <p className="text-sm text-gray-500">Your Funnel URL</p>
                    <p className="text-lg font-mono text-purple-600">/funnel/{digitalLab.funnelPage?.slug}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <p className="text-3xl font-bold text-blue-600">{digitalLab.funnelPage?.views || 0}</p>
                      <p className="text-sm text-gray-500">Views</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <p className="text-3xl font-bold text-green-600">{digitalLab.funnelPage?.conversions || 0}</p>
                      <p className="text-sm text-gray-500">Conversions</p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <p className="text-3xl font-bold text-purple-600">{digitalLab.stats?.conversionRate || 0}%</p>
                      <p className="text-sm text-gray-500">Conv. Rate</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Share this link on WhatsApp, Instagram, and Facebook to capture leads automatically!</p>
                </div>
              )}
            </div>
          )}

          {/* DM TEMPLATES */}
          {boostTab === "templates" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-xl font-bold mb-4">📝 DM Template Manager</h3>
              {!digitalLab?.isActive ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Upgrade to Digital Lab to create and manage DM templates</p>
                  <button onClick={() => handleActivateSubscription("digital_lab")} className="bg-purple-600 text-white px-6 py-2 rounded-lg">
                    Upgrade Now - ₹999/mo
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <h4 className="font-semibold mb-3">Add New Template</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <input
                        placeholder="Template Name"
                        value={templateForm.name}
                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                        className="border p-3 rounded-lg"
                      />
                      <select
                        value={templateForm.category}
                        onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                        className="border p-3 rounded-lg"
                      >
                        <option value="introduction">Introduction</option>
                        <option value="follow_up">Follow Up</option>
                        <option value="closing">Closing</option>
                        <option value="objection">Objection Handling</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <textarea
                      placeholder="Template content..."
                      value={templateForm.content}
                      onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                      className="w-full border p-3 rounded-lg mt-3"
                      rows={3}
                    />
                    <button onClick={handleAddTemplate} className="bg-green-600 text-white px-4 py-2 rounded-lg mt-3">
                      Add Template
                    </button>
                  </div>

                  <div className="space-y-3">
                    {digitalLab.dmTemplates?.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No templates yet. Create your first one above!</p>
                    )}
                    {digitalLab.dmTemplates?.map((t) => (
                      <div key={t._id} className="border p-4 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold">{t.name}</span>
                            <span className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded capitalize">{t.category.replace("_", " ")}</span>
                          </div>
                          <span className="text-sm text-gray-400">Used {t.usageCount}x</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3 whitespace-pre-wrap">{t.content}</p>
                        <div className="flex gap-2">
                          <button onClick={() => handleCopyTemplate(t)} className="text-blue-600 text-sm">📋 Copy</button>
                          <button onClick={() => handleDeleteTemplate(t._id)} className="text-red-600 text-sm">🗑️ Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* REMINDERS */}
          {boostTab === "reminders" && (
            <div className="bg-white p-6 rounded-2xl shadow">
              <h3 className="text-xl font-bold mb-4">⏰ Follow-up Reminders</h3>
              {!digitalLab?.isActive ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Upgrade to Digital Lab to set follow-up reminders</p>
                  <button onClick={() => handleActivateSubscription("digital_lab")} className="bg-purple-600 text-white px-6 py-2 rounded-lg">
                    Upgrade Now - ₹999/mo
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl mb-6">
                    <h4 className="font-semibold mb-3">Add Reminder</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <input
                        placeholder="Lead Name"
                        value={reminderForm.leadName}
                        onChange={(e) => setReminderForm({ ...reminderForm, leadName: e.target.value })}
                        className="border p-3 rounded-lg"
                      />
                      <input
                        type="date"
                        value={reminderForm.reminderDate}
                        onChange={(e) => setReminderForm({ ...reminderForm, reminderDate: e.target.value })}
                        className="border p-3 rounded-lg"
                      />
                      <select
                        value={reminderForm.source}
                        onChange={(e) => setReminderForm({ ...reminderForm, source: e.target.value })}
                        className="border p-3 rounded-lg"
                      >
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="Funnel">Funnel</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <input
                      placeholder="Reminder message (optional)"
                      value={reminderForm.message}
                      onChange={(e) => setReminderForm({ ...reminderForm, message: e.target.value })}
                      className="w-full border p-3 rounded-lg mt-3"
                    />
                    <button onClick={handleAddReminder} className="bg-green-600 text-white px-4 py-2 rounded-lg mt-3">
                      Add Reminder
                    </button>
                  </div>

                  <div className="space-y-3">
                    {digitalLab.reminders?.filter(r => r.status === "pending").length === 0 && (
                      <p className="text-gray-500 text-center py-4">No pending reminders!</p>
                    )}
                    {digitalLab.reminders?.filter(r => r.status === "pending").map((r) => (
                      <div key={r._id} className="border p-4 rounded-xl flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{r.leadName}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(r.reminderDate).toLocaleDateString()}
                            {new Date(r.reminderDate) <= new Date() && <span className="text-red-600 ml-2">⚠️ Due</span>}
                          </p>
                        </div>
                        <button
                          onClick={() => handleCompleteReminder(r._id)}
                          className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm"
                        >
                          ✓ Done
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
