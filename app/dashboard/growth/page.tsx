"use client";

import { useEffect, useState, useCallback } from "react";

interface RankStatusType {
  _id: string;
  userId: string;
  totalVolume: number;
  levelPercent: number;
  commissionEarned: number;
  updatedAt: string;
}

export default function GrowthPage() {
  const [rankStatus, setRankStatus] = useState<RankStatusType | null>(null);
  const [leaderboard, setLeaderboard] = useState<RankStatusType[]>([]);
  const [loading, setLoading] = useState(true);
  const [shakeCount, setShakeCount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchGrowth(), fetchLeaderboard()]);
      setLoading(false);
    };
    load();
  }, [fetchGrowth, fetchLeaderboard]);

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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || data.message || "Failed to add shake");
        return;
      }
      setShakeCount("");
      await fetchGrowth();
      await fetchLeaderboard();
    } catch (err) {
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

  const totalVolume = rankStatus?.totalVolume ?? 0;
  const remainingTo200 = Math.max(0, 200 - totalVolume);
  const progress = Math.min((totalVolume / 200) * 100, 100);

  return (
    <div data-testid="growth-page">
      <div className="mb-10 pr-32">
        <h2 className="text-3xl font-bold text-gray-800">Growth Engine</h2>
        <p className="text-gray-500 mt-2">Track your volume, level and commission.</p>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Volume</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="total-volume">
            {totalVolume}
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Current Level %</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="level-percent">
            {rankStatus?.levelPercent ?? 35}%
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Commission Earned</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="commission-earned">
            ₹{rankStatus?.commissionEarned ?? 0}
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Remaining to 200</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="remaining-to-200">
            {remainingTo200}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">Progress to next tier (200 volume)</h3>
        <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-600 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {totalVolume} / 200 volume ({progress.toFixed(0)}%)
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

      {/* Leaderboard */}
      <div className="bg-gray-50 p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Leaderboard (Top 10 by Volume)</h3>
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
                    <td className="py-3 text-green-600 font-semibold">{row.totalVolume}</td>
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
