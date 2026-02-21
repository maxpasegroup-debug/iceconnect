"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
}

interface OnboardingData {
  onboardingFeePaid: boolean;
  onboardingCompleted: boolean;
  onboardingStatus: string;
  steps: OnboardingStep[];
}

export default function OnboardingPage() {
  const router = useRouter();
  const [data, setData] = useState<OnboardingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const fetchOnboarding = async () => {
    try {
      const res = await fetch("/api/onboarding", { credentials: "include" });
      if (res.ok) {
        const onboardingData = await res.json();
        setData(onboardingData);
        
        // Load completed steps from localStorage
        const saved = localStorage.getItem("onboarding_completed_steps");
        if (saved) {
          setCompletedSteps(JSON.parse(saved));
        }
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOnboarding();
  }, []);

  const toggleStep = (stepId: string) => {
    let updated: string[];
    if (completedSteps.includes(stepId)) {
      updated = completedSteps.filter((s) => s !== stepId);
    } else {
      updated = [...completedSteps, stepId];
    }
    setCompletedSteps(updated);
    localStorage.setItem("onboarding_completed_steps", JSON.stringify(updated));
  };

  const handleCompleteOnboarding = async () => {
    if (completedSteps.length < (data?.steps?.length || 0)) {
      alert("Please complete all steps first!");
      return;
    }

    const res = await fetch("/api/onboarding", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "completed", completed: true }),
    });

    if (res.ok) {
      alert("🎉 Congratulations! Onboarding completed!");
      router.push("/dashboard");
    }
  };

  const handleActivateOnboarding = async () => {
    const res = await fetch("/api/subscription", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "onboarding", paymentId: "mock_payment" }),
    });

    if (res.ok) {
      alert("Onboarding activated!");
      fetchOnboarding();
    }
  };

  const getStepLink = (stepId: string) => {
    switch (stepId) {
      case "profile": return "/dashboard/settings";
      case "social": return "/dashboard/sales-booster";
      case "funnel": return "/dashboard/sales-booster";
      case "template": return "/dashboard/sales-booster";
      case "team": return "/dashboard/my-team";
      case "customer": return "/dashboard/my-customers";
      case "lead": return "/dashboard/sales-booster";
      default: return "/dashboard";
    }
  };

  const getStepIcon = (stepId: string) => {
    switch (stepId) {
      case "profile": return "👤";
      case "social": return "🔗";
      case "funnel": return "🎯";
      case "template": return "📝";
      case "team": return "👥";
      case "customer": return "🛒";
      case "lead": return "📋";
      default: return "📌";
    }
  };

  const progress = data?.steps ? Math.round((completedSteps.length / data.steps.length) * 100) : 0;

  if (loading) return <div className="p-6">Loading...</div>;

  if (!data?.onboardingFeePaid) {
    return (
      <div data-testid="onboarding-page" className="max-w-2xl mx-auto">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-8 rounded-2xl text-white text-center">
          <h2 className="text-3xl font-bold mb-4">🚀 Onboarding Program</h2>
          <p className="text-lg opacity-90 mb-6">
            Get started with a guided setup to maximize your CRM experience
          </p>
          
          <div className="bg-white/10 p-6 rounded-xl mb-6">
            <h3 className="text-xl font-semibold mb-4">What&apos;s Included:</h3>
            <ul className="text-left space-y-2">
              <li>✓ Step-by-step CRM setup guide</li>
              <li>✓ Profile optimization tips</li>
              <li>✓ Social media integration walkthrough</li>
              <li>✓ Funnel page customization</li>
              <li>✓ DM template creation guide</li>
              <li>✓ Team & customer management basics</li>
              <li>✓ Lead generation strategies</li>
            </ul>
          </div>

          <div className="text-4xl font-bold mb-2">₹3,000</div>
          <p className="text-sm opacity-80 mb-6">One-time payment</p>

          <button
            onClick={handleActivateOnboarding}
            className="bg-white text-purple-600 font-bold px-8 py-4 rounded-xl text-lg hover:bg-gray-100 transition"
            data-testid="activate-onboarding-btn"
          >
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  if (data.onboardingCompleted) {
    return (
      <div data-testid="onboarding-page" className="max-w-2xl mx-auto text-center">
        <div className="bg-green-50 p-8 rounded-2xl border-2 border-green-200">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-3xl font-bold text-green-700 mb-4">Onboarding Completed!</h2>
          <p className="text-gray-600 mb-6">
            You&apos;ve successfully completed all onboarding steps. Your CRM is now fully configured!
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="onboarding-page">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-2">🚀 Onboarding Checklist</h2>
        <p className="text-gray-600 mb-6">Complete these steps to set up your CRM for success</p>

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded-2xl shadow mb-8">
          <div className="flex justify-between mb-2">
            <span className="font-semibold">Overall Progress</span>
            <span className="text-green-600 font-bold">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4">
            <div
              className="bg-gradient-to-r from-green-500 to-green-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {completedSteps.length} of {data?.steps?.length || 0} steps completed
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {data?.steps?.map((step, index) => {
            const isCompleted = completedSteps.includes(step.id);
            return (
              <div
                key={step.id}
                className={`bg-white p-4 rounded-xl shadow border-l-4 transition ${
                  isCompleted ? "border-green-500 bg-green-50" : "border-gray-200"
                }`}
                data-testid={`onboarding-step-${step.id}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        isCompleted ? "bg-green-500 text-white" : "bg-gray-100"
                      }`}
                    >
                      {isCompleted ? "✓" : getStepIcon(step.id)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Step {index + 1}</span>
                        {isCompleted && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Done</span>}
                      </div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={getStepLink(step.id)}
                      className="text-blue-600 text-sm hover:underline"
                    >
                      Go →
                    </a>
                    <button
                      onClick={() => toggleStep(step.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                        isCompleted
                          ? "bg-gray-200 text-gray-600 hover:bg-gray-300"
                          : "bg-green-600 text-white hover:bg-green-700"
                      }`}
                    >
                      {isCompleted ? "Undo" : "Mark Done"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Complete Button */}
        <div className="text-center">
          <button
            onClick={handleCompleteOnboarding}
            disabled={completedSteps.length < (data?.steps?.length || 0)}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition ${
              completedSteps.length >= (data?.steps?.length || 0)
                ? "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
            data-testid="complete-onboarding-btn"
          >
            {completedSteps.length >= (data?.steps?.length || 0)
              ? "🎉 Complete Onboarding"
              : `Complete ${(data?.steps?.length || 0) - completedSteps.length} more steps`}
          </button>
        </div>
      </div>
    </div>
  );
}
