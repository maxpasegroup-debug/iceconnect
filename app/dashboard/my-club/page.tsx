"use client";

import { useEffect, useState } from "react";

interface ClubData {
  _id: string;
  currentClubLevel: string;
  pvRequired: number;
  gvRequired: number;
  activeLinesRequired: number;
  currentPV: number;
  currentGV: number;
  activeLines: number;
  qualificationMonth: string | null;
  maintenanceStatus: string;
}

const CLUB_LEVELS = ["None", "Club 100", "Club 200", "Club 300", "President's Club"];

export default function MyClubPage() {
  const [club, setClub] = useState<ClubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    currentClubLevel: "None",
    pvRequired: 2500,
    gvRequired: 10000,
    activeLinesRequired: 3,
    currentPV: 0,
    currentGV: 0,
    activeLines: 0,
    qualificationMonth: "",
    maintenanceStatus: "Not Qualified",
  });

  const fetchClub = async () => {
    try {
      const res = await fetch("/api/club", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setClub(data.club);
        setFormData({
          currentClubLevel: data.club.currentClubLevel,
          pvRequired: data.club.pvRequired,
          gvRequired: data.club.gvRequired,
          activeLinesRequired: data.club.activeLinesRequired,
          currentPV: data.club.currentPV,
          currentGV: data.club.currentGV,
          activeLines: data.club.activeLines,
          qualificationMonth: data.club.qualificationMonth?.split("T")[0] || "",
          maintenanceStatus: data.club.maintenanceStatus,
        });
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, []);

  const handleUpdate = async () => {
    const res = await fetch("/api/club", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setEditing(false);
      fetchClub();
    }
  };

  const calculateProgress = (current: number, required: number) => {
    if (required === 0) return 0;
    return Math.min((current / required) * 100, 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Qualified": return "bg-green-100 text-green-700";
      case "At Risk": return "bg-yellow-100 text-yellow-700";
      default: return "bg-red-100 text-red-700";
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div data-testid="club-page">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">My Club</h2>
        <button
          onClick={() => setEditing(!editing)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
          data-testid="edit-club-btn"
        >
          {editing ? "Cancel" : "Update Progress"}
        </button>
      </div>

      {/* Current Level */}
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-8 rounded-2xl text-white mb-8">
        <p className="text-lg opacity-80">Current Club Level</p>
        {editing ? (
          <select
            value={formData.currentClubLevel}
            onChange={(e) => setFormData({ ...formData, currentClubLevel: e.target.value })}
            className="mt-2 w-full max-w-xs p-3 rounded-lg bg-white/20 text-white text-2xl font-bold"
          >
            {CLUB_LEVELS.map((l) => (
              <option key={l} value={l} className="text-black">{l}</option>
            ))}
          </select>
        ) : (
          <p className="text-4xl font-bold mt-2" data-testid="club-level">{club?.currentClubLevel}</p>
        )}
        <div className="mt-4 flex items-center gap-4">
          <span className={`px-4 py-2 rounded-full ${getStatusColor(club?.maintenanceStatus || "")}`}>
            {club?.maintenanceStatus}
          </span>
          {club?.qualificationMonth && (
            <span className="text-sm opacity-80">
              Qualified: {new Date(club.qualificationMonth).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* PV Progress */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Personal Volume</span>
            <span className="text-green-600 font-bold">
              {editing ? (
                <input
                  type="number"
                  value={formData.currentPV}
                  onChange={(e) => setFormData({ ...formData, currentPV: parseInt(e.target.value) || 0 })}
                  className="w-20 border rounded px-2"
                />
              ) : club?.currentPV} / {editing ? (
                <input
                  type="number"
                  value={formData.pvRequired}
                  onChange={(e) => setFormData({ ...formData, pvRequired: parseInt(e.target.value) || 0 })}
                  className="w-20 border rounded px-2"
                />
              ) : club?.pvRequired}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-green-500 h-4 rounded-full transition-all"
              style={{ width: `${calculateProgress(club?.currentPV || 0, club?.pvRequired || 1)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {calculateProgress(club?.currentPV || 0, club?.pvRequired || 1).toFixed(1)}% Complete
          </p>
        </div>

        {/* GV Progress */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Group Volume</span>
            <span className="text-blue-600 font-bold">
              {editing ? (
                <input
                  type="number"
                  value={formData.currentGV}
                  onChange={(e) => setFormData({ ...formData, currentGV: parseInt(e.target.value) || 0 })}
                  className="w-20 border rounded px-2"
                />
              ) : club?.currentGV} / {editing ? (
                <input
                  type="number"
                  value={formData.gvRequired}
                  onChange={(e) => setFormData({ ...formData, gvRequired: parseInt(e.target.value) || 0 })}
                  className="w-20 border rounded px-2"
                />
              ) : club?.gvRequired}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-blue-500 h-4 rounded-full transition-all"
              style={{ width: `${calculateProgress(club?.currentGV || 0, club?.gvRequired || 1)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {calculateProgress(club?.currentGV || 0, club?.gvRequired || 1).toFixed(1)}% Complete
          </p>
        </div>

        {/* Active Lines Progress */}
        <div className="bg-white p-6 rounded-2xl shadow">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Active Lines</span>
            <span className="text-purple-600 font-bold">
              {editing ? (
                <input
                  type="number"
                  value={formData.activeLines}
                  onChange={(e) => setFormData({ ...formData, activeLines: parseInt(e.target.value) || 0 })}
                  className="w-16 border rounded px-2"
                />
              ) : club?.activeLines} / {editing ? (
                <input
                  type="number"
                  value={formData.activeLinesRequired}
                  onChange={(e) => setFormData({ ...formData, activeLinesRequired: parseInt(e.target.value) || 0 })}
                  className="w-16 border rounded px-2"
                />
              ) : club?.activeLinesRequired}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-purple-500 h-4 rounded-full transition-all"
              style={{ width: `${calculateProgress(club?.activeLines || 0, club?.activeLinesRequired || 1)}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {calculateProgress(club?.activeLines || 0, club?.activeLinesRequired || 1).toFixed(1)}% Complete
          </p>
        </div>
      </div>

      {editing && (
        <div className="bg-white p-6 rounded-2xl shadow mb-8">
          <h3 className="font-semibold mb-4">Additional Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Qualification Month</label>
              <input
                type="date"
                value={formData.qualificationMonth}
                onChange={(e) => setFormData({ ...formData, qualificationMonth: e.target.value })}
                className="w-full border p-3 rounded-lg mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Maintenance Status</label>
              <select
                value={formData.maintenanceStatus}
                onChange={(e) => setFormData({ ...formData, maintenanceStatus: e.target.value })}
                className="w-full border p-3 rounded-lg mt-1"
              >
                <option>Qualified</option>
                <option>At Risk</option>
                <option>Not Qualified</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleUpdate}
            className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg"
            data-testid="save-club-btn"
          >
            Save Changes
          </button>
        </div>
      )}

      {/* Club Benefits Info */}
      <div className="bg-gray-50 p-6 rounded-2xl">
        <h3 className="text-xl font-semibold mb-4">Club Level Benefits</h3>
        <div className="grid grid-cols-4 gap-4">
          {CLUB_LEVELS.slice(1).map((level) => (
            <div key={level} className={`p-4 rounded-xl ${club?.currentClubLevel === level ? "bg-green-100 border-2 border-green-500" : "bg-white"}`}>
              <p className="font-bold">{level}</p>
              <p className="text-sm text-gray-500 mt-1">Exclusive rewards & recognition</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}