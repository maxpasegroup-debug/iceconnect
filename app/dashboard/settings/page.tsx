"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  _id: string;
  name: string;
  phone: string;
  role: string;
}

interface Settings {
  _id: string;
  monthlyTarget: number;
  currency: string;
  timezone: string;
  profilePicture: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // Profile form
  const [profileForm, setProfileForm] = useState({ name: "", currentPin: "", newPin: "", confirmPin: "" });
  
  // Business form
  const [businessForm, setBusinessForm] = useState({ monthlyTarget: 5000, currency: "INR", timezone: "Asia/Kolkata" });

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setSettings(data.settings);
        setProfileForm({ ...profileForm, name: data.user?.name || "" });
        setBusinessForm({
          monthlyTarget: data.settings?.monthlyTarget || 5000,
          currency: data.settings?.currency || "INR",
          timezone: data.settings?.timezone || "Asia/Kolkata",
        });
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleProfileUpdate = async () => {
    if (profileForm.newPin && profileForm.newPin !== profileForm.confirmPin) {
      alert("New PIN and Confirm PIN don't match");
      return;
    }
    if (profileForm.newPin && profileForm.newPin.length !== 4) {
      alert("PIN must be 4 digits");
      return;
    }

    const res = await fetch("/api/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "profile",
        data: {
          name: profileForm.name,
          currentPin: profileForm.currentPin || undefined,
          newPin: profileForm.newPin || undefined,
        },
      }),
    });

    const data = await res.json();
    if (res.ok) {
      alert("Profile updated successfully");
      setProfileForm({ ...profileForm, currentPin: "", newPin: "", confirmPin: "" });
      fetchSettings();
    } else {
      alert(data.message || "Failed to update profile");
    }
  };

  const handleBusinessUpdate = async () => {
    const res = await fetch("/api/settings", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "business", data: businessForm }),
    });

    if (res.ok) {
      alert("Business settings updated");
      fetchSettings();
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm("This will log you out from all sessions. Continue?")) return;

    const res = await fetch("/api/settings", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "logout-all" }),
    });

    if (res.ok) {
      router.push("/");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmed !== "DELETE") {
      alert("Account deletion cancelled");
      return;
    }

    const res = await fetch("/api/settings", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "delete-account" }),
    });

    if (res.ok) {
      alert("Account deleted successfully");
      router.push("/");
    }
  };

  const handleExportData = async () => {
    try {
      const res = await fetch("/api/settings/export", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `herbalife-crm-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div data-testid="settings-page">
      <h2 className="text-3xl font-bold mb-6">Settings</h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: "profile", label: "Profile" },
          { id: "business", label: "Business" },
          { id: "security", label: "Security" },
          { id: "data", label: "Data" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === tab.id ? "bg-green-600 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-6">Profile Settings</h3>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-sm text-gray-600">Full Name</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full border p-3 rounded-lg mt-1"
                data-testid="profile-name-input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Phone (cannot be changed)</label>
              <input
                type="text"
                value={user?.phone || ""}
                disabled
                className="w-full border p-3 rounded-lg mt-1 bg-gray-100"
              />
            </div>

            <hr className="my-6" />

            <h4 className="font-semibold">Change PIN</h4>

            <div>
              <label className="text-sm text-gray-600">Current PIN</label>
              <input
                type="password"
                placeholder="Enter current PIN"
                value={profileForm.currentPin}
                onChange={(e) => setProfileForm({ ...profileForm, currentPin: e.target.value })}
                className="w-full border p-3 rounded-lg mt-1"
                maxLength={4}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">New PIN</label>
              <input
                type="password"
                placeholder="Enter new 4-digit PIN"
                value={profileForm.newPin}
                onChange={(e) => setProfileForm({ ...profileForm, newPin: e.target.value })}
                className="w-full border p-3 rounded-lg mt-1"
                maxLength={4}
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Confirm New PIN</label>
              <input
                type="password"
                placeholder="Confirm new PIN"
                value={profileForm.confirmPin}
                onChange={(e) => setProfileForm({ ...profileForm, confirmPin: e.target.value })}
                className="w-full border p-3 rounded-lg mt-1"
                maxLength={4}
              />
            </div>

            <button
              onClick={handleProfileUpdate}
              className="bg-green-600 text-white px-6 py-3 rounded-lg mt-4"
              data-testid="save-profile-btn"
            >
              Save Profile
            </button>
          </div>
        </div>
      )}

      {/* Business Tab */}
      {activeTab === "business" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-6">Business Settings</h3>
          
          <div className="space-y-4 max-w-md">
            <div>
              <label className="text-sm text-gray-600">Monthly Target (PV)</label>
              <input
                type="number"
                value={businessForm.monthlyTarget}
                onChange={(e) => setBusinessForm({ ...businessForm, monthlyTarget: parseInt(e.target.value) || 0 })}
                className="w-full border p-3 rounded-lg mt-1"
                data-testid="business-target-input"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600">Currency</label>
              <select
                value={businessForm.currency}
                onChange={(e) => setBusinessForm({ ...businessForm, currency: e.target.value })}
                className="w-full border p-3 rounded-lg mt-1"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-600">Timezone</label>
              <select
                value={businessForm.timezone}
                onChange={(e) => setBusinessForm({ ...businessForm, timezone: e.target.value })}
                className="w-full border p-3 rounded-lg mt-1"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Dubai">Asia/Dubai (GST)</option>
              </select>
            </div>

            <button
              onClick={handleBusinessUpdate}
              className="bg-green-600 text-white px-6 py-3 rounded-lg mt-4"
              data-testid="save-business-btn"
            >
              Save Business Settings
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-6">Security Settings</h3>
          
          <div className="space-y-6">
            <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <h4 className="font-semibold text-yellow-800">Logout All Sessions</h4>
              <p className="text-sm text-yellow-700 mt-1">This will log you out from all devices and sessions.</p>
              <button
                onClick={handleLogoutAll}
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg mt-3"
                data-testid="logout-all-btn"
              >
                Logout All Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === "data" && (
        <div className="bg-white p-6 rounded-2xl shadow">
          <h3 className="text-xl font-semibold mb-6">Data Management</h3>
          
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <h4 className="font-semibold text-blue-800">Export Your Data</h4>
              <p className="text-sm text-blue-700 mt-1">Download all your data in JSON format.</p>
              <button
                onClick={handleExportData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg mt-3"
                data-testid="export-data-btn"
              >
                Export Data (JSON)
              </button>
            </div>

            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <h4 className="font-semibold text-red-800">Delete Account</h4>
              <p className="text-sm text-red-700 mt-1">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-4 py-2 rounded-lg mt-3"
                data-testid="delete-account-btn"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
