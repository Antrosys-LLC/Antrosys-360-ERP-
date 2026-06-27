"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Umbrella, Clock, CheckCircle2, XCircle } from "lucide-react";
import apiClient from "@/lib/api-client";

type ApiResponse = {
  module: string;
  status: string;
};

export default function LeavePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.get("/operations/leave");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch leave module", err);
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

  const leaveTypes = [
    { name: "Annual Leave", icon: Umbrella, used: "—", total: "—", color: "text-blue-600", bg: "bg-blue-50" },
    { name: "Sick Leave", icon: Clock, used: "—", total: "—", color: "text-rose-600", bg: "bg-rose-50" },
    { name: "Personal Leave", icon: Calendar, used: "—", total: "—", color: "text-violet-600", bg: "bg-violet-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Leave Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage leave requests and balances</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
          <span className="capitalize">{data?.module}</span>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            {data?.status}
          </span>
        </div>
      </div>

      {/* Leave balance cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {leaveTypes.map((type) => (
          <div key={type.name} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`rounded-lg p-2 ${type.bg}`}>
                <type.icon className={`h-5 w-5 ${type.color}`} />
              </div>
              <span className="text-2xl font-bold">
                {type.used}/{type.total}
              </span>
            </div>
            <h3 className="font-semibold text-sm">{type.name}</h3>
            {/* Progress bar */}
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-primary/20 w-0"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Used / Total</p>
          </div>
        ))}
      </div>

      {/* Recent requests timeline */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-sm">Recent Requests</h3>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" /> Approved
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" /> Rejected
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-500" /> Pending
            </span>
          </div>
        </div>
        <div className="p-8 text-center text-sm text-muted-foreground">
          No leave requests have been submitted yet.
        </div>
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
