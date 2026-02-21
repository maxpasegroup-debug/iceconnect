"use client";

import Navbar from "../components/Navbar";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [open, setOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [company, setCompany] = useState("herbalife");

  const router = useRouter();

  // REGISTER
  const handleRegister = async () => {
    if (!name || phone.length !== 10 || pin.length !== 4 || pin !== confirmPin) {
      alert("Please fill all details correctly");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      setOpen(false);
      router.push("/dashboard");

    } catch {
      alert("Registration failed");
    }
  };

  // LOGIN
  const handleLogin = async () => {
    if (phone.length !== 10 || pin.length !== 4) {
      alert("Enter valid credentials");
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      setLoginOpen(false);
      router.push("/dashboard");

    } catch {
      alert("Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E7EB] text-[#0B1F3A]">

      <Navbar />

      {/* HERO SECTION */}
      <section className="text-center px-6 py-20">
        <div className="flex justify-center mb-12">
          <Image
            src="/logo.png"
            alt="ICEConnect Logo"
            width={300}
            height={300}
            className="object-contain"
          />
        </div>

        <h1 className="text-5xl font-bold mb-6">
          Where Entrepreneurs Connect, Collaborate & Automate Growth
        </h1>

        <p className="text-xl max-w-3xl mx-auto mb-10 text-[#0B1F3A]/80">
          ICE Connect is a global automation-driven community platform built for founders,
          innovators, and business leaders who want to scale smarter together.
        </p>

        <div className="space-x-4">
          <button
            onClick={() => alert("Community activities coming soon")}
            className="bg-[#0EA5E9] text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-500 transition"
          >
            🚀 Join the Community
          </button>

          <button
            onClick={() => setOpen(true)}
            className="border border-[#0B1F3A] px-8 py-4 rounded-lg font-semibold hover:bg-[#0B1F3A] hover:text-white transition"
          >
            ⚙️ Automate Your Business
          </button>

          <button
            onClick={() => setLoginOpen(true)}
            className="bg-[#0B1F3A] text-white px-8 py-4 rounded-lg font-semibold hover:bg-black transition"
          >
            🔐 Login
          </button>
        </div>
      </section>

      {/* SECTION 2 */}
      <section className="px-6 py-20 text-center max-w-5xl mx-auto">
        <h2 className="text-4xl font-bold mb-8 text-[#0EA5E9]">
          International Community Of Entrepreneurs
        </h2>

        <p className="text-lg leading-relaxed">
          ICE Connect is more than a network. It’s a structured ecosystem where entrepreneurs
          meet opportunities, partnerships, capital, and technology — all in one intelligent platform.
          <br /><br />
          Whether you're launching your first startup or scaling globally, ICE Connect gives you
          the tools and community to move faster.
        </p>
      </section>

      {/* SECTION 3 */}
      <section className="px-6 py-20 bg-white">
        <h2 className="text-4xl font-bold text-center mb-12 text-[#0EA5E9]">
          Built for Smart Entrepreneurs
        </h2>

        <div className="grid md:grid-cols-2 gap-10 max-w-6xl mx-auto text-lg">
          <div>
            <h3 className="font-semibold mb-3">🔗 Smart Networking</h3>
            <p>AI-driven connections that match you with relevant founders, investors, and collaborators.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">📊 Business Automation Tools</h3>
            <p>Simplify operations, manage workflows, and streamline communication from one dashboard.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">🌎 Global Access</h3>
            <p>Connect beyond borders. Expand your reach internationally.</p>
          </div>

          <div>
            <h3 className="font-semibold mb-3">🤝 Verified Community</h3>
            <p>A serious platform for serious builders.</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#E5E7EB] text-center py-10 text-sm">
        <div className="font-bold mb-2">ICE CONNECT</div>
        <div className="mb-4">International Community Of Entrepreneurs</div>
        <div>© 2026 ICE Connect. All rights reserved.</div>
        <div className="mt-2">Privacy Policy | Terms | Contact</div>
      </footer>

      {/* REGISTER MODAL */}
      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 relative">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-3 right-4 text-gray-500"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6 text-center">
              Register to ICEConnect
            </h2>

            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-3 rounded-lg mb-4"
            />

            <input
              type="text"
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border p-3 rounded-lg mb-4"
            />

            <input
              type="password"
              placeholder="4 Digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full border p-3 rounded-lg mb-4"
            />

            <input
              type="password"
              placeholder="Confirm PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full border p-3 rounded-lg mb-4"
            />

            <select
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full border p-3 rounded-lg mb-6"
            >
              <option value="herbalife">Herbalife</option>
            </select>

            <button
              onClick={handleRegister}
              className="w-full bg-[#0EA5E9] text-white p-3 rounded-lg font-semibold hover:bg-blue-500 transition"
            >
              Register
            </button>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {loginOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 relative">
            <button
              onClick={() => setLoginOpen(false)}
              className="absolute top-3 right-4 text-gray-500"
            >
              ✕
            </button>

            <h2 className="text-2xl font-bold mb-6 text-center">
              Login to ICEConnect
            </h2>

            <input
              type="text"
              placeholder="Mobile Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border p-3 rounded-lg mb-4"
            />

            <input
              type="password"
              placeholder="4 Digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full border p-3 rounded-lg mb-6"
            />

            <button
              onClick={handleLogin}
              className="w-full bg-[#0EA5E9] text-white p-3 rounded-lg font-semibold hover:bg-blue-500 transition"
            >
              Login
            </button>
          </div>
        </div>
      )}

    </div>
  );
}