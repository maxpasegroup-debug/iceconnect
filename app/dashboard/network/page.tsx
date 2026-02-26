"use client";

import { useEffect, useState, useCallback } from "react";

interface NetworkStatsData {
  totalDownlineCount: number;
  totalDownlineVolume: number;
}

interface LeaderboardRow {
  _id: string;
  userId: string;
  totalDownlineVolume: number;
}

export default function NetworkPage() {
  const [stats, setStats] = useState<NetworkStatsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/network", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {
      setStats(null);
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await fetch("/api/network?leaderboard=true", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(Array.isArray(data) ? data : []);
      }
    } catch {
      setLeaderboard([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchLeaderboard()]);
      setLoading(false);
    };
    load();
  }, [fetchStats, fetchLeaderboard]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading Network...</div>
      </div>
    );
  }

  const totalDownlineCount = stats?.totalDownlineCount ?? 0;
  const totalDownlineVolume = stats?.totalDownlineVolume ?? 0;
  const showBadge = totalDownlineVolume >= 200;

  return (
    <div data-testid="network-page">
      <div className="mb-10 pr-32">
        <h2 className="text-3xl font-bold text-gray-800">Network</h2>
        <p className="text-gray-500 mt-2">Your downline stats and leaderboard.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Downline Count</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="downline-count">
            {totalDownlineCount}
          </div>
        </div>
        <div className="bg-gray-50 p-6 rounded-2xl shadow">
          <h3 className="text-lg font-semibold text-gray-700">Total Downline Volume</h3>
          <div className="text-4xl text-green-600 font-bold mt-2" data-testid="downline-volume">
            {totalDownlineVolume}
          </div>
        </div>
      </div>

      {showBadge && (
        <div className="mb-8">
          <span className="inline-block bg-green-600 text-white px-4 py-2 rounded-xl font-semibold">
            Junior Partner Qualified
          </span>
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Leaderboard (Top 10 by Downline Volume)</h3>
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
                    <td className="py-3 text-green-600 font-semibold">{row.totalDownlineVolume}</td>
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
