'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Download,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Plus,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  acceptCfoTask,
  cancelCfoTask,
  createCfoEvent,
  deleteCfoEvent,
  exportCfoReport,
  fetchCfoActivities,
  fetchCfoCashflow,
  fetchCfoDashboard,
  fetchCfoEvents,
  fetchCfoInvoiceStatus,
  fetchCfoTasks,
  updateCfoEvent,
  type CfoMetric,
} from '@/lib/cfo-api';

type InvoicePeriod = 'month' | 'quarter' | 'year';
type CashflowPeriod = 'year' | 'quarter' | 'month';

const INVOICE_PERIOD_LABELS: Record<InvoicePeriod, string> = {
  month: 'This Month',
  quarter: 'This Quarter',
  year: 'This Year',
};

const CASHFLOW_PERIOD_LABELS: Record<CashflowPeriod, string> = {
  year: 'This Year',
  quarter: 'This Quarter',
  month: 'This Month',
};

function cycleInvoicePeriod(current: InvoicePeriod): InvoicePeriod {
  const order: InvoicePeriod[] = ['month', 'quarter', 'year'];
  return order[(order.indexOf(current) + 1) % order.length];
}

function cycleCashflowPeriod(current: CashflowPeriod): CashflowPeriod {
  const order: CashflowPeriod[] = ['year', 'quarter', 'month'];
  return order[(order.indexOf(current) + 1) % order.length];
}

