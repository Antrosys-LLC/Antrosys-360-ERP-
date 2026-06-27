"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  CheckSquare,
  Square,
  Clock,
  Bell,
  AlertTriangle,
  Calendar,
  FileText,
  Upload,
  Send,
  Mail,
} from "lucide-react";
import apiClient from "@/lib/api-client";

type NewHire = {
  id: string;
  name: string;
  dept: string;
  startDate: string;
  phase: number;
  completion: number;
  buddy: { name: string; initials: string; role: string };
  avatarText: string;
  color: string;
  email: string;
  templateType: string;
  hasWarning?: boolean;
};

type ChecklistTask = {
  id: string;
  text: string;
  phase: number;
  done: boolean;
  subtext?: string;
  hasAction?: boolean;
};

type OnboardingDoc = {
  id: string;
  name: string;
  type: string;
  status: string;
};

type OnboardingSummary = {
  active: number;
  avgCompletion: number;
  overdueTasks: number;
  completingSoon: number;
};

export default function OnboardingModulePage() {
  const [activeTab, setActiveTab] = useState<string>("Onboarding Hub");
  const [selectedHireId, setSelectedHireId] = useState<string>("");
  const [newHires, setNewHires] = useState<NewHire[]>([]);
  const [checklist, setChecklist] = useState<ChecklistTask[]>([]);
  const [documents, setDocuments] = useState<OnboardingDoc[]>([]);
  const [summary, setSummary] = useState<OnboardingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailTemplate, setEmailTemplate] = useState<string>("");
  const [customMessageBody, setCustomMessageBody] = useState<string>("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [hiresRes, summaryRes] = await Promise.all([
          apiClient.get('/hr/onboarding'),
          apiClient.get('/hr/onboarding/summary'),
        ]);
        const items = hiresRes.data.data;
        setNewHires(items);
        setSummary(summaryRes.data.data);
        if (items.length > 0) {
          setSelectedHireId(items[0].id);
          handleSelectHireContext(items[0]);
        }
      } catch (err) {
        console.error('Failed to fetch onboarding data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const activeHire = useMemo(() => {
    return newHires.find(h => h.id === selectedHireId) || newHires[0];
  }, [selectedHireId, newHires]);

  const toggleChecklistItem = async (id: string) => {
    const task = checklist.find(t => t.id === id);
    if (!task) return;
    try {
      await apiClient.patch(`/hr/onboarding/${selectedHireId}/tasks/${id}`, { done: !task.done });
      setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
    } catch (err) {
      console.error('Failed to toggle task', err);
    }
  };

  const handleSelectHireContext = async (hire: NewHire) => {
    setSelectedHireId(hire.id);
    setEmailTemplate(hire.templateType);
    setCustomMessageBody(
      `Hi ${hire.name},\n\nWelcome to the ${hire.dept} team at Antrosys! We are excited to for you to start on ${hire.startDate}.\n\nPlease review your onboarding dashboard to complete your initial tasks.`
    );
    try {
      const res = await apiClient.get(`/hr/onboarding/${hire.id}`);
      const data = res.data.data;
      setChecklist(data.tasks || []);
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('Failed to fetch onboarding details', err);
    }
  };

  const handleSendMessage = async () => {
    if (!activeHire || sending) return;
    setSending(true);
    try {
      await apiClient.post(`/hr/onboarding/${activeHire.id}/communicate`, {
        templateType: emailTemplate,
        messageBody: customMessageBody,
        recipientEmail: activeHire.email,
      });
      alert('Message sent successfully!');
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="animate-pulse p-4 space-y-6">
          <div className="h-12 bg-muted rounded-lg w-64" />
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 p-4 md:p-6">

      <div className="flex border-b border-border mb-6 gap-6 text-xs font-medium">
        {["Onboarding Hub", "Global View", "Assignments", "Templates"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2.5 transition border-b-2 font-bold ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 pb-1.5">
          <button className="bg-primary/10 text-primary hover:bg-primary/20 text-[11px] font-bold px-2.5 py-1 rounded">
            Add New Hire
          </button>
          <div className="h-4 w-px bg-border mx-1" />
          <Bell className="h-4 w-4 text-muted-foreground cursor-pointer" />
          <div className="w-6 h-6 rounded-full bg-muted border border-border" />
        </div>
      </div>

      <section className="space-y-6">
        <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-foreground">Onboarding management</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{summary?.active || 0} active onboardings across {new Set(newHires.map(h => h.dept)).size} departments.</p>
            </div>
            <button
              onClick={() => alert("Initializing system sequencing configuration run workflow.")}
              className="self-start md:self-center bg-primary text-primary-foreground font-semibold text-xs py-1.5 px-3 rounded-md shadow-xs hover:opacity-90 active:scale-[0.98] transition flex items-center gap-1"
            >
              <span>⚡ Start onboarding</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 bg-muted/30 border border-border rounded-lg">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Active</span>
              <div className="text-lg font-bold text-foreground mt-0.5 flex items-baseline gap-1.5">
                <span>{summary?.active ?? 6}</span>
                <span className="text-[10px] text-emerald-500 font-medium">+2 this week</span>
              </div>
            </div>
            <div className="p-3 bg-muted/30 border border-border rounded-lg">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Avg Completion</span>
              <div className="text-lg font-bold text-foreground mt-0.5 flex items-center gap-2">
                <span>{summary?.avgCompletion ?? 42}%</span>
                <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            </div>
            <div className="p-3 bg-muted/30 border border-border rounded-lg">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Overdue Tasks</span>
              <div className="text-lg font-bold text-destructive mt-0.5 flex items-baseline gap-1.5">
                <span>{summary?.overdueTasks ?? 3}</span>
                <span className="text-[10px] text-muted-foreground font-normal">across 2 hires</span>
              </div>
            </div>
            <div className="p-3 bg-muted/30 border border-border rounded-lg">
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Completing Soon</span>
              <div className="text-lg font-bold text-foreground mt-0.5 flex items-baseline gap-1.5">
                <span>{summary?.completingSoon ?? 1}</span>
                <span className="text-[10px] text-muted-foreground font-normal">next 7 days</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/50">
            <div className="flex justify-between items-center text-[11px] text-muted-foreground mb-1.5 font-medium">
              <span>New hires by phase</span>
              <span className="font-bold text-foreground">Total: {newHires.length}</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden flex">
              {[1, 2, 3, 4, 5].map((phase) => {
                const count = newHires.filter(h => h.phase === phase || (h.completion === 100 && phase === 5)).length;
                const pct = newHires.length > 0 ? (count / newHires.length) * 100 : 0;
                if (count === 0) return null;
                const colors = ['bg-primary', 'bg-blue-400', 'bg-indigo-400', 'bg-violet-400', 'bg-emerald-500'];
                return (
                  <div
                    key={phase}
                    className={`${colors[phase - 1]} h-full border-r border-card last:border-r-0 transition-all`}
                    style={{ width: `${pct}%` }}
                    title={`Phase ${phase}: ${count} hire${count > 1 ? 's' : ''}`}
                  />
                );
              })}
            </div>
            <div className="grid grid-cols-6 text-[9px] text-center font-bold tracking-tight text-muted-foreground mt-1 uppercase">
              <div>Pre-joining ({newHires.filter(h => h.phase === 1).length})</div>
              <div>IT setup ({newHires.filter(h => h.phase === 2).length})</div>
              <div>HR docs ({newHires.filter(h => h.phase === 3).length})</div>
              <div>Team Intros ({newHires.filter(h => h.phase === 4).length})</div>
              <div>Training ({newHires.filter(h => h.phase === 5 && h.completion < 100).length})</div>
              <div>Completed ({newHires.filter(h => h.completion === 100).length})</div>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/40 font-bold">
                <th className="p-3 pl-4">New Hire</th>
                <th className="p-3">Dept</th>
                <th className="p-3">Start Date</th>
                <th className="p-3">Phase</th>
                <th className="p-3 text-center">Completion</th>
                <th className="p-3 text-center">Buddy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-xs">
              {newHires.map((hire) => {
                const isTargetActive = selectedHireId === hire.id;
                return (
                  <tr
                    key={hire.id}
                    onClick={() => handleSelectHireContext(hire)}
                    className={`cursor-pointer transition ${isTargetActive ? "bg-secondary/60 font-medium" : "hover:bg-muted/40"}`}
                  >
                    <td className="p-3 pl-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${hire.color} shrink-0`}>
                          {hire.avatarText}
                        </div>
                        <div>
                          <span className="font-bold text-foreground text-sm flex items-center gap-1">
                            {hire.name}
                            {hire.hasWarning && <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground font-semibold">{hire.dept}</td>
                    <td className="p-3 text-foreground font-medium">{hire.startDate}</td>
                    <td className="p-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((step) => (
                          <div
                            key={step}
                            className={`w-3 h-1.5 rounded-xs ${step <= hire.phase ? "bg-primary" : "bg-muted"}`}
                          />
                        ))}
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${hire.completion === 100 ? "bg-emerald-500" : "bg-primary animate-pulse"}`} />
                        <span className={`font-bold ${hire.completion === 100 ? "text-emerald-600" : "text-foreground"}`}>{hire.completion}%</span>
                      </div>
                    </td>
                    <td className="p-3 text-center">
                      <div className="w-6 h-6 rounded-full bg-muted border border-border mx-auto flex items-center justify-center text-[9px] font-bold text-muted-foreground" title={hire.buddy.name}>
                        {hire.buddy.initials}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-8 space-y-4">
            <div className="flex items-start justify-between border-b border-border pb-3">
              <div>
                <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-2 py-0.5 rounded uppercase">My Onboarding Journey</span>
                <h3 className="text-base font-bold text-foreground tracking-tight mt-1">Welcome to Antrosys, {activeHire?.name || 'there'}!</h3>
                <p className="text-xs text-muted-foreground mt-0.5">We are thrilled to welcome you to our dynamic engineering ecosystem vector layout track layout frameworks.</p>
              </div>
              <div className="bg-muted border border-border text-foreground px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Day {Math.ceil((activeHire ? (Date.now() - new Date(activeHire.startDate).getTime()) / 86400000 : 5))} of 30</span>
              </div>
            </div>

            <div className="bg-muted/40 border border-border/80 rounded-xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                {activeHire?.buddy?.initials || '--'}
              </div>
              <div className="text-xs space-y-1">
                <p className="text-foreground/90 italic font-serif leading-relaxed">
                  &ldquo;I'm your designated operational buddy context system parameter lead. Reach out downstream if you notice pipeline synchronization locks or blockages!&rdquo;
                </p>
                <span className="text-[10px] text-muted-foreground block font-semibold">— {activeHire?.buddy?.name || 'Unassigned'}, {activeHire?.buddy?.role || ''}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">Phase {activeHire?.phase || 1} Task Assignments</span>
                <span className="text-[11px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded">
                  {checklist.filter(c => c.done).length} of {checklist.length} Completed
                </span>
              </div>

              <div className="space-y-2.5">
                {checklist.filter(t => t.phase === (activeHire?.phase || 1)).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleChecklistItem(task.id)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer select-none ${
                      task.done ? "bg-muted/40 border-border/60 opacity-60" : "bg-card border-border hover:border-muted-foreground/30"
                    }`}
                  >
                    <button className="mt-0.5 shrink-0 text-primary">
                      {task.done ? <CheckSquare className="h-4 w-4 fill-primary/10" /> : <Square className="h-4 w-4 text-muted-foreground/60" />}
                    </button>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={`text-xs font-semibold text-foreground leading-none ${task.done ? "line-through text-muted-foreground font-normal" : ""}`}>
                        {task.text}
                      </p>
                      {task.subtext && <p className="text-[11px] text-muted-foreground leading-normal">{task.subtext}</p>}
                      {task.hasAction && !task.done && (
                        <button
                          onClick={(e) => { e.stopPropagation(); alert("Routing external calendar invite dialog interface context."); }}
                          className="text-[11px] text-primary font-bold hover:underline block pt-0.5"
                        >
                          View Calendar →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-4 flex flex-col">

            <div className="bg-card border border-border rounded-xl shadow-xs p-4 space-y-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Your Onboarding Buddy</span>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                  {activeHire?.buddy?.initials || '--'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">{activeHire?.buddy?.name || 'Unassigned'}</h4>
                  <span className="text-[11px] text-muted-foreground block">{activeHire?.buddy?.role || ''}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-xs p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Documents</span>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 rounded">{documents.filter(d => d.status === 'pending').length} pending</span>
              </div>

              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className={`p-2.5 rounded-lg flex items-center justify-between text-xs ${
                    doc.status === 'done' ? 'bg-muted/40 border border-border' : 'bg-card border border-border group hover:border-primary/40 transition'
                  }`}>
                    <div className="flex items-center gap-2 truncate">
                      <FileText className={`h-4 w-4 shrink-0 ${doc.status === 'done' ? 'text-emerald-600' : 'text-rose-500'}`} />
                      <span className="font-medium truncate text-foreground">{doc.name}</span>
                    </div>
                    {doc.status === 'done' ? (
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 rounded uppercase shrink-0">Done</span>
                    ) : (
                      <button
                        onClick={() => alert("Triggering file system local context ingestion.")}
                        className="text-[10px] border border-border px-2 py-0.5 rounded bg-card hover:bg-muted font-semibold transition shrink-0 flex items-center gap-1"
                      >
                        <Upload className="h-3 w-3" /> Upload
                      </button>
                    )}
                  </div>
                ))}
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
            <p className="text-xs text-muted-foreground mt-0.5">Send custom or automated transactional welcome messages down pipelines directly to recent hires.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            <div className="space-y-3.5 lg:col-span-6 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground uppercase text-[10px] mb-1">Recipients Selection</label>
                <div className="p-2 bg-muted/40 border border-border rounded-lg flex flex-wrap gap-1.5 items-center">
                  <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-md border border-primary/10 flex items-center gap-1">
                    {activeHire?.name || 'N/A'} <span className="text-[10px] text-muted-foreground">({activeHire?.email || ''})</span>
                  </span>
                  <input
                    type="text"
                    placeholder="Add targets..."
                    className="bg-transparent focus:outline-none text-xs text-foreground p-0.5 flex-1 min-w-[80px]"
                    disabled
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-muted-foreground uppercase text-[10px] mb-1">System Template Layout</label>
                <input
                  type="text"
                  value={emailTemplate}
                  onChange={(e) => setEmailTemplate(e.target.value)}
                  placeholder="Template name..."
                  className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium text-foreground"
                />
              </div>

              <div>
                <label className="block font-bold text-muted-foreground uppercase text-[10px] mb-1">Message Body</label>
                <textarea
                  rows={4}
                  value={customMessageBody}
                  onChange={(e) => setCustomMessageBody(e.target.value)}
                  className="w-full p-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium leading-relaxed font-mono text-foreground"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => alert("Draft staged to transactional state log saved.")}
                  className="px-3 py-1.5 border border-border rounded-md text-xs font-bold bg-card hover:bg-muted text-foreground transition"
                >
                  Save Draft
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={sending}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90 transition shadow-xs disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{sending ? 'Sending...' : 'Send Message'}</span>
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
                  <div><span className="font-bold text-foreground/70">To:</span> {activeHire?.email || ''}</div>
                  <div><span className="font-bold text-foreground/70">Subject:</span> Welcome to Antrosys!</div>
                </div>

                <div className="whitespace-pre-wrap font-medium leading-relaxed text-foreground bg-muted/20 p-3 rounded-lg border border-border/40 select-none">
                  {customMessageBody}
                </div>
              </div>
            </div>

          </div>
        </div>

      </section>

    </div>
  );
}
