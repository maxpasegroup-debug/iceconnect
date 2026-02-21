"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [network, setNetwork] = useState("Herbalife");

  const handleRegister = () => {
    if (!name) {
      alert("Enter your name");
      return;
    }

    if (phone.length !== 10) {
      alert("Enter valid 10-digit mobile number");
      return;
    }

    if (pin.length !== 4) {
      alert("PIN must be 4 digits");
      return;
    }

    if (pin !== confirmPin) {
      alert("PINs do not match");
      return;
    }

    // Save locally (temporary until backend)
    localStorage.setItem("user_name", name);
    localStorage.setItem("user_phone", phone);
    localStorage.setItem("user_pin", pin);
    localStorage.setItem("user_network", network);

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-green-700">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96">
        <h1 className="text-2xl font-bold text-green-700 mb-6 text-center">
          Herbalife CRM Register
        </h1>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <input
          type="text"
          placeholder="Mobile Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <input
          type="password"
          placeholder="4 Digit PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <input
          type="password"
          placeholder="Confirm PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
        />

        <select
          value={network}
          onChange={(e) => setNetwork(e.target.value)}
          className="w-full border p-3 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="Herbalife">Herbalife</option>
        </select>

        <button
          onClick={handleRegister}
          className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition"
        >
          Register
        </button>
      </div>
    </div>
  );
}