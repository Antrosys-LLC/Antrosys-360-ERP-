'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Users,
  UserX,
  CalendarDays,
  TrendingUp,
  MoreVertical,
  Flag,
  ClipboardCheck,
  Play,
  Megaphone,
  BarChart3,
  RefreshCw,
  ChevronDown,
  Send,
  Loader2,
  Paperclip,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import axios from 'axios';
import Link from 'next/link';

// ============================================================================
// API FUNCTIONS
// ============================================================================

async function fetchDashboard() {
  const { data } = await apiClient.get('/manager');
  return data.data;
}

async function patchLeaveStatus(leaveId: string, status: 'APPROVED' | 'REJECTED') {
  const { data } = await apiClient.patch(`/manager/leaves/${leaveId}`, { status });
  return data;
}

async function postApproveAll() {
  const { data } = await apiClient.post('/manager/leaves/approve-all');
  return data;
}

async function postAnnouncement(payload: { title: string; content: string }) {
  const { data } = await apiClient.post('/manager/announcements', payload);
  return data;
}

async function putAttendanceStatus(employeeId: string, status: string) {
  const { data } = await apiClient.put(`/manager/attendance/${employeeId}`, { status });
  return data;
}

async function postToggleFlag(employeeId: string, isFlagged: boolean) {
  const { data } = await apiClient.post(`/manager/attendance/${employeeId}/flag`, { isFlagged });
  return data;
}

// ============================================================================
// TYPES
// ============================================================================

interface AttendanceRow {
  employeeId: string;
  name: string;
  role: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  hours: number;
  isFlagged: boolean;
}

interface LeaveRequest {
  id: string;
  name: string;
  type: string;
  startDate: string;
  endDate: string;
  durationDays: number;
  status: string;
  reason: string | null;
  attachment?: string | null;
  avatarColor?: { bg: string, text: string };
  overlapDetected?: boolean;
}

interface AnnouncementItem {
  id: string;
  author: string;
  title: string;
  content: string;
  createdAt: string;
}

interface TeamDashboardSlice {
  id: string;
  name: string;
  memberCount: number;
  managerName: string | null;
  kpis: DashboardData['kpis'];
  teamSchedule: NonNullable<DashboardData['teamSchedule']>;
  attendanceSummary: {
    present: number;
    absent: number;
    onLeave: number;
    total: number;
  };
}

interface DashboardData {
  managedTeam?: { id: string; name: string } | null;
  teams?: TeamDashboardSlice[];
  metrics: {
    presentCount: number;
    totalEmployees: number;
    absentCount: number;
    leavesPendingCount: number;
    deptKpiAvg: number;
  };
  attendance: AttendanceRow[];
  leaves: LeaveRequest[];
  kpis: {
    sprintVelocity: number;
    bugResolution: number;
    codeReview: number;
    deliveryOnTime: number;
    teamUtilization: number;
    openTickets: number;
    documentation: number;
  };
  announcements: AnnouncementItem[];
  moodPulse: {
    happy: number;
    neutral: number;
    stressed: number;
    unknown: number;
  };
  teamSchedule?: {
    pending: number;
    totalTaken: number;
    attendance: number;
    onLeaveToday: number;
    presentCount?: number;
    absentCount?: number;
  };
}

// ============================================================================
// HELPERS
// ============================================================================

function formatTime(isoString: string | null): string {
  if (!isoString) return '-';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatHours(h: number): string {
  if (h <= 0) return '0h';
  return `${h.toFixed(1)}h`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'PRESENT':
      return { label: 'Present', className: 'bg-[#EBF7EE] text-[#2F7A47] dark:bg-emerald-950/20 dark:text-emerald-400', dotColor: 'bg-[#EBF7EE]' };
    case 'ABSENT':
      return { label: 'Absent', className: 'bg-[#FDECEF] text-[#C93B4E] dark:bg-rose-950/20 dark:text-rose-400', dotColor: 'bg-[#FDECEF]' };
    case 'LATE':
      return { label: 'Late', className: 'bg-[#FEF5E7] text-[#C98B2C] dark:bg-amber-950/20 dark:text-amber-400', dotColor: 'bg-[#FEF5E7]' };
    case 'LEAVE':
    case 'ON LEAVE':
      return { label: 'On leave', className: 'bg-[#ECEFF3] text-[#5A6E85] dark:bg-slate-800 dark:text-slate-400', dotColor: 'bg-[#ECEFF3]' };
    default:
      return { label: status, className: 'bg-muted text-muted-foreground', dotColor: 'bg-muted' };
  }
}

