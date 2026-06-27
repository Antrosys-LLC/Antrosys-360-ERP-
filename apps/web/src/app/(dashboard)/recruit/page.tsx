"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Info
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export interface Candidate {
  id: string;
  columnId: string;
  isDropZone?: boolean;
  name?: string;
  role?: string;
  exp?: string;
  rating?: string | null;
  ratingType?: 'default' | 'primary';
  files?: number;
  timeAgo?: string;
  isDragging?: boolean;
  tag?: string;
  tagColor?: string;
  initials?: string;
  applicantId?: string;
  pipelineStage?: string;
  pipelineProgress?: number;
  interviewSchedule?: {
    month: string;
    day: string;
    title: string;
    time: string;
    location: string;
  };
  skills?: string[];
}

export interface Metric {
  id: string;
  label: string;
  value: string;
  highlight?: boolean;
}

const CandidateCard = ({ 
  candidate, 
  onClick,
  onDragStart,
  onDragEnd
}: { 
  candidate: Candidate; 
  onClick?: (candidate: Candidate) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}) => {
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
      ${candidate.isDragging ? 'border-2 border-primary shadow-sm opacity-60 select-none' : 'border-border shadow-sm'}
    `}>
      <header className="flex justify-between items-start mb-2">
        <h4 className={`font-bold text-base ${candidate.isDragging ? 'text-primary' : 'text-foreground'}`}>
          {candidate.name}
        </h4>
        {candidate.rating && (
          <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
            candidate.ratingType === 'primary' 
              ? 'bg-primary/10 text-primary' 
              : 'bg-muted text-muted-foreground'
          }`}>
            {candidate.rating}
          </span>
        )}
      </header>
      
      <p className="text-sm text-muted-foreground mb-4">
        {candidate.role} {candidate.exp && `• ${candidate.exp}`}
      </p>

      {candidate.tag && (
        <div className="mb-3">
          <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold ${candidate.tagColor || 'bg-muted text-muted-foreground'}`}>
            {candidate.tag}
          </span>
        </div>
      )}

      {((candidate.files && candidate.files > 0) || candidate.timeAgo || candidate.isDragging) && (
        <footer className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2">
          <div className="flex items-center gap-3">
            {candidate.files && candidate.files > 0 && (
              <span className="flex items-center gap-1.5 font-medium">
                <Paperclip size={14} /> {candidate.files} files
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {candidate.timeAgo && (
              <span className="flex items-center gap-1.5 font-medium">
                <Clock size={14} /> {candidate.timeAgo}
              </span>
            )}
          </div>
        </footer>
      )}
    </article>
  );
};

const CandidateSidePanel = ({ 
  isOpen, 
  onClose, 
  candidate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  candidate: Candidate | null 
}) => {
  if (!candidate) return null;

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
                {candidate.initials || (candidate.name ? candidate.name.charAt(0) : '?')}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{candidate.name}</h2>
                <p className="text-slate-500 text-sm">Candidate ID: {candidate.applicantId || 'N/A'}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1" aria-label="Close panel">
              <X size={24} />
            </button>
          </header>

          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pipeline Status</h3>
            <div className="flex gap-2 mb-4" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`h-2.5 flex-1 rounded-full ${i <= (candidate.pipelineProgress || 1) ? 'bg-[#5B32EA]' : 'bg-slate-100'}`} />
              ))}
            </div>
            <p className="font-bold text-[15px] text-slate-900">Stage: {candidate.pipelineStage || 'In Progress'}</p>
          </section>

          <section className="mb-8">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Average Rating</h3>
            <div className="flex items-center gap-3">
              <div className="flex text-[#5B32EA]" aria-hidden="true">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="fill-current" size={24} />
                ))}
              </div>
              <span className="font-bold text-xl text-slate-900">{candidate.rating || 'N/A'}</span>
            </div>
          </section>

          {candidate.interviewSchedule && (
            <section className="mb-8">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Interview Schedule</h3>
                <div className="flex gap-4 items-center">
                  <div className="border border-slate-200 rounded-lg py-2 px-3 text-center bg-white shadow-sm w-16">
                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">{candidate.interviewSchedule.month}</div>
                    <div className="text-xl font-bold text-[#5B32EA] leading-none">{candidate.interviewSchedule.day}</div>
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-[15px] mb-1">{candidate.interviewSchedule.title}</h4>
                    <p className="text-sm text-slate-500 font-medium">{candidate.interviewSchedule.time} • {candidate.interviewSchedule.location}</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {candidate.skills && candidate.skills.length > 0 && (
            <section className="mb-8">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Skills & Tags</h3>
              <ul className="flex flex-wrap gap-2.5">
                {candidate.skills.map(skill => (
                  <li key={skill} className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white">{skill}</li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <footer className="p-6 border-t border-slate-100 bg-white">
          <div className="flex gap-3">
            <button className="flex-1 bg-[#5B32EA] text-white py-3.5 rounded-lg font-bold hover:bg-[#4A28C4] transition-colors shadow-sm text-sm">View Full Profile</button>
            <button className="px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center" aria-label="Email candidate">
              <Mail size={20} />
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
};

export default function RecruitmentPage() {
  const [apiData, setApiData] = useState<{ module?: string; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get('/hr/recruitment')
      .then(res => setApiData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedCandidate = useMemo(() => {
    if (!selectedCandidateId) return null;
    return candidates.find(c => c.id === selectedCandidateId) || null;
  }, [selectedCandidateId, candidates]);

  const handleCandidateClick = (candidate: Candidate) => {
    setSelectedCandidateId(candidate.id);
  };

  const closePanel = () => setSelectedCandidateId(null);

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-background p-6 font-sans flex items-center justify-center">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-primary" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-muted-foreground font-medium">Loading recruitment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-background p-6 font-sans flex items-center justify-center">
        <div className="bg-card border border-border rounded-lg p-6 shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-foreground mb-1">Failed to load</h3>
          <p className="text-xs text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-background p-6 font-sans relative">
      <main className="max-w-[1400px] w-full mx-auto">
        
        {/* Header */}
        <header className="flex items-center justify-between py-4 mb-6 border-b border-b-[var(--border)]">
          <div>
            <nav aria-label="Breadcrumb" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">
              HR & Talent <span className="mx-1" aria-hidden="true">&gt;</span> Recruitment
            </nav>
            <h1 className="text-2xl font-bold text-foreground">Recruitment & talent</h1>
          </div>
          <div className="flex items-center gap-4">
            <nav aria-label="View toggle" className="flex bg-muted rounded-full p-1 border border-border">
              <button className="px-4 py-1 text-sm font-medium rounded-full text-muted-foreground hover:bg-background">List</button>
              <button className="px-4 py-1 text-sm font-medium rounded-full bg-primary text-primary-foreground shadow-sm" aria-current="page">Pipeline</button>
              <button className="px-4 py-1 text-sm font-medium rounded-full text-muted-foreground hover:bg-background">Analytics</button>
            </nav>
            <button className="p-2 text-muted-foreground hover:text-foreground" aria-label="Notifications">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden" aria-hidden="true">
                <span className="text-white text-xs font-bold">AU</span>
              </div>
            </div>
          </div>
        </header>

        {/* API Status */}
        <section className="bg-card border border-border rounded-[var(--radius)] p-4 mb-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Info size={20} />
            </div>
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Module Status</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-bold text-foreground">{apiData?.module || 'N/A'}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  apiData?.status === 'wip' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}>
                  {apiData?.status || 'unknown'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Job Requisitions */}
        <section className="bg-card border border-border rounded-[var(--radius)] mb-8 shadow-sm">
          <header className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground">Active Job Requisitions</h2>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded text-foreground hover:bg-muted">
                <Filter size={16} /> Filter
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded text-foreground hover:bg-muted">
                <Upload size={16} /> Export
              </button>
            </div>
          </header>
          <div className="p-8 flex flex-col items-center justify-center text-center">
            <Info size={24} className="text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Job requisitions will appear once the backend provides data.</p>
          </div>
        </section>

        {/* Kanban Board */}
        <section aria-label="Candidate Pipeline" className="flex gap-4 overflow-x-auto pb-6">
          {[
            { id: 'applied', title: 'APPLIED', count: 0 },
            { id: 'screening', title: 'SCREENING', count: 0 },
            { id: 'interview', title: 'INTERVIEW', count: 0 },
            { id: 'offer', title: 'OFFER', count: 0 },
            { id: 'hired', title: 'HIRED', count: 0 },
          ].map(column => (
            <div key={column.id} className="flex-1 min-w-[280px]">
              <header className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{column.title}</h3>
                  <span className="px-2 py-0.5 bg-muted border border-border text-foreground text-xs font-bold rounded-md">{column.count}</span>
                </div>
              </header>
              <div className="bg-card border border-border rounded-[var(--radius)] p-3 flex flex-col gap-3 min-h-[500px] items-center justify-center">
                <Info size={20} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">No candidates yet</span>
              </div>
            </div>
          ))}
        </section>

        {/* Metrics Footer */}
        <section className="inline-flex items-center bg-card py-6 px-2 mt-4 border border-border shadow-sm rounded-[var(--radius)]" aria-label="Key Metrics">
          {[
            { id: 'm-1', label: 'TOTAL APPLICANTS', value: '—' },
            { id: 'm-2', label: 'AVG. TIME TO HIRE', value: '—' },
            { id: 'm-3', label: 'OFFER ACCEPTANCE', value: '—', highlight: true },
            { id: 'm-4', label: 'OPEN POSITIONS', value: '—' },
            { id: 'm-5', label: 'INTERVIEWS TODAY', value: '—', highlight: true },
            { id: 'm-6', label: 'RECRUITMENT ROI', value: '—' },
          ].map((metric, idx) => (
            <React.Fragment key={metric.id}>
              <div className="flex flex-col px-6">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">{metric.label}</span>
                <span className={`text-[24px] leading-none font-bold ${metric.highlight ? 'text-primary' : 'text-foreground'}`}>{metric.value}</span>
              </div>
              {idx < 5 && <div className="w-[1px] h-10 bg-border" aria-hidden="true" />}
            </React.Fragment>
          ))}
        </section>
      </main>

      <CandidateSidePanel isOpen={!!selectedCandidateId} onClose={closePanel} candidate={selectedCandidate} />
    </div>
  );
}
