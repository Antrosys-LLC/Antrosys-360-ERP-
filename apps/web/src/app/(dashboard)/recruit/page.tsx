"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Bell, 
  Filter, 
  Upload, 
  MoreHorizontal, 
  Paperclip, 
  Clock, 
  MousePointer2,
  X,
  Star,
  Mail,
  Loader2,
  AlertCircle,
  Plus
} from 'lucide-react';
import {
  fetchRequisitions,
  fetchCandidates,
  fetchRecruitMetrics,
  updateCandidateStage,
  createRequisition,
  updateRequisition,
  createCandidate,
  type ApiRequisition,
  type ApiCandidate,
  type ApiMetrics,
  type PipelineStage,
} from '@/lib/recruit-api';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface User {
  initials: string;
  name: string;
  role: string;
}

export interface KanbanColumn {
  id: PipelineStage;
  title: string;
  hasMenu: boolean;
}

export interface InterviewSchedule {
  month: string;
  day: string;
  title: string;
  time: string;
  location: string;
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
}

// ==========================================
// CONSTANTS
// ==========================================

const currentUserMock: User = {
  initials: 'AU',
  name: 'Admin User',
  role: 'SYSTEM OWNER',
};

const kanbanColumnsMeta: KanbanColumn[] = [
  { id: 'APPLIED',    title: 'APPLIED',    hasMenu: true },
  { id: 'SCREENING',  title: 'SCREENING',  hasMenu: false },
  { id: 'INTERVIEW',  title: 'INTERVIEW',  hasMenu: false },
  { id: 'OFFER',      title: 'OFFER',      hasMenu: false },
  { id: 'HIRED',      title: 'HIRED',      hasMenu: false },
];

// ==========================================
// HELPERS
// ==========================================

function buildInterviewSchedule(candidate: ApiCandidate): InterviewSchedule | undefined {
  if (!candidate.interviewAt) return undefined;
  const d = new Date(candidate.interviewAt);
  return {
    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
    day: String(d.getDate()),
    title: candidate.interviewTitle ?? 'Interview',
    time: d.toLocaleString('en', { hour: '2-digit', minute: '2-digit', hour12: true }),
    location: candidate.interviewLocation ?? 'TBD',
  };
}