function normalizeAttendanceStatus(status: string): string {
  if (status === 'LEAVE') return 'ON LEAVE';
  return status;
}

function isSameAttendanceStatus(a: string, b: string): boolean {
  return normalizeAttendanceStatus(a) === normalizeAttendanceStatus(b);
}

function getMutationErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const apiError = error.response?.data?.error;
    if (apiError) return String(apiError);
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

function resolveAttachmentLink(attachment: string): { href: string; label: string } {
  const label = attachment.split('/').pop() || attachment;
  if (attachment.startsWith('http://') || attachment.startsWith('https://')) {
    return { href: attachment, label };
  }
  const apiOrigin = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1').replace(/\/api\/v\d+\/?$/, '');
  const href = attachment.startsWith('/') ? `${apiOrigin}${attachment}` : attachment;
  return { href, label };
}

function getAnnouncementDotColor(index: number): string {
  const colors = ['border-blue-500', 'border-amber-500', 'border-emerald-500', 'border-slate-300 dark:border-slate-700'];
  return colors[index % colors.length];
}

function timeAgo(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatLeaveDates(startDate: string, endDate: string): string {
  try {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return '-';
    
    const sMonth = s.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const sDate = s.getUTCDate();
    const eMonth = e.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
    const eDate = e.getUTCDate();
    
    if (sMonth === eMonth) {
      if (sDate === eDate) return `${sMonth} ${sDate}`;
      return `${sMonth} ${sDate}-${eDate}`;
    }
    return `${sMonth} ${sDate} - ${eMonth} ${eDate}`;
  } catch {
    return '-';
  }
}

function getCurrentMonthLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long' });
}

async function downloadTeamReport(teamId?: string) {
  const response = await apiClient.get('/manager/report', {
    responseType: 'blob',
    params: teamId ? { teamId } : undefined,
  });
  const disposition = response.headers['content-disposition'] as string | undefined;
  const filenameMatch = disposition?.match(/filename="([^"]+)"/);
  const filename = filenameMatch?.[1] ?? (teamId ? 'team-kpi-report.csv' : 'all-teams-kpi-report.csv');
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);
  window.URL.revokeObjectURL(url);
}

function TeamScheduleBar({
  present,
  onLeave,
  absent,
  total,
}: {
  present: number;
  onLeave: number;
  absent: number;
  total: number;
}) {
  const safeTotal = total > 0 ? total : 1;
  const presentPct = Math.round((present / safeTotal) * 100);
  const onLeavePct = Math.round((onLeave / safeTotal) * 100);
  const absentPct = Math.max(0, 100 - presentPct - onLeavePct);

  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
        {presentPct > 0 && (
          <div className="h-full bg-[#7ec384]" style={{ width: `${presentPct}%` }} title={`Present: ${present}`} />
        )}
        {onLeavePct > 0 && (
          <div className="h-full bg-[#69b4f0]" style={{ width: `${onLeavePct}%` }} title={`On leave: ${onLeave}`} />
        )}
        {absentPct > 0 && (
          <div className="h-full bg-[#e57b73]" style={{ width: `${absentPct}%` }} title={`Absent: ${absent}`} />
        )}
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground font-medium">
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#7ec384]" /> Present ({present})</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#69b4f0]" /> On leave ({onLeave})</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#e57b73]" /> Absent ({absent})</span>
      </div>
    </div>
  );
}

