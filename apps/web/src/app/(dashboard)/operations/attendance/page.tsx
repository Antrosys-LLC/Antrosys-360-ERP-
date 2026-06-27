"use client";

import React, { useState, useEffect } from "react";
import { ClipboardCheck, Clock, UserCheck, UserX, TrendingUp } from "lucide-react";
import apiClient from "@/lib/api-client";

type ApiResponse = {
  module: string;
  status: string;
};

export default function AttendancePage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.get("/operations/attendance");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch attendance module", err);
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

  const todayStats = [
    { label: "Present", value: "—", icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "Absent", value: "—", icon: UserX, color: "text-red-600", bg: "bg-red-50" },
    { label: "Late", value: "—", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "On Leave", value: "—", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track employee attendance and work hours</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
          <span className="capitalize">{data?.module}</span>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            {data?.status}
          </span>
        </div>
      </div>

      {/* Today's date badge */}
      <div className="flex items-center gap-2 text-sm">
        <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">Today</span>
        <span className="font-medium">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Today's stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {todayStats.map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className={`rounded-lg p-2 ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Recent entries table */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Today's Log</h3>
        </div>
        <div className="divide-y">
          {[
            { name: "—", time: "—", status: "—" },
          ].map((entry, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-muted" />
                <span className="text-muted-foreground">{entry.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">{entry.time}</span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                  {entry.status}
                </span>
              </div>
            </div>
          ))}
          <div className="px-4 py-6 text-center text-sm text-muted-foreground">
            No attendance entries for today.
          </div>
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
