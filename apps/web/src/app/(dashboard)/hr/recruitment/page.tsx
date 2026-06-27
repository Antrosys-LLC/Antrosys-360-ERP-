"use client";

import React, { useState, useEffect } from "react";
import { UserPlus, Filter, Eye, MessageSquare } from "lucide-react";
import apiClient from "@/lib/api-client";

type ApiResponse = {
  module: string;
  status: string;
};

export default function RecruitmentPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.get("/hr/recruitment");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch recruitment module", err);
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

  const stages = [
    { name: "Sourced", color: "border-l-slate-400", bg: "bg-slate-50", count: "—" },
    { name: "Screening", color: "border-l-blue-400", bg: "bg-blue-50", count: "—" },
    { name: "Interview", color: "border-l-amber-400", bg: "bg-amber-50", count: "—" },
    { name: "Offer", color: "border-l-emerald-400", bg: "bg-emerald-50", count: "—" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Recruitment</h1>
          <p className="mt-1 text-sm text-muted-foreground">Track job openings and candidates</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
          <span className="capitalize">{data?.module}</span>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            {data?.status}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Open Positions</p>
          <p className="text-xl font-bold">—</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Total Candidates</p>
          <p className="text-xl font-bold">—</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">In Progress</p>
          <p className="text-xl font-bold">—</p>
        </div>
        <div className="rounded-xl border bg-card p-4 shadow-sm text-center">
          <p className="text-xs text-muted-foreground mb-1">Hired</p>
          <p className="text-xl font-bold">—</p>
        </div>
      </div>

      {/* Pipeline stages */}
      <h3 className="font-semibold text-sm">Pipeline</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stages.map((stage) => (
          <div
            key={stage.name}
            className={`rounded-xl border bg-card shadow-sm border-l-4 ${stage.color}`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-sm">{stage.name}</h4>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stage.bg}`}>
                  {stage.count}
                </span>
              </div>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div key={i} className="rounded-lg border p-3 bg-background">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">—</span>
                      <span className="text-[10px] text-muted-foreground">—</span>
                    </div>
                    <p className="text-xs text-muted-foreground">—</p>
                    <div className="flex gap-2 mt-2">
                      <Eye className="h-3 w-3 text-muted-foreground" />
                      <MessageSquare className="h-3 w-3 text-muted-foreground" />
                    </div>
                  </div>
                ))}
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
