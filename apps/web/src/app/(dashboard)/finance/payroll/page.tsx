"use client";

import React, { useState, useEffect } from "react";
import { Wallet, Users, Banknote, CalendarDays } from "lucide-react";
import apiClient from "@/lib/api-client";

type ApiResponse = {
  module: string;
  status: string;
};

export default function PayrollPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.get("/finance/payroll");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch payroll module", err);
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

  const stats = [
    { label: "Total Payroll", value: "—", icon: Wallet, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Active Employees", value: "—", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Avg. Salary", value: "—", icon: Banknote, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Next Pay Date", value: "—", icon: CalendarDays, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Payroll</h1>
          <p className="mt-1 text-sm text-muted-foreground">Process and manage employee payroll</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
          <span className="capitalize">{data?.module}</span>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            {data?.status}
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Payroll period & table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Payroll History</h3>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            Period: —
          </span>
        </div>
        <div className="p-8 text-center text-sm text-muted-foreground">
          No payroll cycles have been processed yet.
        </div>
      </div>

      {/* Contribution breakdown */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { title: "Employee Contributions", pct: "—" },
          { title: "Employer Contributions", pct: "—" },
          { title: "Total Deductions", pct: "—" },
        ].map((item) => (
          <div key={item.title} className="rounded-xl border bg-card p-4 shadow-sm text-center">
            <p className="text-sm text-muted-foreground mb-1">{item.title}</p>
            <p className="text-lg font-bold">{item.pct}</p>
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
