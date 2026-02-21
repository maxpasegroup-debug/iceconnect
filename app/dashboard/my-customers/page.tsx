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
}

export default function MyCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [productPlan, setProductPlan] = useState("");
  const [subscriptionStatus, setSubscriptionStatus] = useState("Active");
  const [renewalDate, setRenewalDate] = useState("");
  const [monthlyVolume, setMonthlyVolume] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/customers", {
        credentials: "include",
      });

      if (!res.ok) {
        console.log("Fetch failed", res.status);
        return;
      }

      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err) {
      console.error("Fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleAdd = async () => {
    if (!name || phone.length !== 10) {
      alert("Enter valid details (name required, phone must be 10 digits)");
      return;
    }

    const res = await fetch("/api/customers", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        phone,
        productPlan,
        subscriptionStatus,
        renewalDate: renewalDate || null,
        monthlyVolume: monthlyVolume ? parseInt(monthlyVolume) : 0,
      }),
    });

    if (!res.ok) {
      alert("Failed to add customer");
      return;
    }

    setName("");
    setPhone("");
    setProductPlan("");
    setSubscriptionStatus("Active");
    setRenewalDate("");
    setMonthlyVolume("");
    fetchCustomers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this customer?")) return;
    
    await fetch(`/api/customers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    fetchCustomers();
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div data-testid="customers-page">
      <h2 className="text-3xl font-bold mb-6">My Customers</h2>

      {/* ADD CUSTOMER */}
      <div className="bg-white p-6 rounded-2xl shadow mb-8 max-w-2xl">
        <h3 className="text-xl font-semibold mb-4">Add Customer</h3>

        <div className="grid grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Full Name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="customer-name-input"
          />

          <input
            type="text"
            placeholder="Mobile Number *"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="customer-phone-input"
          />

          <input
            type="text"
            placeholder="Product Plan"
            value={productPlan}
            onChange={(e) => setProductPlan(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="customer-plan-input"
          />

          <select
            value={subscriptionStatus}
            onChange={(e) => setSubscriptionStatus(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="customer-status-select"
          >
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>

          <input
            type="date"
            placeholder="Renewal Date"
            value={renewalDate}
            onChange={(e) => setRenewalDate(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="customer-renewal-input"
          />

          <input
            type="number"
            placeholder="Monthly Volume (PV)"
            value={monthlyVolume}
            onChange={(e) => setMonthlyVolume(e.target.value)}
            className="w-full border p-3 rounded-lg"
            data-testid="customer-volume-input"
          />
        </div>

        <button
          onClick={handleAdd}
          className="bg-green-600 text-white px-6 py-3 rounded-lg mt-4"
          data-testid="add-customer-btn"
        >
          Add Customer
        </button>
      </div>

      {/* CUSTOMER LIST */}
      <div className="bg-white p-6 rounded-2xl shadow">
        <h3 className="text-xl font-semibold mb-4">Customer List</h3>

        {loading && <p>Loading...</p>}

        {!loading && customers.length === 0 && (
          <p className="text-gray-500">No customers added yet.</p>
        )}

        <div className="space-y-4" data-testid="customer-list">
          {customers.map((customer) => (
            <div
              key={customer._id}
              className="flex justify-between items-center border-b pb-3"
              data-testid={`customer-item-${customer._id}`}
            >
              <div className="flex-1">
                <p className="font-semibold">{customer.name}</p>
                <p className="text-sm text-gray-500">
                  {customer.phone} • {customer.productPlan || "No Plan"}
                </p>
                <p className="text-sm text-gray-400">
                  Renewal: {formatDate(customer.renewalDate)} • Volume: {customer.monthlyVolume} PV
                </p>
              </div>

              <div className="flex items-center space-x-4">
                <span
                  className={
                    customer.subscriptionStatus === "Active"
                      ? "text-green-600 font-medium"
                      : "text-red-500 font-medium"
                  }
                  data-testid={`customer-status-${customer._id}`}
                >
                  {customer.subscriptionStatus}
                </span>

                <button
                  onClick={() => handleDelete(customer._id)}
                  className="text-red-500 text-sm hover:underline"
                  data-testid={`delete-customer-${customer._id}`}
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
