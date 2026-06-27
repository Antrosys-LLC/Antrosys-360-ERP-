"use client";

import React, { useState, useEffect } from "react";
import { FileText, TrendingUp, AlertCircle, CheckCircle2 } from "lucide-react";
import apiClient from "@/lib/api-client";

type ApiResponse = {
  module: string;
  status: string;
};

export default function InvoicesPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await apiClient.get("/finance/invoices");
        setData(res.data);
      } catch (err) {
        console.error("Failed to fetch invoices module", err);
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

  const summaryCards = [
    { label: "Total Invoices", value: "—", icon: FileText, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Paid", value: "—", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending", value: "—", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Revenue", value: "—", icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage and track all invoices</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-md">
          <span className="capitalize">{data?.module}</span>
          <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
            {data?.status}
          </span>
        </div>
      </div>

      {/* Summary cards row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{card.label}</span>
              <div className={`rounded-lg p-2 ${card.bg}`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Table placeholder */}
      <div className="rounded-xl border bg-card shadow-sm">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Recent Invoices</h3>
        </div>
        <div className="divide-y">
          {[{ id: "INV-001", client: "—", amount: "—", status: "—" }].map((row) => (
            <div key={row.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
                <span className="text-muted-foreground">{row.client}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-medium">{row.amount}</span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                  {row.status}
                </span>
              </div>
            </div>
          ))}
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
