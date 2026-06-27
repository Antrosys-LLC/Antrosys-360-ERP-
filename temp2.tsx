diff --git a/apps/web/src/app/(dashboard)/recruit/page.tsx b/apps/web/src/app/(dashboard)/recruit/page.tsx
index 9a4bad8..0db5398 100644
--- a/apps/web/src/app/(dashboard)/recruit/page.tsx
+++ b/apps/web/src/app/(dashboard)/recruit/page.tsx
@@ -1,6 +1,6 @@
 "use client";
 
-import React, { useState, useMemo } from 'react';
+import React, { useState, useMemo, useEffect, useCallback } from 'react';
 import { 
   Bell, 
   Filter, 
@@ -11,8 +11,23 @@ import {
   MousePointer2,
   X,
   Star,
-  Mail
+  Mail,
+  Loader2,
+  AlertCircle,
+  Plus
 } from 'lucide-react';
+import {
+  fetchRequisitions,
+  fetchCandidates,
+  fetchRecruitMetrics,
+  updateCandidateStage,
+  createRequisition,
+  createCandidate,
+  type ApiRequisition,
+  type ApiCandidate,
+  type ApiMetrics,
+  type PipelineStage,
+} from '@/lib/recruit-api';
 
 // ==========================================
 // TYPES & INTERFACES
@@ -24,19 +39,9 @@ export interface User {
   role: string;
 }
 
-export interface JobRequisition {
-  id: string;
-  title: string;
-  postedAgo: string;
-  department: string;
-  applicants: number;
-  pipeline: number[];
-}
-
 export interface KanbanColumn {
-  id: string;
+  id: PipelineStage;
   title: string;
-  count: number;
   hasMenu: boolean;
 }
 
@@ -48,28 +53,6 @@ export interface InterviewSchedule {
   location: string;
 }
 
-export interface Candidate {
-  id: string;
-  columnId: string;
-  isDropZone?: boolean;
-  name?: string;
-  role?: string;
-  exp?: string;
-  rating?: string | null;
-  ratingType?: 'default' | 'primary';
-  files?: number;
-  timeAgo?: string;
-  isDragging?: boolean;
-  tag?: string;
-  tagColor?: string;
-  initials?: string;
-  applicantId?: string;
-  pipelineStage?: string;
-  pipelineProgress?: number;
-  interviewSchedule?: InterviewSchedule;
-  skills?: string[];
-}
-
 export interface Metric {
   id: string;
   label: string;
@@ -78,7 +61,7 @@ export interface Metric {
 }
 
 // ==========================================
-// MOCK DATA (Single source of truth)
+// CONSTANTS
 // ==========================================
 
 const currentUserMock: User = {
@@ -87,144 +70,50 @@ const currentUserMock: User = {
   role: 'SYSTEM OWNER',
 };
 
-const activeJobsMock: JobRequisition[] = [
-  {
-    id: 'REQ-001',
-    title: 'Senior Product Designer',
-    postedAgo: '2d ago',
-    department: 'Design Operations',
-    applicants: 42,
-    pipeline: [24, 12, 4, 2, 0],
-  },
-  {
-    id: 'REQ-002',
-    title: 'Lead Frontend Engineer',
-    postedAgo: '5d ago',
-    department: 'Engineering',
-    applicants: 18,
-    pipeline: [10, 5, 2, 1, 0],
-  }
+const kanbanColumnsMeta: KanbanColumn[] = [
+  { id: 'APPLIED',    title: 'APPLIED',    hasMenu: true },
+  { id: 'SCREENING',  title: 'SCREENING',  hasMenu: false },
+  { id: 'INTERVIEW',  title: 'INTERVIEW',  hasMenu: false },
+  { id: 'OFFER',      title: 'OFFER',      hasMenu: false },
+  { id: 'HIRED',      title: 'HIRED',      hasMenu: false },
 ];
 
-const kanbanColumnsMock: KanbanColumn[] = [
-  { id: 'applied', title: 'APPLIED', count: 12, hasMenu: true },
-  { id: 'screening', title: 'SCREENING', count: 8, hasMenu: false },
-  { id: 'interview', title: 'INTERVIEW', count: 4, hasMenu: false },
-  { id: 'offer', title: 'OFFER', count: 2, hasMenu: false },
-  { id: 'hired', title: 'HIRED', count: 5, hasMenu: false },
-];
+// ==========================================
+// HELPERS
+// ==========================================
 
-const candidatesMock: Candidate[] = [
-  {
-    id: 'c-1',
-    name: 'Sara Jenkins',
-    role: 'UI Designer',
-    exp: '4yrs exp',
-    rating: '4.8',
-    ratingType: 'default',
-    files: 2,
-    timeAgo: '1h ago',
-    columnId: 'applied',
-  },
-  {
-    id: 'c-2',
-    name: 'Bilal Hussain',
-    role: 'UX Architect',
-    exp: '6yrs exp',
-    rating: '5.0',
-    ratingType: 'primary',
-    files: 4,
-    timeAgo: '',
-    columnId: 'applied',
-  },
-  {
-    id: 'c-3',
-    name: 'Elena Rodriguez',
-    role: 'Visual Designer',
-    exp: '2yrs exp',
-    rating: null,
-    files: 0,
-    timeAgo: '',
-    columnId: 'applied',
-  },
-  {
-    id: 'c-4',
-    name: 'Marcus Thorne',
-    role: 'Product Lead',
-    exp: '',
-    rating: null,
-    files: 0,
-    timeAgo: '',
-    columnId: 'screening',
-  },
-  {
-    id: 'c-5',
-    name: 'Linda Chen',
-    role: 'Systems Analyst',
-    exp: '',
-    rating: null,
-    files: 0,
-    timeAgo: '',
-    columnId: 'interview',
-    tag: 'Urgent',
-    tagColor: 'bg-destructive/10 text-destructive',
-  },
-  {
-    id: 'c-6',
-    name: 'David Miller',
-    role: 'Sr. Frontend Engineer',
-    exp: '',
-    rating: null,
-    files: 0,
-    timeAgo: '',
-    columnId: 'offer',
-  },
-  {
-    id: 'c-7',
-    name: 'Zain Malik',
-    initials: 'ZM',
-    applicantId: '#ZM-9921',
-    role: 'Staff Engineer',
-    exp: '',
-    rating: '5.0',
-    files: 0,
-    timeAgo: '',
-    columnId: 'hired',
-    tag: 'Onboarding',
-    tagColor: 'bg-primary/10 text-primary',
-    pipelineStage: 'Hired / Onboarding',
-    pipelineProgress: 5,
-    interviewSchedule: {
-      month: 'OCT',
-      day: '12',
-      title: 'Final Leadership Review',
-      time: '02:00 PM',
-      location: 'Remote'
-    },
-    skills: ['System Design', 'Kubernetes', 'Microservices', 'GoLang']
-  },
-];
+function buildInterviewSchedule(candidate: ApiCandidate): InterviewSchedule | undefined {
+  if (!candidate.interviewAt) return undefined;
+  const d = new Date(candidate.interviewAt);
+  return {
+    month: d.toLocaleString('en', { month: 'short' }).toUpperCase(),
+    day: String(d.getDate()),
+    title: candidate.interviewTitle ?? 'Interview',
+    time: d.toLocaleString('en', { hour: '2-digit', minute: '2-digit', hour12: true }),
+    location: candidate.interviewLocation ?? 'TBD',
+  };
+}
 
-const metricsMock: Metric[] = [
-  { id: 'm-1', label: 'TOTAL APPLICANTS', value: '1,284' },
-  { id: 'm-2', label: 'AVG. TIME TO HIRE', value: '18 Days' },
-  { id: 'm-3', label: 'OFFER ACCEPTANCE', value: '94.2%', highlight: true },
-  { id: 'm-4', label: 'OPEN POSITIONS', value: '24' },
-  { id: 'm-5', label: 'INTERVIEWS TODAY', value: '12', highlight: true },
-  { id: 'm-6', label: 'RECRUITMENT ROI', value: '$142k' },
-];
+function formatTimeAgo(dateStr: string): string {
+  const ms = Date.now() - new Date(dateStr).getTime();
+  const mins = Math.floor(ms / 60000);
+  if (mins < 60) return `${mins}m ago`;
+  const hrs = Math.floor(mins / 60);
+  if (hrs < 24) return `${hrs}h ago`;
+  return `${Math.floor(hrs / 24)}d ago`;
+}
 
 // ==========================================
-// DUMB COMPONENTS
+// DUMB COMPONENTS (design unchanged)
 // ==========================================
 
 const HeaderTop = ({ user }: { user: User }) => (
   <header className="flex items-center justify-between py-4 mb-6 border-b border-b-[var(--border)]">
     <div>
       <nav aria-label="Breadcrumb" className="text-xs font-semibold tracking-wider text-muted-foreground uppercase mb-1">
-        HR & Talent <span className="mx-1" aria-hidden="true">&gt;</span> Recruitment
+        HR &amp; Talent <span className="mx-1" aria-hidden="true">&gt;</span> Recruitment
       </nav>
-      <h1 className="text-2xl font-bold text-foreground">Recruitment & talent</h1>
+      <h1 className="text-2xl font-bold text-foreground">Recruitment &amp; talent</h1>
     </div>
     
     <div className="flex items-center gap-4">
@@ -251,7 +140,15 @@ const HeaderTop = ({ user }: { user: User }) => (
   </header>
 );
 
-const JobRequisitionsTable = ({ jobs }: { jobs: JobRequisition[] }) => (
+const JobRequisitionsTable = ({
+  jobs,
+  loading,
+  onAddJob,
+}: {
+  jobs: ApiRequisition[];
+  loading: boolean;
+  onAddJob: () => void;
+}) => (
   <section className="bg-card border border-border rounded-[var(--radius)] mb-8 shadow-sm">
     <header className="flex items-center justify-between p-4 border-b border-border">
       <h2 className="text-lg font-bold text-foreground">Active Job Requisitions</h2>
@@ -262,67 +159,96 @@ const JobRequisitionsTable = ({ jobs }: { jobs: JobRequisition[] }) => (
         <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium border border-border rounded text-foreground hover:bg-muted">
           <Upload size={16} /> Export
         </button>
+        <button
+          onClick={onAddJob}
+          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded hover:opacity-90"
+        >
+          <Plus size={16} /> New Req
+        </button>
       </div>
     </header>
 
-    <div className="w-full text-sm" role="table" aria-label="Job Requisitions">
-      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wider" role="row">
-        <div className="col-span-3" role="columnheader">Position Name</div>
-        <div className="col-span-3" role="columnheader">Department</div>
-        <div className="col-span-2" role="columnheader">Applicants</div>
-        <div className="col-span-3" role="columnheader">Pipeline Health</div>
-        <div className="col-span-1 text-right" role="columnheader">Actions</div>
+    {loading ? (
+      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
+        <Loader2 size={20} className="animate-spin" />
+        <span className="text-sm">Loading requisitionsΓÇª</span>
       </div>
-      
-      <div className="flex flex-col" role="rowgroup">
-        {jobs.map((job, idx) => (
-          <article key={job.id} className={`grid grid-cols-12 gap-4 px-4 py-4 items-center ${idx !== jobs.length - 1 ? 'border-b border-border' : ''}`} role="row">
-            <div className="col-span-3" role="cell">
-              <div className="font-semibold text-primary">{job.title}</div>
-              <div className="text-xs text-muted-foreground mt-1">ID: {job.id} ΓÇó Posted {job.postedAgo}</div>
-            </div>
-            <div className="col-span-3 text-muted-foreground" role="cell">{job.department}</div>
-            <div className="col-span-2 font-semibold text-foreground" role="cell">{job.applicants} Candidates</div>
-            <div className="col-span-3 flex flex-col gap-1" role="cell">
-              <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-muted" aria-hidden="true">
-                {job.pipeline.map((count, i) => (
-                  <div 
-                    key={i} 
-                    className="h-full border-r border-background last:border-0"
-                    style={{ 
-                      width: `${(count / job.applicants) * 100}%`,
-                      backgroundColor: `hsl(var(--primary) / ${1 - (i * 0.15)})`
-                    }} 
-                  />
-                ))}
+    ) : jobs.length === 0 ? (
+      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
+        <AlertCircle size={24} />
+        <p className="text-sm">No job requisitions yet.</p>
+      </div>
+    ) : (
+      <div className="w-full text-sm" role="table" aria-label="Job Requisitions">
+        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted text-xs font-semibold text-muted-foreground uppercase tracking-wider" role="row">
+          <div className="col-span-3" role="columnheader">Position Name</div>
+          <div className="col-span-3" role="columnheader">Department</div>
+          <div className="col-span-2" role="columnheader">Applicants</div>
+          <div className="col-span-3" role="columnheader">Pipeline Health</div>
+          <div className="col-span-1 text-right" role="columnheader">Actions</div>
+        </div>
+        
+        <div className="flex flex-col" role="rowgroup">
+          {jobs.map((job, idx) => (
+            <article key={job.id} className={`grid grid-cols-12 gap-4 px-4 py-4 items-center ${idx !== jobs.length - 1 ? 'border-b border-border' : ''}`} role="row">
+              <div className="col-span-3" role="cell">
+                <div className="font-semibold text-primary">{job.title}</div>
+                <div className="text-xs text-muted-foreground mt-1">ID: {job.id.slice(0, 8)} ΓÇó Posted {job.postedAgo}</div>
               </div>
-              <div className="flex text-[10px] text-muted-foreground w-full justify-between" aria-hidden="true">
-                {job.pipeline.map((count, i) => <span key={i}>{count}</span>)}
+              <div className="col-span-3 text-muted-foreground" role="cell">{job.department}</div>
+              <div className="col-span-2 font-semibold text-foreground" role="cell">{job.applicants} Candidates</div>
+              <div className="col-span-3 flex flex-col gap-1" role="cell">
+                {job.applicants > 0 ? (
+                  <>
+                    <div className="flex w-full h-1.5 rounded-full overflow-hidden bg-muted" aria-hidden="true">
+                      {job.pipeline.map((count, i) => (
+                        <div
+                          key={i}
+                          className="h-full border-r border-background last:border-0"
+                          style={{
+                            width: `${(count / job.applicants) * 100}%`,
+                            backgroundColor: `hsl(var(--primary) / ${1 - i * 0.15})`,
+                          }}
+                        />
+                      ))}
+                    </div>
+                    <div className="flex text-[10px] text-muted-foreground w-full justify-between" aria-hidden="true">
+                      {job.pipeline.map((count, i) => <span key={i}>{count}</span>)}
+                    </div>
+                  </>
+                ) : (
+                  <span className="text-xs text-muted-foreground">No applicants yet</span>
+                )}
               </div>
-            </div>
-            <div className="col-span-1 text-right" role="cell">
-              <button className="text-primary hover:underline text-sm font-medium">Manage</button>
-            </div>
-          </article>
-        ))}
+              <div className="col-span-1 text-right" role="cell">
+                <button className="text-primary hover:underline text-sm font-medium">Manage</button>
+              </div>
+            </article>
+          ))}
+        </div>
       </div>
-    </div>
+    )}
   </section>
 );
 
-const CandidateCard = ({ 
-  candidate, 
+const CandidateCard = ({
+  candidate,
   onClick,
   onDragStart,
-  onDragEnd
-}: { 
-  candidate: Candidate; 
-  onClick?: (candidate: Candidate) => void;
+  onDragEnd,
+  isDragging,
+}: {
+  candidate: ApiCandidate;
+  onClick?: (candidate: ApiCandidate) => void;
   onDragStart?: (e: React.DragEvent) => void;
   onDragEnd?: (e: React.DragEvent) => void;
+  isDragging?: boolean;
 }) => {
+  const ratingDisplay = candidate.rating ? parseFloat(candidate.rating).toFixed(1) : null;
+  const timeAgo = formatTimeAgo(candidate.createdAt);
+
   return (
-    <article 
+    <article
       onClick={() => onClick?.(candidate)}
       role="button"
       tabIndex={0}
@@ -331,25 +257,28 @@ const CandidateCard = ({
       onDragEnd={onDragEnd}
       onKeyDown={(e) => e.key === 'Enter' && onClick?.(candidate)}
       className={`p-4 bg-card border rounded-[var(--radius)] flex flex-col ${onClick ? 'cursor-pointer hover:border-primary/50 transition-colors' : ''}
-      ${candidate.isDragging ? 'border-2 border-primary shadow-sm opacity-60 select-none' : 'border-border shadow-sm'}
-    `}>
+      ${isDragging ? 'border-2 border-primary shadow-sm opacity-60 select-none' : 'border-border shadow-sm'}
+    `}
+    >
       <header className="flex justify-between items-start mb-2">
-        <h4 className={`font-bold text-base ${candidate.isDragging ? 'text-primary' : 'text-foreground'}`}>
+        <h4 className={`font-bold text-base ${isDragging ? 'text-primary' : 'text-foreground'}`}>
           {candidate.name}
         </h4>
-        {candidate.rating && (
-          <span className={`px-1.5 py-0.5 text-xs font-bold rounded ${
-            candidate.ratingType === 'primary' 
-              ? 'bg-primary/10 text-primary' 
-              : 'bg-muted text-muted-foreground'
-          }`}>
-            {candidate.rating}
+        {ratingDisplay && (
+          <span
+            className={`px-1.5 py-0.5 text-xs font-bold rounded ${
+              candidate.ratingType === 'primary'
+                ? 'bg-primary/10 text-primary'
+                : 'bg-muted text-muted-foreground'
+            }`}
+          >
+            {ratingDisplay}
           </span>
         )}
       </header>
-      
+
       <p className="text-sm text-muted-foreground mb-4">
-        {candidate.role} {candidate.exp && `ΓÇó ${candidate.exp}`}
+        {candidate.role} {candidate.experience && `ΓÇó ${candidate.experience}`}
       </p>
 
       {candidate.tag && (
@@ -360,23 +289,22 @@ const CandidateCard = ({
         </div>
       )}
 
-      {((candidate.files && candidate.files > 0) || candidate.timeAgo || candidate.isDragging) && (
+      {(candidate.filesCount > 0 || timeAgo || isDragging) && (
         <footer className="flex items-center justify-between text-xs text-muted-foreground mt-auto pt-2">
           <div className="flex items-center gap-3">
-            {candidate.files && candidate.files > 0 && (
+            {candidate.filesCount > 0 && (
               <span className="flex items-center gap-1.5 font-medium">
-                <Paperclip size={14} /> {candidate.files} files
+                <Paperclip size={14} /> {candidate.filesCount} files
               </span>
             )}
           </div>
-          
           <div className="flex items-center gap-2">
-            {candidate.timeAgo && (
+            {timeAgo && (
               <span className="flex items-center gap-1.5 font-medium">
-                <Clock size={14} /> {candidate.timeAgo}
+                <Clock size={14} /> {timeAgo}
               </span>
             )}
-            {candidate.isDragging && (
+            {isDragging && (
               <span className="flex items-center gap-1.5 text-primary font-bold">
                 <MousePointer2 size={14} className="fill-primary" /> Dragging
               </span>
@@ -388,66 +316,78 @@ const CandidateCard = ({
   );
 };
 
-const MetricsFooter = ({ metrics }: { metrics: Metric[] }) => (
+const MetricsFooter = ({ metrics, loading }: { metrics: Metric[]; loading: boolean }) => (
   <section className="inline-flex items-center bg-card py-6 px-2 mt-4 border border-border shadow-sm rounded-[var(--radius)]" aria-label="Key Metrics">
-    {metrics.map((metric, idx) => (
-      <React.Fragment key={metric.id}>
-        <div className="flex flex-col px-6">
-          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
-            {metric.label}
-          </span>
-          <span className={`text-[24px] leading-none font-bold ${metric.highlight ? 'text-primary' : 'text-foreground'}`}>
-            {metric.value}
-          </span>
-        </div>
-        {idx < metrics.length - 1 && (
-          <div className="w-[1px] h-10 bg-border" aria-hidden="true" />
-        )}
-      </React.Fragment>
-    ))}
+    {loading ? (
+      <div className="flex items-center gap-2 px-6 text-muted-foreground text-sm">
+        <Loader2 size={16} className="animate-spin" /> Loading metricsΓÇª
+      </div>
+    ) : (
+      metrics.map((metric, idx) => (
+        <React.Fragment key={metric.id}>
+          <div className="flex flex-col px-6">
+            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
+              {metric.label}
+            </span>
+            <span className={`text-[24px] leading-none font-bold ${metric.highlight ? 'text-primary' : 'text-foreground'}`}>
+              {metric.value}
+            </span>
+          </div>
+          {idx < metrics.length - 1 && (
+            <div className="w-[1px] h-10 bg-border" aria-hidden="true" />
+          )}
+        </React.Fragment>
+      ))
+    )}
   </section>
 );
 
-const CandidateSidePanel = ({ 
-  isOpen, 
-  onClose, 
-  candidate 
-}: { 
-  isOpen: boolean; 
-  onClose: () => void; 
-  candidate: Candidate | null 
+const CandidateSidePanel = ({
+  isOpen,
+  onClose,
+  candidate,
+}: {
+  isOpen: boolean;
+  onClose: () => void;
+  candidate: ApiCandidate | null;
 }) => {
   if (!candidate) return null;
 
+  const ratingDisplay = candidate.rating ? parseFloat(candidate.rating).toFixed(1) : null;
+  const interviewSchedule = buildInterviewSchedule(candidate);
+  const pipelineProgressMap: Record<PipelineStage, number> = {
+    APPLIED: 1, SCREENING: 2, INTERVIEW: 3, OFFER: 4, HIRED: 5, REJECTED: 0,
+  };
+  const progress = pipelineProgressMap[candidate.pipelineStage] ?? 1;
+
   return (
     <>
       {isOpen && (
-        <div 
+        <div
           className="fixed inset-0 bg-black/20 z-40 transition-opacity"
           onClick={onClose}
           aria-hidden="true"
         />
       )}
-      
-      <aside 
+
+      <aside
         className={`fixed top-0 right-0 h-full w-[420px] bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${
           isOpen ? 'translate-x-0' : 'translate-x-full'
         }`}
         aria-hidden={!isOpen}
       >
         <div className="p-6 overflow-y-auto flex-1">
-          {/* Header & Close Button */}
           <header className="flex justify-between items-start mb-8">
             <div className="flex gap-4 items-center">
               <div className="w-16 h-16 rounded-2xl bg-[#EBE4FF] text-[#5B32EA] flex items-center justify-center text-2xl font-bold" aria-hidden="true">
-                {candidate.initials || (candidate.name ? candidate.name.charAt(0) : '?')}
+                {candidate.name.charAt(0)}
               </div>
               <div>
                 <h2 className="text-2xl font-bold text-slate-900 leading-tight">{candidate.name}</h2>
-                <p className="text-slate-500 text-sm">Candidate ID: {candidate.applicantId || 'N/A'}</p>
+                <p className="text-slate-500 text-sm">Candidate ID: {candidate.id.slice(0, 8)}</p>
               </div>
             </div>
-            <button 
+            <button
               onClick={onClose}
               className="text-slate-400 hover:text-slate-600 transition-colors p-1"
               aria-label="Close panel"
@@ -456,21 +396,21 @@ const CandidateSidePanel = ({
             </button>
           </header>
 
-          {/* Pipeline Status */}
           <section className="mb-8">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Pipeline Status</h3>
             <div className="flex gap-2 mb-4" aria-hidden="true">
               {[1, 2, 3, 4, 5].map((i) => (
-                <div 
-                  key={i} 
-                  className={`h-2.5 flex-1 rounded-full ${i <= (candidate.pipelineProgress || 1) ? 'bg-[#5B32EA]' : 'bg-slate-100'}`} 
+                <div
+                  key={i}
+                  className={`h-2.5 flex-1 rounded-full ${i <= progress ? 'bg-[#5B32EA]' : 'bg-slate-100'}`}
                 />
               ))}
             </div>
-            <p className="font-bold text-[15px] text-slate-900">Stage: {candidate.pipelineStage || 'In Progress'}</p>
+            <p className="font-bold text-[15px] text-slate-900">
+              Stage: {candidate.pipelineStage.charAt(0) + candidate.pipelineStage.slice(1).toLowerCase()}
+            </p>
           </section>
 
-          {/* Average Rating */}
           <section className="mb-8">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Average Rating</h3>
             <div className="flex items-center gap-3">
@@ -479,24 +419,23 @@ const CandidateSidePanel = ({
                   <Star key={i} className="fill-current" size={24} />
                 ))}
               </div>
-              <span className="font-bold text-xl text-slate-900">{candidate.rating || 'N/A'}</span>
+              <span className="font-bold text-xl text-slate-900">{ratingDisplay ?? 'N/A'}</span>
             </div>
           </section>
 
-          {/* Interview Schedule */}
-          {candidate.interviewSchedule && (
+          {interviewSchedule && (
             <section className="mb-8">
               <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                 <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Interview Schedule</h3>
                 <div className="flex gap-4 items-center">
                   <div className="border border-slate-200 rounded-lg py-2 px-3 text-center bg-white shadow-sm w-16">
-                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">{candidate.interviewSchedule.month}</div>
-                    <div className="text-xl font-bold text-[#5B32EA] leading-none">{candidate.interviewSchedule.day}</div>
+                    <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">{interviewSchedule.month}</div>
+                    <div className="text-xl font-bold text-[#5B32EA] leading-none">{interviewSchedule.day}</div>
                   </div>
                   <div>
-                    <h4 className="font-bold text-slate-900 text-[15px] mb-1">{candidate.interviewSchedule.title}</h4>
+                    <h4 className="font-bold text-slate-900 text-[15px] mb-1">{interviewSchedule.title}</h4>
                     <p className="text-sm text-slate-500 font-medium">
-                      {candidate.interviewSchedule.time} ΓÇó {candidate.interviewSchedule.location}
+                      {interviewSchedule.time} ΓÇó {interviewSchedule.location}
                     </p>
                   </div>
                 </div>
@@ -504,14 +443,13 @@ const CandidateSidePanel = ({
             </section>
           )}
 
-          {/* Skills & Tags */}
           {candidate.skills && candidate.skills.length > 0 && (
             <section className="mb-8">
-              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Skills & Tags</h3>
+              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Skills &amp; Tags</h3>
               <ul className="flex flex-wrap gap-2.5">
-                {candidate.skills.map(skill => (
-                  <li 
-                    key={skill} 
+                {candidate.skills.map((skill) => (
+                  <li
+                    key={skill}
                     className="px-3.5 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 bg-white"
                   >
                     {skill}
@@ -522,15 +460,20 @@ const CandidateSidePanel = ({
           )}
         </div>
 
-        {/* Bottom Action Area */}
         <footer className="p-6 border-t border-slate-100 bg-white">
           <div className="flex gap-3">
             <button className="flex-1 bg-[#5B32EA] text-white py-3.5 rounded-lg font-bold hover:bg-[#4A28C4] transition-colors shadow-sm text-sm">
               View Full Profile
             </button>
-            <button className="px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center" aria-label="Email candidate">
-              <Mail size={20} />
-            </button>
+            {candidate.email && (
+              <a
+                href={`mailto:${candidate.email}`}
+                className="px-4 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
+                aria-label="Email candidate"
+              >
+                <Mail size={20} />
+              </a>
+            )}
           </div>
         </footer>
       </aside>
@@ -538,127 +481,301 @@ const CandidateSidePanel = ({
   );
 };
 
+// ΓöÇΓöÇΓöÇ New Requisition Modal ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
+
+const NewRequisitionModal = ({
+  isOpen,
+  onClose,
+  onSubmit,
+  saving,
+}: {
+  isOpen: boolean;
+  onClose: () => void;
+  onSubmit: (data: { title: string; department: string }) => void;
+  saving: boolean;
+}) => {
+  const [title, setTitle] = useState('');
+  const [department, setDepartment] = useState('');
+
+  if (!isOpen) return null;
+
+  const handleSubmit = (e: React.FormEvent) => {
+    e.preventDefault();
+    if (!title.trim() || !department.trim()) return;
+    onSubmit({ title: title.trim(), department: department.trim() });
+  };
+
+  return (
+    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
+      <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-2xl w-full max-w-md">
+        <h2 className="text-lg font-bold mb-4 text-foreground">New Job Requisition</h2>
+        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
+          <div>
+            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Position Title</label>
+            <input
+              value={title}
+              onChange={(e) => setTitle(e.target.value)}
+              placeholder="e.g. Senior Product Designer"
+              required
+              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
+            />
+          </div>
+          <div>
+            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Department</label>
+            <input
+              value={department}
+              onChange={(e) => setDepartment(e.target.value)}
+              placeholder="e.g. Engineering"
+              required
+              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
+            />
+          </div>
+          <div className="flex gap-2 justify-end mt-2">
+            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-border rounded text-foreground hover:bg-muted">Cancel</button>
+            <button
+              type="submit"
+              disabled={saving}
+              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:opacity-90 flex items-center gap-2 disabled:opacity-60"
+            >
+              {saving && <Loader2 size={14} className="animate-spin" />}
+              Create
+            </button>
+          </div>
+        </form>
+      </div>
+    </div>
+  );
+};
+
 // ==========================================
 // SMART CONTAINER (Page Level)
 // ==========================================
 
 export default function RecruitmentPage() {
-  const [candidates, setCandidates] = useState<Candidate[]>(candidatesMock);
+  // ΓöÇΓöÇΓöÇ Data State ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
+  const [requisitions, setRequisitions] = useState<ApiRequisition[]>([]);
+  const [candidates, setCandidates] = useState<ApiCandidate[]>([]);
+  const [metrics, setMetrics] = useState<ApiMetrics | null>(null);
+
+  // ΓöÇΓöÇΓöÇ Loading / Error State ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
+  const [reqLoading, setReqLoading] = useState(true);
+  const [candLoading, setCandLoading] = useState(true);
+  const [metricsLoading, setMetricsLoading] = useState(true);
+
+  // ΓöÇΓöÇΓöÇ UI State ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
   const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
+  const [draggingId, setDraggingId] = useState<string | null>(null);
+  const [showNewReqModal, setShowNewReqModal] = useState(false);
+  const [savingReq, setSavingReq] = useState(false);
+
+  // ΓöÇΓöÇΓöÇ Derived ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
+  const selectedCandidate = useMemo(
+    () => (selectedCandidateId ? candidates.find((c) => c.id === selectedCandidateId) ?? null : null),
+    [selectedCandidateId, candidates],
+  );
 
-  const selectedCandidate = useMemo(() => {
-    if (!selectedCandidateId) return null;
-    return candidates.find(c => c.id === selectedCandidateId) || null;
-  }, [selectedCandidateId, candidates]);
+  const metricsDisplay: Metric[] = useMemo(() => {
+    if (!metrics) return [];
+    return [
+      { id: 'm-1', label: 'TOTAL APPLICANTS',  value: metrics.totalApplicants.toLocaleString() },
+      { id: 'm-2', label: 'AVG. TIME TO HIRE', value: metrics.avgTimeToHire },
+      { id: 'm-3', label: 'OFFER ACCEPTANCE',  value: metrics.offerAcceptance, highlight: true },
+      { id: 'm-4', label: 'OPEN POSITIONS',    value: String(metrics.openPositions) },
+      { id: 'm-5', label: 'INTERVIEWS TODAY',  value: String(metrics.interviewsToday), highlight: true },
+    ];
+  }, [metrics]);
+
+  // ΓöÇΓöÇΓöÇ Data Fetching ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
+  const loadRequisitions = useCallback(async () => {
+    setReqLoading(true);
+    try {
+      const { items } = await fetchRequisitions({ status: 'ACTIVE', limit: 50 });
+      setRequisitions(items);
+    } catch {
+      // Silent ΓÇö table shows empty state
+    } finally {
+      setReqLoading(false);
+    }
+  }, []);
+
+  const loadCandidates = useCallback(async () => {
+    setCandLoading(true);
+    try {
+      const { items } = await fetchCandidates({ limit: 200 });
+      setCandidates(items);
+    } catch {
+      // Silent
+    } finally {
+      setCandLoading(false);
+    }
+  }, []);
+
+  const loadMetrics = useCallback(async () => {
+    setMetricsLoading(true);
+    try {
+      const data = await fetchRecruitMetrics();
+      setMetrics(data);
+    } catch {
+      // Silent
+    } finally {
+      setMetricsLoading(false);
+    }
+  }, []);
+
+  useEffect(() => {
+    loadRequisitions();
+    loadCandidates();
+    loadMetrics();
+  }, [loadRequisitions, loadCandidates, loadMetrics]);
+
+  // ΓöÇΓöÇΓöÇ New Requisition ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
+  const handleCreateRequisition = async (data: { title: string; department: string }) => {
+    setSavingReq(true);
+    try {
+      await createRequisition(data);
+      setShowNewReqModal(false);
+      await Promise.all([loadRequisitions(), loadMetrics()]);
+    } catch {
+      // Could add toast here
+    } finally {
+      setSavingReq(false);
+    }
+  };
 
-  const handleCandidateClick = (candidate: Candidate) => {
+  // ΓöÇΓöÇΓöÇ Candidate Selection ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
+  const handleCandidateClick = (candidate: ApiCandidate) => {
     setSelectedCandidateId(candidate.id);
   };
 
-  const closePanel = () => {
-    setSelectedCandidateId(null);
-  };
+  const closePanel = () => setSelectedCandidateId(null);
 
-  // ==========================================
-  // DRAG & DROP HANDLERS
-  // ==========================================
-  
+  // ΓöÇΓöÇΓöÇ Drag & Drop (end-to-end with backend sync) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
   const handleDragStart = (e: React.DragEvent, candidateId: string) => {
-    e.dataTransfer.setData("text/plain", candidateId);
-    // Use a 0ms timeout so the browser captures the original look for the ghost preview 
-    // before applying active styles in the state layout.
-    setTimeout(() => {
-      setCandidates(prev => 
-        prev.map(c => c.id === candidateId ? { ...c, isDragging: true } : c)
-      );
-    }, 0);
+    e.dataTransfer.setData('text/plain', candidateId);
+    setTimeout(() => setDraggingId(candidateId), 0);
   };
 
-  const handleDragEnd = (candidateId: string) => {
-    setCandidates(prev => 
-      prev.map(c => c.id === candidateId ? { ...c, isDragging: false } : c)
-    );
-  };
+  const handleDragEnd = () => setDraggingId(null);
 
-  const handleDragOver = (e: React.DragEvent) => {
-    e.preventDefault(); // Essential to allow drop actions
-  };
+  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
 
-  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
+  const handleDrop = async (e: React.DragEvent, targetStage: PipelineStage) => {
     e.preventDefault();
-    const candidateId = e.dataTransfer.getData("text/plain");
+    const candidateId = e.dataTransfer.getData('text/plain');
     if (!candidateId) return;
 
-    setCandidates(prev => 
-      prev.map(c => c.id === candidateId ? { ...c, columnId: targetColumnId, isDragging: false } : c)
+    const candidate = candidates.find((c) => c.id === candidateId);
+    if (!candidate || candidate.pipelineStage === targetStage) {
+      setDraggingId(null);
+      return;
+    }
+
+    // Optimistic UI update
+    setCandidates((prev) =>
+      prev.map((c) =>
+        c.id === candidateId ? { ...c, pipelineStage: targetStage } : c,
+      ),
     );
+    setDraggingId(null);
+
+    // Persist to backend ΓÇö revert on failure
+    try {
+      await updateCandidateStage(candidateId, targetStage);
+      // Refresh metrics silently (applicant counts per column may shift)
+      loadMetrics();
+    } catch {
+      // Revert optimistic update
+      setCandidates((prev) =>
+        prev.map((c) =>
+          c.id === candidateId ? { ...c, pipelineStage: candidate.pipelineStage } : c,
+        ),
+      );
+    }
   };
 
+  // ΓöÇΓöÇΓöÇ Render ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
   return (
     <div className="min-h-screen w-full bg-background p-6 font-sans relative">
       <main className="max-w-[1400px] w-full mx-auto">
-        
+
         <HeaderTop user={currentUserMock} />
-        
-        <JobRequisitionsTable jobs={activeJobsMock} />
 
-        {/* Kanban Board Container */}
+        <JobRequisitionsTable
+          jobs={requisitions}
+          loading={reqLoading}
+          onAddJob={() => setShowNewReqModal(true)}
+        />
+
+        {/* Kanban Board */}
         <section aria-label="Candidate Pipeline" className="flex gap-4 overflow-x-auto pb-6">
-          {kanbanColumnsMock.map(column => {
-            // Keep the baseline metrics accurate to the dashboard layouts while remaining dynamic
-            const initialItemCount = candidatesMock.filter(c => c.columnId === column.id).length;
-            const liveItemCount = candidates.filter(c => c.columnId === column.id).length;
-            const displayCount = column.count + (liveItemCount - initialItemCount);
-
-            return (
-              <div 
-                key={column.id} 
-                className="flex-1 min-w-[280px]"
-                onDragOver={handleDragOver}
-                onDrop={(e) => handleDrop(e, column.id)}
-              >
-                
-                <header className="flex items-center justify-between mb-3 px-1">
-                  <div className="flex items-center gap-2">
-                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{column.title}</h3>
-                    <span className="px-2 py-0.5 bg-muted border border-border text-foreground text-xs font-bold rounded-md">
-                      {displayCount}
-                    </span>
-                  </div>
-                  {column.hasMenu && (
-                    <button className="text-foreground hover:text-primary" aria-label={`More options for ${column.title}`}>
-                      <MoreHorizontal size={20} />
-                    </button>
-                  )}
-                </header>
-
-                <div className="bg-card border border-border rounded-[var(--radius)] p-3 flex flex-col gap-3 min-h-[500px]">
-                  {candidates
-                    .filter(c => c.columnId === column.id)
-                    .map(candidate => (
-                      <CandidateCard 
-                        key={candidate.id} 
-                        candidate={candidate} 
+          {candLoading ? (
+            <div className="flex items-center gap-2 py-12 text-muted-foreground text-sm mx-auto">
+              <Loader2 size={20} className="animate-spin" /> Loading candidatesΓÇª
+            </div>
+          ) : (
+            kanbanColumnsMeta.map((column) => {
+              const columnCandidates = candidates.filter((c) => c.pipelineStage === column.id);
+
+              return (
+                <div
+                  key={column.id}
+                  className="flex-1 min-w-[280px]"
+                  onDragOver={handleDragOver}
+                  onDrop={(e) => handleDrop(e, column.id)}
+                >
+                  <header className="flex items-center justify-between mb-3 px-1">
+                    <div className="flex items-center gap-2">
+                      <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{column.title}</h3>
+                      <span className="px-2 py-0.5 bg-muted border border-border text-foreground text-xs font-bold rounded-md">
+                        {columnCandidates.length}
+                      </span>
+                    </div>
+                    {column.hasMenu && (
+                      <button className="text-foreground hover:text-primary" aria-label={`More options for ${column.title}`}>
+                        <MoreHorizontal size={20} />
+                      </button>
+                    )}
+                  </header>
+
+                  <div className="bg-card border border-border rounded-[var(--radius)] p-3 flex flex-col gap-3 min-h-[500px]">
+                    {columnCandidates.map((candidate) => (
+                      <CandidateCard
+                        key={candidate.id}
+                        candidate={candidate}
+                        isDragging={draggingId === candidate.id}
                         onClick={handleCandidateClick}
                         onDragStart={(e) => handleDragStart(e, candidate.id)}
-                        onDragEnd={() => handleDragEnd(candidate.id)}
+                        onDragEnd={handleDragEnd}
                       />
                     ))}
+
+                    {columnCandidates.length === 0 && (
+                      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground/50 font-medium py-8">
+                        Drop candidates here
+                      </div>
+                    )}
+                  </div>
                 </div>
-                
-              </div>
-            );
-          })}
+              );
+            })
+          )}
         </section>
 
-        <MetricsFooter metrics={metricsMock} />
+        <MetricsFooter metrics={metricsDisplay} loading={metricsLoading} />
       </main>
 
-      <CandidateSidePanel 
-        isOpen={!!selectedCandidateId} 
-        onClose={closePanel} 
+      <CandidateSidePanel
+        isOpen={!!selectedCandidateId}
+        onClose={closePanel}
         candidate={selectedCandidate}
       />
+
+      <NewRequisitionModal
+        isOpen={showNewReqModal}
+        onClose={() => setShowNewReqModal(false)}
+        onSubmit={handleCreateRequisition}
+        saving={savingReq}
+      />
     </div>
   );
 }
\ No newline at end of file
