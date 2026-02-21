"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";

interface FunnelData {
  headline: string;
  subheadline: string;
  ctaText: string;
}

export default function FunnelLandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [thankYouMessage, setThankYouMessage] = useState("");
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });

  useEffect(() => {
    const fetchFunnel = async () => {
      try {
        const res = await fetch(`/api/funnel/${slug}`);
        if (res.ok) {
          const data = await res.json();
          setFunnel(data);
        } else {
          setError("Page not found");
        }
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchFunnel();
    }
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      alert("Please enter your name and phone number");
      return;
    }

    if (formData.phone.length !== 10) {
      alert("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      const utmSource = searchParams.get("utm_source") || "";
      const utmMedium = searchParams.get("utm_medium") || "";
      const utmCampaign = searchParams.get("utm_campaign") || "";

      const res = await fetch(`/api/funnel/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          utmSource,
          utmMedium,
          utmCampaign,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setThankYouMessage(data.message);
        setSubmitted(true);
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Failed to submit. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-400 mb-4">404</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-green-600 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-green-600 mb-4">Thank You!</h1>
          <p className="text-gray-600">{thankYouMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-3">{funnel?.headline}</h1>
          <p className="text-gray-600">{funnel?.subheadline}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Your Name *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border-2 border-gray-200 p-4 rounded-xl focus:border-green-500 focus:outline-none transition"
              data-testid="funnel-name-input"
            />
          </div>

          <div>
            <input
              type="tel"
              placeholder="Phone Number * (10 digits)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              className="w-full border-2 border-gray-200 p-4 rounded-xl focus:border-green-500 focus:outline-none transition"
              data-testid="funnel-phone-input"
            />
          </div>

          <div>
            <input
              type="email"
              placeholder="Email (optional)"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border-2 border-gray-200 p-4 rounded-xl focus:border-green-500 focus:outline-none transition"
              data-testid="funnel-email-input"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-xl text-lg hover:from-green-600 hover:to-green-700 transition shadow-lg"
            data-testid="funnel-submit-btn"
          >
            {funnel?.ctaText || "Get Started"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          By submitting, you agree to be contacted about our products and services.
        </p>
      </div>
    </div>
  );
}
