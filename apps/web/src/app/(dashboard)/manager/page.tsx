'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Users,
  UserX,
  CalendarDays,
  TrendingUp,
  MoreVertical,
  Flag,
  Check,
  X,
  ClipboardCheck,
  Play,
  Megaphone,
  BarChart3,
  RefreshCw,
  ChevronDown,
  Send,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
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
}

interface AnnouncementItem {
  id: string;
  author: string;
  title: string;
  content: string;
  createdAt: string;
}

interface DashboardData {
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
      return { label: 'Present', className: 'bg-[#EBF7EE] text-[#2F7A47] dark:bg-emerald-950/20 dark:text-emerald-400' };
    case 'ABSENT':
      return { label: 'Absent', className: 'bg-[#FDECEF] text-[#C93B4E] dark:bg-rose-950/20 dark:text-rose-400' };
    case 'LATE':
      return { label: 'Late', className: 'bg-[#FEF5E7] text-[#C98B2C] dark:bg-amber-950/20 dark:text-amber-400' };
    case 'LEAVE':
    case 'ON LEAVE':
      return { label: 'On leave', className: 'bg-[#ECEFF3] text-[#5A6E85] dark:bg-slate-800 dark:text-slate-400' };
    default:
      return { label: status, className: 'bg-muted text-muted-foreground' };
  }
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
                    opt === currentStatus ? 'bg-accent/50' : ''
                  }`}
                >
                  <span className={`inline-block h-2 w-2 rounded-full ${optBadge.className.split(' ')[0]}`} />
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  });

  const approveAllMutation = useMutation({
    mutationFn: postApproveAll,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['manager-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({
        title: 'Approved All Leaves',
        description: `Successfully approved all pending leave requests.`,
        className: 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200',
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
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const handleQuickAction = (actionName: string) => {
    if (actionName === 'Approve all leave') {
      approveAllMutation.mutate();
      return;
    }
    if (actionName === 'Post team announcement') {
      setAnnouncementOpen(true);
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

  const { metrics, attendance, leaves, kpis, announcements, moodPulse } = data;

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
                            href={`/employee/employee_profile_personal?employeeId=${row.employeeId}&tab=Attendance+logs`}
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
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2 flex flex-col h-[500px]">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between border-b pb-4 shrink-0">
              <h3 className="font-semibold text-foreground text-lg">Leave approvals</h3>
              {leaves.length > 0 && (
                <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-semibold border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40">
                  {leaves.length} pending
                </span>
              )}
            </div>

            {/* List of Leave Requests */}
            <div className="mt-4 space-y-3 overflow-y-auto flex-grow -mr-4 pr-4 pb-2 custom-scrollbar">
              {leaves.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <ClipboardCheck className="h-10 w-10 text-muted/50 mb-3" />
                  <p className="text-sm font-semibold">No pending requests</p>
                  <p className="text-xs mt-1">All leave approvals are processed!</p>
                </div>
              ) : (
                leaves.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between rounded-[6px] border border-slate-200/80 border-l-[4px] border-l-amber-500 bg-[#F8F8FD] dark:bg-slate-900/40 p-3.5 shadow-[0_2px_5px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{req.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {req.type} · {req.durationDays}d
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => leaveStatusMutation.mutate({ leaveId: req.id, status: 'REJECTED' })}
                        className="h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-rose-600 hover:text-rose-700 transition-colors flex items-center justify-center dark:bg-slate-950 dark:border-slate-800"
                        aria-label="Reject Request"
                        disabled={leaveStatusMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => leaveStatusMutation.mutate({ leaveId: req.id, status: 'APPROVED' })}
                        className="h-8 w-8 rounded-md bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors flex items-center justify-center dark:bg-indigo-600 dark:hover:bg-indigo-700"
                        aria-label="Approve Request"
                        disabled={leaveStatusMutation.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: KPI Progress, Recent Announcements & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        
        {/* Column 1: Dept KPI Progress */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="font-semibold text-foreground text-lg border-b pb-4">Dept KPI progress</h3>
            
            {/* Radial SVGs Grid */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                { label: 'Sprint\nvelocity', value: kpis.sprintVelocity },
                { label: 'Bug\nresolution', value: kpis.bugResolution },
                { label: 'Code\nreview', value: kpis.codeReview },
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

            {/* Progress Bars */}
            <div className="mt-6 space-y-3.5">
              {[
                { label: 'Delivery on time', value: kpis.deliveryOnTime, color: 'bg-primary' },
                { label: 'Team utilization', value: kpis.teamUtilization, color: 'bg-primary' },
                { label: 'Open tickets', value: kpis.openTickets, color: 'bg-amber-500' },
                { label: 'Documentation', value: kpis.documentation, color: 'bg-rose-500' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs font-semibold text-foreground">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                    <div className={`${item.color} h-1.5 rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center text-[10px] text-muted-foreground mt-4 border-t pt-3 font-semibold uppercase w-full">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-primary" /> Q2 Planning
            </div>
            <div className="h-[1px] bg-border flex-grow mx-2" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full bg-muted" /> Mid-cycle
            </div>
            <div className="h-[1px] bg-border flex-grow mx-2" />
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="h-2 w-2 rounded-full border border-muted-foreground bg-transparent" /> Review
            </div>
          </div>
        </div>

        {/* Column 2: Recent Announcements */}
        <div className="rounded-xl border bg-card p-6 shadow-sm h-full flex flex-col">
          <h3 className="font-semibold text-foreground text-lg border-b pb-4 shrink-0">Recent announcements</h3>
          
          <div className="mt-5 relative flex-grow">
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
                      <p className="text-muted-foreground font-normal mt-1.5 leading-relaxed text-sm">
                        {ann.content}
                      </p>
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

        {/* Column 3: Quick Actions & Weekly Mood Pulse */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between gap-6 h-full">
          {/* Quick Actions List */}
          <div>
            <h3 className="font-semibold text-foreground text-lg border-b pb-4">Quick actions</h3>
            
            <div className="mt-4 space-y-1">
              <button
                onClick={() => handleQuickAction('Approve all leave')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
              >
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <span>Approve all leave ({metrics.leavesPendingCount})</span>
              </button>

              <button
                onClick={() => handleQuickAction('Start performance review')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm bg-primary/10 text-primary hover:bg-primary/15 transition-colors font-medium text-left"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Start performance review</span>
              </button>

              <button
                onClick={() => handleQuickAction('Post team announcement')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
              >
                <Megaphone className="h-5 w-5" />
                <span>Post team announcement</span>
              </button>

              <button
                onClick={() => handleQuickAction('Generate team report')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
              >
                <BarChart3 className="h-5 w-5" />
                <span>Generate team report</span>
              </button>
            </div>
          </div>

          {/* Team Mood pulse check */}
          <div className="border-t pt-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Team mood (Weekly pulse)</span>
            
            <div className="mt-2.5 flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full">
              <div className={`bg-emerald-500/20 dark:bg-emerald-500/10 hover:bg-emerald-500/30 transition-colors`} style={{ flex: moodPulse.happy }} title={`Happy (${moodPulse.happy})`} />
              <div className={`bg-amber-500/20 dark:bg-amber-500/10 hover:bg-amber-500/30 transition-colors`} style={{ flex: moodPulse.neutral }} title={`Neutral (${moodPulse.neutral})`} />
              <div className={`bg-rose-500/20 dark:bg-rose-500/10 hover:bg-rose-500/30 transition-colors`} style={{ flex: moodPulse.stressed }} title={`Stressed (${moodPulse.stressed})`} />
              <div className={`bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors`} style={{ flex: moodPulse.unknown }} title={`Unknown (${moodPulse.unknown})`} />
            </div>
          </div>
        </div>
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
    </div>
  );
}