function startOfMonthIso(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function CFODashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [invoicePeriod, setInvoicePeriod] = useState<InvoicePeriod>('month');
  const [cashflowPeriod, setCashflowPeriod] = useState<CashflowPeriod>('year');
  const [cashflowOffset, setCashflowOffset] = useState(0);
  const [calendarOffset, setCalendarOffset] = useState(0);
  const [taskActionId, setTaskActionId] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventStartAt, setEventStartAt] = useState('');
  const [eventHighlighted, setEventHighlighted] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ['cfo', 'dashboard', invoicePeriod],
    queryFn: () => fetchCfoDashboard(invoicePeriod),
  });

  const cashflowQuery = useQuery({
    queryKey: ['cfo', 'cashflow', cashflowPeriod, cashflowOffset],
    queryFn: () => fetchCfoCashflow(cashflowPeriod, cashflowOffset),
  });

  const invoiceStatusQuery = useQuery({
    queryKey: ['cfo', 'invoice-status', invoicePeriod],
    queryFn: () => fetchCfoInvoiceStatus(invoicePeriod),
  });

  const tasksQuery = useQuery({
    queryKey: ['cfo', 'tasks'],
    queryFn: fetchCfoTasks,
  });

  const activitiesQuery = useQuery({
    queryKey: ['cfo', 'activities'],
    queryFn: fetchCfoActivities,
  });

  const eventsQuery = useQuery({
    queryKey: ['cfo', 'events', calendarOffset],
    queryFn: () => fetchCfoEvents(calendarOffset),
  });

  const acceptMutation = useMutation({
    mutationFn: acceptCfoTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['cfo', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['cfo', 'activities'] });
      toast({ title: 'Task accepted' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to accept task' });
    },
    onSettled: () => setTaskActionId(null),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelCfoTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo', 'tasks'] });
      queryClient.invalidateQueries({ queryKey: ['cfo', 'dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['cfo', 'activities'] });
      toast({ title: 'Task cancelled' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to cancel task' });
    },
    onSettled: () => setTaskActionId(null),
  });

  const resetEventForm = () => {
    setShowEventForm(false);
    setEditingEventId(null);
    setEventTitle('');
    setEventDescription('');
    setEventStartAt('');
    setEventHighlighted(false);
  };

  const openCreateEvent = () => {
    setEditingEventId(null);
    setEventTitle('');
    setEventDescription('');
    setEventStartAt(new Date().toISOString().slice(0, 16));
    setEventHighlighted(false);
    setShowEventForm(true);
  };

  const openEditEvent = (event: {
    id: string;
    title: string;
    subtitle: string;
    description?: string;
    startAt?: string;
    date: string;
    time: string;
    highlighted: boolean;
  }) => {
    setEditingEventId(event.id);
    setEventTitle(event.title);
    setEventDescription(event.description ?? event.subtitle ?? '');
    const start = event.startAt
      ? new Date(event.startAt)
      : new Date(`${event.date}T${event.time}`);
    const local = Number.isNaN(start.getTime())
      ? new Date().toISOString().slice(0, 16)
      : new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEventStartAt(local);
    setEventHighlighted(event.highlighted);
    setShowEventForm(true);
  };

  const eventMutation = useMutation({
    mutationFn: async () => {
      const body = {
        title: eventTitle.trim(),
        description: eventDescription.trim() || null,
        startAt: new Date(eventStartAt).toISOString(),
        isHighlighted: eventHighlighted,
      };
      if (editingEventId) {
        return updateCfoEvent(editingEventId, body);
      }
      return createCfoEvent(body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo', 'events'] });
      resetEventForm();
      toast({ title: editingEventId ? 'Event updated' : 'Event created' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to save event' });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: deleteCfoEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cfo', 'events'] });
      toast({ title: 'Event deleted' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to delete event' });
    },
  });

  const handleExport = async () => {
    const fromDate = window.prompt('Export from date (YYYY-MM-DD)', startOfMonthIso());
    if (!fromDate) return;
    const toDate = window.prompt('Export to date (YYYY-MM-DD)', todayIso());
    if (!toDate) return;

    try {
      const blob = await exportCfoReport(fromDate, toDate);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cfo-report-${fromDate}-${toDate}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Report exported' });
    } catch {
      toast({ variant: 'destructive', title: 'Export failed' });
    }
  };

  const dashboard = dashboardQuery.data;
  const cashflow = cashflowQuery.data;
  const invoiceStatus = invoiceStatusQuery.data ?? dashboard?.invoiceStatus;
  const metrics = dashboard?.metrics ?? [];
  const tasks = tasksQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];
  const eventsData = eventsQuery.data;

  const greeting = dashboard?.greeting ?? 'there';
  const displayDate = dashboard?.date ?? new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-[#F4F6FC] text-[#11142D] p-6 space-y-6">

      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Good morning, {greeting}
          </h1>
          <p className="text-sm text-gray-400 mt-1">{displayDate}</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center justify-center gap-2 bg-white border border-[#EBEAEF] hover:bg-gray-50 text-sm font-medium px-4 py-2.5 rounded-lg transition-colors shadow-sm text-gray-700"
        >
          <Download className="w-4 h-4 text-gray-500" />
          Export Report
        </button>
      </header>

      {/* TOP METRICS GRIDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {(dashboardQuery.isLoading
          ? ([null, null, null, null] as (CfoMetric | null)[])
          : metrics
        ).map((metric, idx) => (
          <div key={metric?.id ?? idx} className="bg-white p-5 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
            {metric ? (
              <>
                <div>
                  <div className="flex items-center justify-between text-gray-400">
                    <span className="text-xs font-medium uppercase tracking-wider">{metric.title}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{metric.subtitle}</p>
                </div>
                <div className="flex items-end justify-between mt-4">
                  <span className="text-2xl font-bold tracking-tight">{metric.value}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                    metric.isPositive
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-rose-50 text-rose-600'
                  }`}>
                    {metric.isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {metric.change}
                  </span>
                </div>
              </>
            ) : (
              <div className="animate-pulse h-20 bg-gray-100 rounded" />
            )}
          </div>
        ))}
      </section>

      {/* CHARTS & ANALYTICS OVERVIEW */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* CASHFLOW OVERVIEW MATRIX */}
        <div className="bg-white p-6 rounded-xl border border-[#EBEAEF] shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cashflow Overview</h3>
              <p className="text-3xl font-bold mt-1 text-[#11142D]">
                {cashflow?.percentage ?? dashboard?.cashflowSummary?.percentage ?? '—'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCashflowPeriod(cycleCashflowPeriod(cashflowPeriod))}
                className="inline-flex items-center gap-1.5 text-xs bg-gray-50 border border-[#EBEAEF] px-3 py-1.5 rounded-md font-medium text-gray-600"
              >
                {CASHFLOW_PERIOD_LABELS[cashflowPeriod]}
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="flex items-center border border-[#EBEAEF] rounded-md bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCashflowOffset((o) => o - 1)}
                  className="p-1.5 hover:bg-gray-50 border-r border-[#EBEAEF]"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => setCashflowOffset((o) => o + 1)}
                  className="p-1.5 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-8">
            {(cashflow?.months ?? []).map((month, mIdx) => (
              <div key={mIdx} className="space-y-4">
                <h4 className="text-xs font-medium text-gray-400">{month.name}</h4>
                <div className="flex justify-between items-end h-32 pt-2">
                  {month.days.map((day, dIdx) => (
                    <div key={dIdx} className="flex flex-col items-center gap-2 flex-1">
                      <div className="flex flex-col gap-1 justify-end h-24">
                        {Array.from({ length: 5 }).map((_, dotIdx) => {
                          const isActive = dotIdx < day.activeDots;
                          return (
                            <span
                              key={dotIdx}
                              className={`w-2 h-2 rounded-full transition-colors ${
                                isActive ? 'bg-[#735BF2]' : 'bg-gray-100'
                              }`}
                            />
                          );
                        })}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{day.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {cashflowQuery.isLoading && (
              <div className="col-span-3 animate-pulse h-32 bg-gray-100 rounded" />
            )}
          </div>
        </div>

        {/* INVOICE STATUS SECTOR */}
        <div className="bg-white p-6 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-[#11142D]">Invoice Status</h3>
            <button
              type="button"
              onClick={() => setInvoicePeriod(cycleInvoicePeriod(invoicePeriod))}
              className="text-xs bg-gray-50 border border-[#EBEAEF] px-3 py-1.5 rounded-md font-medium text-gray-600 flex items-center gap-1"
            >
              {INVOICE_PERIOD_LABELS[invoicePeriod]}
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center justify-center my-6">
            <div
              className="relative w-36 h-36 rounded-full border-8 border-gray-100 flex items-center justify-center transition-all shadow-inner"
              style={{ borderColor: '#735BF2 #f59e0b #f43f5e #38bdf8' }}
            >
              <div className="text-center">
                <span className="block text-[10px] uppercase font-bold tracking-widest text-gray-400">Total</span>
                <span className="text-2xl font-black text-[#11142D]">{invoiceStatus?.total ?? '—'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {(invoiceStatus?.segments ?? []).map((segment, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 w-20">
                  <span className={`w-2.5 h-2.5 rounded-full ${segment.color}`} />
                  <span className="text-gray-500 font-medium">{segment.label}</span>
                </div>
                <span className="font-bold text-[#11142D] w-8 text-right">{segment.count}</span>
                <div className="flex-1 mx-3 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${segment.color}`}
                    style={{
                      width: `${invoiceStatus?.total ? (segment.count / invoiceStatus.total) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="text-[10px] text-gray-400 min-w-[40px] text-right">{segment.left} Left</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => router.push('/finance/invoices')}
            className="w-full text-center bg-[#735BF2] hover:bg-[#624be0] text-white text-xs font-semibold py-2.5 rounded-lg mt-5 transition-colors shadow-sm"
          >
            View all
          </button>
        </div>
      </section>

      {/* LOWER FOOTER WORKFLOW CARDS */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

        {/* YOUR TASKS SECTION */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-tight">Your Tasks</h3>
            <button type="button" className="text-gray-400 hover:text-gray-600">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            {tasks.length === 0 && !tasksQuery.isLoading && (
              <p className="text-xs text-gray-400 text-center py-4">No pending tasks</p>
            )}
            {tasks.map((task) => (
              <div key={task.id} className="p-4 rounded-xl bg-gray-50 border border-[#EBEAEF] space-y-3">
                <div className="flex items-center gap-3">
                  <img src={task.user.avatar} alt={task.user.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
                  <div>
                    <h4 className="text-xs font-bold text-[#11142D]">{task.user.name}</h4>
                    <p className="text-[11px] text-gray-400">{task.user.role}</p>
                  </div>
                </div>

                <div className="flex justify-between items-start pt-1">
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{task.action}</p>
                    <span className={`inline-block text-[10px] font-bold mt-1 ${task.priority === 'High' ? 'text-rose-500' : 'text-gray-400'}`}>
                      {task.priority}
                    </span>
                  </div>
                  <div className="text-right text-[10px] text-gray-400">
                    <p>{task.date}</p>
                    <p>{task.time}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    disabled={taskActionId === task.id}
                    onClick={() => {
                      setTaskActionId(task.id);
                      cancelMutation.mutate(task.id);
                    }}
                    className="inline-flex items-center justify-center px-3 py-1.5 border border-[#EBEAEF] bg-white hover:bg-gray-100 text-xs font-medium rounded-lg text-gray-600 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={taskActionId === task.id}
                    onClick={() => {
                      setTaskActionId(task.id);
                      acceptMutation.mutate(task.id);
                    }}
                    className="inline-flex items-center justify-center px-3 py-1.5 bg-[#735BF2] hover:bg-[#624be0] text-white text-xs font-medium rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    Accept
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECENT ACTIVITY LOGS */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold tracking-tight">Recent Activity</h3>
            <button
              type="button"
              onClick={() => router.push('/finance/invoices')}
              className="text-xs text-[#735BF2] font-semibold hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-5 flex-1 overflow-y-auto">
            {activities.map((group, gIdx) => (
              <div key={gIdx} className="space-y-2">
                <span className="text-[11px] uppercase font-bold tracking-wider text-gray-400 block">{group.category}</span>
                <div className="space-y-2">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-[#EBEAEF] bg-white hover:bg-gray-50 transition-colors cursor-pointer">
                      <div>
                        <p className="text-xs font-medium text-gray-800">{item.title}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.timestamp}</p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* UPCOMING EVENTS SCHEDULE */}
        <div className="bg-white p-5 rounded-xl border border-[#EBEAEF] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold tracking-tight">Upcoming Events</h3>
            <button
              type="button"
              onClick={openCreateEvent}
              className="flex items-center gap-1 text-xs text-[#735BF2] font-medium hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add event
            </button>
          </div>

          {showEventForm && (
            <div className="mb-3 p-3 rounded-lg border border-[#EBEAEF] bg-[#F8F9FC] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#11142D]">
                  {editingEventId ? 'Edit event' : 'New event'}
                </span>
                <button type="button" onClick={resetEventForm} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Title"
                className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white"
              />
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Description"
                rows={2}
                className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white resize-none"
              />
              <input
                type="datetime-local"
                value={eventStartAt}
                onChange={(e) => setEventStartAt(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-md px-2 py-1.5 bg-white"
              />
              <label className="flex items-center gap-2 text-[11px] text-gray-600">
                <input
                  type="checkbox"
                  checked={eventHighlighted}
                  onChange={(e) => setEventHighlighted(e.target.checked)}
                />
                Highlight event
              </label>
              <button
                type="button"
                disabled={!eventTitle.trim() || !eventStartAt || eventMutation.isPending}
                onClick={() => eventMutation.mutate()}
                className="w-full text-xs font-medium bg-[#735BF2] text-white rounded-md py-1.5 disabled:opacity-50"
              >
                {eventMutation.isPending ? 'Saving…' : editingEventId ? 'Update event' : 'Create event'}
              </button>
            </div>
          )}

          <div className="border-b border-gray-100 pb-3 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#11142D]">{eventsData?.calendar.label ?? '—'}</span>
              <div className="flex items-center border border-gray-200 rounded bg-white overflow-hidden scale-90">
                <button
                  type="button"
                  onClick={() => setCalendarOffset((o) => o - 1)}
                  className="p-1 hover:bg-gray-50 border-r border-gray-200"
                >
                  <ChevronLeft className="w-3 h-3 text-gray-500" />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarOffset((o) => o + 1)}
                  className="p-1 hover:bg-gray-50"
                >
                  <ChevronRight className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {(eventsData?.calendar.days ?? []).map((day, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[9px] font-medium text-gray-400 uppercase block">{day.day}</span>
                  <span className={`w-6 h-6 text-xs flex items-center justify-center mx-auto rounded-full font-semibold transition-all ${
                    day.active ? 'bg-[#735BF2] text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                  }`}>{day.num}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto max-h-[280px]">
            {(eventsData?.events ?? []).length === 0 && (
              <p className="text-[11px] text-gray-400 text-center py-4">No upcoming events.</p>
            )}
            {(eventsData?.events ?? []).map((event) => (
              <div
                key={event.id}
                className={`p-3 rounded-lg border transition-colors flex gap-3 ${
                  event.highlighted
                    ? 'bg-purple-50/70 border-purple-200 text-[#735BF2]'
                    : 'bg-white border-[#EBEAEF] text-[#11142D]'
                }`}
              >
                <div className="flex flex-col items-center justify-center min-w-[50px] text-center border-r border-gray-100 pr-2">
                  <Clock className="w-3.5 h-3.5 opacity-60 mb-1" />
                  <span className="text-[10px] font-bold block leading-none">{event.time.split(' ')[0]}</span>
                  <span className="text-[8px] font-semibold uppercase block tracking-wider opacity-70">{event.time.split(' ')[1]}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={`text-xs font-bold truncate ${event.highlighted ? 'text-[#735BF2]' : 'text-gray-900'}`}>{event.title}</h4>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditEvent(event)}
                        className="p-1 rounded hover:bg-black/5 text-gray-400 hover:text-gray-700"
                        aria-label="Edit event"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Delete "${event.title}"?`)) {
                            deleteEventMutation.mutate(event.id);
                          }
                        }}
                        className="p-1 rounded hover:bg-black/5 text-gray-400 hover:text-red-600"
                        aria-label="Delete event"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{event.subtitle || event.description}</p>

                  {(event.date || event.unit) && (
                    <div className="flex items-center gap-3 mt-1.5 text-[9px] text-gray-400 font-medium">
                      {event.date && <span>{event.date}</span>}
                      {event.unit && <span>{event.unit}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>
    </div>
  );
}
