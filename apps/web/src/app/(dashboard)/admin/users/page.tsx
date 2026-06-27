"use client";

import React, { useState, useEffect } from "react";
import { Shield, Search } from "lucide-react";
import apiClient from "@/lib/api-client";

type ApiResponse = {
  module: string;
  status: string;
};

export default function AdminUsersPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.get("/admin");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch admin module", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage system users, roles, and access</p>
        </div>
        <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-md text-sm text-muted-foreground">
          <Shield className="h-4 w-4" />
          <span className="capitalize">{data?.module}</span>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            {data?.status}
          </span>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search users by name, email, or role..."
          className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled
        />
      </div>

      {/* Role cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {["Admin", "Editor", "Viewer"].map((role) => (
          <div
            key={role}
            className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">{role}</h3>
              <span className="text-xs text-muted-foreground">0 users</span>
            </div>
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full bg-muted border-2 border-card"
                />
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {role === "Admin" && "Full system access and configuration"}
              {role === "Editor" && "Can create and edit content"}
              {role === "Viewer" && "Read-only access to modules"}
            </p>
          </div>
        ))}
      </div>

      {/* Raw response */}
      <details className="text-xs text-muted-foreground">
        <summary className="cursor-pointer hover:text-foreground">API Response</summary>
        <pre className="mt-2 rounded-lg bg-muted p-4 overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
