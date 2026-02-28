"use client";

import { useEffect, useState, useCallback } from "react";
import { jsPDF } from "jspdf";

interface RankStatus {
  lifetimeVolume: number;
  lifetimeCommission: number;
  currentMonthlyVolume: number;
  currentMonthlyCommission: number;
  currentLevelPercent: number;
  currentMonth: string;
}

interface GrowthResponse {
  rankStatus?: RankStatus;
}

interface DreamAnchor {
  _id: string;
  userId: string;
  category: string;
  title: string;
  cost: number;
  targetDate: string;
  timelineMonths: number;
  monthlyRequired: number;
  volumeRequired: number;
  why: string;
  imageUrl?: string;
  createdAt: string;
}

interface AchievementItem {
  _id: string;
  levelName: string;
  volumeAtUnlock: number;
  unlockedAt: string;
}

const DREAM_CATEGORIES = [
  "Car",
  "Home",
  "Travel",
  "Financial Freedom",
  "Education",
  "Custom",
] as const;

const COMMISSION_PER_SHAKE = 80;

function downloadDreamVisionPdf(dream: DreamAnchor) {
  const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  const title = "My Dream Vision";
  const titleW = doc.getTextWidth(title);
  doc.text(title, (pageW - titleW) / 2, y);
  y += 10;

  doc.setDrawColor(34, 197, 94);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 12;

  if (dream.imageUrl && dream.imageUrl.startsWith("data:image")) {
    const imgW = contentW;
    const imgH = Math.min(50, imgW * 0.6);
    const format = dream.imageUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
    try {
      doc.addImage(dream.imageUrl, format, margin, y, imgW, imgH);
      y += imgH + 10;
    } catch {
      y += 2;
    }
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const lineH = 7;
  const label = (text: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(text, margin, y);
    y += lineH;
  };
  const value = (text: string) => {
    doc.setFont("helvetica", "normal");
    const lines = doc.splitTextToSize(text, contentW);
    doc.text(lines, margin, y);
    y += lines.length * lineH + 2;
  };

  label("Dream Title");
  value(dream.title);
  label("Category");
  value(dream.category);
  label("Cost");
  value(`₹${dream.cost.toLocaleString()}`);
  label("Target Date");
  value(new Date(dream.targetDate).toLocaleDateString());
  label("Monthly Required");
  value(`₹${dream.monthlyRequired.toLocaleString()}`);
  label("Volume Required");
  value(String(dream.volumeRequired));
  label("Why");
  value(dream.why);

  doc.save("My_Dream_Vision.pdf");
}

const LEVELS = [
  { name: "Customer", required: 0, discount: "25%" },
  { name: "Associate", required: 100, discount: "35%" },
  { name: "Senior Consultant", required: 500, discount: "35%" },
  { name: "Success Builder", required: 1000, discount: "42%" },
  { name: "Qualified Producer", required: 2500, discount: "42%" },
  { name: "Supervisor", required: 4000, discount: "50%" },
];

function getCurrentLevelIndex(volume: number): number {
  let index = 0;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (volume >= LEVELS[i].required) {
      index = i;
      break;
    }
  }
  return index;
}

function getMotivationalLine(volume: number, nextName: string | null): string {
  if (!nextName) return "You're at the top. Keep building your legacy.";
  if (volume >= 3500) return "So close to Supervisor. One strong week can do it.";
  if (volume >= 2000) return "Qualified Producer is within reach. Focus on consistency.";
  if (volume >= 800) return "Success Builder is your next stop. Keep the momentum.";
  if (volume >= 300) return "Senior Consultant level is ahead. Every touch counts.";
  if (volume >= 50) return "You're on track to Associate. Keep adding value.";
  return "Start strong this month. Your first 100 volume is the foundation.";
}

const ACTION_TASKS = [
  "Add 5 new leads",
  "Follow up 3 warm prospects",
  "Close 1 trial customer",
  "Post 1 health story on WhatsApp",
  "Personal development 20 minutes",
];

