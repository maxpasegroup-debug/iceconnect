"use client";

import { useEffect, useState, useCallback } from "react";

interface DreamItem {
  _id: string;
  title: string;
  description?: string;
  targetAmount: number;
  targetDate: string;
  why?: string;
  monthlyIncomeRequired: number;
  status: "on-track" | "at-risk" | "achieved";
}

interface GrowthData {
  currentMonthlyCommission: number;
  currentMonthlyVolume: number;
}

export default function DreamBookPage() {
  const [dreams, setDreams] = useState<DreamItem[]>([]);
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    targetAmount: "",
    targetDate: "",
    why: "",
    description: "",
  });

  const fetchDreams = useCallback(async () => {
    try {
      const res = await fetch("/api/dreams", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDreams(Array.isArray(data) ? data : []);
      }
    } catch {
      setDreams([]);
    }
  }, []);

  const fetchGrowth = useCallback(async () => {
    try {
      const res = await fetch("/api/growth", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const rs = data?.rankStatus;
        if (rs) {
          setGrowth({
            currentMonthlyCommission: rs.currentMonthlyCommission ?? 0,
            currentMonthlyVolume: rs.currentMonthlyVolume ?? 0,
          });
        }
      }
    } catch {
      setGrowth(null);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchDreams(), fetchGrowth()]);
      setLoading(false);
    };
    load();
  }, [fetchDreams, fetchGrowth]);

  function getLiveStatus(dream: DreamItem): "on-track" | "at-risk" | "achieved" {
    if (dream.status === "achieved") return "achieved";
    if (growth === null) return dream.status;
    return growth.currentMonthlyCommission >= dream.monthlyIncomeRequired ? "on-track" : "at-risk";
  }

  function getGapToOnTrack(monthlyIncomeRequired: number): number {
    if (growth === null) return 0;
    const gap = monthlyIncomeRequired - growth.currentMonthlyCommission;
    return Math.max(0, Math.round(gap));
  }

  const handleOpenModal = () => {
    setError(null);
    setForm({ title: "", targetAmount: "", targetDate: "", why: "", description: "" });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(form.targetAmount);
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Target amount must be a positive number");
      return;
    }
    const targetDate = form.targetDate ? new Date(form.targetDate) : null;
    if (!targetDate || Number.isNaN(targetDate.getTime())) {
      setError("Target date is required");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          targetAmount: amount,
          targetDate: targetDate.toISOString(),
          why: form.why.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        handleCloseModal();
        await fetchDreams();
      } else {
        setError(data.message || "Failed to save dream");
      }
    } catch {
      setError("Failed to save dream");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch("/api/dreams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchDreams();
      }
    } catch {
      // silent fail or could set a toast
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <p className="text-gray-500 text-lg">Loading your dreams...</p>
      </div>
    );
  }

  return (
    <div data-testid="dream-book-page" className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Dream Book</h1>
          <p className="text-gray-500 mt-2">Turn your vision into measurable success.</p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl font-semibold shadow-md hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all"
        >
          + Add Dream
        </button>
      </div>

      {/* Empty state */}
      {dreams.length === 0 && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-12 text-center shadow-sm">
          <p className="text-xl font-semibold text-gray-700">Your future begins with a decision.</p>
          <p className="text-gray-500 mt-2 mb-6">Add your first dream to get started.</p>
          <button
            type="button"
            onClick={handleOpenModal}
            className="bg-green-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-700 transition"
          >
            Add your first dream
          </button>
        </div>
      )}

      {/* Dream cards grid */}
      {dreams.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dreams.map((dream) => {
            const liveStatus = getLiveStatus(dream);
            const gap = getGapToOnTrack(dream.monthlyIncomeRequired);
            return (
            <div
              key={dream._id}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 p-6 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-4">
                <h3 className="text-xl font-bold text-gray-800">{dream.title}</h3>
                <span
                  className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${
                    liveStatus === "on-track"
                      ? "bg-green-100 text-green-700"
                      : liveStatus === "at-risk"
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {liveStatus === "on-track" ? "On track" : liveStatus === "at-risk" ? "At risk" : "Achieved"}
                </span>
              </div>
              <p className="text-2xl font-bold text-green-600 mb-1">
                ₹{dream.targetAmount.toLocaleString("en-IN")}
              </p>
              <p className="text-sm text-gray-500 mb-4">Target by {formatDate(dream.targetDate)}</p>
              <div className="bg-green-50 rounded-xl p-3 mb-4">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Monthly income required</p>
                <p className="text-lg font-bold text-green-700">
                  ₹{Math.round(dream.monthlyIncomeRequired).toLocaleString("en-IN")}
                </p>
              </div>
              {liveStatus === "at-risk" && gap > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                  <p className="text-sm text-red-800">
                    At your current performance, this dream timeline is at risk.
                    Increase your monthly commission by ₹{gap.toLocaleString("en-IN")} to stay on track.
                  </p>
                </div>
              )}
              {dream.why && (
                <div className="mb-4 flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Why</p>
                  <p className="text-gray-600 text-sm">{dream.why}</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => handleDelete(dream._id)}
                className="mt-auto text-red-600 text-sm font-medium hover:text-red-700 hover:underline"
              >
                Delete
              </button>
            </div>
            );
          })}
        </div>
      )}

      {/* Add Dream Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Add Dream</h2>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="dream-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  id="dream-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g. Own a home"
                />
              </div>
              <div>
                <label htmlFor="dream-amount" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Amount (₹)
                </label>
                <input
                  id="dream-amount"
                  type="number"
                  min={1}
                  value={form.targetAmount}
                  onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g. 5000000"
                />
              </div>
              <div>
                <label htmlFor="dream-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Target Date
                </label>
                <input
                  id="dream-date"
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label htmlFor="dream-why" className="block text-sm font-medium text-gray-700 mb-1">
                  Why
                </label>
                <textarea
                  id="dream-why"
                  rows={3}
                  value={form.why}
                  onChange={(e) => setForm((f) => ({ ...f, why: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Why does this matter to you?"
                />
              </div>
              <div>
                <label htmlFor="dream-desc" className="block text-sm font-medium text-gray-700 mb-1">
                  Description (optional)
                </label>
                <textarea
                  id="dream-desc"
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Brief description"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Dream"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
