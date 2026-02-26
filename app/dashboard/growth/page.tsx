"use client";

import { useEffect, useState, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface RankStatusType {
  lifetimeVolume: number;
  lifetimeCommission: number;
  currentMonthlyVolume: number;
  currentMonthlyCommission: number;
  currentLevelPercent: number;
  currentMonth: string;
}

interface LeaderboardRow {
  _id: string;
  userId: string;
  lifetimeVolume: number;
}

interface MonthlyPerformanceRow {
  _id: string;
  month: string;
  monthlyVolume: number;
  monthlyCommission: number;
  levelPercent: number;
}

export default function GrowthPage() {
  const [rankStatus, setRankStatus] = useState<RankStatusType | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [history, setHistory] = useState<MonthlyPerformanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [shakeCount, setShakeCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<string | null>(null);

  const fetchGrowth = useCallback(async () => {
    try {
      const res = await fetch("/api/growth", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setRankStatus(data.rankStatus ?? null);
      }
    } catch {
      setRankStatus(null);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/growth?leaderboard=true", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard ?? []);
      }
    } catch {
      setLeaderboard([]);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/growth?history=true", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history ?? []);
      }
    } catch {
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchGrowth(), fetchLeaderboard(), fetchHistory()]);
      setLoading(false);
    };
    load();
  }, [fetchGrowth, fetchLeaderboard, fetchHistory]);

  useEffect(() => {
    if (!milestone) return;
    const timeoutId = window.setTimeout(() => {
      setMilestone(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [milestone]);

  const handleAddShake = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(shakeCount, 10);
    if (!Number.isFinite(num) || num < 1) {
      setError("Enter a valid positive number");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/growth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ shakeCount: num }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || data.message || "Failed to add shake");
        return;
      }
      if (typeof data.milestone === "string" && data.milestone) {
        setMilestone(data.milestone);
      }
      setShakeCount("");
      await fetchGrowth();
      await fetchLeaderboard();
      await fetchHistory();
    } catch {
      setError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading Growth...</div>
      </div>
    );
  }

  const currentMonthlyVolume = rankStatus?.currentMonthlyVolume ?? 0;
  const progress = Math.min((currentMonthlyVolume / 200) * 100, 100);

  const chronologicalHistory = [...history].reverse();
  const lifetimeTrendData = chronologicalHistory.reduce<{ month: string; cumulativeVolume: number }[]>(
    (acc, row) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].cumulativeVolume : 0;
      acc.push({
        month: row.month,
        cumulativeVolume: prev + (row.monthlyVolume ?? 0),
      });
      return acc;
    },
    []
  );

  return (
    <div data-testid="growth-page">
      <div className="mb-10 pr-32">
        <h2 className="text-3xl font-bold text-gray-800">Growth Engine</h2>
        <p className="text-gray-500 mt-2">Track your volume, level and commission.</p>
      </div>

      {milestone && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-800">
          {milestone}
        </div>
      )}

      <div className="mb-8">
        <button
          type="button"
          onClick={() => window.open("/api/report", "_blank")}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition"
        >
          Download Performance Report
        </button>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Lifetime Volume</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="lifetime-volume">
            {rankStatus?.lifetimeVolume ?? 0}
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Lifetime Commission</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="lifetime-commission">
            ₹{rankStatus?.lifetimeCommission ?? 0}
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Current Month Volume</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="current-month-volume">
            {currentMonthlyVolume}
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Current Level %</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="level-percent">
            {rankStatus?.currentLevelPercent ?? 35}%
          </div>
        </div>
      </div>

      {/* Monthly Performance Chart */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Monthly Performance</h3>
        {history.length === 0 ? (
          <p className="text-gray-500">No history yet.</p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[...history].reverse()}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: "#374151", fontSize: 12 }} />
                <YAxis tick={{ fill: "#374151", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  labelStyle={{ color: "#374151" }}
                />
                <Line
                  type="monotone"
                  dataKey="monthlyVolume"
                  stroke="#16a34a"
                  strokeWidth={2}
                  dot={{ fill: "#16a34a", r: 4 }}
                  name="Volume"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Lifetime Growth Trend Chart */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Lifetime Growth Trend</h3>
        {lifetimeTrendData.length === 0 ? (
          <p className="text-gray-500">No history yet.</p>
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lifetimeTrendData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fill: "#374151", fontSize: 12 }} />
                <YAxis tick={{ fill: "#374151", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  labelStyle={{ color: "#374151" }}
                />
                <Line
                  type="monotone"
                  dataKey="cumulativeVolume"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ fill: "#2563eb", r: 4 }}
                  name="Lifetime Volume"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Progress to next tier (200 volume this month)</h3>
        <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {currentMonthlyVolume} / 200 volume ({progress.toFixed(0)}%)
        </p>
      </div>

      {/* Add Shake */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Add Shake</h3>
        <form onSubmit={handleAddShake} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="shakeCount" className="block text-sm font-medium text-gray-700 mb-1">
              Number of shakes
            </label>
            <input
              id="shakeCount"
              type="number"
              min={1}
              value={shakeCount}
              onChange={(e) => setShakeCount(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-40 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g. 5"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {submitting ? "Adding..." : "Add Shake"}
          </button>
        </form>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Performance History */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Performance History</h3>
        {history.length === 0 ? (
          <p className="text-gray-500">No history yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-semibold text-gray-700">Month</th>
                  <th className="pb-3 font-semibold text-gray-700">Monthly Volume</th>
                  <th className="pb-3 font-semibold text-gray-700">Monthly Commission</th>
                  <th className="pb-3 font-semibold text-gray-700">Level %</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row._id} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{row.month}</td>
                    <td className="py-3 text-gray-600">{row.monthlyVolume}</td>
                    <td className="py-3 text-gray-600">₹{row.monthlyCommission}</td>
                    <td className="py-3 text-green-600 font-semibold">{row.levelPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Leaderboard (Top 10 by Lifetime Volume)</h3>
        {leaderboard.length === 0 ? (
          <p className="text-gray-500">No entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-semibold text-gray-700">Rank</th>
                  <th className="pb-3 font-semibold text-gray-700">UserId</th>
                  <th className="pb-3 font-semibold text-gray-700">Volume</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((row, index) => (
                  <tr key={row._id} className="border-b border-gray-100">
                    <td className="py-3 font-medium">{index + 1}</td>
                    <td className="py-3 text-gray-600">{row.userId}</td>
                    <td className="py-3 text-green-600 font-semibold">{row.lifetimeVolume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