export default function MyJourneyPage() {
  const [growth, setGrowth] = useState<GrowthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedActions, setCompletedActions] = useState<boolean[]>(() => ACTION_TASKS.map(() => false));
  const [showDreamModal, setShowDreamModal] = useState(false);
  const [dream, setDream] = useState<DreamAnchor | null>(null);
  const [dreamStep, setDreamStep] = useState<1 | 2 | 3>(1);
  const [dreamForm, setDreamForm] = useState({
    category: "",
    title: "",
    cost: "",
    targetDate: "",
    timelineMonths: "",
    why: "",
    imageUrl: "",
  });
  const [dreamSaving, setDreamSaving] = useState(false);
  const [achievements, setAchievements] = useState<AchievementItem[]>([]);
  const [predictorVisible, setPredictorVisible] = useState(false);
  const [showResetBanner, setShowResetBanner] = useState(false);
  const [bannerRevealed, setBannerRevealed] = useState(false);
  const [habits, setHabits] = useState({ post: false, followup: false, learning: false });

  const HABIT_ITEMS: { key: keyof typeof habits; label: string }[] = [
    { key: "post", label: "Health Post on WhatsApp" },
    { key: "followup", label: "Follow-up Block (30 mins)" },
    { key: "learning", label: "Personal Learning (20 mins)" },
  ];

  const fetchGrowth = useCallback(async () => {
    try {
      const res = await fetch("/api/growth", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGrowth(data);
      } else {
        setGrowth(null);
      }
    } catch {
      setGrowth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch("/api/daily-habit", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const h = data?.habit;
        if (h) {
          setHabits({
            post: h.post ?? false,
            followup: h.followup ?? false,
            learning: h.learning ?? false,
          });
        }
      }
    } catch {
      // keep current state on error
    }
  }, []);

  const fetchDream = useCallback(async () => {
    try {
      const res = await fetch("/api/dream", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setDream(data.dream ?? null);
      }
    } catch {
      setDream(null);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchGrowth();
    fetchHabits();
    fetchDream();
  }, [fetchGrowth, fetchHabits, fetchDream]);

  useEffect(() => {
    setPredictorVisible(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const seen = localStorage.getItem("journeyMonthSeen");
    if (seen !== monthKey) {
      localStorage.setItem("journeyMonthSeen", monthKey);
      setShowResetBanner(true);
    }
  }, []);

  useEffect(() => {
    if (!showResetBanner) return;
    const t = requestAnimationFrame(() => setBannerRevealed(true));
    return () => cancelAnimationFrame(t);
  }, [showResetBanner]);

  useEffect(() => {
    const volume = growth?.rankStatus?.currentMonthlyVolume;
    if (volume == null) return;
    const run = async () => {
      try {
        await fetch("/api/achievement", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentMonthlyVolume: volume }),
        });
        const res = await fetch("/api/achievement", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setAchievements(Array.isArray(data) ? data : []);
        }
      } catch {
        setAchievements([]);
      }
    };
    run();
  }, [growth?.rankStatus?.currentMonthlyVolume]);

  const updateHabit = useCallback(
    async (key: "post" | "followup" | "learning") => {
      const next = { ...habits, [key]: !habits[key] };
      try {
        const res = await fetch("/api/daily-habit", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
        if (res.ok) {
          const data = await res.json();
          const h = data?.habit;
          if (h) {
            setHabits({
              post: h.post ?? false,
              followup: h.followup ?? false,
              learning: h.learning ?? false,
            });
          }
        }
      } catch {
        // keep current state on error
      }
    },
    [habits]
  );

  const rank = growth?.rankStatus;
  const currentMonthlyVolume = rank?.currentMonthlyVolume ?? 0;
  const currentMonthlyCommission = rank?.currentMonthlyCommission ?? 0;
  const currentLevelPercent = rank?.currentLevelPercent ?? 0;
  const lifetimeVolume = rank?.lifetimeVolume ?? 0;

  const currentLevelIndex = getCurrentLevelIndex(currentMonthlyVolume);
  const currentLevel = LEVELS[currentLevelIndex];
  const nextLevel = currentLevelIndex < LEVELS.length - 1 ? LEVELS[currentLevelIndex + 1] : null;
  const nextRankName = nextLevel?.name ?? null;
  const nextRequiredVolume = nextLevel?.required ?? 0;
  const gapVolume = nextLevel ? Math.max(0, nextLevel.required - currentMonthlyVolume) : 0;
  const progress = nextRequiredVolume > 0
    ? Math.min((currentMonthlyVolume / nextRequiredVolume) * 100, 100)
    : 100;
  const motivationalLine = getMotivationalLine(currentMonthlyVolume, nextRankName);

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const msPerDay = 24 * 60 * 60 * 1000;
  const daysPassed = Math.max(1, Math.round((today.getTime() - startOfMonth.getTime()) / msPerDay));
  const avgDailyVolume = currentMonthlyVolume / daysPassed;
  const estimatedMonths =
    avgDailyVolume > 0 && gapVolume > 0
      ? Math.round((gapVolume / avgDailyVolume) / 30 * 10) / 10
      : null;

  const shakesNeeded = gapVolume > 0 ? Math.ceil(gapVolume / 2) : 0;
  const trialCustomersNeeded = gapVolume > 0 ? Math.ceil(gapVolume / 100) : 0;
  const pcsNeeded = gapVolume > 0 ? Math.ceil(gapVolume / 200) : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]" data-testid="journey-page">
        <p className="text-gray-500 text-lg">Loading Journey...</p>
      </div>
    );
  }

  return (
    <div data-testid="journey-page" className="space-y-8 pb-10">
      {showResetBanner && (
        <div
          className={`bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl p-5 mb-6 shadow-lg flex justify-between items-center transition-all duration-500 ${
            bannerRevealed ? "translate-y-0 opacity-100" : "-translate-y-5 opacity-0"
          }`}
        >
          <div>
            <p className="font-semibold text-lg">New Growth Cycle Started</p>
            <p className="text-white/90 text-sm mt-0.5">This month is your opportunity to rise to the next level.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowResetBanner(false)}
            className="shrink-0 p-2 rounded-xl hover:bg-white/20 transition-colors text-xl leading-none"
            aria-label="Close banner"
          >
            ×
          </button>
        </div>
      )}
      {/* Section 1 — Hero Identity Engine */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl shadow-xl text-white p-8 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-green-200 text-sm font-medium uppercase tracking-wide mb-1">Current Rank</p>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="current-rank">
              {currentLevel.name}
            </h1>
            <p className="text-green-100 text-lg mb-2">
              Next: <span data-testid="next-rank">{nextRankName ?? "—"}</span>
            </p>
            <p className="text-white font-semibold text-xl mb-1">{currentMonthlyVolume} volume this month</p>
            <p className="text-green-100">Current discount: {currentLevel.discount}</p>
          </div>
          <div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-green-100">Progress to next level</span>
                <span className="font-bold">{progress.toFixed(0)}%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <div
              className={`transition-opacity duration-500 ${predictorVisible ? "opacity-100" : "opacity-0"}`}
            >
              {!nextLevel ? (
                <p className="text-sm text-green-100 mt-3">
                  You are at the top level. Maintain your leadership.
                </p>
              ) : avgDailyVolume > 0 && gapVolume > 0 ? (
                <p className="text-sm text-green-100 mt-3">
                  At your current pace, you will reach {nextLevel.name} in approximately {estimatedMonths} months.
                </p>
              ) : (
                <p className="text-sm text-green-100 mt-3 italic">
                  Start building momentum to unlock your growth prediction.
                </p>
              )}
            </div>
            {gapVolume > 0 && (
              <div className="bg-white/20 rounded-xl p-4 mt-4 text-green-100 text-sm">
                <p className="font-medium mb-2">How to close this gap</p>
                <ul className="space-y-1">
                  <li>• Approx. {shakesNeeded} shakes</li>
                  <li>• OR {trialCustomersNeeded} trial customers</li>
                  <li>• OR {pcsNeeded} active PCs</li>
                </ul>
              </div>
            )}
            {nextRankName && gapVolume > 0 && (
              <p className="text-white font-medium mb-2">
                You are {gapVolume} volume away from {nextRankName}
              </p>
            )}
            <p className="text-green-100 text-sm">{motivationalLine}</p>
          </div>
        </div>
      </div>

      {/* Section 2 — Performance Snapshot Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6">
          <p className="text-gray-500 text-sm">Monthly Volume</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{currentMonthlyVolume}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6">
          <p className="text-gray-500 text-sm">Lifetime Volume</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{lifetimeVolume}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6">
          <p className="text-gray-500 text-sm">Monthly Commission</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{currentMonthlyCommission}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 p-6">
          <p className="text-gray-500 text-sm">Current Level %</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{currentLevelPercent}%</p>
        </div>
      </div>

      {/* Section 3 — Premium Metro Rank Engine */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Your Growth Path</h2>
        <p className="text-gray-500 text-sm mb-8">Track your progress to the next leadership level</p>

        <div className="relative pl-2">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-1 bg-green-200 rounded-full" />

          {LEVELS.map((level, index) => {
            const achieved = currentMonthlyVolume >= level.required;
            const nextLevelIndex = LEVELS.findIndex((l) => currentMonthlyVolume < l.required);
            const isNextLevel = nextLevelIndex === index;
            const gapVolume = Math.max(0, level.required - currentMonthlyVolume);

            let circleClass = "bg-gray-300";
            if (achieved) circleClass = "bg-green-600";
            else if (isNextLevel) circleClass = "bg-yellow-400 animate-pulse";

            return (
              <div key={level.name} className="flex items-start mb-10 relative last:mb-0">
                <div className="relative z-10 shrink-0 w-6 h-6 rounded-full ring-4 ring-white shadow flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full transition-all duration-300 ${circleClass}`} />
                </div>
                <div className="ml-10 w-full min-w-0">
                  <div className="bg-white rounded-2xl shadow-sm p-5 w-full hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-gray-800">{level.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">
                      Required: {level.required} volume · Discount: {level.discount}
                    </p>
                    {achieved ? (
                      <p className="text-green-600 font-medium text-sm mt-2">Level Achieved</p>
                    ) : (
                      <p className="text-amber-600 text-sm mt-2">
                        You need {gapVolume} more volume to unlock this level.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievements */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Achievements</h2>
        <div className="flex flex-wrap gap-4 mt-6">
          {achievements.length === 0 ? (
            <p className="text-gray-500 text-sm">No achievements unlocked yet.</p>
          ) : (
            achievements.map((a) => (
              <span
                key={a._id}
                className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold"
              >
                🏆 {a.levelName}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Section 4 — Action Engine */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Today&apos;s Growth Focus</h2>
        <p className="text-gray-500 text-sm mb-6">Small daily actions create big leadership levels.</p>

        {gapVolume > 0 ? (
          <>
            <ul className="divide-y divide-gray-100">
              {ACTION_TASKS.map((task, index) => {
                const done = completedActions[index];
                return (
                  <li
                    key={task}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-none hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                    onClick={() =>
                      setCompletedActions((prev) => {
                        const next = [...prev];
                        next[index] = !next[index];
                        return next;
                      })
                    }
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                        done ? "bg-green-600 border-green-600" : "border-green-600"
                      }`}
                    >
                      {done && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`flex-1 ml-4 text-left text-gray-800 ${
                        done ? "line-through text-gray-500" : ""
                      }`}
                    >
                      {task}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex justify-end">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  completedActions.every(Boolean)
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                Today&apos;s Completion: {completedActions.filter(Boolean).length} / 5
              </span>
            </div>
          </>
        ) : (
          <p className="text-green-600 font-medium py-4">
            You are ready for the next level. Maintain momentum.
          </p>
        )}
      </div>

      {/* Section 5 — Dream Anchor Engine */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Your Dream</h2>
        <p className="text-gray-500 text-sm mb-6">Your business grows only when your dream is clear.</p>

        {dream === null ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 shadow-sm mt-10 text-center">
            <span className="text-5xl" role="img" aria-hidden>🌟</span>
            <h3 className="text-xl font-bold text-gray-800 mt-4">Create Your Dream Book</h3>
            <p className="text-gray-600 text-sm mt-2 max-w-md mx-auto">
              Define your dream clearly and connect it to your business growth.
            </p>
            <button
              type="button"
              onClick={() => setShowDreamModal(true)}
              className="mt-6 bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-all"
            >
              Create Dream
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mt-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl bg-gray-100 aspect-video overflow-hidden">
                {dream.imageUrl ? (
                  <img src={dream.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{dream.title}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Target: {new Date(dream.targetDate).toLocaleDateString()}
                </p>
                <p className="text-gray-500 text-sm">Monthly required: ₹{dream.monthlyRequired.toLocaleString()}</p>
                <p className="text-gray-500 text-sm">Volume required: {dream.volumeRequired}</p>
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-700">0%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full transition-all duration-300" style={{ width: "0%" }} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => downloadDreamVisionPdf(dream)}
                  className="mt-4 w-full sm:w-auto bg-green-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-all text-sm"
                >
                  Download Vision PDF
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dream wizard modal */}
      {showDreamModal ? (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 transition-opacity">
          <div className="bg-white w-full sm:max-w-lg min-h-[85vh] sm:min-h-0 sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-lg flex flex-col transition-all">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-sm font-medium text-gray-500">
                Step {dreamStep} / 3
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowDreamModal(false);
                  setDreamStep(1);
                  setDreamForm({ category: "", title: "", cost: "", targetDate: "", timelineMonths: "", why: "", imageUrl: "" });
                }}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-600 transition-colors"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-6 flex-1">
              {dreamStep === 1 ? (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Choose category</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {DREAM_CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setDreamForm((f) => ({ ...f, category: cat }))}
                        className={`p-4 rounded-2xl border-2 text-left font-medium transition-all ${
                          dreamForm.category === cat
                            ? "border-green-600 bg-green-50 text-green-800"
                            : "border-gray-200 hover:border-green-300 text-gray-700"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="button"
                      disabled={!dreamForm.category}
                      onClick={() => setDreamStep(2)}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : dreamStep === 2 ? (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Define your dream</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        value={dreamForm.title}
                        onChange={(e) => setDreamForm((f) => ({ ...f, title: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="e.g. New car"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Estimated cost (₹)</label>
                      <input
                        type="number"
                        min={1}
                        value={dreamForm.cost}
                        onChange={(e) => setDreamForm((f) => ({ ...f, cost: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="e.g. 500000"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target date</label>
                      <input
                        type="date"
                        value={dreamForm.targetDate}
                        onChange={(e) => setDreamForm((f) => ({ ...f, targetDate: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Timeline (months)</label>
                      <input
                        type="number"
                        min={1}
                        value={dreamForm.timelineMonths}
                        onChange={(e) => setDreamForm((f) => ({ ...f, timelineMonths: e.target.value }))}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                        placeholder="e.g. 24"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Why is this important?</label>
                      <textarea
                        value={dreamForm.why}
                        onChange={(e) => setDreamForm((f) => ({ ...f, why: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                        placeholder="Your motivation..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dream image (optional)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = () => {
                            const result = reader.result;
                            if (typeof result === "string") {
                              setDreamForm((f) => ({ ...f, imageUrl: result }));
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                        className="w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-green-50 file:text-green-700 file:font-medium hover:file:bg-green-100 transition-all"
                      />
                      {dreamForm.imageUrl ? (
                        <p className="mt-1 text-xs text-green-600">Image selected</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setDreamStep(1)}
                      className="px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={
                        !dreamForm.title.trim() ||
                        !dreamForm.cost ||
                        Number(dreamForm.cost) <= 0 ||
                        !dreamForm.targetDate ||
                        !dreamForm.timelineMonths ||
                        Number(dreamForm.timelineMonths) <= 0 ||
                        !dreamForm.why.trim()
                      }
                      onClick={() => setDreamStep(3)}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 disabled:pointer-events-none transition-all"
                    >
                      Next
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Preview</h3>
                  {(() => {
                    const costNum = Number(dreamForm.cost) || 0;
                    const monthsNum = Number(dreamForm.timelineMonths) || 1;
                    const monthlyRequired = costNum / monthsNum;
                    const volumeRequired = Math.ceil(monthlyRequired / COMMISSION_PER_SHAKE);
                    return (
                      <div className="space-y-3 rounded-2xl bg-gray-50 p-4">
                        {dreamForm.imageUrl ? (
                          <div className="rounded-xl overflow-hidden bg-gray-200 aspect-video max-h-40 w-full">
                            <img src={dreamForm.imageUrl} alt="" className="w-full h-full object-contain" />
                          </div>
                        ) : null}
                        <p className="font-medium text-gray-800">{dreamForm.title}</p>
                        <p className="text-sm text-gray-600">Cost: ₹{costNum.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Monthly required: ₹{monthlyRequired.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Volume required: {volumeRequired}</p>
                        <p className="text-sm text-gray-600">
                          Target date: {dreamForm.targetDate ? new Date(dreamForm.targetDate).toLocaleDateString() : "—"}
                        </p>
                      </div>
                    );
                  })()}
                  <div className="mt-6 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setDreamStep(2)}
                      className="px-6 py-3 rounded-xl font-semibold text-gray-700 hover:bg-gray-100 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={dreamSaving}
                      onClick={async () => {
                        const costNum = Number(dreamForm.cost) || 0;
                        const monthsNum = Number(dreamForm.timelineMonths) || 1;
                        if (costNum <= 0 || monthsNum <= 0) return;
                        setDreamSaving(true);
                        try {
                          const res = await fetch("/api/dream", {
                            method: "POST",
                            credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              category: dreamForm.category,
                              title: dreamForm.title.trim(),
                              cost: costNum,
                              targetDate: dreamForm.targetDate,
                              timelineMonths: monthsNum,
                              why: dreamForm.why.trim(),
                              ...(dreamForm.imageUrl.trim() ? { imageUrl: dreamForm.imageUrl.trim() } : {}),
                            }),
                          });
                          if (res.ok) {
                            setShowDreamModal(false);
                            setDreamStep(1);
                            setDreamForm({ category: "", title: "", cost: "", targetDate: "", timelineMonths: "", why: "", imageUrl: "" });
                            await fetchDream();
                          }
                        } finally {
                          setDreamSaving(false);
                        }
                      }}
                      className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                      {dreamSaving ? "Saving…" : "Save Dream"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* Section 6 — Habit Streak Engine */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">Daily Success Habits</h2>
        <p className="text-gray-500 text-sm mb-6">Consistency builds leadership.</p>

        <div className="bg-white rounded-2xl shadow-sm p-6 mt-10">
          <ul>
            {HABIT_ITEMS.map(({ key, label }) => {
              const done = habits[key];
              return (
                <li
                  key={key}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-none hover:bg-gray-50 transition-all duration-200 cursor-pointer"
                  onClick={() => updateHabit(key)}
                >
                  <div
                    className={`w-6 h-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
                      done ? "bg-green-600 border-green-600 text-white" : "border-green-600"
                    }`}
                  >
                    {done && (
                      <span className="text-sm font-bold">✓</span>
                    )}
                  </div>
                  <span className="flex-1 ml-4 text-left text-gray-800">{label}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex justify-end">
            {(() => {
              const completedCount = [habits.post, habits.followup, habits.learning].filter(Boolean).length;
              const isPerfect = completedCount === 3;
              return (
                <span
                  className={`rounded-full px-4 py-1 text-sm font-semibold ${
                    isPerfect ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isPerfect ? "Perfect Day 🔥" : `${completedCount} / 3 Completed`}
                </span>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
