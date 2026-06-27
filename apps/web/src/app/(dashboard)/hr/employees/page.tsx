"use client";

import React, { useState, useEffect } from "react";
import { Users, Building2, GraduationCap, Briefcase } from "lucide-react";
import apiClient from "@/lib/api-client";

type ApiResponse = {
  module: string;
  status: string;
};

export default function EmployeesPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.get("/hr/employees");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch employees module", err);
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

  const departments = [
    { name: "Engineering", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50", count: "—" },
    { name: "Design", icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50", count: "—" },
    { name: "Operations", icon: Building2, color: "text-amber-600", bg: "bg-amber-50", count: "—" },
    { name: "HR", icon: Users, color: "text-rose-600", bg: "bg-rose-50", count: "—" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Employees</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your workforce directory</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
          <span className="capitalize">{data?.module}</span>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            {data?.status}
          </span>
        </div>
      </div>

      {/* Department filter chips */}
      <div className="flex gap-2 flex-wrap">
        {["All", ...departments.map((d) => d.name)].map((dept) => (
          <button
            key={dept}
            className="rounded-full border px-4 py-1.5 text-sm font-medium bg-background hover:bg-muted transition-colors"
          >
            {dept === "All" ? "All Departments" : dept}
          </button>
        ))}
      </div>

      {/* Department cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {departments.map((dept) => (
          <div key={dept.name} className="rounded-xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div className={`rounded-lg p-2 ${dept.bg}`}>
                <dept.icon className={`h-5 w-5 ${dept.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{dept.name}</h3>
                <p className="text-xs text-muted-foreground">{dept.count} employees</p>
              </div>
            </div>
            {/* Avatar stack skeleton */}
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-muted border-2 border-card" />
              ))}
              <div className="h-8 w-8 rounded-full bg-muted/50 border-2 border-card flex items-center justify-center text-[10px] text-muted-foreground">
                +—
              </div>
            </div>
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
