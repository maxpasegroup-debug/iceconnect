"use client";

import { useEffect, useState } from "react";

interface Member {
  _id: string;
  name: string;
  phone: string;
  rank: string;
  personalVolume: number;
  teamVolume: number;
  level: number;
  performanceTag: string;
  status: string;
}

interface Stats {
  totalMembers: number;
  totalVolume: number;
  levelCount: number;
  strongestLine: { name: string; volume: number } | null;
  weakestLine: { name: string; volume: number } | null;
}

export default function MyOrganizationPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [levelGroups, setLevelGroups] = useState<Record<number, Member[]>>({});
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);

  const fetchOrganization = async () => {
    try {
      const res = await fetch("/api/organization", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setLevelGroups(data.levelGroups || {});
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, []);

  const filteredMembers = selectedLevel
    ? members.filter((m) => m.level === selectedLevel)
    : members;

  const levels = Object.keys(levelGroups).map(Number).sort((a, b) => a - b);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div data-testid="organization-page">
      <h2 className="text-3xl font-bold mb-6">My Organization</h2>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white">
          <p className="text-sm opacity-80">Total Members</p>
          <p className="text-3xl font-bold" data-testid="org-total-members">{stats?.totalMembers || 0}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-2xl text-white">
          <p className="text-sm opacity-80">Total Volume</p>
          <p className="text-3xl font-bold">{stats?.totalVolume || 0} PV</p>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white">
          <p className="text-sm opacity-80">Organization Depth</p>
          <p className="text-3xl font-bold">{stats?.levelCount || 0} Levels</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-6 rounded-2xl text-white">
          <p className="text-sm opacity-80">Direct Lines</p>
          <p className="text-3xl font-bold">{levelGroups[1]?.length || 0}</p>
        </div>
      </div>

      {/* Strongest & Weakest Lines */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-2xl border-l-4 border-green-500">
          <h3 className="font-semibold text-green-700 mb-2">💪 Strongest Line</h3>
          {stats?.strongestLine ? (
            <div>
              <p className="text-xl font-bold">{stats.strongestLine.name}</p>
              <p className="text-green-600">{stats.strongestLine.volume} PV</p>
            </div>
          ) : (
            <p className="text-gray-500">No data yet</p>
          )}
        </div>
        <div className="bg-red-50 p-6 rounded-2xl border-l-4 border-red-500">
          <h3 className="font-semibold text-red-700 mb-2">📉 Needs Attention</h3>
          {stats?.weakestLine ? (
            <div>
              <p className="text-xl font-bold">{stats.weakestLine.name}</p>
              <p className="text-red-600">{stats.weakestLine.volume} PV</p>
            </div>
          ) : (
            <p className="text-gray-500">No data yet</p>
          )}
        </div>
      </div>

      {/* Level Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setSelectedLevel(null)}
          className={`px-4 py-2 rounded-lg ${!selectedLevel ? "bg-green-600 text-white" : "bg-gray-100"}`}
        >
          All Levels
        </button>
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => setSelectedLevel(level)}
            className={`px-4 py-2 rounded-lg ${selectedLevel === level ? "bg-green-600 text-white" : "bg-gray-100"}`}
            data-testid={`level-filter-${level}`}
          >
            Level {level} ({levelGroups[level]?.length || 0})
          </button>
        ))}
      </div>

      {/* Organization Tree */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Organization Structure</h3>
        
        {filteredMembers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No team members yet. Start building your organization!</p>
        ) : (
          <div className="space-y-4" data-testid="org-members-list">
            {levels.map((level) => {
              const levelMembers = filteredMembers.filter((m) => m.level === level);
              if (levelMembers.length === 0) return null;
              
              return (
                <div key={level}>
                  <h4 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <span className="w-8 h-8 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm">
                      L{level}
                    </span>
                    Level {level} ({levelMembers.length} members)
                  </h4>
                  <div className="grid grid-cols-3 gap-3 ml-10">
                    {levelMembers.map((member) => (
                      <div
                        key={member._id}
                        className={`p-4 rounded-xl border-2 ${member.status === "Active" ? "border-green-200 bg-green-50" : "border-gray-200 bg-gray-50"}`}
                        data-testid={`org-member-${member._id}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.rank}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${member.status === "Active" ? "bg-green-200 text-green-700" : "bg-gray-200 text-gray-600"}`}>
                            {member.status}
                          </span>
                        </div>
                        <div className="mt-2 flex gap-4 text-sm">
                          <span className="text-blue-600">PV: {member.personalVolume}</span>
                          <span className="text-purple-600">TV: {member.teamVolume}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}