function formatTimeAgo(dateStr: string): string {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ==========================================
// DUMB COMPONENTS (design unchanged)
// ==========================================

const HeaderTop = ({ user, activeView, setActiveView }: { user: User; activeView: string; setActiveView: (v: string) => void }) => (
  <header className="flex items-center justify-between py-4 mb-6 border-b border-b-[var(--border)]">
    <div>
      <nav aria-label="Breadcrumb" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">
        HR &amp; Talent <span className="mx-1" aria-hidden="true">&gt;</span> Recruitment
      </nav>
      <h1 className="text-2xl font-bold text-foreground">Recruitment &amp; talent</h1>
    </div>
    
    <div className="flex items-center gap-4">
      <nav aria-label="View toggle" className="flex bg-muted rounded-full p-1 border border-border">
        <button onClick={() => setActiveView('list')} className={`px-4 py-1 text-sm font-medium rounded-full ${activeView === 'list' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background'}`}>List</button>
        <button onClick={() => setActiveView('pipeline')} className={`px-4 py-1 text-sm font-medium rounded-full ${activeView === 'pipeline' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background'}`}>Pipeline</button>
        <button onClick={() => setActiveView('analytics')} className={`px-4 py-1 text-sm font-medium rounded-full ${activeView === 'analytics' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background'}`}>Analytics</button>
      </nav>
      
      <button className="p-2 text-muted-foreground hover:text-foreground" aria-label="Notifications">
        <Bell size={20} />
      </button>
      
      <div className="flex items-center gap-2 border-l border-border pl-4">
        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden" aria-hidden="true">
          <span className="text-white text-xs font-bold">{user.initials}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground leading-none">{user.name}</span>
          <span className="text-xs text-muted-foreground">{user.role}</span>
        </div>
      </div>
    </div>
  </header>
);

const JobRequisitionsTable = ({
  jobs,
  loading,
  onAddJob,
  onExport,
  onManage,
}: {
  jobs: ApiRequisition[];
  loading: boolean;
  onAddJob: () => void;
  onExport: () => void;
  onManage: (job: ApiRequisition) => void;
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const [filterText, setFilterText] = useState('');

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(filterText.toLowerCase()) || 
    job.department.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
  <section className="bg-card border border-border rounded-[var(--radius)] mb-8 shadow-sm">
    <header className="flex flex-col gap-4 p-4 border-b border-border">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Active Job Requisitions</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowFilter(!showFilter)} className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded hover:bg-muted ${showFilter ? 'bg-muted text-foreground' : 'text-foreground'}`}>
            <Filter size={16} /> Filter
          </button>
          <button onClick={onExport} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded text-foreground hover:bg-muted">
            <Upload size={16} /> Export
          </button>
          <button
            onClick={onAddJob}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90"
          >
            <Plus size={16} /> New Req
          </button>
        </div>
      </div>
      {showFilter && (
        <div>
          <input 
            type="text" 
            placeholder="Search by position or department..." 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full sm:w-1/3 px-3 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary bg-background text-foreground"
          />
        </div>
      )}
    </header>

    {loading ? (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading requisitions…</span>
      </div>
    ) : jobs.length === 0 ? (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
        <AlertCircle size={24} />
        <p className="text-sm">No job requisitions yet.</p>
      </div>
    ) : (
      <div className="w-full text-sm" role="table" aria-label="Job Requisitions">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wider" role="row">
          <div className="col-span-3" role="columnheader">Position Name</div>
          <div className="col-span-3" role="columnheader">Department</div>
          <div className="col-span-2" role="columnheader">Applicants</div>
          <div className="col-span-3" role="columnheader">Pipeline Health</div>
          <div className="col-span-1 text-right" role="columnheader">Actions</div>
        </div>
        
        <div className="flex flex-col" role="rowgroup">
          {filteredJobs.map((job, idx) => (
            <article key={job.id} className={`grid grid-cols-12 gap-4 px-4 py-4 items-center ${idx !== filteredJobs.length - 1 ? 'border-b border-border' : ''}`} role="row">
              <div className="col-span-3" role="cell">
                <div className="font-semibold text-primary">{job.title}</div>
                <div className="text-xs text-muted-foreground mt-1">ID: {job.id.slice(0, 8)} • Posted {job.postedAgo}</div>
              </div>
              <div className="col-span-3 text-muted-foreground" role="cell">{job.department}</div>
              <div className="col-span-2 font-semibold text-foreground" role="cell">{job.applicants} Candidates</div>
              <div className="col-span-3 flex flex-col gap-1" role="cell">
                {job.applicants > 0 ? (
                  <>
                    <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-muted" aria-hidden="true">
                      {job.pipeline.map((count, i) => (
                        <div
                          key={i}
                          className="h-full border-r border-background last:border-0"
                          style={{
                            width: `${(count / job.applicants) * 100}%`,
                            backgroundColor: `hsl(var(--primary) / ${1 - i * 0.15})`,
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex text-[10px] text-muted-foreground w-full justify-between" aria-hidden="true">
                      {job.pipeline.map((count, i) => <span key={i}>{count}</span>)}
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">No applicants yet</span>
                )}
              </div>
              <div className="col-span-1 text-right" role="cell">
                <button onClick={() => onManage(job)} className="text-primary hover:underline text-sm font-medium">Manage</button>
              </div>
            </article>
          ))}
          {filteredJobs.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">No requisitions found.</div>
          )}
        </div>
      </div>
    )}
  </section>
)};

const CandidateCard = ({
  candidate,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging,
}: {
  candidate: ApiCandidate;
  onClick?: (candidate: ApiCandidate) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  isDragging?: boolean;
}) => {
  const ratingDisplay = candidate.rating ? parseFloat(candidate.rating).toFixed(1) : null;
  const timeAgo = formatTimeAgo(candidate.createdAt);

  return (
    <article
      onClick={() => onClick?.(candidate)}
      role="button"
      tabIndex={0}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(candidate)}
      className={`p-4 bg-card border rounded-[var(--radius)] flex flex-col ${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}
      ${isDragging ? 'border-2 border-primary shadow-sm opacity-60 select-none' : 'border-border shadow-sm'}
    `}
    >
      <header className="flex justify-between items-start mb-2">
        <h4 className={`font-bold text-base ${isDragging ? 'text-primary' : 'text-foreground'}`}>
          {candidate.name}
        </h4>
        {ratingDisplay && (
          <span
            className={`px-1.5 py-0.5 text-xs font-bold rounded ${
              candidate.ratingType === 'primary'
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {ratingDisplay}
          </span>
        )}
      </header>

      <p className="text-sm text-muted-foreground mb-4">
        {candidate.role} {candidate.experience && `• ${candidate.experience}`}
      </p>

      {candidate.tag && (
        <div className="mb-3">
          <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${candidate.tagColor}`}>
            {candidate.tag}
          </span>
        </div>
      )}

      {(timeAgo || isDragging) && (
        <footer className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2">
          <div className="flex items-center gap-2">
            {timeAgo && (
              <span className="flex items-center gap-1.5 font-medium">
                <Clock size={14} /> {timeAgo}
              </span>
            )}
            {isDragging && (
              <span className="flex items-center gap-1.5 text-primary font-bold">
                <MousePointer2 size={14} className="fill-primary" /> Dragging
              </span>
            )}
          </div>
        </footer>
      )}
    </article>
  );
};

const MetricsFooter = ({ metrics, loading }: { metrics: Metric[]; loading: boolean }) => (
  <section className="inline-flex items-center bg-card py-6 px-2 mt-4 border border-border shadow-sm rounded-[var(--radius)]" aria-label="Key Metrics">
    {loading ? (
      <div className="flex items-center gap-2 px-6 text-muted-foreground text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading metrics…
      </div>
    ) : (
      metrics.map((metric, idx) => (
        <React.Fragment key={metric.id}>
          <div className="flex flex-col px-6">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
              {metric.label}
            </span>
            <span className={`text-[24px] leading-none font-bold ${metric.highlight ? 'text-primary' : 'text-foreground'}`}>
              {metric.value}
            </span>
          </div>
          {idx < metrics.length - 1 && (
            <div className="w-[1px] h-10 bg-border" aria-hidden="true" />
          )}
        </React.Fragment>
      ))
    )}
  </section>
);

const PIPELINE_STAGES: PipelineStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];

const stageBadgeColors: Record<PipelineStage, string> = {
  APPLIED:   'bg-blue-500/10 text-blue-500',
  SCREENING: 'bg-yellow-500/10 text-yellow-600',
  INTERVIEW: 'bg-purple-500/10 text-purple-500',
  OFFER:     'bg-green-500/10 text-green-600',
  HIRED:     'bg-emerald-500/10 text-emerald-600',
  REJECTED:  'bg-red-500/10 text-red-500',
};

const CandidateList = ({
  candidates,
  onStageChange,
}: {
  candidates: ApiCandidate[];
  onStageChange: (candidateId: string, stage: PipelineStage) => void;
}) => (
  <section className="bg-card border border-border rounded-[var(--radius)] mb-8 shadow-sm">
    <div className="w-full text-sm" role="table">
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <div className="col-span-4">Candidate</div>
        <div className="col-span-3">Role / Experience</div>
        <div className="col-span-3">Stage</div>
        <div className="col-span-2 text-right">Rating</div>
      </div>
      <div className="flex flex-col">
        {candidates.map((c, idx) => (
          <article key={c.id} className={`grid grid-cols-12 gap-4 px-4 py-4 items-center ${idx !== candidates.length - 1 ? 'border-b border-border' : ''}`}>
            <div className="col-span-4 font-semibold text-foreground">{c.name}</div>
            <div className="col-span-3 text-muted-foreground">{c.role} {c.experience && `• ${c.experience}`}</div>
            <div className="col-span-3">
              <select
                value={c.pipelineStage}
                onChange={(e) => onStageChange(c.id, e.target.value as PipelineStage)}
                className={`px-2.5 py-1 text-xs font-bold rounded border-0 outline-none cursor-pointer focus:ring-1 focus:ring-primary ${stageBadgeColors[c.pipelineStage]}`}
                aria-label={`Stage for ${c.name}`}
              >
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 text-right font-medium">
              {c.rating ? parseFloat(c.rating).toFixed(1) : '—'}
            </div>
          </article>
        ))}
        {candidates.length === 0 && (
          <div className="py-8 text-center text-muted-foreground">No candidates found</div>
        )}
      </div>
    </div>
  </section>
);

const CandidateAnalytics = ({ metrics }: { metrics: Metric[] }) => (
  <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
    {metrics.map(m => (
      <div key={m.id} className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-sm flex flex-col justify-center items-center text-center">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">{m.label}</h3>
        <div className={`text-4xl font-bold ${m.highlight ? 'text-primary' : 'text-foreground'}`}>
          {m.value}
        </div>
      </div>
    ))}
  </section>
);

const CandidateSidePanel = ({
  isOpen,
  onClose,
  candidate,
}: {
  isOpen: boolean;
  onClose: () => void;
  candidate: ApiCandidate | null;
}) => {
  if (!candidate) return null;

  const ratingDisplay = candidate.rating ? parseFloat(candidate.rating).toFixed(1) : null;
  const interviewSchedule = buildInterviewSchedule(candidate);
  const pipelineProgressMap: Record<PipelineStage, number> = {
    APPLIED: 1, SCREENING: 2, INTERVIEW: 3, OFFER: 4, HIRED: 5, REJECTED: 0,
  };
  const progress = pipelineProgressMap[candidate.pipelineStage] ?? 1;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
      >
        <div className="p-6 overflow-y-auto flex-1">
          <header className="flex justify-between items-start mb-8">
            <div className="flex gap-4 items-center">
              <div className="w-16 h-16 rounded-2xl bg-[#EBE4FF] text-[#5B32EA] flex items-center justify-center text-2xl font-bold" aria-hidden="true">
                {candidate.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{candidate.name}</h2>
                <p className="text-slate-500 text-sm">Candidate ID: {candidate.id.slice(0, 8)}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              aria-label="Close panel"
            >
              <X size={24} />
            </button>
          </header>

          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pipeline Status</h3>
            <div className="flex gap-2 mb-4" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className={`h-2.5 flex-1 rounded-full ${i <= progress ? 'bg-[#5B32EA]' : 'bg-slate-100'}`}
                />
              ))}
            </div>
            <p className="font-bold text-[15px] text-slate-900">
              Stage: {candidate.pipelineStage.charAt(0) + candidate.pipelineStage.slice(1).toLowerCase()}
            </p>
          </section>

          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Average Rating</h3>
            <div className="flex items-center gap-3">
              <div className="flex text-[#5B32EA]" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="fill-current" size={24} />
                ))}
              </div>
              <span className="font-bold text-xl text-slate-900">{ratingDisplay ?? 'N/A'}</span>
            </div>
          </section>

          {interviewSchedule && (
            <section className="mb-8">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Interview Schedule</h3>
                <div className="flex gap-4 items-center">
                  <div className="border border-slate-200 rounded-lg py-2 px-3 text-center bg-white shadow-sm w-16">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">{interviewSchedule.month}</div>
                    <div className="text-xl font-bold text-[#5B32EA] leading-none">{interviewSchedule.day}</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-[15px] mb-1">{interviewSchedule.title}</h4>
                    <p className="text-sm text-slate-500 font-medium">
                      {interviewSchedule.time} • {interviewSchedule.location}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {candidate.skills && candidate.skills.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Skills &amp; Tags</h3>
              <ul className="flex flex-wrap gap-2.5">
                {candidate.skills.map((skill) => (
                  <li
                    key={skill}
                    className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <footer className="p-6 border-t border-slate-100 bg-white">
          <div className="flex gap-3">
            <button className="flex-1 bg-[#5B32EA] text-white py-3.5 rounded-lg font-bold hover:bg-[#4A28C4] transition-colors shadow-sm text-sm">
              View Full Profile
            </button>
            {candidate.email && (
              <a
                href={`mailto:${candidate.email}`}
                className="px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
                aria-label="Email candidate"
              >
                <Mail size={20} />
              </a>
            )}
          </div>
        </footer>
      </aside>
    </>
  );
};

// ─── Requisition Modal ────────────────────────────────────────────────

const RequisitionModal = ({
  isOpen,
  onClose,
  onSubmit,
  saving,
  initialData,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { id?: string, title: string; department: string }) => void;
  saving: boolean;
  initialData?: ApiRequisition | null;
}) => {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  const DEPARTMENTS = ['Engineering', 'Operations', 'Sales', 'Finance', 'HR'];
  const showCustomDept = selectedDept === 'Other';

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title);
        const dept = initialData.department;
        if (DEPARTMENTS.includes(dept)) {
          setSelectedDept(dept);
          setDepartment(dept);
        } else {
          setSelectedDept('Other');
          setDepartment(dept);
        }
      } else {
        setTitle('');
        setSelectedDept('');
        setDepartment('');
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !department.trim()) return;
    onSubmit({ id: initialData?.id, title: title.trim(), department: department.trim() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-2xl w-full max-w-md">
        <h2 className="text-lg font-bold mb-4 text-foreground">{initialData ? 'Edit Requisition' : 'New Job Requisition'}</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Position Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Senior Product Designer"
              required
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedDept(val);
                if (val !== 'Other') {
                  setDepartment(val);
                } else {
                  setDepartment('');
                }
              }}
              required
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="" disabled>Select department</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
              <option value="Other">Other</option>
            </select>
            {showCustomDept && (
              <input
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Enter department name"
                required
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary mt-2"
              />
            )}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded text-foreground hover:bg-muted">Cancel</button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {initialData ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ==========================================
// SMART CONTAINER (Page Level)
// ==========================================

export default function RecruitmentPage() {
  // ─── Data State ──────────────────────────────────────────────────────────
  const [requisitions, setRequisitions] = useState<ApiRequisition[]>([]);
  const [candidates, setCandidates] = useState<ApiCandidate[]>([]);
  const [metrics, setMetrics] = useState<ApiMetrics | null>(null);

  // ─── Loading / Error State ───────────────────────────────────────────────
  const [reqLoading, setReqLoading] = useState(true);
  const [candLoading, setCandLoading] = useState(true);
  const [metricsLoading, setMetricsLoading] = useState(true);

  // ─── UI State ────────────────────────────────────────────────────────────
  const [activeView, setActiveView] = useState('pipeline');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [showNewReqModal, setShowNewReqModal] = useState(false);
  const [editingReq, setEditingReq] = useState<ApiRequisition | null>(null);
  const [savingReq, setSavingReq] = useState(false);

  // ─── Derived ─────────────────────────────────────────────────────────────
  const selectedCandidate = useMemo(
    () => (selectedCandidateId ? candidates.find((c) => c.id === selectedCandidateId) ?? null : null),
    [selectedCandidateId, candidates],
  );

  const metricsDisplay: Metric[] = useMemo(() => {
    if (!metrics) return [];
    return [
      { id: 'm-1', label: 'TOTAL APPLICANTS',  value: metrics.totalApplicants.toLocaleString() },
      { id: 'm-2', label: 'AVG. TIME TO HIRE', value: metrics.avgTimeToHire },
      { id: 'm-3', label: 'OFFER ACCEPTANCE',  value: metrics.offerAcceptance, highlight: true },
      { id: 'm-4', label: 'OPEN POSITIONS',    value: String(metrics.openPositions) },
      { id: 'm-5', label: 'INTERVIEWS TODAY',  value: String(metrics.interviewsToday), highlight: true },
    ];
  }, [metrics]);

  // ─── Data Fetching ───────────────────────────────────────────────────────
  const loadRequisitions = useCallback(async () => {
    setReqLoading(true);
    try {
      const { items } = await fetchRequisitions({ status: 'ACTIVE', limit: 50 });
      setRequisitions(items);
    } catch {
      // Silent — table shows empty state
    } finally {
      setReqLoading(false);
    }
  }, []);

  const loadCandidates = useCallback(async () => {
    setCandLoading(true);
    try {
      const { items } = await fetchCandidates({ limit: 200 });
      setCandidates(items);
    } catch {
      // Silent
    } finally {
      setCandLoading(false);
    }
  }, []);

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const data = await fetchRecruitMetrics();
      setMetrics(data);
    } catch {
      // Silent
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequisitions();
    loadCandidates();
    loadMetrics();
  }, [loadRequisitions, loadCandidates, loadMetrics]);

  // ─── Requisition Actions ──────────────────────────────────────────────────
  const handleSaveRequisition = async (data: { id?: string; title: string; department: string }) => {
    setSavingReq(true);
    try {
      if (data.id) {
        await updateRequisition(data.id, data);
        setEditingReq(null);
      } else {
        await createRequisition(data);
        setShowNewReqModal(false);
      }
      await Promise.all([loadRequisitions(), loadMetrics()]);
    } catch {
      // Could add toast here
    } finally {
      setSavingReq(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Role', 'Experience', 'Rating', 'Pipeline Stage', 'Requisition ID'];
    const csvData = candidates.map(c => 
      [c.name, c.role || '', c.experience || '', c.rating || '', c.pipelineStage, c.jobRequisitionId].join(',')
    );
    const csv = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'candidates_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleClearColumn = async (stage: PipelineStage) => {
    const columnCandidates = candidates.filter((c) => c.pipelineStage === stage);
    if (columnCandidates.length === 0) return;
    const confirmed = window.confirm(`Move all ${columnCandidates.length} candidate(s) in ${stage} to Rejected?`);
    if (!confirmed) return;

    // Optimistic update
    setCandidates((prev) =>
      prev.map((c) => (c.pipelineStage === stage ? { ...c, pipelineStage: 'REJECTED' as PipelineStage } : c)),
    );

    try {
      await Promise.all(columnCandidates.map((c) => updateCandidateStage(c.id, 'REJECTED')));
      loadMetrics();
    } catch {
      // Revert on failure
      setCandidates((prev) =>
        prev.map((c) => (c.pipelineStage === 'REJECTED' && columnCandidates.find((o) => o.id === c.id) ? { ...c, pipelineStage: stage } : c)),
      );
    }
  };

  // ─── Candidate Selection ─────────────────────────────────────────────────
  const handleCandidateClick = (candidate: ApiCandidate) => {
    setSelectedCandidateId(candidate.id);
  };

  const handleStageChange = async (candidateId: string, newStage: PipelineStage) => {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate || candidate.pipelineStage === newStage) return;

    // Optimistic update
    setCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, pipelineStage: newStage } : c));

    try {
      await updateCandidateStage(candidateId, newStage);
      loadMetrics();
    } catch {
      // Revert on failure
      setCandidates((prev) => prev.map((c) => c.id === candidateId ? { ...c, pipelineStage: candidate.pipelineStage } : c));
    }
  };

  const closePanel = () => setSelectedCandidateId(null);

  // ─── Drag & Drop (end-to-end with backend sync) ──────────────────────────
  const handleDragStart = (e: React.DragEvent, candidateId: string) => {
    e.dataTransfer.setData('text/plain', candidateId);
    setTimeout(() => setDraggingId(candidateId), 0);
  };

  const handleDragEnd = () => setDraggingId(null);

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
    e.preventDefault();
    const candidateId = e.dataTransfer.getData('text/plain');
    if (!candidateId) return;

    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate || candidate.pipelineStage === targetStage) {
      setDraggingId(null);
      return;
    }

    // Optimistic UI update
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId ? { ...c, pipelineStage: targetStage } : c,
      ),
    );
    setDraggingId(null);

    // Persist to backend — revert on failure
    try {
      await updateCandidateStage(candidateId, targetStage);
      // Refresh metrics silently (applicant counts per column may shift)
      loadMetrics();
    } catch {
      // Revert optimistic update
      setCandidates((prev) =>
        prev.map((c) =>
          c.id === candidateId ? { ...c, pipelineStage: candidate.pipelineStage } : c,
        ),
      );
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-background p-6 font-sans relative">
      <main className="max-w-[1400px] w-full mx-auto">

        <HeaderTop user={currentUserMock} activeView={activeView} setActiveView={setActiveView} />

        <JobRequisitionsTable
          jobs={requisitions}
          loading={reqLoading}
          onAddJob={() => setShowNewReqModal(true)}
          onExport={handleExportCSV}
          onManage={(job) => setEditingReq(job)}
        />

        {activeView === 'list' && (
          <CandidateList candidates={candidates} onStageChange={handleStageChange} />
        )}

        {activeView === 'analytics' && (
          <CandidateAnalytics metrics={metricsDisplay} />
        )}

        {/* Kanban Board */}
        {activeView === 'pipeline' && (
          <section aria-label="Candidate Pipeline" className="flex gap-4 overflow-x-auto pb-6">
          {candLoading ? (
            <div className="flex items-center gap-2 py-12 text-muted-foreground text-sm mx-auto">
              <Loader2 size={20} className="animate-spin" /> Loading candidates…
            </div>
          ) : (
            kanbanColumnsMeta.map((column) => {
              const columnCandidates = candidates.filter((c) => c.pipelineStage === column.id);

              return (
                <div
                  key={column.id}
                  className="flex-1 min-w-[280px]"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <header className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{column.title}</h3>
                      <span className="px-2 py-0.5 bg-muted border border-border text-foreground text-xs font-bold rounded-md">
                        {columnCandidates.length}
                      </span>
                    </div>
                    {column.hasMenu && (
                      <button onClick={() => handleClearColumn(column.id)} className="text-xs font-semibold text-muted-foreground hover:text-primary uppercase tracking-wider" aria-label={`Clear candidates in ${column.title}`}>
                        Clear
                      </button>
                    )}
                  </header>

                  <div className="bg-card border border-border rounded-[var(--radius)] p-3 flex flex-col gap-3 min-h-[500px]">
                    {columnCandidates.map((candidate) => (
                      <CandidateCard
                        key={candidate.id}
                        candidate={candidate}
                        isDragging={draggingId === candidate.id}
                        onClick={handleCandidateClick}
                        onDragStart={(e) => handleDragStart(e, candidate.id)}
                        onDragEnd={handleDragEnd}
                      />
                    ))}

                    {columnCandidates.length === 0 && (
                      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50 font-medium py-8">
                        Drop candidates here
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>
        )}

        <MetricsFooter metrics={metricsDisplay} loading={metricsLoading} />
      </main>

      <CandidateSidePanel
        isOpen={!!selectedCandidateId}
        onClose={closePanel}
        candidate={selectedCandidate}
      />

      <RequisitionModal
        isOpen={showNewReqModal || !!editingReq}
        onClose={() => { setShowNewReqModal(false); setEditingReq(null); }}
        onSubmit={handleSaveRequisition}
        saving={savingReq}
        initialData={editingReq}
      />
    </div>
  );
}