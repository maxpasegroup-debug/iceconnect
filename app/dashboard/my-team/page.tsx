"use client";

import { useEffect, useState } from "react";

interface Member {
  _id: string;
  name: string;
  phone: string;
  role: string;
  rank: string;
  joiningDate: string;
  personalVolume: number;
  teamVolume: number;
  level: number;
  performanceTag: string;
  status: string;
}

interface Stats {
  totalActiveMembers: number;
  totalTeamVolume: number;
  newMembersThisMonth: number;
  totalMembers: number;
}

export default function MyTeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    role: "Junior Partner",
    rank: "Distributor",
    joiningDate: "",
    personalVolume: 0,
    teamVolume: 0,
    level: 1,
    performanceTag: "New",
  });

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/team", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      role: "Junior Partner",
      rank: "Distributor",
      joiningDate: "",
      personalVolume: 0,
      teamVolume: 0,
      level: 1,
      performanceTag: "New",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      alert("Name and phone are required");
      return;
    }

    const url = editingId ? `/api/team/${editingId}` : "/api/team";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      resetForm();
      fetchMembers();
    } else {
      alert("Failed to save member");
    }
  };

  const handleEdit = (member: Member) => {
    setFormData({
      name: member.name,
      phone: member.phone,
      role: member.role,
      rank: member.rank,
      joiningDate: member.joiningDate?.split("T")[0] || "",
      personalVolume: member.personalVolume,
      teamVolume: member.teamVolume,
      level: member.level,
      performanceTag: member.performanceTag,
    });
    setEditingId(member._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this member?")) return;
    await fetch(`/api/team/${id}`, { method: "DELETE", credentials: "include" });
    fetchMembers();
  };

  const handleToggleStatus = async (member: Member) => {
    const newStatus = member.status === "Active" ? "Inactive" : "Active";
    await fetch(`/api/team/${member._id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchMembers();
  };

  const getTagColor = (tag: string) => {
    switch (tag) {
      case "Hot": return "bg-red-100 text-red-700";
      case "Top Performer": return "bg-green-100 text-green-700";
      case "Needs Support": return "bg-yellow-100 text-yellow-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div data-testid="team-page">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">My Team</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
          data-testid="add-member-btn"
        >
          + Add Member
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Total Members</p>
          <p className="text-2xl font-bold text-green-600" data-testid="total-members">{stats?.totalMembers || 0}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Active Members</p>
          <p className="text-2xl font-bold text-blue-600" data-testid="active-members">{stats?.totalActiveMembers || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Total Volume</p>
          <p className="text-2xl font-bold text-purple-600" data-testid="total-volume">{stats?.totalTeamVolume || 0} PV</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">New This Month</p>
          <p className="text-2xl font-bold text-orange-600" data-testid="new-this-month">{stats?.newMembersThisMonth || 0}</p>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">{editingId ? "Edit Member" : "Add Team Member"}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Full Name *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border p-3 rounded-lg"
                data-testid="member-name-input"
              />
              <input
                placeholder="Phone *"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="border p-3 rounded-lg"
                data-testid="member-phone-input"
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="border p-3 rounded-lg"
              >
                <option>Junior Partner</option>
                <option>Club Member</option>
                <option>Club Owner</option>
                <option>Supervisor</option>
              </select>
              <select
                value={formData.rank}
                onChange={(e) => setFormData({ ...formData, rank: e.target.value })}
                className="border p-3 rounded-lg"
              >
                <option>Distributor</option>
                <option>Senior Consultant</option>
                <option>Supervisor</option>
                <option>World Team</option>
              </select>
              <input
                type="date"
                value={formData.joiningDate}
                onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                className="border p-3 rounded-lg"
              />
              <input
                type="number"
                placeholder="Personal Volume"
                value={formData.personalVolume}
                onChange={(e) => setFormData({ ...formData, personalVolume: parseInt(e.target.value) || 0 })}
                className="border p-3 rounded-lg"
              />
              <input
                type="number"
                placeholder="Team Volume"
                value={formData.teamVolume}
                onChange={(e) => setFormData({ ...formData, teamVolume: parseInt(e.target.value) || 0 })}
                className="border p-3 rounded-lg"
              />
              <input
                type="number"
                placeholder="Level"
                value={formData.level}
                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) || 1 })}
                className="border p-3 rounded-lg"
              />
              <select
                value={formData.performanceTag}
                onChange={(e) => setFormData({ ...formData, performanceTag: e.target.value })}
                className="border p-3 rounded-lg col-span-2"
              >
                <option>New</option>
                <option>Hot</option>
                <option>Needs Support</option>
                <option>Top Performer</option>
              </select>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit} className="flex-1 bg-green-600 text-white py-3 rounded-lg" data-testid="save-member-btn">
                {editingId ? "Update" : "Add Member"}
              </button>
              <button onClick={resetForm} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Name</th>
              <th className="text-left p-4">Rank</th>
              <th className="text-left p-4">Volume</th>
              <th className="text-left p-4">Level</th>
              <th className="text-left p-4">Tag</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody data-testid="members-list">
            {members.length === 0 && (
              <tr><td colSpan={7} className="p-4 text-center text-gray-500">No team members yet</td></tr>
            )}
            {members.map((m) => (
              <tr key={m._id} className="border-t" data-testid={`member-row-${m._id}`}>
                <td className="p-4">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-sm text-gray-500">{m.phone}</p>
                </td>
                <td className="p-4">{m.rank}</td>
                <td className="p-4">{m.personalVolume + m.teamVolume} PV</td>
                <td className="p-4">L{m.level}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-sm ${getTagColor(m.performanceTag)}`}>
                    {m.performanceTag}
                  </span>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => handleToggleStatus(m)}
                    className={`px-3 py-1 rounded-full text-sm ${m.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    data-testid={`toggle-status-${m._id}`}
                  >
                    {m.status}
                  </button>
                </td>
                <td className="p-4">
                  <button onClick={() => handleEdit(m)} className="text-blue-600 mr-3" data-testid={`edit-member-${m._id}`}>Edit</button>
                  <button onClick={() => handleDelete(m._id)} className="text-red-600" data-testid={`delete-member-${m._id}`}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
