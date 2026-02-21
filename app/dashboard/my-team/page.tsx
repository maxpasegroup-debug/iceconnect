"use client";

import { useEffect, useState } from "react";

interface Member {
  _id: string;
  name: string;
  phone: string;
  role: string;
  status: string;
}

export default function MyTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("Junior Partner");
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/team", {
        credentials: "include", // ✅ IMPORTANT
      });

      if (!res.ok) {
        console.log("Fetch failed", res.status);
        return;
      }

      const data = await res.json();
      setMembers(data.members || []);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdd = async () => {
    if (!name || phone.length !== 10) {
      alert("Enter valid details");
      return;
    }

    const res = await fetch("/api/team", {
      method: "POST",
      credentials: "include", // ✅ IMPORTANT
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phone, role }),
    });

    if (!res.ok) {
      alert("Failed to add member");
      return;
    }

    setName("");
    setPhone("");
    setRole("Junior Partner");
    fetchMembers();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/team/${id}`, {
      method: "DELETE",
      credentials: "include", // ✅ IMPORTANT
    });

    fetchMembers();
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">My Team</h2>

      {/* ADD MEMBER */}
      <div className="bg-white p-6 rounded-2xl shadow mb-8 max-w-xl">
        <h3 className="text-xl font-semibold mb-4">Add Team Member</h3>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 rounded-lg mb-3"
        />

        <input
          type="text"
          placeholder="Mobile Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border p-3 rounded-lg mb-3"
        />

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4"
        >
          <option>Junior Partner</option>
          <option>Club Member</option>
          <option>Club Owner</option>
        </select>

        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-6 py-3 rounded-lg"
        >
          Add Member
        </button>
      </div>

      {/* MEMBER LIST */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4">Team Members</h3>

        {loading && <p>Loading...</p>}

        {!loading && members.length === 0 && (
          <p className="text-gray-500">No team members added yet.</p>
        )}

        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member._id}
              className="flex justify-between items-center border-b pb-2"
            >
              <div>
                <p className="font-semibold">{member.name}</p>
                <p className="text-sm text-gray-500">
                  {member.phone} • {member.role}
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <span
                  className={
                    member.status === "Active"
                      ? "text-green-600"
                      : "text-red-500"
                  }
                >
                  {member.status}
                </span>

                <button
                  onClick={() => handleDelete(member._id)}
                  className="text-red-500 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}