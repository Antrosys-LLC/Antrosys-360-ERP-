"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Users, CheckSquare, Square, Clock, Plus, Bell, Search, MoreHorizontal,
  ChevronRight, AlertTriangle, Calendar, FileText, Upload, Send, HelpCircle,
  Settings, Mail, UserCheck, LayoutDashboard, Loader2, Trash2, Edit3, X,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  fetchDashboardStats, fetchOnboardEmployees, fetchOnboardEmployee,
  createOnboardEmployee, deleteOnboardEmployee,
  fetchEmployeeTasks, createEmployeeTask, updateTask, deleteTask,
  updateOnboardEmployee,
  fetchTeams, addTeamMember, removeTeamMember,
  fetchMessages, sendMessage,
  type OnboardEmployee, type OnboardTask, type DashboardStats, type Team, type Message,
} from "@/lib/onboard-api";

export default function OnboardingModulePage() {
  const [selectedHireId, setSelectedHireId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<OnboardEmployee[]>([]);
  const [teamsList, setTeamsList] = useState<Team[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [employeeTasks, setEmployeeTasks] = useState<OnboardTask[]>([]);

  const [customMessageBody, setCustomMessageBody] = useState("");
  const [sending, setSending] = useState(false);
  const [showAddHire, setShowAddHire] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [newHireForm, setNewHireForm] = useState({ firstName: "", lastName: "", email: "", department: "", designation: "" });

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const [statsData, empData, teamsData, msgsData] = await Promise.all([
        fetchDashboardStats().catch(() => null),
        fetchOnboardEmployees({ limit: 100 }),
        fetchTeams().catch(() => []),
        fetchMessages().catch(() => []),
      ]);
      setStats(statsData);
      setEmployees(empData.employees);
      setTeamsList(teamsData);
      setMessages(msgsData);
      if (empData.employees.length > 0 && !selectedHireId) {
        setSelectedHireId(empData.employees[0].id);
      }
    } catch {
      setError("Failed to load onboarding data");
    } finally {
      setLoading(false);
    }
  }

  const activeHire = useMemo(
    () => employees.find((h) => h.id === selectedHireId) || null,
    [selectedHireId, employees],
  );

  useEffect(() => {
    if (activeHire) {
      fetchEmployeeTasks(activeHire.id).then(setEmployeeTasks).catch(() => {});
      setCustomMessageBody(
        `Hi ${activeHire.firstName},\n\nWelcome to the ${activeHire.department || "team"} at Antrosys! We are excited to have you start.\n\nPlease review your onboarding dashboard to complete your initial tasks.`
      );
    }
  }, [activeHire]);

  async function handleAddHire() {
    if (!newHireForm.firstName || !newHireForm.lastName || !newHireForm.email) return;
    try {
      await createOnboardEmployee(newHireForm);
      setShowAddHire(false);
      setNewHireForm({ firstName: "", lastName: "", email: "", department: "", designation: "" });
      const empData = await fetchOnboardEmployees({ limit: 100 });
      setEmployees(empData.employees);
    } catch (e) { console.error(e); }
  }

  async function handleDeleteHire(id: string) {
    try {
      await deleteOnboardEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
      if (selectedHireId === id) setSelectedHireId(employees[0]?.id || null);
    } catch (e) { console.error(e); }
  }

  async function handleToggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "COMPLETED" ? "PENDING" : "COMPLETED";
    try {
      await updateTask(taskId, { status: newStatus });
      setEmployeeTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
      );
    } catch (e) { console.error(e); }
  }

  async function handleAddTask() {
    if (!activeHire || !taskTitle.trim()) return;
    try {
      const task = await createEmployeeTask(activeHire.id, { title: taskTitle.trim() });
      setEmployeeTasks((prev) => [task, ...prev]);
      setTaskTitle("");
      setShowAddTask(false);
    } catch (e) { console.error(e); }
  }

  async function handleUpdateField(id: string, field: string, value: string) {
    try {
      const updated = await updateOnboardEmployee(id, { [field]: value });
      setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
    } catch (e) { console.error(e); }
  }

  async function handleUpdateTaskStatus(taskId: string, status: string) {
    try {
      await updateTask(taskId, { status });
      setEmployeeTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status, completedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined } : t))
      );
    } catch (e) { console.error(e); }
  }

  async function handleDeleteTask(taskId: string) {
    try {
      await deleteTask(taskId);
      setEmployeeTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e) { console.error(e); }
  }

  async function handleSendMessage() {
    if (!activeHire || !customMessageBody.trim()) return;
    setSending(true);
    try {
      await sendMessage({
        recipientId: activeHire.id,
        subject: "Welcome to Antrosys!",
        body: customMessageBody,
      });
      setMessages(await fetchMessages());
    } catch (e) { console.error(e); } finally {
      setSending(false);
    }
  }

  async function handleAssignTeam(teamId: string) {
    if (!activeHire) return;
    try {
      await addTeamMember(teamId, activeHire.id);
      const emp = await fetchOnboardEmployee(activeHire.id);
      setEmployees((prev) => prev.map((e) => (e.id === emp.id ? emp : e)));
    } catch (e) { console.error(e); }
  }

  const displayName = (e: OnboardEmployee) => `${e.firstName} ${e.lastName}`;
  const initials = (e: OnboardEmployee) => `${e.firstName?.[0] || ""}${e.lastName?.[0] || ""}`.toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Loading onboarding dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <button onClick={loadAll} className="text-xs text-primary hover:underline font-bold">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">Onboarding management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {stats ? `${stats.activeOnboardings} active onboardings across ${stats.departments.length} departments.` : "Loading..."}
            </p>
          </div>
          <button onClick={() => setShowAddHire(true)}
            className="bg-primary text-primary-foreground font-semibold text-xs py-1.5 px-3 rounded-md shadow-xs hover:opacity-90 transition flex items-center gap-1">
            <Plus className="h-3.5 w-3.5" /> Start onboarding
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-muted/30 border border-border rounded-lg">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Active</span>
            <div className="text-lg font-bold text-foreground mt-0.5">
              <span>{stats?.activeOnboardings ?? 0}</span>
            </div>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded-lg">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Avg Completion</span>
            <div className="text-lg font-bold text-foreground mt-0.5">
              <span>{stats?.avgCompletion ?? 0}%</span>
            </div>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded-lg">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Overdue Tasks</span>
            <div className="text-lg font-bold text-destructive mt-0.5">
              <span>{stats?.overdueTasks ?? 0}</span>
              <span className="text-[10px] text-muted-foreground font-normal ml-1">across {stats?.employeesWithOverdueTasks ?? 0} hires</span>
            </div>
          </div>
          <div className="p-3 bg-muted/30 border border-border rounded-lg">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Completing Soon</span>
            <div className="text-lg font-bold text-foreground mt-0.5">
              <span>{stats?.completingSoon ?? 0}</span>
              <span className="text-[10px] text-muted-foreground font-normal ml-1">next 7 days</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 font-bold">
              <th className="p-3 pl-4">New Hire</th>
              <th className="p-3">Dept</th>
              <th className="p-3">Status</th>
              <th className="p-3">Tasks</th>
              <th className="p-3 text-center">Teams</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border text-xs">
            {employees.map((hire) => {
              const isTarget = selectedHireId === hire.id;
              const completedTasks = employeeTasks.filter((t) => t.status === "COMPLETED").length;
              return (
                <tr key={hire.id} onClick={() => setSelectedHireId(hire.id)}
                  className={`cursor-pointer transition ${isTarget ? "bg-secondary/60 font-medium" : "hover:bg-muted/40"}`}>
                  <td className="p-3 pl-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-[11px] shrink-0">
                        {initials(hire)}
                      </div>
                      <div>
                        <span className="font-bold text-foreground text-sm">{displayName(hire)}</span>
                        <span className="text-[10px] text-muted-foreground block">{hire.user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <select value={hire.department || ""} onChange={(e) => handleUpdateField(hire.id, "department", e.target.value)}
                      className="bg-transparent text-[11px] font-semibold text-muted-foreground border border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer">
                      <option value="">—</option>
                      <option value="ENGINEERING">ENGINEERING</option>
                      <option value="OPERATIONS">OPERATIONS</option>
                      <option value="SALES">SALES</option>
                      <option value="FINANCE">FINANCE</option>
                      <option value="HR">HR</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </td>
                  <td className="p-3" onClick={(e) => e.stopPropagation()}>
                    <select value={hire.employmentStatus || ""} onChange={(e) => handleUpdateField(hire.id, "employmentStatus", e.target.value)}
                      className={`text-[10px] font-bold border border-border rounded px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer ${
                        hire.employmentStatus === "ACTIVE" ? "bg-emerald-500/10 text-emerald-600" :
                        hire.employmentStatus === "ONBOARDING" ? "bg-blue-500/10 text-blue-600" :
                        "bg-muted text-muted-foreground"
                      }`}>
                      <option value="">N/A</option>
                      <option value="OFFER_SIGNED">OFFER_SIGNED</option>
                      <option value="ONBOARDING">ONBOARDING</option>
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="OFFBOARDING">OFFBOARDING</option>
                      <option value="TERMINATED">TERMINATED</option>
                    </select>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${employeeTasks.length > 0 && completedTasks < employeeTasks.length ? "bg-primary animate-pulse" : "bg-emerald-500"}`} />
                      <span className="font-bold">{completedTasks}/{employeeTasks.length}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {hire.teams?.slice(0, 3).map((t, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center text-[9px] font-bold text-muted-foreground" title={t.team.name}>
                          {t.team.name[0]}
                        </div>
                      ))}
                      {(hire.teams?.length ?? 0) > 3 && (
                        <span className="text-[10px] text-muted-foreground font-bold">+{hire.teams!.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(hire.id); }}
                      className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
            {employees.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">No employees found. Add a new hire to get started.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-8 space-y-4">
          <div className="flex items-start justify-between border-b border-border pb-3">
            <div>
              <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-2 py-0.5 rounded uppercase">Onboarding Journey</span>
              <h3 className="text-base font-bold text-foreground tracking-tight mt-1">
                {activeHire ? `${displayName(activeHire)}` : "Select an employee"}
              </h3>
            </div>
            {activeHire?.joiningDate && (
              <div className="bg-muted border border-border text-foreground px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Started {new Date(activeHire.joiningDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {activeHire && (
            <div className="bg-muted/40 border border-border/80 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                {initials(activeHire)}
              </div>
              <div className="text-xs space-y-1">
                <p className="text-foreground/90 font-medium">{activeHire.designation || "New Hire"}</p>
                <span className="text-[10px] text-muted-foreground block">{activeHire.department ? `${activeHire.department} dept` : "Department not set"}</span>
                {activeHire.teams && activeHire.teams.length > 0 && (
                  <span className="text-[10px] text-primary block">Teams: {activeHire.teams.map((t) => t.team.name).join(", ")}</span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
              <span className="text-xs font-bold text-foreground uppercase tracking-wider">Tasks</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded">
                  {employeeTasks.filter((t) => t.status === "COMPLETED").length} of {employeeTasks.length}
                </span>
                <button onClick={() => setShowAddTask(true)}
                  className="text-[10px] border border-border px-2 py-0.5 rounded hover:bg-muted font-semibold flex items-center gap-1">
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {employeeTasks.map((task) => {
                const statusColor =
                  task.status === "COMPLETED" ? "bg-emerald-500/10 text-emerald-600" :
                  task.status === "IN_PROGRESS" ? "bg-blue-500/10 text-blue-600" :
                  "bg-muted text-muted-foreground";
                return (
                  <div key={task.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition select-none ${
                      task.status === "COMPLETED"
                        ? "bg-muted/40 border-border/60 opacity-60"
                        : "bg-card border-border"
                    }`}>
                    <button onClick={() => handleToggleTask(task.id, task.status)}
                      className="mt-0.5 shrink-0 text-primary">
                      {task.status === "COMPLETED"
                        ? <CheckSquare className="h-4 w-4 fill-primary/10" />
                        : <Square className="h-4 w-4 text-muted-foreground/60" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-xs font-semibold text-foreground leading-none ${task.status === "COMPLETED" ? "line-through text-muted-foreground font-normal" : ""}`}>
                          {task.title}
                        </p>
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${statusColor}`}>
                          {task.status}
                        </span>
                      </div>
                      {task.description && <p className="text-[11px] text-muted-foreground mt-1">{task.description}</p>}
                      {task.dueAt && <p className="text-[10px] text-muted-foreground mt-0.5">Due: {new Date(task.dueAt).toLocaleDateString()}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <select value={task.status} onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                        className="text-[9px] bg-card border border-border rounded px-1 py-0.5 focus:outline-none cursor-pointer">
                        <option value="PENDING">PENDING</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                      <button onClick={() => handleDeleteTask(task.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
              {employeeTasks.length === 0 && activeHire && (
                <p className="text-xs text-muted-foreground text-center py-4">No tasks yet. Click "Add" to create one.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4 flex flex-col">
          <div className="bg-card border border-border rounded-xl shadow-xs p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Teams</span>
              {activeHire && teamsList.length > 0 && (
                <select onChange={(e) => { if (e.target.value) handleAssignTeam(e.target.value); e.target.value = ""; }}
                  className="text-[10px] border border-border px-2 py-0.5 rounded bg-card text-muted-foreground">
                  <option value="">Assign team...</option>
                  {teamsList.filter((t) => !activeHire.teams?.some((mt) => mt.team.id === t.id)).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {activeHire?.teams?.map((t, i) => (
                <div key={i} className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-md border border-primary/10 flex items-center gap-1">
                  {t.team.name}
                  <button onClick={() => removeTeamMember(t.team.id, activeHire.id).then(loadAll)}
                    className="hover:text-destructive ml-0.5">×</button>
                </div>
              ))}
              {(!activeHire?.teams || activeHire.teams.length === 0) && (
                <span className="text-[11px] text-muted-foreground">No teams assigned</span>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-xs p-4 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Messages ({messages.length})</span>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {messages.slice(0, 5).map((msg) => (
                <div key={msg.id} className="p-2 bg-muted/40 border border-border rounded-lg text-xs">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-foreground text-[11px]">{msg.subject}</span>
                    {!msg.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">To: {msg.recipient.firstName} {msg.recipient.lastName}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl shadow-xs p-4 space-y-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Quick Stats</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-muted/30 rounded-lg">
                <span className="text-[10px] text-muted-foreground block">Employees</span>
                <span className="font-bold">{employees.length}</span>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <span className="text-[10px] text-muted-foreground block">Teams</span>
                <span className="font-bold">{teamsList.length}</span>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <span className="text-[10px] text-muted-foreground block">Active</span>
                <span className="font-bold">{stats?.activeOnboardings ?? 0}</span>
              </div>
              <div className="p-2 bg-muted/30 rounded-lg">
                <span className="text-[10px] text-muted-foreground block">Completed</span>
                <span className="font-bold">{stats?.completedOnboardings ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs p-5 space-y-4">
        <div className="border-b border-border pb-2.5">
          <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>Communication Center</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Send welcome messages directly to new hires.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="space-y-3.5 lg:col-span-6 text-xs">
            <div>
              <label className="block font-bold text-muted-foreground uppercase text-[10px] mb-1">Recipient</label>
              <div className="p-2 bg-muted/40 border border-border rounded-lg flex flex-wrap gap-1.5 items-center">
                {activeHire ? (
                  <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-md border border-primary/10 flex items-center gap-1">
                    {displayName(activeHire)} <span className="text-[10px] text-muted-foreground">({activeHire.user.email})</span>
                  </span>
                ) : (
                  <span className="text-muted-foreground text-[11px]">Select an employee</span>
                )}
              </div>
            </div>

            <div>
              <label className="block font-bold text-muted-foreground uppercase text-[10px] mb-1">Message Body</label>
              <textarea rows={4} value={customMessageBody} onChange={(e) => setCustomMessageBody(e.target.value)}
                className="w-full p-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium leading-relaxed font-mono text-foreground"
                disabled={!activeHire} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={handleSendMessage} disabled={!activeHire || sending}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90 transition shadow-xs disabled:opacity-50">
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                <span>{sending ? "Sending..." : "Send Message"}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 border border-border rounded-xl overflow-hidden shadow-2xs">
            <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Live Preview
              </span>
            </div>
            <div className="p-4 bg-card space-y-3 font-sans text-xs text-foreground/90">
              <div className="space-y-1 text-[11px] text-muted-foreground font-mono pb-2.5 border-b border-border/60">
                <div><span className="font-bold text-foreground/70">From:</span> hr@antrosys.com</div>
                <div><span className="font-bold text-foreground/70">To:</span> {activeHire?.user.email || "—"}</div>
                <div><span className="font-bold text-foreground/70">Subject:</span> Welcome to Antrosys!</div>
              </div>
              <div className="whitespace-pre-wrap font-medium leading-relaxed text-foreground bg-muted/20 p-3 rounded-lg border border-border/40 select-none">
                {customMessageBody || "Select an employee and compose a message..."}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAddHire} onOpenChange={setShowAddHire}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Hire</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">First Name</label>
                <input value={newHireForm.firstName} onChange={(e) => setNewHireForm({ ...newHireForm, firstName: e.target.value })}
                  className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs" />
              </div>
              <div>
                <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">Last Name</label>
                <input value={newHireForm.lastName} onChange={(e) => setNewHireForm({ ...newHireForm, lastName: e.target.value })}
                  className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs" />
              </div>
            </div>
            <div>
              <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">Email</label>
              <input type="email" value={newHireForm.email} onChange={(e) => setNewHireForm({ ...newHireForm, email: e.target.value })}
                className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">Department</label>
                <select value={newHireForm.department} onChange={(e) => setNewHireForm({ ...newHireForm, department: e.target.value })}
                  className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs">
                  <option value="">Select...</option>
                  <option value="ENGINEERING">Engineering</option>
                  <option value="OPERATIONS">Operations</option>
                  <option value="SALES">Sales</option>
                  <option value="FINANCE">Finance</option>
                  <option value="HR">HR</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-muted-foreground text-[10px] uppercase mb-1">Designation</label>
                <input value={newHireForm.designation} onChange={(e) => setNewHireForm({ ...newHireForm, designation: e.target.value })}
                  className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setShowAddHire(false)} className="px-3 py-1.5 border border-border rounded-md text-xs font-bold bg-card hover:bg-muted">Cancel</button>
            <button onClick={handleAddHire} className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90">Add Employee</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <input
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}
            placeholder="Enter task title..."
            className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs"
            autoFocus
          />
          <DialogFooter>
            <button onClick={() => { setShowAddTask(false); setTaskTitle(""); }} className="px-3 py-1.5 border border-border rounded-md text-xs font-bold bg-card hover:bg-muted">Cancel</button>
            <button onClick={handleAddTask} disabled={!taskTitle.trim()} className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90 disabled:opacity-50">Add</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Are you sure you want to delete this employee? This action cannot be undone.</p>
          <DialogFooter>
            <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 border border-border rounded-md text-xs font-bold bg-card hover:bg-muted">Cancel</button>
            <button onClick={async () => { if (deleteConfirmId) { await handleDeleteHire(deleteConfirmId); setDeleteConfirmId(null); } }}
              className="px-4 py-1.5 bg-destructive text-destructive-foreground text-xs font-bold rounded-md hover:opacity-90">Delete</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
