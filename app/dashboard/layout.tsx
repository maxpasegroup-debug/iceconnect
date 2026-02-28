"use client";

import { ReactNode, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

interface User {
  name: string;
  phone: string;
  email?: string;
  role?: string;
  digitalLabActive?: boolean;
  digitalLabExpiry?: string;
  generateLeadsSubscription?: {
    active: boolean;
    startDate: string;
    expiryDate: string;
    autopayEnabled: boolean;
  };
}

const NAV_ITEMS: { href: string; label: string; icon: string }[] = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/my-journey", label: "My Journey", icon: "🗺️" },
  { href: "/dashboard/my-team", label: "My Team", icon: "👥" },
  { href: "/dashboard/my-customers", label: "My Customers", icon: "🤝" },
  { href: "/dashboard/my-club", label: "My Club", icon: "🏆" },
  { href: "/dashboard/my-organization", label: "My Organization", icon: "🏢" },
  { href: "/dashboard/growth", label: "Growth", icon: "📈" },
  { href: "/dashboard/sales-booster", label: "Sales Booster", icon: "🚀" },
  { href: "/dashboard/dream-book", label: "Dream Book", icon: "📖" },
  { href: "/dashboard/habit", label: "Habit", icon: "✅" },
  { href: "/dashboard/reports", label: "Reports", icon: "📋" },
  { href: "/dashboard/network", label: "Network", icon: "🌐" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

const NOTIFICATIONS = [
  { id: 1, title: "Welcome to ICECONNECT!", time: "Just now", read: false },
  { id: 2, title: "Complete your profile setup", time: "1 hour ago", read: false },
  { id: 3, title: "Explore Sales Booster features", time: "Today", read: true },
];

function getPageTitle(pathname: string): string {
  const item = NAV_ITEMS.find((n) => n.href === pathname);
  return item ? item.label : "Dashboard";
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);

  const [chatMessages, setChatMessages] = useState<{ type: "bot" | "user"; text: string }[]>([
    { type: "bot", text: "Hi! How can I help you today?" },
  ]);

  const [mobileBannerDismissed, setMobileBannerDismissed] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("mobileBannerDismissed");
    if (dismissed) setMobileBannerDismissed(true);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/session", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // silent
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    router.push("/");
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRemainingDays = (expiryDate: string | undefined) => {
    if (!expiryDate) return 0;
    const expiry = new Date(expiryDate);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) > 0
      ? Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      : 0;
  };

  const handleQuickButton = (question: string) => {
    setChatMessages((prev) => [...prev, { type: "user", text: question }]);
    setTimeout(() => {
      let response = "";
      switch (question) {
        case "How to activate Generate Leads?":
          response =
            "To activate Generate Leads subscription:\n\n1. Go to Sales Booster → Boost Digitally\n2. Click on \"Upgrade Now\" button\n3. Complete the payment of ₹999/month\n4. Your subscription will be activated instantly!";
          break;
        case "How to add a lead?":
          response =
            "To add a new lead:\n\n1. Go to Sales Booster from the sidebar\n2. Click \"Add Lead\" button (top-right)\n3. Fill in the lead details\n4. Click Save\n\nYour lead will appear in the list!";
          break;
        case "Subscription help":
          response =
            "Subscription Plans:\n\n• Generate Leads: ₹999/month\n• Onboarding: ₹3,000 (one-time)\n• Marketing Support: ₹4,999/month\n\nContact support for billing issues.";
          break;
        case "Technical issue":
          response = "For faster support, please contact our technical team directly:";
          break;
        default:
          response = "I can help you with that. Please select an option or contact support.";
      }
      setChatMessages((prev) => [...prev, { type: "bot", text: response }]);
    }, 500);
  };

  const closeMobileSidebar = () => setSidebarOpen(false);

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile overlay */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden ${
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeMobileSidebar}
        onKeyDown={(e) => e.key === "Escape" && closeMobileSidebar()}
      />

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen flex flex-col bg-white border-r border-gray-200 shadow-lg transition-[width,transform] duration-300 ease-out w-[260px] ${
          sidebarCollapsed ? "md:w-[70px]" : "md:w-[260px]"
        } ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Top: Logo / App name */}
        <div className="flex items-center justify-between shrink-0 p-4 border-b border-gray-100">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden" onClick={closeMobileSidebar}>
            <span className="text-xl shrink-0">📱</span>
            {!sidebarCollapsed && (
              <span className="font-bold text-gray-800 truncate">ICECONNECT</span>
            )}
          </Link>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? "▶" : "◀"}
            </button>
          </div>
        </div>

        {/* Middle: Nav links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link href={href} key={href} onClick={closeMobileSidebar}>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                  pathname === href
                    ? "bg-green-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="text-lg shrink-0" aria-hidden>{icon}</span>
                {!sidebarCollapsed && <span className="truncate font-medium">{label}</span>}
              </div>
            </Link>
          ))}
        </nav>

        {/* Bottom: Notifications, Profile, Logout + Help */}
        <div className="shrink-0 p-3 border-t border-gray-100 space-y-1">
          <button
            type="button"
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="relative shrink-0">
              🔔
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </span>
            {!sidebarCollapsed && <span className="truncate">Notifications</span>}
          </button>
          <button
            type="button"
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition"
          >
            <span className="shrink-0">👤</span>
            {!sidebarCollapsed && <span className="truncate">Profile</span>}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition"
          >
            <span className="shrink-0">🚪</span>
            {!sidebarCollapsed && <span className="truncate">Logout</span>}
          </button>
          <button
            type="button"
            onClick={() => setShowSupportChat(true)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-gray-700 hover:bg-gray-100 transition mt-2"
            data-testid="help-btn"
          >
            <span className="shrink-0">❓</span>
            {!sidebarCollapsed && <span className="truncate">Help</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 py-3 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition"
              aria-label="Open menu"
            >
              <span className="text-xl">☰</span>
            </button>
            <h1 className="text-lg font-semibold text-gray-800 truncate">
              {getPageTitle(pathname)}
            </h1>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Notification panel (fixed, when opened from sidebar) */}
      {showNotificationPanel && (
        <div className="fixed top-16 right-4 z-50 w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            <button
              type="button"
              onClick={() => setShowNotificationPanel(false)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {NOTIFICATIONS.map((n) => (
              <div
                key={n.id}
                className={`p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 ${
                  !n.read ? "bg-green-50/50" : ""
                }`}
              >
                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-500 mt-1">{n.time}</p>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-gray-100 text-center">
            <button type="button" className="text-green-600 text-sm font-medium hover:underline">
              Mark all as read
            </button>
          </div>
        </div>
      )}

      {/* Mobile banner */}
      {!mobileBannerDismissed && (
        <div
          className="fixed bottom-4 right-4 z-40 max-w-sm md:hidden bg-white rounded-xl shadow-lg border border-gray-200 p-4 flex items-center gap-3"
          data-testid="mobile-banner"
        >
          <span className="text-2xl">📱</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 text-sm">ICECONNECT Mobile</p>
            <p className="text-xs text-gray-500">Add to Home Screen for app-like experience</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowMobileModal(true)}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition"
              data-testid="mobile-banner-setup-btn"
            >
              Setup
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileBannerDismissed(true);
                localStorage.setItem("mobileBannerDismissed", "true");
              }}
              className="text-xs text-gray-400 hover:text-gray-600"
              data-testid="mobile-banner-dismiss-btn"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Profile modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">👤</span>
                  Account Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-800">{user?.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-gray-800">{user?.phone ?? "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Role</span>
                    <span className="font-medium text-gray-800 capitalize">{user?.role ?? "Member"}</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">💳</span>
                  Subscription
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  {user?.digitalLabActive ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          ACTIVE
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Plan</span>
                        <span className="font-medium text-gray-800">Generate Leads – ₹999/month</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Remaining Days</span>
                        <span className="font-medium text-green-600">{getRemainingDays(user?.digitalLabExpiry)} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Expiry Date</span>
                        <span className="font-medium text-gray-800">
                          {user?.digitalLabExpiry ? new Date(user.digitalLabExpiry).toLocaleDateString() : "—"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">
                        INACTIVE
                      </span>
                      <p className="text-gray-500 mt-3 text-sm">No active subscription</p>
                      <Link href="/dashboard/sales-booster">
                        <button type="button" className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition">
                          Activate Now
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">📱</span>
                  Mobile Experience
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                  <p className="text-gray-700 text-sm mb-3">Add ICECONNECT to your home screen for app-like usage.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileModal(false);
                      setShowMobileModal(true);
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                  >
                    View Setup Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile setup modal */}
      {showMobileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">📱 Mobile Experience Setup</h2>
              <button
                type="button"
                onClick={() => setShowMobileModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🤖</span> Android
                </h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-bold text-green-600 shrink-0">1.</span>
                    Open Chrome browser menu (⋮)
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-green-600 shrink-0">2.</span>
                    Tap &quot;Add to Home Screen&quot;
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-green-600 shrink-0">3.</span>
                    Tap &quot;Add&quot; to confirm
                  </li>
                </ol>
              </div>
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🍎</span> iOS (iPhone/iPad)
                </h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600 shrink-0">1.</span>
                    Tap the Share button (□↑)
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600 shrink-0">2.</span>
                    Scroll down and tap &quot;Add to Home Screen&quot;
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600 shrink-0">3.</span>
                    Tap &quot;Add&quot; in the top right
                  </li>
                </ol>
              </div>
              <p className="text-center text-gray-500 text-sm">
                After adding, access ICECONNECT directly from your home screen!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Support chatbot modal */}
      {showSupportChat && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-green-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">💬</div>
                <div>
                  <h2 className="font-bold">ICECONNECT Support</h2>
                  <p className="text-xs text-green-100">We&apos;re here to help</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSupportChat(false)}
                className="text-white/80 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl ${
                      msg.type === "user"
                        ? "bg-green-600 text-white rounded-br-md"
                        : "bg-white text-gray-800 shadow rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}
              {chatMessages.some((m) => m.text.includes("contact our technical team")) && (
                <div className="bg-white rounded-xl shadow p-4 space-y-3">
                  <a
                    href="https://wa.me/918089239823?text=Hi%20ICECONNECT%20Support,%20I%20need%20help%20with%20ICECONNECT"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-green-500 text-white p-3 rounded-xl hover:bg-green-600 transition"
                  >
                    <span className="text-2xl">💬</span>
                    <span className="font-medium">Chat on WhatsApp</span>
                  </a>
                  <a
                    href="tel:+918089239823"
                    className="flex items-center gap-3 bg-gray-100 text-gray-800 p-3 rounded-xl hover:bg-gray-200 transition"
                  >
                    <span className="text-2xl">📞</span>
                    <span className="font-medium">Call: +91 8089239823</span>
                  </a>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 bg-white rounded-b-2xl">
              <p className="text-xs text-gray-500 mb-3">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "How to activate Generate Leads?",
                  "How to add a lead?",
                  "Subscription help",
                  "Technical issue",
                ].map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => handleQuickButton(q)}
                    className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-xs hover:bg-green-100 hover:text-green-700 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
