"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  Layers,
  CheckSquare,
  Square,
  Clock,
  Plus,
  Bell,
  Search,
  MoreHorizontal,
  ChevronRight,
  AlertTriangle,
  Calendar,
  FileText,
  Upload,
  Send,
  HelpCircle,
  Settings,
  Mail,
  UserCheck,
  LayoutDashboard
} from "lucide-react";

/* ==========================================================================
   REALISTIC STATE ARCHITECTURE DATA MODELS
   ========================================================================== */
const MOCK_NEW_HIRES = [
  {
    id: "H-2024-01",
    name: "Sara Javed",
    dept: "Engineering",
    startDate: "Oct 12, 2024",
    phase: 4, // "Team Intros"
    completion: 85,
    buddy: { name: "Zara Khan", initials: "ZK", role: "Senior Frontend Engineer" },
    avatarText: "SJ",
    color: "bg-primary text-primary-foreground",
    email: "sara.javed@antrosys.com",
    templateType: "Standard Welcome - Engineering"
  },
  {
    id: "H-2024-02",
    name: "Musa Ali",
    dept: "Design",
    startDate: "Oct 15, 2024",
    phase: 2, // "IT setup"
    completion: 20,
    buddy: { name: "Ahmed W.", initials: "AW", role: "Product Designer" },
    avatarText: "MA",
    color: "bg-blue-500 text-white",
    email: "musa.ali@antrosys.com",
    templateType: "Standard Welcome - General"
  },
  {
    id: "H-2024-03",
    name: "Rida Khan",
    dept: "Marketing",
    startDate: "Oct 17, 2024",
    phase: 3, // "HR docs"
    completion: 50,
    buddy: { name: "Zainab R.", initials: "ZR", role: "Growth Lead" },
    avatarText: "RK",
    color: "bg-rose-500 text-white",
    hasWarning: true,
    email: "rida.khan@antrosys.com",
    templateType: "Standard Welcome - General"
  },
  {
    id: "H-2024-04",
    name: "Ali Riaz",
    dept: "Sales",
    startDate: "Oct 20, 2024",
    phase: 1, // "Pre-joining"
    completion: 5,
    buddy: { name: "Hamza S.", initials: "HS", role: "Account Exec" },
    avatarText: "AR",
    color: "bg-amber-500 text-white",
    email: "ali.riaz@antrosys.com",
    templateType: "Standard Welcome - General"
  },
  {
    id: "H-2024-05",
    name: "Fawad Ali",
    dept: "Product",
    startDate: "Sep 15, 2024",
    phase: 5, // "Training"
    completion: 100,
    buddy: { name: "Bilal K.", initials: "BK", role: "VP Product" },
    avatarText: "FA",
    color: "bg-emerald-500 text-white",
    email: "fawad.ali@antrosys.com",
    templateType: "Standard Welcome - General"
  }
];

const INITIAL_CHECKLIST_TASKS = [
  { id: "chk-1", text: "Join Slack channels #engineering, #announcements", phase: 4, done: true },
  { id: "chk-2", text: "Schedule 1:1 with Engineering Lead (Fawad)", subtext: "Check his calendar and find a 30m slot this week.", hasAction: true, phase: 4, done: false },
  { id: "chk-3", text: "Attend Friday All-Hands meeting", phase: 4, done: false }
];

