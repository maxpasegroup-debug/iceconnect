"use client";

import { useEffect, useState, useCallback } from "react";

interface HabitItem {
  _id: string;
  userId: string;
  title: string;
  targetPerDay: number;
  isActive: boolean;
  todayCompletedCount: number;
}

export default function HabitPage() {
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/habit", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setHabits(Array.isArray(data) ? data : []);
        setError(null);
      } else {
        setError("Failed to load habits");
      }
    } catch {
      setError("Failed to load habits");
      setHabits([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchHabits();
      setLoading(false);
    };
    load();
  }, [fetchHabits]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    const target = newTarget.trim();
    const parsedTarget = target ? Number(target) : undefined;
    if (!title) {
      setError("Title is required");
      return;
    }
    if (parsedTarget !== undefined && !Number.isFinite(parsedTarget)) {
      setError("Target per day must be a number");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/habit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          targetPerDay: parsedTarget,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewTitle("");
        setNewTarget("");
        await fetchHabits();
      } else {
        setError(data.message || "Failed to create habit");
      }
    } catch {
      setError("Failed to create habit");
    } finally {
      setCreating(false);
    }
  };

  const handleIncrement = async (habit: HabitItem) => {
    const nextCount = habit.todayCompletedCount + 1;
    setUpdatingId(habit._id);
    setError(null);
    try {
      const res = await fetch("/api/habit", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          habitId: habit._id,
          completedCount: nextCount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        await fetchHabits();
      } else {
        setError(data.message || "Failed to update habit");
      }
    } catch {
      setError("Failed to update habit");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-500">Loading Habits...</div>
      </div>
    );
  }

  return (
    <div data-testid="habit-page">
      <div className="mb-10 pr-32">
        <h2 className="text-3xl font-bold text-gray-800">Habits</h2>
        <p className="text-gray-500 mt-2">Track and complete your daily habits.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-6 rounded-2xl shadow mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Create new habit</h3>
        <form onSubmit={handleCreate} className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="habitTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              id="habitTitle"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Drink water"
            />
          </div>
          <div>
            <label htmlFor="habitTarget" className="block text-sm font-medium text-gray-700 mb-1">
              Target per day
            </label>
            <input
              id="habitTarget"
              type="number"
              min={1}
              value={newTarget}
              onChange={(e) => setNewTarget(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 w-28 focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="1"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create habit"}
          </button>
        </form>
      </div>

      <div className="bg-gray-50 p-6 rounded-2xl shadow">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Today&apos;s habits</h3>
        {habits.length === 0 ? (
          <p className="text-gray-500">No habits yet. Create your first habit above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 font-semibold text-gray-700">Title</th>
                  <th className="pb-3 font-semibold text-gray-700">Target / day</th>
                  <th className="pb-3 font-semibold text-gray-700">Completed today</th>
                  <th className="pb-3 font-semibold text-gray-700">Status</th>
                  <th className="pb-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {habits.map((h) => {
                  const completed = h.todayCompletedCount >= h.targetPerDay;
                  return (
                    <tr key={h._id} className="border-b border-gray-100">
                      <td className="py-3 font-medium text-gray-800">{h.title}</td>
                      <td className="py-3 text-gray-600">{h.targetPerDay}</td>
                      <td className="py-3 text-gray-600">{h.todayCompletedCount}</td>
                      <td className="py-3">
                        {completed ? (
                          <span className="inline-block bg-green-100 text-green-700 text-xs px-3 py-1 rounded-full">
                            Completed Today
                          </span>
                        ) : (
                          <span className="inline-block bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                            In Progress
                          </span>
                        )}
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => handleIncrement(h)}
                          disabled={updatingId === h._id}
                          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition disabled:opacity-50"
                        >
                          {updatingId === h._id ? "..." : "+"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