function TeamPickerDropdown({
  teams,
  selectedTeamId,
  onSelect,
}: {
  teams: Pick<TeamDashboardSlice, 'id' | 'name' | 'memberCount'>[];
  selectedTeamId: string;
  onSelect: (teamId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top?: string; bottom?: string; left?: string }>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? teams[0];

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 160;

      setDropdownStyle({
        top: openUpwards ? 'auto' : `${rect.bottom + 4}px`,
        bottom: openUpwards ? `${window.innerHeight - rect.top + 4}px` : 'auto',
        left: `${rect.left}px`,
      });
    }
    setOpen(!open);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold text-foreground hover:bg-muted/50 transition-colors"
      >
        <span className="truncate max-w-[180px]">{selectedTeam.name}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            style={dropdownStyle}
            className="fixed z-50 min-w-[220px] max-w-[280px] rounded-lg border bg-card shadow-lg py-1"
          >
            {teams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => {
                  onSelect(team.id);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-accent transition-colors ${
                  team.id === selectedTeamId ? 'bg-accent/50 font-semibold' : 'font-medium'
                }`}
              >
                <span className="block text-foreground truncate">{team.name}</span>
                <span className="block text-[10px] text-muted-foreground mt-0.5">{team.memberCount} members</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TeamKpiPanel({
  team,
  teams,
  selectedTeamId,
  onTeamSelect,
  onDownload,
}: {
  team: Pick<TeamDashboardSlice, 'name' | 'memberCount' | 'managerName' | 'kpis' | 'teamSchedule' | 'attendanceSummary' | 'id'>;
  teams?: Pick<TeamDashboardSlice, 'id' | 'name' | 'memberCount'>[];
  selectedTeamId?: string;
  onTeamSelect?: (teamId: string) => void;
  onDownload: (teamId: string) => void;
}) {
  const kpiAvg = Math.round((team.kpis.sprintVelocity + team.kpis.bugResolution + team.kpis.codeReview) / 3);
  const showTeamPicker = teams && teams.length > 1 && selectedTeamId && onTeamSelect;

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-3 border-b pb-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground text-lg">Team KPI progress</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {showTeamPicker ? (
                <TeamPickerDropdown
                  teams={teams}
                  selectedTeamId={selectedTeamId}
                  onSelect={onTeamSelect}
                />
              ) : (
                <p className="text-xs font-semibold text-foreground">{team.name}</p>
              )}
              <span className="text-xs text-muted-foreground">
                · {team.memberCount} members
                {team.managerName ? ` · ${team.managerName}` : ''}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDownload(team.id)}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted/50 transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            KPI CSV
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-5">
          {[
            { label: 'Sprint\nvelocity', value: team.kpis.sprintVelocity },
            { label: 'Bug\nresolution', value: team.kpis.bugResolution },
            { label: 'Code\nreview', value: team.kpis.codeReview },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center">
              <div className="relative h-16 w-16">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="32" cy="32" r="24" className="stroke-muted" strokeWidth="4" fill="transparent" />
                  <circle
                    cx="32" cy="32" r="24"
                    className="stroke-primary"
                    strokeWidth="4"
                    strokeDasharray={2 * Math.PI * 24}
                    strokeDashoffset={(2 * Math.PI * 24) * (1 - item.value / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{item.value}%</span>
              </div>
              <span className="mt-2 text-center text-[10px] font-semibold text-muted-foreground leading-tight" dangerouslySetInnerHTML={{ __html: item.label.replace('\n', '<br />') }} />
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3.5">
          {[
            { label: 'Delivery on time', value: team.kpis.deliveryOnTime, color: 'bg-primary' },
            { label: 'Team utilization', value: team.kpis.teamUtilization, color: 'bg-primary' },
            { label: 'Open tickets', value: team.kpis.openTickets, color: 'bg-amber-500' },
            { label: 'Documentation', value: team.kpis.documentation, color: 'bg-rose-500' },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs font-semibold text-foreground">
                <span>{item.label}</span>
                <span>{item.value}{item.label === 'Open tickets' ? '' : '%'}</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                <div
                  className={`${item.color} h-1.5 rounded-full`}
                  style={{ width: `${Math.min(100, item.label === 'Open tickets' ? Math.min(item.value * 10, 100) : item.value)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-4 border-t pt-3 font-semibold uppercase">
        <span>Team KPI avg: {kpiAvg}%</span>
        <span>On leave today: {team.teamSchedule.onLeaveToday}</span>
      </div>
    </div>
  );
}

function AnnouncementsPanel({ announcements }: { announcements: AnnouncementItem[] }) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm h-full flex flex-col">
      <h3 className="font-semibold text-foreground text-lg border-b pb-4 shrink-0">Recent announcements</h3>
      <div className="mt-5 relative flex-grow min-h-[280px]">
        <div className="absolute inset-0 overflow-y-auto custom-scrollbar -ml-4 pl-4 -mr-4 pr-4">
          <div className="space-y-5 relative border-l border-muted pl-4 ml-2 py-1">
            {announcements.map((ann, index) => {
              const isOld = index >= 3;
              return (
                <div key={ann.id} className={`relative ${isOld ? 'opacity-60' : ''}`}>
                  <div className={`absolute -left-[22.5px] top-1.5 bg-card h-3 w-3 rounded-full border-[2.5px] ${
                    isOld ? 'border-slate-300 dark:border-slate-700 bg-slate-300 dark:bg-slate-700' : getAnnouncementDotColor(index)
                  }`} />
                  <div className="text-xs">
                    <span className="font-bold text-foreground text-sm">{ann.title}</span>
                    <p className="text-muted-foreground font-normal mt-1.5 leading-relaxed text-sm">{ann.content}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground font-medium">
                      <span className="text-foreground">{ann.author}</span>
                      <span>&bull;</span>
                      <span>{timeAgo(ann.createdAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {announcements.length === 0 && (
              <p className="text-sm text-muted-foreground py-6 text-center">No announcements yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickActionsPanel({
  metrics,
  moodPulse,
  onQuickAction,
  reportLabel = 'Generate team report',
}: {
  metrics: DashboardData['metrics'];
  moodPulse: DashboardData['moodPulse'];
  onQuickAction: (actionName: string) => void;
  reportLabel?: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between gap-6 h-full">
      <div>
        <h3 className="font-semibold text-foreground text-lg border-b pb-4">Quick actions</h3>
        <div className="mt-4 space-y-1">
          <button
            onClick={() => onQuickAction('Approve all leave')}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
          >
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <span>Approve all leave ({metrics.leavesPendingCount})</span>
          </button>
          <button
            onClick={() => onQuickAction('Start performance review')}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm bg-primary/10 text-primary hover:bg-primary/15 transition-colors font-medium text-left"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>Start performance review</span>
          </button>
          <button
            onClick={() => onQuickAction('Post team announcement')}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
          >
            <Megaphone className="h-5 w-5" />
            <span>Post team announcement</span>
          </button>
          <button
            onClick={() => onQuickAction('Generate team report')}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
          >
            <BarChart3 className="h-5 w-5" />
            <span>{reportLabel}</span>
          </button>
        </div>
      </div>
      <div className="border-t pt-4">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Team mood (Weekly pulse)</span>
        <div className="mt-2.5 flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full">
          <div className="bg-emerald-500/20 dark:bg-emerald-500/10 hover:bg-emerald-500/30 transition-colors" style={{ flex: moodPulse.happy }} title={`Happy (${moodPulse.happy})`} />
          <div className="bg-amber-500/20 dark:bg-amber-500/10 hover:bg-amber-500/30 transition-colors" style={{ flex: moodPulse.neutral }} title={`Neutral (${moodPulse.neutral})`} />
          <div className="bg-rose-500/20 dark:bg-rose-500/10 hover:bg-rose-500/30 transition-colors" style={{ flex: moodPulse.stressed }} title={`Stressed (${moodPulse.stressed})`} />
          <div className="bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" style={{ flex: moodPulse.unknown }} title={`Unknown (${moodPulse.unknown})`} />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// STATUS DROPDOWN COMPONENT
// ============================================================================

function StatusDropdown({
  currentStatus,
  employeeId,
  onSelect,
}: {
  currentStatus: string;
  employeeId: string;
  onSelect: (employeeId: string, status: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<{ top?: string; bottom?: string; right?: string }>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const badge = getStatusBadge(currentStatus);
  const options = ['PRESENT', 'ABSENT', 'LATE', 'ON LEAVE'];

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUpwards = spaceBelow < 180;
      
      setDropdownStyle({
        top: openUpwards ? 'auto' : `${rect.bottom + 4}px`,
        bottom: openUpwards ? `${window.innerHeight - rect.top + 4}px` : 'auto',
        right: `${window.innerWidth - rect.right}px`,
      });
    }
    setOpen(!open);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${badge.className}`}
      >
        {badge.label}
        <ChevronDown className="h-3 w-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div 
            style={dropdownStyle} 
            className="fixed z-50 w-36 rounded-lg border bg-card shadow-lg py-1"
          >
            {options.map((opt) => {
              const optBadge = getStatusBadge(opt);
              return (
                <button
                  key={opt}
                  onClick={() => {
                    onSelect(employeeId, opt);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs font-medium hover:bg-accent transition-colors flex items-center gap-2 ${
                    isSameAttendanceStatus(opt, currentStatus) ? 'bg-accent/50' : ''
                  }`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${optBadge.dotColor}`} />
                  {optBadge.label}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// ANNOUNCEMENT DIALOG COMPONENT
// ============================================================================

function AnnouncementDialog({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, content: string) => void;
  isSubmitting: boolean;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl border bg-card p-6 shadow-2xl">
        <h3 className="font-semibold text-foreground text-lg mb-4">Post team announcement</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title..."
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 outline-none resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (title.trim() && content.trim()) {
                  onSubmit(title.trim(), content.trim());
                }
              }}
              disabled={!title.trim() || !content.trim() || isSubmitting}
              className="bg-[#4F46E5] hover:bg-[#4338CA] text-white"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Post
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// MAIN PAGE COMPONENT
// ============================================================================

export default function ManagerDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [announcementOpen, setAnnouncementOpen] = useState(false);
  const [approveAllConfirmOpen, setApproveAllConfirmOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedKpiTeamId, setSelectedKpiTeamId] = useState<string | null>(null);

  // Fetch dashboard data
  const { data, isLoading, isError, refetch } = useQuery<DashboardData>({
    queryKey: ['manager-dashboard'],
    queryFn: fetchDashboard,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 2000,
  });

  // Mutations
  const leaveStatusMutation = useMutation({
    mutationFn: ({ leaveId, status }: { leaveId: string; status: 'APPROVED' | 'REJECTED' }) =>
      patchLeaveStatus(leaveId, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: variables.status === 'APPROVED' ? 'Leave Approved' : 'Leave Rejected',
        description: `Leave request has been ${variables.status.toLowerCase()}.`,
        className:
          variables.status === 'APPROVED'
            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200'
            : 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Leave update failed',
        description: getMutationErrorMessage(error, 'Could not update the leave request.'),
      });
    },
  });

  const approveAllMutation = useMutation({
    mutationFn: postApproveAll,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      const count = res?.data?.count ?? 0;
      if (count === 0) {
        toast({
          title: 'No pending leaves',
          description: 'There are no leave requests waiting for approval.',
        });
        return;
      }
      toast({
        title: 'Approved All Leaves',
        description: `Successfully approved ${count} pending leave request${count === 1 ? '' : 's'}.`,
        className: 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Approve all failed',
        description: getMutationErrorMessage(error, 'Could not approve pending leave requests.'),
      });
    },
  });

  const announcementMutation = useMutation({
    mutationFn: (payload: { title: string; content: string }) => postAnnouncement(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setAnnouncementOpen(false);
      toast({
        title: 'Announcement Posted',
        description: 'Your announcement has been sent to the team.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Failed to post',
        description: error instanceof Error ? error.message : 'An error occurred while posting the announcement.',
      });
    },
  });

  const attendanceMutation = useMutation({
    mutationFn: ({ employeeId, status }: { employeeId: string; status: string }) =>
      putAttendanceStatus(employeeId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard'] });
      toast({
        title: 'Status Updated',
        description: 'Attendance status has been overridden.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Status update failed',
        description: getMutationErrorMessage(error, 'Could not update attendance status.'),
      });
    },
  });

  const flagMutation = useMutation({
    mutationFn: ({ employeeId, isFlagged }: { employeeId: string; isFlagged: boolean }) =>
      postToggleFlag(employeeId, isFlagged),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard'] });
      toast({
        title: variables.isFlagged ? 'Employee Flagged' : 'Flag Removed',
        description: variables.isFlagged
          ? 'Check-in has been flagged for review.'
          : 'Flag has been removed.',
      });
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Flag update failed',
        description: getMutationErrorMessage(error, 'Could not update the flag status.'),
      });
    },
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleQuickAction = async (actionName: string) => {
    if (actionName === 'Approve all leave') {
      setApproveAllConfirmOpen(true);
      return;
    }
    if (actionName === 'Post team announcement') {
      setAnnouncementOpen(true);
      return;
    }
    if (actionName === 'Generate team report') {
      try {
        await downloadTeamReport();
        toast({ title: 'Report Downloaded', description: 'Team KPI report generated successfully.' });
      } catch (error) {
        toast({
          title: 'Error',
          description: getMutationErrorMessage(error, 'Failed to download report'),
          variant: 'destructive',
        });
      }
      return;
    }
    if (actionName === 'Start performance review') {
      toast({ title: 'Action Triggered', description: 'Performance review workflow started.' });
      return;
    }
    toast({ title: 'Action Triggered', description: `"${actionName}" executed successfully.` });
  };

  // Loading & error states
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center text-muted-foreground">
        <p className="text-sm font-semibold mb-2">Failed to load dashboard data</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const { metrics, attendance, leaves, kpis, announcements, moodPulse, teamSchedule, teams, managedTeam } = data;
  const teamKpiPanels: TeamDashboardSlice[] =
    teams && teams.length > 0
      ? teams
      : managedTeam
        ? [{
            id: managedTeam.id,
            name: managedTeam.name,
            memberCount: metrics.totalEmployees,
            managerName: null,
            kpis,
            teamSchedule: teamSchedule ?? {
              pending: metrics.leavesPendingCount,
              totalTaken: 0,
              attendance: 0,
              onLeaveToday: 0,
            },
            attendanceSummary: {
              present: metrics.presentCount,
              absent: metrics.absentCount,
              onLeave: teamSchedule?.onLeaveToday ?? 0,
              total: metrics.totalEmployees,
            },
          }]
        : [];

  const defaultKpiTeamId = managedTeam?.id ?? teamKpiPanels[0]?.id ?? null;
  const activeKpiTeamId =
    selectedKpiTeamId && teamKpiPanels.some((team) => team.id === selectedKpiTeamId)
      ? selectedKpiTeamId
      : defaultKpiTeamId;
  const activeKpiTeam = teamKpiPanels.find((team) => team.id === activeKpiTeamId) ?? teamKpiPanels[0] ?? null;

  const handleTeamReportDownload = async (teamId: string) => {
    try {
      await downloadTeamReport(teamId);
      toast({ title: 'Report Downloaded', description: 'Team KPI report downloaded successfully.' });
    } catch (error) {
      toast({
        title: 'Error',
        description: getMutationErrorMessage(error, 'Failed to download report'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Metrics Row */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Present Today */}
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground">{metrics.presentCount}</span>
              <span className="text-sm font-medium text-muted-foreground">/{metrics.totalEmployees}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">PRESENT TODAY</span>
          </div>
        </div>

        {/* Absent Today */}
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
            <UserX className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold tracking-tight text-foreground">{metrics.absentCount}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ABSENT TODAY</span>
          </div>
        </div>

        {/* Leave Pending */}
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
            <CalendarDays className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold tracking-tight text-foreground">{metrics.leavesPendingCount}</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">LEAVE PENDING</span>
          </div>
        </div>

        {/* Dept KPI Avg */}
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold tracking-tight text-foreground">{metrics.deptKpiAvg}%</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">DEPT KPI AVG</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Attendance & Leave Approvals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 items-stretch">
        
        {/* Left Widget: Team Attendance (Col Span 3) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-3 flex flex-col h-[500px]">
          <div className="flex flex-col h-full">
            {/* Header section with title, refresh, and menu */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <h3 className="font-semibold text-foreground text-lg">Team attendance · today</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefresh}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-slate-50 hover:text-foreground transition-colors"
                  title="Refresh attendance"
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
                <button className="rounded-md p-1 text-muted-foreground hover:bg-slate-50 transition-colors">
                  <MoreVertical className="h-5 w-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-auto -mx-6 flex-grow border-b border-slate-100 dark:border-slate-800/60 custom-scrollbar">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] dark:bg-slate-900/50 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-6">EMPLOYEE</th>
                    <th className="py-3 px-4">ROLE</th>
                    <th className="py-3 px-4">CHECK-IN</th>
                    <th className="py-3 px-4">STATUS</th>
                    <th className="py-3 px-4">HOURS</th>
                    <th className="py-3 px-6 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 font-medium">
                  {attendance.map((row, idx) => {
                    const isAbsentOrLeave = row.status === 'ABSENT' || row.status === 'LEAVE';
                    const isLate = row.status === 'LATE';
                    return (
                      <tr
                        key={row.employeeId}
                        className={`${
                          isAbsentOrLeave
                            ? 'bg-[#F4F5F8] hover:bg-[#EAECEF] dark:bg-slate-800/40 dark:hover:bg-slate-800/60'
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/20'
                        } transition-colors`}
                      >
                        <td className="py-4 px-6">
                          <Link
                            href={`/employee/employee_profile_personal?id=${row.employeeId}&tab=Attendance+logs`}
                            className="text-slate-900 dark:text-slate-100 font-medium hover:text-primary hover:underline transition-colors"
                          >
                            {row.name}
                          </Link>
                        </td>
                        <td className="py-4 px-4 text-slate-500 font-normal">{row.role}</td>
                        <td className={`py-4 px-4 font-normal ${isLate ? 'text-red-600 dark:text-rose-400 font-semibold' : 'text-slate-800 dark:text-slate-200'}`}>
                          {formatTime(row.checkIn)}
                        </td>
                        <td className="py-4 px-4">
                          <StatusDropdown
                            currentStatus={row.status}
                            employeeId={row.employeeId}
                            onSelect={(empId, newStatus) => {
                              attendanceMutation.mutate({ employeeId: empId, status: newStatus });
                            }}
                          />
                        </td>
                        <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">
                          {formatHours(row.hours)}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => flagMutation.mutate({ employeeId: row.employeeId, isFlagged: !row.isFlagged })}
                            className={`transition-colors inline-flex align-middle ${
                              row.isFlagged
                                ? 'text-rose-600 hover:text-rose-800'
                                : 'text-slate-400 hover:text-rose-500'
                            }`}
                            title={row.isFlagged ? 'Remove flag' : 'Flag member'}
                          >
                            <Flag className={`h-4 w-4 ${row.isFlagged ? 'fill-current' : ''}`} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Widget: Leave Approvals (Col Span 2) */}
        <div className="lg:col-span-2 flex flex-col h-[500px] gap-4">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4 flex flex-col">
          {leaves.length === 0 ? (
            <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col items-center justify-center py-12 text-center text-muted-foreground h-full">
              <ClipboardCheck className="h-10 w-10 text-muted/50 mb-3" />
              <p className="text-sm font-semibold">No pending requests</p>
              <p className="text-xs mt-1">All leave approvals are processed!</p>
            </div>
          ) : (
            leaves.map((req) => {
              const initials = req.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
              
              const avatarBg = req.avatarColor?.bg || 'bg-slate-100 dark:bg-slate-800';
              const avatarText = req.avatarColor?.text || 'text-slate-600 dark:text-slate-300';
              
              return (
                <div key={req.id} className="rounded-xl border border-slate-200/60 dark:border-slate-800 bg-card p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${avatarBg} ${avatarText}`}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-foreground truncate">{req.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {req.type} &bull; {formatLeaveDates(req.startDate, req.endDate)} ({req.durationDays} day{req.durationDays !== 1 ? 's' : ''})
                      </p>
                    </div>
                  </div>
                  
                  {(req.overlapDetected || req.attachment) && (
                    <div className="flex items-center gap-2 mt-0.5">
                      {req.overlapDetected && (
                        <div className="flex items-center gap-1.5 rounded bg-[#FFF4E5] dark:bg-amber-950/30 px-2 py-1 text-[11px] font-medium text-[#D97706] dark:text-amber-400 border border-[#FFE0B2] dark:border-amber-900/50">
                          <Users className="h-3.5 w-3.5" />
                          Team overlap detected
                        </div>
                      )}
                      {req.attachment && (() => {
                        const { href, label } = resolveAttachmentLink(req.attachment);
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 rounded bg-[#E6F4EA] dark:bg-emerald-950/30 px-2 py-1 text-[11px] font-medium text-[#1E8E3E] dark:text-emerald-400 border border-[#CEEAD6] dark:border-emerald-900/50 hover:bg-[#CEEAD6]/60 transition-colors"
                          >
                            <Paperclip className="h-3.5 w-3.5" />
                            {label}
                          </a>
                        );
                      })()}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mt-1">
                    <button
                      onClick={() => leaveStatusMutation.mutate({ leaveId: req.id, status: 'REJECTED' })}
                      className="flex-1 rounded-md bg-[#FDECEF] dark:bg-rose-950/30 py-2 text-sm font-bold text-[#C93B4E] dark:text-rose-400 hover:bg-[#f8dadd] dark:hover:bg-rose-900/40 transition-colors"
                      disabled={leaveStatusMutation.isPending}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => leaveStatusMutation.mutate({ leaveId: req.id, status: 'APPROVED' })}
                      className="flex-1 rounded-md bg-[#5A4FCF] dark:bg-indigo-600 py-2 text-sm font-bold text-white hover:bg-[#4d44b4] dark:hover:bg-indigo-700 transition-colors"
                      disabled={leaveStatusMutation.isPending}
                    >
                      Approve
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
          
          {/* Team Schedule Card - synced with today's attendance */}
          <div className="mt-auto rounded-xl border border-slate-200/60 dark:border-slate-800 bg-card p-4 shadow-sm shrink-0">
            <div className="mb-4">
              <h3 className="font-bold text-sm text-foreground">
                Team Schedule ({getCurrentMonthLabel()})
              </h3>
              {managedTeam && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{managedTeam.name}</p>
              )}
            </div>

            <TeamScheduleBar
              present={metrics.presentCount}
              onLeave={teamSchedule?.onLeaveToday ?? 0}
              absent={metrics.absentCount}
              total={metrics.totalEmployees}
            />
            
            <div className="grid grid-cols-4 gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="font-bold text-xs text-foreground">{teamSchedule?.pending ?? 0}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Pending</div>
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">{teamSchedule?.totalTaken ?? 0}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">Total Taken</div>
              </div>
              <div>
                <div className="font-bold text-xs text-emerald-600">{teamSchedule?.attendance ?? 0}%</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Attendance</div>
              </div>
              <div>
                <div className="font-bold text-xs text-foreground">{teamSchedule?.onLeaveToday ?? 0}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">On Leave Today</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: KPI Progress, Recent Announcements & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        {activeKpiTeam ? (
          <TeamKpiPanel
            team={activeKpiTeam}
            teams={teamKpiPanels.length > 1 ? teamKpiPanels : undefined}
            selectedTeamId={activeKpiTeam.id}
            onTeamSelect={setSelectedKpiTeamId}
            onDownload={handleTeamReportDownload}
          />
        ) : (
          <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between h-full">
            <div>
              <h3 className="font-semibold text-foreground text-lg border-b pb-4">Team KPI progress</h3>
              <p className="text-sm text-muted-foreground mt-4">No team KPI data available yet.</p>
            </div>
          </div>
        )}
        <AnnouncementsPanel announcements={announcements} />
        <QuickActionsPanel
          metrics={metrics}
          moodPulse={moodPulse}
          onQuickAction={handleQuickAction}
          reportLabel={(teams?.length ?? 0) > 1 ? 'Download all teams KPI report' : 'Generate team report'}
        />
      </div>

      {/* Announcement Dialog */}
      {announcementOpen && (
        <AnnouncementDialog
          open={true}
          onClose={() => setAnnouncementOpen(false)}
          onSubmit={(title, content) => announcementMutation.mutate({ title, content })}
          isSubmitting={announcementMutation.isPending}
        />
      )}

      {/* Approve All Leave Confirmation */}
      {approveAllConfirmOpen && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setApproveAllConfirmOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-xl border bg-card p-6 shadow-2xl">
            <h3 className="font-semibold text-foreground text-lg mb-2">Approve All Leave Requests</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Are you sure you want to approve all pending leave requests? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setApproveAllConfirmOpen(false)}
                disabled={approveAllMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  approveAllMutation.mutate();
                  setApproveAllConfirmOpen(false);
                }}
                disabled={approveAllMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {approveAllMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                )}
                Approve All
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
