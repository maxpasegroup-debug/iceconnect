"use client";

import { useEffect, useState, useCallback } from "react";

interface AdminUser {
  userId: string;
  lifetimeVolume: number;
  currentMonthlyVolume: number;
  lifetimeCommission: number;
}

export default function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustVolume, setAdjustVolume] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [volumeLogId, setVolumeLogId] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchAdmin = useCallback(async () => {
    try {
      const res = await fetch("/api/admin", { credentials: "include" });
      if (res.status === 401) {
        setError("Unauthorized");
        setUsers([]);
        return;
      }
      if (res.status === 403) {
        setError("Forbidden");
        setUsers([]);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        setError("Failed to load");
      }
    } catch {
      setError("Failed to load");
      setUsers([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAdmin();
      setLoading(false);
    };
    load();
  }, [fetchAdmin]);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = adjustUserId.trim();
    const amount = parseInt(adjustVolume, 10);
    if (!userId || !Number.isFinite(amount)) {
      setError("Enter userId and a valid volume amount");
      return;
    }
    setError(null);
    setAdjusting(true);
    try {
      const res = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ userId, adjustVolume: amount }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setAdjustUserId("");
        setAdjustVolume("");
        await fetchAdmin();
      } else {
        setError(data.message || "Adjust failed");
      }
    } catch {
      setError("Adjust failed");
    } finally {
      setAdjusting(false);
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = volumeLogId.trim();
    if (!id) {
      setError("Enter volume log ID");
      return;
    }
    setError(null);
    setDeleting(true);
    try {
      const res = await fetch("/api/admin", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ volumeLogId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setVolumeLogId("");
      } else {
        setError(data.message || "Delete failed");
      }
    } catch {
      setError("Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div data-testid="admin-page">
      <div className="mb-10 pr-32">
        <h2 className="text-3xl font-bold text-gray-800">Admin</h2>
        <p className="text-gray-500 mt-2">User volume and volume log management.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Users</h3>
        {users.length === 0 ? (
          <p className="text-gray-500">No users.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-semibold text-gray-700">UserId</th>
                  <th className="pb-3 font-semibold text-gray-700">Lifetime Volume</th>
                  <th className="pb-3 font-semibold text-gray-700">Monthly Volume</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.userId} className="border-b border-gray-100">
                    <td className="py-3 font-medium text-gray-800">{u.userId}</td>
                    <td className="py-3 text-gray-600">{u.lifetimeVolume}</td>
                    <td className="py-3 text-gray-600">{u.currentMonthlyVolume}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Adjust volume</h3>
        <form onSubmit={handleAdjust} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="adjustUserId" className="block text-sm font-medium text-gray-700 mb-1">
              User ID
            </label>
            <input
              id="adjustUserId"
              type="text"
              value={adjustUserId}
              onChange={(e) => setAdjustUserId(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-56 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="User ID"
            />
          </div>
          <div>
            <label htmlFor="adjustVolume" className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              id="adjustVolume"
              type="number"
              value={adjustVolume}
              onChange={(e) => setAdjustVolume(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-28 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="0"
            />
          </div>
          <button
            type="submit"
            disabled={adjusting}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {adjusting ? "Adjusting..." : "Adjust volume"}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Delete volume log</h3>
        <form onSubmit={handleDelete} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="volumeLogId" className="block text-sm font-medium text-gray-700 mb-1">
              Volume log ID
            </label>
            <input
              id="volumeLogId"
              type="text"
              value={volumeLogId}
              onChange={(e) => setVolumeLogId(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-72 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="MongoDB _id of volume log"
            />
          </div>
          <button
            type="submit"
            disabled={deleting}
            className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete volume log"}
          </button>
        </form>
      </div>
    </div>
  );
}
