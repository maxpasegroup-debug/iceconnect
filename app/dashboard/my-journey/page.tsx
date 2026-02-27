"use client";

import { useEffect, useState, useCallback } from "react";

interface GrowthData {
  rankStatus: {
    currentMonthlyVolume: number;
    currentLevelPercent: number;
    lifetimeVolume: number;
  };
}

interface JourneyData {
  currentRank: string;
  nextRank: string;
  monthlyPV: number;
  activeTeamMembers: number;
  monthlyNewMembers: number;
}

function getDaysLeftInMonth(): number {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, last.getDate() - now.getDate());
}

function getMotivationalLine(currentVolume: number, levelPercent: number): string {
  if (currentVolume >= 200) {
    return "You've hit 50% level. Keep building your legacy!";
  }
  if (currentVolume >= 100) {
    const away = 200 - currentVolume;
    return `You are ${away} volume away from 50% level. Push this week!`;
  }
  const away = 100 - currentVolume;
  if (away <= 0) return "You've reached 42% level. Aim for 200 next!";
  return `You are ${away} volume away from next level. Push this week!`;
}

const TIMELINE_STEPS = [
  { id: "joined", label: "Joined" },
  { id: "first100", label: "First 100 Volume" },
  { id: "first42", label: "First 42%" },
  { id: "first50", label: "First 50%" },
  { id: "junior", label: "Junior Partner" },
];

export default function MyJourneyPage() {
  const [growth, setGrowth] = useState<GrowthData | null>(null);
  const [journey, setJourney] = useState<JourneyData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchGrowth = useCallback(async () => {
    try {
      const res = await fetch("/api/growth", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setGrowth(data);
      }
    } catch {
      setGrowth(null);
    }
  }, []);

  const fetchJourney = useCallback(async () => {
    try {
      const res = await fetch("/api/journey", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setJourney(data.journey);
      }
    } catch {
      setJourney(null);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchGrowth(), fetchJourney()]);
      setLoading(false);
    };
    load();
  }, [fetchGrowth, fetchJourney]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-xl text-gray-500">Loading your journey...</div>
      </div>
    );
  }

  const currentVolume = growth?.rankStatus?.currentMonthlyVolume ?? 0;
  const levelPercent = growth?.rankStatus?.currentLevelPercent ?? 35;
  const lifetimeVolume = growth?.rankStatus?.lifetimeVolume ?? 0;
  const progressToNext = levelPercent === 50 ? 100 : levelPercent === 42 ? (currentVolume / 200) * 100 : (currentVolume / 100) * 100;
  const daysLeft = getDaysLeftInMonth();
  const motivationalLine = getMotivationalLine(currentVolume, levelPercent);

  const completedSteps = [
    true,
    currentVolume >= 100 || lifetimeVolume >= 100,
    levelPercent >= 42,
    levelPercent >= 50,
    levelPercent >= 50 && currentVolume >= 200,
  ];

  const snapshotCards = [
    { icon: "📊", label: "Monthly Volume", value: currentVolume, sub: "This month" },
    { icon: "🏆", label: "Lifetime Volume", value: lifetimeVolume, sub: "All time" },
    { icon: "👥", label: "Active Team", value: journey?.activeTeamMembers ?? 0, sub: "Members" },
    { icon: "✨", label: "New Members", value: journey?.monthlyNewMembers ?? 0, sub: "This month" },
  ];

  return (
    <div data-testid="journey-page" className="space-y-8 pb-10">
      {/* Hero Card */}
      <div className="bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 p-8 rounded-2xl shadow-xl text-white">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">Your Success OS</h1>
        <p className="text-green-100 text-lg mb-8">Track progress. Hit milestones. Grow.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div>
            <p className="text-green-200 text-sm font-medium">Current Rank</p>
            <p className="text-2xl font-bold mt-1" data-testid="current-rank">
              {journey?.currentRank || "Builder"}
            </p>
          </div>
          <div>
            <p className="text-green-200 text-sm font-medium">Next Rank</p>
            <p className="text-2xl font-bold mt-1" data-testid="next-rank">
              {journey?.nextRank || "Senior Builder"}
            </p>
          </div>
          <div>
            <p className="text-green-200 text-sm font-medium">Current Monthly Volume</p>
            <p className="text-2xl font-bold mt-1">{currentVolume}</p>
          </div>
          <div>
            <p className="text-green-200 text-sm font-medium">Current Level %</p>
            <p className="text-2xl font-bold mt-1">{levelPercent}%</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Progress to next rank</span>
            <span className="font-bold">{Math.min(progressToNext, 100).toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${Math.min(progressToNext, 100)}%` }}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-green-100 text-sm">
            <span className="font-semibold text-white">{daysLeft}</span> days left in month
          </p>
          <p className="text-white/95 font-medium text-sm md:text-base">{motivationalLine}</p>
        </div>
      </div>

      {/* Performance Snapshot Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Performance Snapshot</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {snapshotCards.map((card) => (
            <div
              key={card.label}
              className="bg-white p-6 rounded-2xl shadow-md hover:shadow-lg transition-shadow border border-gray-100"
            >
              <span className="text-3xl" role="img" aria-hidden>{card.icon}</span>
              <p className="text-3xl font-bold text-gray-800 mt-3">{card.value}</p>
              <p className="text-gray-600 font-medium mt-1">{card.label}</p>
              <p className="text-gray-400 text-sm mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dream Book Summary */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-3">Dream Book</h2>
        <p className="text-gray-600 mb-6 max-w-2xl">
          Define your life goals and align your business to achieve them.
        </p>
        <button
          type="button"
          className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
        >
          Create / View Dream Book
        </button>
      </div>

      {/* Action Alignment Panel */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Your Growth Path</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-500 text-sm font-medium">Dream Income Required</p>
            <p className="text-xl font-bold text-gray-800 mt-1">₹50,000 / mo</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-500 text-sm font-medium">Volume Required</p>
            <p className="text-xl font-bold text-gray-800 mt-1">200+</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-500 text-sm font-medium">Team Required</p>
            <p className="text-xl font-bold text-gray-800 mt-1">10 active</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-gray-500 text-sm font-medium">Daily Actions Required</p>
            <p className="text-xl font-bold text-gray-800 mt-1">5 touches</p>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">Progress Timeline</h2>
        <div className="relative">
          {TIMELINE_STEPS.map((step, index) => (
            <div key={step.id} className="flex gap-6">
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={`w-4 h-4 rounded-full ${
                    completedSteps[index] ? "bg-green-500" : "bg-gray-300"
                  }`}
                />
                {index < TIMELINE_STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-12 ${
                      completedSteps[index] ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
              <div className={index < TIMELINE_STEPS.length - 1 ? "pb-2" : ""}>
                <p
                  className={`font-semibold ${
                    completedSteps[index] ? "text-green-700" : "text-gray-500"
                  }`}
                >
                  {step.label}
                </p>
                {completedSteps[index] && (
                  <p className="text-green-600 text-sm mt-0.5">Completed</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
