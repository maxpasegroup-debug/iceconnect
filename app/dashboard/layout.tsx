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

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  
  // Dropdowns
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [showSupportChat, setShowSupportChat] = useState(false);
  
  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Chat messages
  const [chatMessages, setChatMessages] = useState<{type: 'bot' | 'user', text: string}[]>([
    { type: 'bot', text: 'Hi! How can I help you today?' }
  ]);
  
  // Mobile banner dismissed state
  const [mobileBannerDismissed, setMobileBannerDismissed] = useState(false);
  
  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem('mobileBannerDismissed');
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
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    router.push("/");
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name.split(" ").map((p) => p[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRemainingDays = (expiryDate: string | undefined) => {
    if (!expiryDate) return 0;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const diff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const handleQuickButton = (question: string) => {
    setChatMessages(prev => [...prev, { type: 'user', text: question }]);
    
    setTimeout(() => {
      let response = '';
      switch (question) {
        case 'How to activate Generate Leads?':
          response = 'To activate Generate Leads subscription:\n\n1. Go to Sales Booster → Boost Digitally\n2. Click on "Upgrade Now" button\n3. Complete the payment of ₹999/month\n4. Your subscription will be activated instantly!';
          break;
        case 'How to add a lead?':
          response = 'To add a new lead:\n\n1. Go to Sales Booster from the sidebar\n2. Click "Add Lead" button (top-right)\n3. Fill in the lead details\n4. Click Save\n\nYour lead will appear in the list!';
          break;
        case 'Subscription help':
          response = 'Subscription Plans:\n\n• Generate Leads: ₹999/month\n• Onboarding: ₹3,000 (one-time)\n• Marketing Support: ₹4,999/month\n\nContact support for billing issues.';
          break;
        case 'Technical issue':
          response = 'For faster support, please contact our technical team directly:';
          break;
        default:
          response = 'I can help you with that. Please select an option or contact support.';
      }
      setChatMessages(prev => [...prev, { type: 'bot', text: response }]);
    }, 500);
  };

  const menuItem = (href: string, label: string) => (
    <Link href={href} key={href}>
      <div
        className={`px-4 py-2 rounded-lg cursor-pointer transition ${
          pathname === href ? "bg-green-600" : "hover:bg-green-700"
        }`}
      >
        {label}
      </div>
    </Link>
  );

  // Static notifications
  const notifications = [
    { id: 1, title: "Welcome to ICECONNECT!", time: "Just now", read: false },
    { id: 2, title: "Complete your profile setup", time: "1 hour ago", read: false },
    { id: 3, title: "Explore Sales Booster features", time: "Today", read: true },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-green-600 to-green-800 text-white">

      {/* SIDEBAR */}
      <aside className="w-64 bg-green-900/80 backdrop-blur-md p-6 flex flex-col justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-10">ICECONNECT</h1>
          <nav className="space-y-3">
            {menuItem("/dashboard", "Dashboard")}
            {menuItem("/dashboard/my-journey", "My Journey")}
            {menuItem("/dashboard/my-team", "My Team")}
            {menuItem("/dashboard/my-customers", "My Customers")}
            {menuItem("/dashboard/my-club", "My Club")}
            {menuItem("/dashboard/my-organization", "My Organization")}
            {menuItem("/dashboard/sales-booster", "Sales Booster")}
            {menuItem("/dashboard/reports", "Reports")}
            {menuItem("/dashboard/settings", "Settings")}
          </nav>
        </div>

        <div>
          <button 
            onClick={() => setShowSupportChat(true)}
            className="w-full bg-yellow-400 text-black py-2 rounded-lg font-semibold hover:bg-yellow-500 transition"
            data-testid="help-btn"
          >
            Help
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-10 bg-white text-gray-800 rounded-tl-3xl relative">
        
        {/* TOP HEADER BAR */}
        <div className="absolute top-6 right-10 flex items-center space-x-4">
          
          {/* Notification Bell */}
          <div className="relative" ref={notificationRef}>
            <button 
              onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
              className="bg-green-100 p-2 rounded-full hover:bg-green-200 transition relative"
              data-testid="notification-bell-btn"
            >
              🔔
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {notifications.filter(n => !n.read).length}
              </span>
            </button>

            {showNotificationDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50">
                <div className="p-4 border-b">
                  <h3 className="font-semibold text-gray-800">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map(n => (
                    <div key={n.id} className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${!n.read ? 'bg-green-50' : ''}`}>
                      <p className="text-sm font-medium text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{n.time}</p>
                    </div>
                  ))}
                </div>
                <div className="p-3 text-center">
                  <button className="text-green-600 text-sm font-medium">Mark all as read</button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar */}
          <div className="relative" ref={profileRef}>
            <button 
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className="bg-green-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-semibold hover:bg-green-700 transition"
              data-testid="profile-avatar-btn"
            >
              {getInitials(user?.name || "")}
            </button>

            {showProfileDropdown && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border z-50">
                <div className="p-4 border-b">
                  <p className="font-semibold text-gray-800">{user?.name}</p>
                  <p className="text-sm text-gray-500">{user?.phone}</p>
                </div>
                <div className="py-2">
                  <button 
                    onClick={() => { setShowProfileDropdown(false); setShowProfileModal(true); }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                  >
                    👤 My Profile
                  </button>
                  <button 
                    onClick={() => { setShowProfileDropdown(false); setShowProfileModal(true); }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                  >
                    💳 Subscription
                  </button>
                  <button 
                    onClick={() => { setShowProfileDropdown(false); setShowMobileModal(true); }}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                  >
                    📱 Mobile Experience
                  </button>
                  <div className="border-t mt-2 pt-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50"
                    >
                      🚪 Logout
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {children}

        {/* BOTTOM MOBILE BANNER - Shows on smaller screens and can be dismissed */}
        {!mobileBannerDismissed && (
          <div className="fixed bottom-6 right-6 bg-white rounded-xl shadow-lg border p-4 flex items-center gap-4 z-40 max-w-sm md:hidden" data-testid="mobile-banner">
            <div className="text-3xl">📱</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">ICECONNECT Mobile</p>
              <p className="text-xs text-gray-500">Add to Home Screen for app-like experience</p>
            </div>
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => setShowMobileModal(true)}
                className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                data-testid="mobile-banner-setup-btn"
              >
                Setup
              </button>
              <button 
                onClick={() => {
                  setMobileBannerDismissed(true);
                  localStorage.setItem('mobileBannerDismissed', 'true');
                }}
                className="text-xs text-gray-400 hover:text-gray-600"
                data-testid="mobile-banner-dismiss-btn"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </main>

      {/* PROFILE MODAL */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">My Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Account Info */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">👤</span>
                  Account Information
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium text-gray-800">{user?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Phone</span>
                    <span className="font-medium text-gray-800">{user?.phone || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Role</span>
                    <span className="font-medium text-gray-800 capitalize">{user?.role || 'Member'}</span>
                  </div>
                </div>
              </div>

              {/* Subscription Info */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">💳</span>
                  Subscription
                </h3>
                <div className="bg-gray-50 rounded-xl p-4">
                  {user?.digitalLabActive ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">ACTIVE</span>
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
                          {user?.digitalLabExpiry ? new Date(user.digitalLabExpiry).toLocaleDateString() : '-'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <span className="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm font-medium">INACTIVE</span>
                      <p className="text-gray-500 mt-3 text-sm">No active subscription</p>
                      <Link href="/dashboard/sales-booster">
                        <button className="mt-4 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition">
                          Activate Now
                        </button>
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile Experience */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">📱</span>
                  Mobile Experience
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4">
                  <p className="text-gray-700 text-sm mb-3">Add ICECONNECT to your home screen for app-like usage.</p>
                  <button 
                    onClick={() => { setShowProfileModal(false); setShowMobileModal(true); }}
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

      {/* MOBILE SETUP MODAL */}
      {showMobileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">📱 Mobile Experience Setup</h2>
              <button onClick={() => setShowMobileModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Android */}
              <div className="bg-green-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🤖</span> Android
                </h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-bold text-green-600">1.</span>
                    Open Chrome browser menu (⋮)
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-green-600">2.</span>
                    Tap &quot;Add to Home Screen&quot;
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-green-600">3.</span>
                    Tap &quot;Add&quot; to confirm
                  </li>
                </ol>
              </div>

              {/* iOS */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🍎</span> iOS (iPhone/iPad)
                </h3>
                <ol className="space-y-2 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">1.</span>
                    Tap the Share button (□↑)
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">2.</span>
                    Scroll down and tap &quot;Add to Home Screen&quot;
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold text-blue-600">3.</span>
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

      {/* SUPPORT CHATBOT MODAL */}
      {showSupportChat && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex justify-between items-center bg-green-600 text-white rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">💬</div>
                <div>
                  <h2 className="font-bold">ICECONNECT Support</h2>
                  <p className="text-xs text-green-100">We&apos;re here to help</p>
                </div>
              </div>
              <button onClick={() => setShowSupportChat(false)} className="text-white/80 hover:text-white text-2xl">&times;</button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.type === 'user' 
                      ? 'bg-green-600 text-white rounded-br-md' 
                      : 'bg-white text-gray-800 shadow rounded-bl-md'
                  }`}>
                    <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  </div>
                </div>
              ))}

              {/* WhatsApp Contact Card (show after technical issue) */}
              {chatMessages.some(m => m.text.includes('contact our technical team')) && (
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

            {/* Quick Buttons */}
            <div className="p-4 border-t bg-white rounded-b-2xl">
              <p className="text-xs text-gray-500 mb-3">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                {['How to activate Generate Leads?', 'How to add a lead?', 'Subscription help', 'Technical issue'].map(q => (
                  <button
                    key={q}
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
