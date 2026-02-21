"use client";

import { useEffect, useState } from "react";

interface Milestone {
  title: string;
  date: string;
}

interface JourneyData {
  _id: string;
  currentRank: string;
  nextRank: string;
  monthlyPV: number;
  monthlyGV: number;
  activeCustomers: number;
  activeTeamMembers: number;
  monthlyNewMembers: number;
  pvGoal: number;
  teamGoal: number;
  incomeGoal: number;
  milestones: Milestone[];
}

const RANKS = [
  "Distributor",
  "Senior Consultant",
  "Success Builder",
  "Qualified Producer",
  "Supervisor",
  "World Team",
  "Global Expansion Team",
  "Millionaire Team",
  "President's Team",
  "Chairman's Club",
];

export default function MyJourneyPage() {
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", date: "" });

  const [formData, setFormData] = useState({
    currentRank: "",
    nextRank: "",
    pvGoal: 0,
    teamGoal: 0,
    incomeGoal: 0,
    monthlyPV: 0,
    monthlyGV: 0,
    activeCustomers: 0,
    activeTeamMembers: 0,
    monthlyNewMembers: 0,
  });

  const fetchJourney = async () => {
    try {
      const res = await fetch("/api/journey", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setJourney(data.journey);
        setFormData({
          currentRank: data.journey.currentRank,
          nextRank: data.journey.nextRank,
          pvGoal: data.journey.pvGoal,
          teamGoal: data.journey.teamGoal,
          incomeGoal: data.journey.incomeGoal,
          monthlyPV: data.journey.monthlyPV,
          monthlyGV: data.journey.monthlyGV,
          activeCustomers: data.journey.activeCustomers,
          activeTeamMembers: data.journey.activeTeamMembers,
          monthlyNewMembers: data.journey.monthlyNewMembers,
        });
      }
    } catch (err) {
      console.error("Error fetching journey:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, []);

  const handleUpdate = async () => {
    const res = await fetch("/api/journey", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      setEditing(false);
      fetchJourney();
    }
  };

  const handleAddMilestone = async () => {
    if (!newMilestone.title || !newMilestone.date) {
      alert("Please fill milestone title and date");
      return;
    }
    const res = await fetch("/api/journey", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ milestone: newMilestone }),
    });
    if (res.ok) {
      setNewMilestone({ title: "", date: "" });
      fetchJourney();
    }
  };

  const calculateProgress = () => {
    if (!journey) return 0;
    const pvProgress = journey.pvGoal > 0 ? (journey.monthlyPV / journey.pvGoal) * 100 : 0;
    return Math.min(pvProgress, 100);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div data-testid="journey-page">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">My Journey</h2>
        <button
          onClick={() => setEditing(!editing)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
          data-testid="edit-journey-btn"
        >
          {editing ? "Cancel" : "Edit Goals"}
        </button>
      </div>

      {/* Rank & Progress */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-2xl text-white">
          <h3 className="text-lg opacity-80">Current Rank</h3>
          {editing ? (
            <select
              value={formData.currentRank}
              onChange={(e) => setFormData({ ...formData, currentRank: e.target.value })}
              className="mt-2 w-full p-2 rounded bg-white/20 text-white"
            >
              {RANKS.map((r) => (
                <option key={r} value={r} className="text-black">{r}</option>
              ))}
            </select>
          ) : (
            <p className="text-3xl font-bold mt-2" data-testid="current-rank">{journey?.currentRank}</p>
          )}
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl text-white">
          <h3 className="text-lg opacity-80">Next Rank</h3>
          {editing ? (
            <select
              value={formData.nextRank}
              onChange={(e) => setFormData({ ...formData, nextRank: e.target.value })}
              className="mt-2 w-full p-2 rounded bg-white/20 text-white"
            >
              {RANKS.map((r) => (
                <option key={r} value={r} className="text-black">{r}</option>
              ))}
            </select>
          ) : (
            <p className="text-3xl font-bold mt-2" data-testid="next-rank">{journey?.nextRank}</p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-2xl shadow mb-8">
        <div className="flex justify-between mb-2">
          <span className="font-semibold">Progress to Next Rank</span>
          <span className="text-green-600 font-bold">{calculateProgress().toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-600 h-4 rounded-full transition-all"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>

      {/* Monthly Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {[
          { label: "Monthly PV", key: "monthlyPV", value: journey?.monthlyPV },
          { label: "Monthly GV", key: "monthlyGV", value: journey?.monthlyGV },
          { label: "Active Customers", key: "activeCustomers", value: journey?.activeCustomers },
          { label: "Active Team", key: "activeTeamMembers", value: journey?.activeTeamMembers },
          { label: "New Members", key: "monthlyNewMembers", value: journey?.monthlyNewMembers },
        ].map((stat) => (
          <div key={stat.key} className="bg-white p-4 rounded-xl shadow text-center">
            <p className="text-sm text-gray-500">{stat.label}</p>
            {editing ? (
              <input
                type="number"
                value={formData[stat.key as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [stat.key]: parseInt(e.target.value) || 0 })}
                className="w-full text-center text-2xl font-bold text-green-600 border rounded mt-1"
              />
            ) : (
              <p className="text-2xl font-bold text-green-600">{stat.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Goals */}
      <div className="bg-white p-6 rounded-2xl shadow mb-8">
        <h3 className="text-xl font-semibold mb-4">My Goals</h3>
        <div className="grid grid-cols-3 gap-6">
          {[
            { label: "PV Goal", key: "pvGoal", value: journey?.pvGoal },
            { label: "Team Goal", key: "teamGoal", value: journey?.teamGoal },
            { label: "Income Goal (₹)", key: "incomeGoal", value: journey?.incomeGoal },
          ].map((goal) => (
            <div key={goal.key} className="text-center">
              <p className="text-gray-500">{goal.label}</p>
              {editing ? (
                <input
                  type="number"
                  value={formData[goal.key as keyof typeof formData]}
                  onChange={(e) => setFormData({ ...formData, [goal.key]: parseInt(e.target.value) || 0 })}
                  className="w-full text-center text-xl font-bold border rounded mt-1 p-2"
                />
              ) : (
                <p className="text-2xl font-bold">{goal.value?.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>
        {editing && (
          <button
            onClick={handleUpdate}
            className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg"
            data-testid="save-journey-btn"
          >
            Save Changes
          </button>
        )}
      </div>

      {/* Milestones */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4">Milestones</h3>
        
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            placeholder="Milestone title"
            value={newMilestone.title}
            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            className="flex-1 border p-2 rounded-lg"
            data-testid="milestone-title-input"
          />
          <input
            type="date"
            value={newMilestone.date}
            onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
            className="border p-2 rounded-lg"
            data-testid="milestone-date-input"
          />
          <button
            onClick={handleAddMilestone}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            data-testid="add-milestone-btn"
          >
            Add
          </button>
        </div>

        <div className="space-y-3" data-testid="milestones-list">
          {journey?.milestones?.length === 0 && (
            <p className="text-gray-500">No milestones yet. Add your first achievement!</p>
          )}
          {journey?.milestones?.map((m, i) => (
            <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <div className="flex-1">
                <p className="font-semibold">{m.title}</p>
                <p className="text-sm text-gray-500">{new Date(m.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
