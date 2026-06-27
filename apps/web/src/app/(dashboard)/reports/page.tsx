"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, TrendingUp, FileText, Users, DollarSign, Activity } from "lucide-react";
import apiClient from "@/lib/api-client";

type ApiResponse = {
  module: string;
  status: string;
};

export default function ReportsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.get("/reports");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch reports module", err);
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

  const reportCategories = [
    {
      title: "Financial",
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      reports: ["Profit & Loss", "Balance Sheet", "Cash Flow", "Expense Report"],
    },
    {
      title: "Workforce",
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
      reports: ["Headcount", "Turnover Rate", "Attendance Summary", "Payroll Summary"],
    },
    {
      title: "Operations",
      icon: Activity,
      color: "text-violet-600",
      bg: "bg-violet-50",
      reports: ["Project Status", "Task Completion", "Resource Allocation"],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">View and generate organizational reports</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
          <span className="capitalize">{data?.module}</span>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            {data?.status}
          </span>
        </div>
      </div>

      {/* Chart area placeholder */}
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Overview</h3>
        </div>
        <div className="h-48 rounded-lg bg-muted/50 flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Chart visualization coming soon</p>
          </div>
        </div>
        {/* Legend */}
        <div className="flex gap-6 mt-4 text-xs text-muted-foreground">
          {["This Period", "Previous Period"].map((label) => (
            <span key={label} className="flex items-center gap-2">
              <span className="h-2 w-4 rounded bg-primary/20" />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Report categories */}
      <div className="grid gap-4 sm:grid-cols-3">
        {reportCategories.map((cat) => (
          <div key={cat.title} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className={`rounded-lg p-2 ${cat.bg}`}>
                <cat.icon className={`h-5 w-5 ${cat.color}`} />
              </div>
              <h3 className="font-semibold text-sm">{cat.title}</h3>
            </div>
            <ul className="space-y-2">
              {cat.reports.map((report) => (
                <li
                  key={report}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  {report}
                </li>
              ))}
            </ul>
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
