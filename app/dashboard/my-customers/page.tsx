"use client";

import { useEffect, useState } from "react";

interface Customer {
  _id: string;
  name: string;
  phone: string;
  productPlan: string;
  subscriptionStatus: string;
  renewalDate: string | null;
  monthlyVolume: number;
  paymentMode: string;
  notes: string;
}

interface Stats {
  totalCustomers: number;
  activeCount: number;
  expiredCount: number;
  totalRevenue: number;
  upcomingRenewals: number;
}

export default function MyCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    productPlan: "",
    subscriptionStatus: "Active",
    renewalDate: "",
    monthlyVolume: 0,
    paymentMode: "Cash",
    notes: "",
  });

  const fetchCustomers = async () => {
    try {
      const url = filter === "all" ? "/api/customers" : `/api/customers?filter=${filter}`;
      const res = await fetch(url, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [filter]);

  const resetForm = () => {
    setFormData({
      name: "",
      phone: "",
      productPlan: "",
      subscriptionStatus: "Active",
      renewalDate: "",
      monthlyVolume: 0,
      paymentMode: "Cash",
      notes: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      alert("Name and phone are required");
      return;
    }

    const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      resetForm();
      fetchCustomers();
    }
  };

  const handleEdit = (c: Customer) => {
    setFormData({
      name: c.name,
      phone: c.phone,
      productPlan: c.productPlan,
      subscriptionStatus: c.subscriptionStatus,
      renewalDate: c.renewalDate?.split("T")[0] || "",
      monthlyVolume: c.monthlyVolume,
      paymentMode: c.paymentMode,
      notes: c.notes,
    });
    setEditingId(c._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this customer?")) return;
    await fetch(`/api/customers/${id}`, { method: "DELETE", credentials: "include" });
    fetchCustomers();
  };

  const isRenewalSoon = (date: string | null) => {
    if (!date) return false;
    const renewalDate = new Date(date);
    const now = new Date();
    const diff = (renewalDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div data-testid="customers-page">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">My Customers</h2>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg"
          data-testid="add-customer-btn"
        >
          + Add Customer
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold text-blue-600" data-testid="total-customers">{stats?.totalCustomers || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border-l-4 border-green-500">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats?.activeCount || 0}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-xl border-l-4 border-red-500">
          <p className="text-sm text-gray-600">Expired</p>
          <p className="text-2xl font-bold text-red-600">{stats?.expiredCount || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-xl border-l-4 border-purple-500">
          <p className="text-sm text-gray-600">Revenue</p>
          <p className="text-2xl font-bold text-purple-600">₹{stats?.totalRevenue || 0}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-xl border-l-4 border-orange-500">
          <p className="text-sm text-gray-600">Renewals Soon</p>
          <p className="text-2xl font-bold text-orange-600">{stats?.upcomingRenewals || 0}</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {["all", "active", "expired"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg capitalize ${filter === f ? "bg-green-600 text-white" : "bg-gray-100"}`}
            data-testid={`filter-${f}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">{editingId ? "Edit Customer" : "Add Customer"}</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="border p-3 rounded-lg" data-testid="customer-name-input" />
              <input placeholder="Phone *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="border p-3 rounded-lg" data-testid="customer-phone-input" />
              <input placeholder="Product Plan" value={formData.productPlan} onChange={(e) => setFormData({ ...formData, productPlan: e.target.value })} className="border p-3 rounded-lg" />
              <select value={formData.subscriptionStatus} onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })} className="border p-3 rounded-lg">
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
              </select>
              <input type="date" value={formData.renewalDate} onChange={(e) => setFormData({ ...formData, renewalDate: e.target.value })} className="border p-3 rounded-lg" />
              <input type="number" placeholder="Monthly Volume" value={formData.monthlyVolume} onChange={(e) => setFormData({ ...formData, monthlyVolume: parseInt(e.target.value) || 0 })} className="border p-3 rounded-lg" />
              <select value={formData.paymentMode} onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })} className="border p-3 rounded-lg">
                <option>Cash</option>
                <option>UPI</option>
                <option>Card</option>
                <option>Bank Transfer</option>
              </select>
              <textarea placeholder="Notes" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="border p-3 rounded-lg col-span-2" rows={2} />
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSubmit} className="flex-1 bg-green-600 text-white py-3 rounded-lg" data-testid="save-customer-btn">{editingId ? "Update" : "Add"}</button>
              <button onClick={resetForm} className="flex-1 bg-gray-200 py-3 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Customers List */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-4">Customer</th>
              <th className="text-left p-4">Plan</th>
              <th className="text-left p-4">Volume</th>
              <th className="text-left p-4">Renewal</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody data-testid="customers-list">
            {customers.length === 0 && (
              <tr><td colSpan={6} className="p-4 text-center text-gray-500">No customers found</td></tr>
            )}
            {customers.map((c) => (
              <tr key={c._id} className="border-t" data-testid={`customer-row-${c._id}`}>
                <td className="p-4">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.phone}</p>
                </td>
                <td className="p-4">{c.productPlan || "-"}</td>
                <td className="p-4">₹{c.monthlyVolume}</td>
                <td className="p-4">
                  {c.renewalDate ? (
                    <span className={isRenewalSoon(c.renewalDate) ? "text-orange-600 font-semibold" : ""}>
                      {new Date(c.renewalDate).toLocaleDateString()}
                      {isRenewalSoon(c.renewalDate) && <span className="ml-2 text-xs bg-orange-100 px-2 py-1 rounded">Soon</span>}
                    </span>
                  ) : "-"}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${c.subscriptionStatus === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {c.subscriptionStatus}
                  </span>
                </td>
                <td className="p-4">
                  <button onClick={() => handleEdit(c)} className="text-blue-600 mr-3" data-testid={`edit-customer-${c._id}`}>Edit</button>
                  <button onClick={() => handleDelete(c._id)} className="text-red-600" data-testid={`delete-customer-${c._id}`}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
