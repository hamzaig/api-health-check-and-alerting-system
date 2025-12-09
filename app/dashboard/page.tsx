"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

interface Endpoint {
  _id: string;
  url: string;
  name: string;
  checkInterval: number;
  createdAt: string;
  updatedAt: string;
}

interface Check {
  _id: string;
  status: number;
  responseTime: number;
  timestamp: string;
  errorMessage?: string;
}

export default function DashboardPage() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAll, setCheckingAll] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    checkInterval: "60000",
  });

  useEffect(() => {
    fetchEndpoints();
  }, []);

  useEffect(() => {
    if (selectedEndpoint) {
      fetchChecks(selectedEndpoint);
    }
  }, [selectedEndpoint]);

  useEffect(() => {
    if (endpoints.length === 0) return;

    const timers = endpoints.map((endpoint) => {
      // Ensure we don't spam the API faster than 10s even if the stored value is smaller
      const intervalMs = Math.max(endpoint.checkInterval || 60000, 10000);

      const runHealthCheck = async () => {
        try {
          await fetch("/api/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpointId: endpoint._id }),
          });

          if (selectedEndpoint === endpoint._id) {
            fetchChecks(endpoint._id);
          }
        } catch (error) {
          console.error("Failed to auto-check endpoint:", error);
        }
      };

      return setInterval(runHealthCheck, intervalMs);
    });

    return () => {
      timers.forEach(clearInterval);
    };
  }, [endpoints, selectedEndpoint]);

  const fetchEndpoints = async () => {
    try {
      const res = await fetch("/api/endpoints");
      if (res.ok) {
        const data = await res.json();
        setEndpoints(data);
      }
    } catch (error) {
      console.error("Failed to fetch endpoints:", error);
    }
  };

  const fetchChecks = async (endpointId: string) => {
    try {
      const res = await fetch(`/api/endpoints/${endpointId}/checks`);
      if (res.ok) {
        const data = await res.json();
        setChecks(data);
      }
    } catch (error) {
      console.error("Failed to fetch checks:", error);
    }
  };

  const handleAddEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/endpoints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          checkInterval: parseInt(formData.checkInterval),
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: "", url: "", checkInterval: "60000" });
        fetchEndpoints();
      }
    } catch (error) {
      console.error("Failed to add endpoint:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditEndpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEndpoint) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/endpoints/${editingEndpoint._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          url: formData.url,
          checkInterval: parseInt(formData.checkInterval),
        }),
      });

      if (res.ok) {
        setShowEditModal(false);
        setEditingEndpoint(null);
        setFormData({ name: "", url: "", checkInterval: "60000" });
        fetchEndpoints();
      }
    } catch (error) {
      console.error("Failed to update endpoint:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this endpoint?")) return;

    try {
      const res = await fetch(`/api/endpoints/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEndpoints();
        if (selectedEndpoint === id) {
          setSelectedEndpoint(null);
          setChecks([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete endpoint:", error);
    }
  };

  const handleCheckEndpoint = async (id: string) => {
    try {
      await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpointId: id }),
      });
      if (selectedEndpoint === id) {
        fetchChecks(id);
      }
    } catch (error) {
      console.error("Failed to check endpoint:", error);
    }
  };

  const handleCheckAll = async () => {
    setCheckingAll(true);
    try {
      await fetch("/api/check");
      fetchEndpoints();
      if (selectedEndpoint) {
        fetchChecks(selectedEndpoint);
      }
    } catch (error) {
      console.error("Failed to check all endpoints:", error);
    } finally {
      setCheckingAll(false);
    }
  };

  const openEditModal = (endpoint: Endpoint) => {
    setEditingEndpoint(endpoint);
    setFormData({
      name: endpoint.name,
      url: endpoint.url,
      checkInterval: endpoint.checkInterval.toString(),
    });
    setShowEditModal(true);
  };

  const getStatusColor = (status: number) => {
    if (status === 0) return "bg-gray-500";
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">
            Health Check Dashboard
          </h1>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Endpoint
          </button>
          <button
            onClick={handleCheckAll}
            disabled={checkingAll || endpoints.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {checkingAll ? "Checking..." : "Check All"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Endpoints
            </h2>
            <div className="space-y-3">
              {endpoints.length === 0 ? (
                <p className="text-gray-500">No endpoints added yet.</p>
              ) : (
                endpoints.map((endpoint) => (
                  <div
                    key={endpoint._id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-500 cursor-pointer"
                    onClick={() => setSelectedEndpoint(endpoint._id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">
                          {endpoint.name}
                        </h3>
                        <p className="text-sm text-gray-600 break-all">
                          {endpoint.url}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Check every {endpoint.checkInterval / 1000}s
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCheckEndpoint(endpoint._id);
                        }}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Check Now
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(endpoint);
                        }}
                        className="px-3 py-1 text-sm bg-yellow-600 text-white rounded hover:bg-yellow-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEndpoint(endpoint._id);
                        }}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">
              Check History
            </h2>
            {selectedEndpoint ? (
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {checks.length === 0 ? (
                  <p className="text-gray-500">No checks performed yet.</p>
                ) : (
                  checks.map((check) => (
                    <div
                      key={check._id}
                      className="border border-gray-200 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-3 h-3 rounded-full ${getStatusColor(
                              check.status
                            )}`}
                          ></div>
                          <span className="font-semibold text-gray-900">
                            Status: {check.status || "Failed"}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {check.responseTime.toFixed(0)}ms
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {new Date(check.timestamp).toLocaleString()}
                      </p>
                      {check.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">
                          Error: {check.errorMessage}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <p className="text-gray-500">
                Select an endpoint to view its check history.
              </p>
            )}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Add Endpoint
            </h2>
            <form onSubmit={handleAddEndpoint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  placeholder="https://example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Interval (seconds)
                </label>
                <input
                  type="number"
                  value={parseInt(formData.checkInterval) / 1000}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checkInterval: (parseInt(e.target.value) * 1000).toString(),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  min="10"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Adding..." : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setFormData({ name: "", url: "", checkInterval: "60000" });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && editingEndpoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
              Edit Endpoint
            </h2>
            <form onSubmit={handleEditEndpoint} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Check Interval (seconds)
                </label>
                <input
                  type="number"
                  value={parseInt(formData.checkInterval) / 1000}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      checkInterval: (parseInt(e.target.value) * 1000).toString(),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                  min="10"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingEndpoint(null);
                    setFormData({ name: "", url: "", checkInterval: "60000" });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
