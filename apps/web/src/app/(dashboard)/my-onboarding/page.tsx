"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare, Square, CalendarClock, MapPin, Mail, Users2, UserCircle2,
  Loader2, PartyPopper, ChevronRight, Clock3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchMyOnboarding, updateMyTask,
  ONBOARDING_PHASES, PHASE_LABELS,
  type OnboardingPhase, type OnboardTask,
} from "@/lib/onboard-api";

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export default function MyOnboardingPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["my-onboarding"],
    queryFn: fetchMyOnboarding,
  });

  const taskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) => updateMyTask(taskId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-onboarding"] });
    },
    onError: () => toast({ variant: "destructive", title: "Could not update task" }),
  });

  const data = query.data;
  const employee = data?.employee ?? null;
  const record = employee?.onboarding ?? null;

  const currentPhase: OnboardingPhase = record?.currentPhase ?? "PENDING";
  const phaseIndex = ONBOARDING_PHASES.indexOf(currentPhase);

  const tasks = employee?.tasks ?? [];
  const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
  const taskPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const meetings = (employee?.onboardingMeetings ?? []).filter((m) => m.status !== "CANCELLED");
  const messages = employee?.receivedMessages ?? [];

  const { dayLabel, dayPct } = useMemo(() => {
    if (!record?.startDate) return { dayLabel: "", dayPct: 0 };
    const start = new Date(record.startDate);
    const now = new Date();
    const total = record.targetEndDate ? Math.max(1, daysBetween(start, new Date(record.targetEndDate))) : 30;
    const elapsed = Math.min(Math.max(0, daysBetween(start, now)), total);
    return {
      dayLabel: `Day ${elapsed + 1} of ${total + 1}`,
      dayPct: Math.round(((elapsed + 1) / (total + 1)) * 100),
    };
  }, [record?.startDate, record?.targetEndDate]);

  const tasksByPhase = useMemo(() => {
    const map = new Map<string, OnboardTask[]>();
    for (const t of tasks) {
      const key = t.phase ?? "PENDING";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
    return map;
  }, [tasks]);

  function toggleTask(task: OnboardTask) {
    const next = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
    taskMutation.mutate({ taskId: task.id, status: next });
  }

  if (query.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading your onboarding...</span>
        </div>
      </div>
    );
  }

  if (!employee || !data?.hasProfile) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2 max-w-sm">
          <UserCircle2 className="h-8 w-8 text-muted-foreground mx-auto" />
          <p className="text-sm font-bold text-foreground">No employee profile</p>
          <p className="text-xs text-muted-foreground">Your account isn&apos;t linked to an employee record yet. Please contact HR.</p>
        </div>
      </div>
    );
  }

  if (!data.hasOnboarding || !record) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-2 max-w-sm">
          <PartyPopper className="h-8 w-8 text-emerald-500 mx-auto" />
          <p className="text-sm font-bold text-foreground">You&apos;re all set!</p>
          <p className="text-xs text-muted-foreground">There is no active onboarding for your account. Welcome aboard, {employee.firstName}.</p>
        </div>
      </div>
    );
  }

  const isDone = currentPhase === "COMPLETED";

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-2 py-0.5 rounded uppercase">
              My Onboarding Journey
            </span>
            <h1 className="text-xl font-bold text-foreground tracking-tight mt-2">
              Welcome, {employee.firstName}! 👋
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              {employee.designation || "New Hire"}{employee.department ? ` · ${employee.department}` : ""}
            </p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${isDone ? "text-emerald-600" : "text-primary"}`}>{taskPct}%</div>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tasks complete</span>
            {dayLabel && <p className="text-[11px] text-muted-foreground mt-1">{dayLabel}</p>}
          </div>
        </div>

        {/* Day progress bar */}
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className={`h-full rounded-full ${isDone ? "bg-emerald-500" : "bg-primary"}`} style={{ width: `${dayPct}%` }} />
          </div>
        </div>
      </div>

      {/* Pipeline stepper */}
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Your pipeline</span>
        <div className="flex items-center gap-1 mt-4 overflow-x-auto pb-1">
          {ONBOARDING_PHASES.map((phase, i) => {
            const done = i < phaseIndex;
            const active = i === phaseIndex;
            return (
              <div key={phase} className="flex items-center gap-1 shrink-0">
                <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold border-2 ${
                    done ? "bg-primary border-primary text-primary-foreground" :
                    active ? (isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-primary/10 border-primary text-primary") :
                    "bg-muted border-border text-muted-foreground"
                  }`}>
                    {done ? <CheckSquare className="h-4 w-4" /> : i + 1}
                  </div>
                  <span className={`text-[9.5px] font-semibold text-center leading-tight ${active ? "text-primary" : "text-muted-foreground"}`}>
                    {PHASE_LABELS[phase]}
                  </span>
                </div>
                {i < ONBOARDING_PHASES.length - 1 && (
                  <ChevronRight className={`h-4 w-4 shrink-0 ${done ? "text-primary" : "text-muted-foreground/40"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Tasks */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-2">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">My Tasks</span>
            <span className="text-[11px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded">
              {completedTasks} of {tasks.length}
            </span>
          </div>

          {tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">No tasks assigned yet. Your HR team will add them soon.</p>
          )}

          <div className="space-y-4">
            {ONBOARDING_PHASES.map((phase) => {
              const phaseTasks = tasksByPhase.get(phase);
              if (!phaseTasks || phaseTasks.length === 0) return null;
              return (
                <div key={phase} className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{PHASE_LABELS[phase]}</span>
                  {phaseTasks.map((task) => (
                    <div key={task.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                        task.status === "COMPLETED" ? "bg-muted/40 border-border/60" : "bg-card border-border"
                      }`}>
                      <button onClick={() => toggleTask(task)} disabled={taskMutation.isPending} className="mt-0.5 shrink-0 text-primary disabled:opacity-50">
                        {task.status === "COMPLETED"
                          ? <CheckSquare className="h-4 w-4" />
                          : <Square className="h-4 w-4 text-muted-foreground/60" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold text-foreground ${task.status === "COMPLETED" ? "line-through text-muted-foreground font-normal" : ""}`}>
                          {task.title}
                        </p>
                        {task.description && <p className="text-[11px] text-muted-foreground mt-0.5">{task.description}</p>}
                        {task.dueAt && (
                          <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock3 className="h-3 w-3" /> Due {new Date(task.dueAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <select
                        value={task.status}
                        onChange={(e) => taskMutation.mutate({ taskId: task.id, status: e.target.value })}
                        disabled={taskMutation.isPending}
                        className="text-[9px] bg-card border border-border rounded px-1 py-0.5 focus:outline-none cursor-pointer shrink-0"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Meetings */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Upcoming Meetings</span>
            <div className="space-y-2">
              {meetings.length === 0 && <p className="text-[11px] text-muted-foreground">No meetings scheduled.</p>}
              {meetings.map((m) => {
                const when = new Date(m.scheduledAt);
                return (
                  <div key={m.id} className={`p-2.5 rounded-lg border text-xs ${
                    m.status === "COMPLETED" ? "bg-emerald-500/5 border-emerald-500/20" : "bg-muted/30 border-border"
                  }`}>
                    <p className="font-bold text-foreground text-[11px]">{m.title}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <CalendarClock className="h-3 w-3" />
                      {when.toLocaleDateString()} {when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {m.location && (
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3" /> {m.location}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Team & manager */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Users2 className="h-3.5 w-3.5" /> Your Squad
            </span>
            {employee.manager && (
              <div className="text-xs">
                <span className="text-[10px] text-muted-foreground">Manager</span>
                <p className="font-bold text-foreground">{employee.manager.firstName} {employee.manager.lastName}</p>
                {employee.manager.designation && <p className="text-[10px] text-muted-foreground">{employee.manager.designation}</p>}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {employee.teams?.map((t) => (
                <span key={t.team.id} className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-md border border-primary/10">
                  {t.team.name}
                </span>
              ))}
              {(!employee.teams || employee.teams.length === 0) && !employee.manager && (
                <span className="text-[11px] text-muted-foreground">No team assigned yet.</span>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" /> Messages ({messages.length})
            </span>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {messages.length === 0 && <p className="text-[11px] text-muted-foreground">No messages yet.</p>}
              {messages.map((msg) => (
                <div key={msg.id} className="p-2.5 bg-muted/30 border border-border rounded-lg text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-foreground text-[11px]">{msg.subject}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-4">{msg.body}</p>
                  <p className="text-[9px] text-muted-foreground/70 mt-1">From {msg.sender.email}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