export default function OnboardingModulePage() {
  // Navigation & Active Layout States
  const [activeTab, setActiveTab] = useState<string>("Onboarding Hub");
  const [selectedHireId, setSelectedHireId] = useState<string>("H-2024-01");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  
  // Interactive Checklist & Messaging State Management
  const [checklist, setChecklist] = useState(INITIAL_CHECKLIST_TASKS);
  const [emailTemplate, setEmailTemplate] = useState<string>("Standard Welcome - Engineering");
  const [customMessageBody, setCustomMessageBody] = useState<string>(
    "Hi {name},\n\nWelcome to the Engineering team at Antrosys! We are excited to for you to start on Oct 12, 2024.\n\nPlease review your onboarding dashboard to complete your initial tasks."
  );

  // Derive selected active hire context
  const activeHire = useMemo(() => {
    return MOCK_NEW_HIRES.find(h => h.id === selectedHireId) || MOCK_NEW_HIRES[0];
  }, [selectedHireId]);

  // Handle checking/toggling tasks
  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, done: !item.done } : item));
  };

  // Synchronize changes when switching clients to keep preview relevant
  const handleSelectHireContext = (id: string) => {
    setSelectedHireId(id);
    const selected = MOCK_NEW_HIRES.find(h => h.id === id);
    if (selected) {
      setEmailTemplate(selected.templateType);
      setCustomMessageBody(
        `Hi ${selected.name},\n\nWelcome to the ${selected.dept} team at Antrosys! We are excited to for you to start on ${selected.startDate}.\n\nPlease review your onboarding dashboard to complete your initial tasks.`
      );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      
      {/* 1. ERP APP SHELL SIDEBAR COMPONENT */}
      <aside className={`erp-sidebar ${sidebarCollapsed ? "collapsed" : ""}`}>
        <div className="h-[57px] px-4 border-b border-border flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground font-black text-xs">▲</div>
              <div>
                <span className="text-xs font-bold block leading-none text-foreground">Antrosys ERP</span>
                <span className="text-[10px] text-muted-foreground font-medium block mt-0.5">Enterprise Hub</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded hover:bg-muted text-muted-foreground mx-auto"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>

        <div className="p-3">
          {!sidebarCollapsed && (
            <button 
              onClick={() => alert("Launching global recruitment matrix pipeline additions.")}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:opacity-90 transition shadow-sm mb-4"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Folder</span>
            </button>
          )}

          <nav className="space-y-1">
            {[
              { label: "Dashboard", icon: LayoutDashboard },
              { label: "Onboarding", icon: UserCheck, active: true },
              { label: "Employees", icon: Users },
              { label: "Documents", icon: FileText },
              { label: "Settings", icon: Settings },
            ].map((node, i) => (
              <button
                key={i}
                className={`w-full flex items-center gap-2.5 p-2 rounded-md text-xs font-medium transition ${
                  node.active 
                    ? "bg-secondary text-secondary-foreground font-bold" 
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <node.icon className={`h-4 w-4 shrink-0 ${node.active ? "text-primary" : ""}`} />
                {!sidebarCollapsed && <span>{node.label}</span>}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* 2. CORE SYSTEM CONTENT HOUSING WORKSPACE */}
      <div className={`erp-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        
        {/* TOP LAYOUT CONTROL FILTER STRIP */}
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

        {/* COMPREHENSIVE OVERVIEW HUB MODULE METRICS GRID */}
        <section className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-border/60 pb-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-foreground">Onboarding management</h2>
                <p className="text-xs text-muted-foreground mt-0.5">6 active onboardings across 3 departments.</p>
              </div>
              <button 
                onClick={() => alert("Initializing system sequencing configuration run workflow.")}
                className="self-start md:self-center bg-primary text-primary-foreground font-semibold text-xs py-1.5 px-3 rounded-md shadow-xs hover:opacity-90 active:scale-[0.98] transition flex items-center gap-1"
              >
                <span>⚡ Start onboarding</span>
              </button>
            </div>

            {/* Micro Parameter Stat Nodes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-muted/30 border border-border rounded-lg">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Active</span>
                <div className="text-lg font-bold text-foreground mt-0.5 flex items-baseline gap-1.5">
                  <span>6</span>
                  <span className="text-[10px] text-emerald-500 font-medium">+2 this week</span>
                </div>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-lg">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Avg Completion</span>
                <div className="text-lg font-bold text-foreground mt-0.5 flex items-center gap-2">
                  <span>42%</span>
                  <div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                </div>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-lg">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Overdue Tasks</span>
                <div className="text-lg font-bold text-destructive mt-0.5 flex items-baseline gap-1.5">
                  <span>3</span>
                  <span className="text-[10px] text-muted-foreground font-normal">across 2 hires</span>
                </div>
              </div>
              <div className="p-3 bg-muted/30 border border-border rounded-lg">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">Completing Soon</span>
                <div className="text-lg font-bold text-foreground mt-0.5 flex items-baseline gap-1.5">
                  <span>1</span>
                  <span className="text-[10px] text-muted-foreground font-normal">next 7 days</span>
                </div>
              </div>
            </div>

            {/* Phased Sequence Visual Progress Bar */}
            <div className="mt-4 pt-3 border-t border-border/50">
              <div className="flex justify-between items-center text-[11px] text-muted-foreground mb-1.5 font-medium">
                <span>New hires by phase</span>
                <span className="font-bold text-foreground">Total: 6</span>
              </div>
              <div className="w-full bg-muted h-2 rounded-full overflow-hidden flex">
                <div className="bg-primary h-full border-r border-card" style={{ width: "20%" }} title="Pre-joining (1)" />
                <div className="bg-blue-400 h-full border-r border-card" style={{ width: "30%" }} title="IT setup (2)" />
                <div className="bg-indigo-400 h-full border-r border-card" style={{ width: "15%" }} title="HR docs (1)" />
                <div className="bg-violet-400 h-full border-r border-card" style={{ width: "20%" }} title="Team Intros (1)" />
                <div className="bg-emerald-500 h-full" style={{ width: "15%" }} title="Completed (1)" />
              </div>
              <div className="grid grid-cols-6 text-[9px] text-center font-bold tracking-tight text-muted-foreground mt-1 uppercase">
                <div>Pre-joining (1)</div>
                <div>IT setup (2)</div>
                <div>HR docs (2)</div>
                <div>Team Intros (1)</div>
                <div>Training (1)</div>
                <div>Completed (1)</div>
              </div>
            </div>
          </div>

          {/* DYNAMIC PIPELINE MATRIX GRID TABLE VIEW */}
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
                {MOCK_NEW_HIRES.map((hire) => {
                  const isTargetActive = selectedHireId === hire.id;
                  return (
                    <tr
                      key={hire.id}
                      onClick={() => handleSelectHireContext(hire.id)}
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

          {/* GRID SECTION LAYER: SPLIT DETAILED CONTEXT JOURNEY CARDS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* CONTEXT ACTIVE MY ONBOARDING JOURNEY ROADMAP CARD */}
            <div className="bg-card border border-border rounded-xl shadow-xs p-5 lg:col-span-8 space-y-4">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <span className="text-[10px] bg-secondary text-secondary-foreground font-bold px-2 py-0.5 rounded uppercase">My Onboarding Journey</span>
                  <h3 className="text-base font-bold text-foreground tracking-tight mt-1">Welcome to Antrosys, {activeHire.name}! 👋</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">We are thrilled to welcome you to our dynamic engineering ecosystem vector layout track layout frameworks.</p>
                </div>
                <div className="bg-muted border border-border text-foreground px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1 shrink-0">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Day 5 of 30</span>
                </div>
              </div>

              {/* Internal Custom Feedback Panel */}
              <div className="bg-muted/40 border border-border/80 rounded-xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                  {activeHire.buddy.initials}
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-foreground/90 italic font-serif leading-relaxed">
                    "I'm your designated operational buddy context system parameter lead. Reach out downstream if you notice pipeline synchronization locks or blockages!"
                  </p>
                  <span className="text-[10px] text-muted-foreground block font-semibold">— {activeHire.buddy.name}, {activeHire.buddy.role}</span>
                </div>
              </div>

              {/* Dynamic Action Checklist Node System */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-border/60 pb-1.5">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider">Phase {activeHire.phase} Task Assignments</span>
                  <span className="text-[11px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded">
                    {checklist.filter(c => c.done).length} of {checklist.length} Completed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {checklist.map((task) => (
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

            {/* ASSOCIATED TEAM & BUDDY METADATA ASIDE PANEL */}
            <div className="space-y-4 lg:col-span-4 flex flex-col">
              
              {/* Buddy Tracking Module */}
              <div className="bg-card border border-border rounded-xl shadow-xs p-4 space-y-3">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Your Onboarding Buddy</span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm">
                    {activeHire.buddy.initials}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{activeHire.buddy.name}</h4>
                    <span className="text-[11px] text-muted-foreground block">{activeHire.buddy.role}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-border flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Next Sync Alignment</span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Friday, 2:00 PM
                  </span>
                </div>
              </div>

              {/* Related Active Onboarding Documentation Cards */}
              <div className="bg-card border border-border rounded-xl shadow-xs p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Documents</span>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 rounded">1 pending</span>
                </div>
                
                <div className="space-y-2">
                  <div className="p-2.5 bg-muted/40 border border-border rounded-lg flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-medium truncate text-foreground">Signed_Offer_Letter.pdf</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-bold px-1.5 rounded uppercase shrink-0">Done</span>
                  </div>
                  
                  <div className="p-2.5 bg-card border border-border rounded-lg flex items-center justify-between text-xs group hover:border-primary/40 transition">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="h-4 w-4 text-rose-500 shrink-0" />
                      <span className="font-medium truncate text-foreground">Employee_Form.docx</span>
                    </div>
                    <button 
                      onClick={() => alert("Triggering file system local context ingestion.")}
                      className="text-[10px] border border-border px-2 py-0.5 rounded bg-card hover:bg-muted font-semibold transition shrink-0 flex items-center gap-1"
                    >
                      <Upload className="h-3 w-3" /> Upload
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Matrix Board Distribution */}
              <div className="bg-card border border-border rounded-xl shadow-xs p-4 space-y-3 flex-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Your Squad Footprint</span>
                <div className="flex items-center gap-1.5">
                  {["ZK", "AW", "ZR", "HS"].map((initials, idx) => (
                    <div key={idx} className="w-7 h-7 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold text-muted-foreground uppercase">
                      {initials}
                    </div>
                  ))}
                  <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-[10px] font-bold uppercase">
                    +4
                  </div>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 p-2 rounded-lg text-[10px] text-amber-800 dark:text-amber-400 font-medium">
                  ⚠️ 2 members away updates tomorrow
                </div>
              </div>
            </div>
          </div>

          {/* INTERACTIVE SIMULATED COMMUNICATION OUTBOUND LOG MANAGEMENT */}
          <div className="bg-card border border-border rounded-xl shadow-xs p-5 space-y-4">
            <div className="border-b border-border pb-2.5">
              <h3 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>Communication Center</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Send custom or automated transactional welcome messages down pipelines directly to recent hires.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Form Input Controllers */}
              <div className="space-y-3.5 lg:col-span-6 text-xs">
                <div>
                  <label className="block font-bold text-muted-foreground uppercase text-[10px] mb-1">Recipients Selection</label>
                  <div className="p-2 bg-muted/40 border border-border rounded-lg flex flex-wrap gap-1.5 items-center">
                    <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-0.5 rounded-md border border-primary/10 flex items-center gap-1">
                      {activeHire.name} <span className="text-[10px] text-muted-foreground">({activeHire.email})</span>
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
                  <select 
                    value={emailTemplate} 
                    onChange={(e) => {
                      setEmailTemplate(e.target.value);
                      setCustomMessageBody(
                        `Hi ${activeHire.name},\n\nThis is an updated custom adjustment template mapping for selection: ${e.target.value}.\n\nPlease review updates.`
                      );
                    }}
                    className="w-full p-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 text-xs font-medium text-foreground"
                  >
                    <option value="Standard Welcome - Engineering">Standard Welcome - Engineering</option>
                    <option value="Standard Welcome - General">Standard Welcome - General</option>
                    <option value="Executive Management Track Notice">Executive Management Track Notice</option>
                  </select>
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
                    onClick={() => alert("Draft staging locked to transactional state log.")}
                    className="px-3 py-1.5 border border-border rounded-md text-xs font-bold bg-card hover:bg-muted text-foreground transition"
                  >
                    Save Draft
                  </button>
                  <button 
                    onClick={() => alert(`Direct dispatch operation complete targeting email address: ${activeHire.email}`)}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:opacity-90 transition shadow-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </div>

              {/* REAL-TIME PREVIEW CONTAINER */}
              <div className="lg:col-span-6 border border-border rounded-xl overflow-hidden shadow-2xs">
                <div className="bg-muted px-4 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Live Preview (Simulating Semi-sweet)
                  </span>
                </div>
                
                <div className="p-4 bg-card space-y-3 font-sans text-xs text-foreground/90">
                  <div className="space-y-1 text-[11px] text-muted-foreground font-mono pb-2.5 border-b border-border/60">
                    <div><span className="font-bold text-foreground/70">From:</span> hr@antrosys.com</div>
                    <div><span className="font-bold text-foreground/70">To:</span> {activeHire.email}</div>
                    <div><span className="font-bold text-foreground/70">Subject:</span> Welcome to Antrosys!</div>
                  </div>
                  
                  <div className="whitespace-pre-wrap font-medium leading-relaxed text-foreground bg-muted/20 p-3 rounded-lg border border-border/40 select-none">
                    {customMessageBody}
                  </div>

                  <div className="text-[10px] text-muted-foreground italic font-medium text-right pt-2 border-t border-border/40">
                    Antrosys Automated Delivery Services Ecosystem • System Block: 2026
                  </div>
                </div>
              </div>

            </div>
          </div>

        </section>

        {/* CLUSTER FOOTER CONTAINER DEFINITIONS */}
        <footer className="mt-12 pt-4 border-t border-border/80 flex flex-col sm:flex-row justify-between items-center text-[10px] text-muted-foreground font-medium gap-2">
          <span>© 2026 Antrosys Enterprise Systems. All rights reserved.</span>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Privacy Policy</span>
            <span className="hover:underline cursor-pointer">Terms of Service</span>
            <span className="hover:underline cursor-pointer">HR Support Terminal</span>
          </div>
        </footer>

      </div>
    </div>
  );
}