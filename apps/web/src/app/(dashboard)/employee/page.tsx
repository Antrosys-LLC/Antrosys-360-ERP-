'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MapPin,
  Clock3,
  Wallet,
  Sun,
  Sandwich,
  Umbrella,
  Download,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  downloadEmployeePayslip,
  employeeCheckIn,
  employeeCheckOut,
  fetchEmployeeCalendar,
  fetchEmployeeDashboard,
  submitEmployeeMood,
  createTeamAnnouncement,
  updateTeamAnnouncement,
  deleteTeamAnnouncement,
  createTeamHoliday,
  updateTeamHoliday,
  deleteTeamHoliday,
  type DayStatus,
} from '@/lib/employee-api';

const LEAVE_ICONS = {
  Annual: Sun,
  Sick: Sandwich,
  Casual: Umbrella,
} as const;

function dayBgColor(status: DayStatus): string {
  switch (status) {
    case 'present':
      return '#C4BDF8';
    case 'late':
      return '#FBBF24';
    case 'half':
      return '#86EFAC';
    case 'absent':
      return '#F8B4B4';
    case 'leave':
      return '#93C5FD';
    case 'holiday':
      return '#BFDBFE';
    case 'today':
      return '#7B68EE';
    default:
      return 'transparent';
  }
}

function dayTextColor(status: DayStatus): string {
  return status === 'today' ? '#FFFFFF' : '#1A1A1A';
}

export default function EmployeeDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const now = new Date();
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [attendanceActionPending, setAttendanceActionPending] = useState(false);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [showHolidayForm, setShowHolidayForm] = useState(false);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayDate, setHolidayDate] = useState('');

  const dashboardQuery = useQuery({
    queryKey: ['employee', 'dashboard'],
    queryFn: fetchEmployeeDashboard,
  });

  const calendarQuery = useQuery({
    queryKey: ['employee', 'calendar', calendarMonth, calendarYear],
    queryFn: () => fetchEmployeeCalendar(calendarMonth, calendarYear),
    enabled: Boolean(dashboardQuery.data),
  });

  const checkInMutation = useMutation({
    mutationFn: employeeCheckIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      toast({ title: 'Checked in successfully' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Check-in failed' });
    },
    onSettled: () => setAttendanceActionPending(false),
  });

  const checkOutMutation = useMutation({
    mutationFn: employeeCheckOut,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      toast({ title: 'Checked out successfully' });
      if (result.needsMood) {
        setShowMoodModal(true);
      }
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Check-out failed' });
    },
    onSettled: () => setAttendanceActionPending(false),
  });

  const moodMutation = useMutation({
    mutationFn: submitEmployeeMood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employee'] });
      setShowMoodModal(false);
      toast({ title: 'Mood recorded for today' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to record mood' });
    },
  });

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: ['employee'] });
  };

  const announcementMutation = useMutation({
    mutationFn: async () => {
      const body = { title: announcementTitle.trim(), content: announcementContent.trim() };
      if (editingAnnouncementId) {
        return updateTeamAnnouncement(editingAnnouncementId, body);
      }
      return createTeamAnnouncement(body);
    },
    onSuccess: () => {
      invalidateDashboard();
      setShowAnnouncementForm(false);
      setEditingAnnouncementId(null);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      toast({ title: editingAnnouncementId ? 'Announcement updated' : 'Announcement posted' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to save announcement' });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: deleteTeamAnnouncement,
    onSuccess: () => {
      invalidateDashboard();
      toast({ title: 'Announcement deleted' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to delete announcement' });
    },
  });

  const holidayMutation = useMutation({
    mutationFn: async () => {
      const body = { title: holidayTitle.trim(), date: holidayDate };
      if (editingHolidayId) {
        return updateTeamHoliday(editingHolidayId, body);
      }
      return createTeamHoliday(body);
    },
    onSuccess: () => {
      invalidateDashboard();
      setShowHolidayForm(false);
      setEditingHolidayId(null);
      setHolidayTitle('');
      setHolidayDate('');
      toast({ title: editingHolidayId ? 'Holiday updated' : 'Holiday added' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to save holiday' });
    },
  });

  const deleteHolidayMutation = useMutation({
    mutationFn: deleteTeamHoliday,
    onSuccess: () => {
      invalidateDashboard();
      toast({ title: 'Holiday deleted' });
    },
    onError: () => {
      toast({ variant: 'destructive', title: 'Failed to delete holiday' });
    },
  });

  const dashboard = dashboardQuery.data;
  const calendar = calendarQuery.data ?? dashboard?.calendarMonth;
  const canManageTeam = dashboard?.canManageTeam ?? false;

  const currentUser = dashboard?.currentUser;
  const attendanceToday = dashboard?.attendanceToday;
  const leaveBalances = dashboard?.leaveBalances ?? [];
  const pendingLeaveRequest = dashboard?.pendingLeaveRequest;
  const latestPayslip = dashboard?.latestPayslip;
  const teamAnnouncements = dashboard?.teamAnnouncements ?? [];
  const upcomingHolidays = dashboard?.upcomingHolidays ?? [];

  const hasCheckedIn = attendanceToday?.hasCheckedIn ?? false;
  const hasCheckedOut = attendanceToday?.hasCheckedOut ?? false;

  useEffect(() => {
    if (attendanceToday?.needsMood) {
      setShowMoodModal(true);
    }
  }, [attendanceToday?.needsMood]);

  const attendanceButtonLabel = useMemo(() => {
    if (!hasCheckedIn) {
      return (
        <>
          Tap to
          <br />
          check in
        </>
      );
    }
    if (!hasCheckedOut) {
      return (
        <>
          Tap to
          <br />
          check out
        </>
      );
    }
    return (
      <>
        Done
        <br />
        for today
      </>
    );
  }, [hasCheckedIn, hasCheckedOut]);

  const handleAttendanceToggle = () => {
    if (attendanceActionPending || hasCheckedOut) return;
    if (!hasCheckedIn) {
      setAttendanceActionPending(true);
      checkInMutation.mutate();
      return;
    }
    const confirmed = window.confirm('Check out for today? This will finalize your attendance hours.');
    if (!confirmed) return;
    setAttendanceActionPending(true);
    checkOutMutation.mutate();
  };

  const shiftCalendarMonth = (delta: number) => {
    const date = new Date(Date.UTC(calendarYear, calendarMonth - 1 + delta, 1));
    setCalendarMonth(date.getUTCMonth() + 1);
    setCalendarYear(date.getUTCFullYear());
  };

  const handleDownloadPayslip = async () => {
    if (!latestPayslip?.id) return;
    try {
      const blob = await downloadEmployeePayslip(latestPayslip.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `payslip-${latestPayslip.period.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      anchor.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Payslip downloaded' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to download payslip' });
    }
  };

  if (dashboardQuery.isLoading) {
    return (
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-8 bg-[#E0E0E0] rounded w-64" />
        <div className="h-4 bg-[#E0E0E0] rounded w-48" />
        <div className="grid grid-cols-[1.6fr_1fr] gap-4">
          <div className="h-40 bg-[#E0E0E0] rounded-[10px]" />
          <div className="h-40 bg-[#E0E0E0] rounded-[10px]" />
        </div>
      </div>
    );
  }

  if (dashboardQuery.isError || !currentUser || !attendanceToday) {
    return (
      <div className="text-[13px] text-[#A32D2D]">
        Unable to load employee dashboard. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {showMoodModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-[10px] border border-[#E0E0E0] p-5 w-full max-w-sm shadow-lg">
            <h2 className="text-[16px] font-semibold text-[#1A1A1A] mb-1">How are you feeling today?</h2>
            <p className="text-[12px] text-[#888888] mb-4">Your mood helps your manager track team wellbeing.</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { mood: 'HAPPY' as const, label: 'Happy', emoji: '😊' },
                { mood: 'NEUTRAL' as const, label: 'Neutral', emoji: '😐' },
                { mood: 'STRESSED' as const, label: 'Stressed', emoji: '😓' },
              ]).map((option) => (
                <button
                  key={option.mood}
                  type="button"
                  disabled={moodMutation.isPending}
                  onClick={() => moodMutation.mutate(option.mood)}
                  className="flex flex-col items-center gap-1 border border-[#E0E0E0] rounded-lg py-3 hover:bg-[#F8F9FC] disabled:opacity-50"
                >
                  <span className="text-[20px]">{option.emoji}</span>
                  <span className="text-[11px] font-medium text-[#1A1A1A]">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#1A1A1A] leading-tight flex items-center gap-2">
          {currentUser.greeting} <span>👋</span>
        </h1>
        <p className="text-[13px] text-[#888888] mt-0.5">{currentUser.subtitle}</p>
      </div>

      {/* Top row: Check-in + Profile */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        {/* Check-in card */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleAttendanceToggle}
              disabled={attendanceActionPending || hasCheckedOut}
              className="size-16 rounded-full bg-[#7B68EE] hover:bg-[#6A5ACD] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors"
            >
              <span className="text-white text-[10px] font-medium text-center leading-tight">
                {attendanceButtonLabel}
              </span>
            </button>
            <div>
              <div className="text-[22px] font-bold text-[#1A1A1A] leading-none">{attendanceToday.currentTime}</div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="flex items-center gap-1 bg-[#F8F9FC] border border-[#E0E0E0] rounded-full px-2.5 py-1">
                  <MapPin size={11} strokeWidth={2} className="text-[#888888]" />
                  <span className="text-[11px] text-[#888888]">{attendanceToday.location}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-[#E0E0E0] mt-4 pt-4 grid grid-cols-4 gap-2">
            <div>
              <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide block mb-1">
                Check-in
              </span>
              <span className="text-[13px] font-medium text-[#1A1A1A]">{attendanceToday.checkIn}</span>
            </div>
            <div>
              <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide block mb-1">
                Check-out
              </span>
              <span className="text-[13px] font-medium text-[#1A1A1A]">{attendanceToday.checkOut}</span>
            </div>
            <div>
              <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide block mb-1">
                Hours
              </span>
              <span className="text-[13px] font-medium text-[#1A1A1A]">{attendanceToday.hours}</span>
            </div>
            <div>
              <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide block mb-1">
                Overtime
              </span>
              <span className="text-[13px] font-medium text-[#1A1A1A]">{attendanceToday.overtime}</span>
            </div>
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5 flex flex-col items-center text-center">
          <div className="size-14 rounded-full bg-[#7B68EE] flex items-center justify-center mb-3">
            <span className="text-white font-bold text-[16px]">{currentUser.initials}</span>
          </div>
          <span className="text-[14px] font-semibold text-[#1A1A1A]">{currentUser.name}</span>
          <span className="text-[11px] text-[#534AB7] bg-[#EEEDFE] px-2.5 py-1 rounded-full mt-1.5">
            {currentUser.title}
          </span>

          <div className="border border-[#E0E0E0] rounded-lg w-full mt-4 grid grid-cols-3 divide-x divide-[#E0E0E0]">
            <div className="flex flex-col items-center py-2.5">
              <span className="text-[14px] font-bold text-[#1A1A1A]">{currentUser.tenure}</span>
              <span className="text-[9px] text-[#AAAAAA] mt-0.5">Tenure</span>
            </div>
            <div className="flex flex-col items-center py-2.5">
              <span className="text-[14px] font-bold text-[#1A1A1A]">{currentUser.teamSize}</span>
              <span className="text-[9px] text-[#AAAAAA] mt-0.5">Team Size</span>
            </div>
            <div className="flex flex-col items-center py-2.5 gap-1">
              <MapPin size={14} strokeWidth={1.8} className="text-[#534AB7]" />
              <span className="text-[9px] text-[#AAAAAA]">{currentUser.location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle row: Leave balances + Payslip */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        {/* Leave balances */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[14px] font-semibold text-[#1A1A1A]">Leave Balances</span>
            <Link href="/leave" className="text-[11px] font-medium text-[#534AB7] hover:underline">
              View History
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {leaveBalances.map((leave) => {
              const Icon = LEAVE_ICONS[leave.type as keyof typeof LEAVE_ICONS] ?? Sun;
              return (
                <div key={leave.type} className="border border-[#E0E0E0] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="size-7 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: leave.bg }}
                    >
                      <Icon size={14} strokeWidth={1.8} style={{ color: leave.iconColor }} />
                    </div>
                    <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide">
                      {leave.type}
                    </span>
                  </div>
                  <div
                    className="text-[20px] font-bold leading-none"
                    style={{ color: leave.type === 'Casual' ? '#A32D2D' : '#1A1A1A' }}
                  >
                    {leave.value}
                  </div>
                  <span className="text-[10px] text-[#AAAAAA]">Days available</span>
                </div>
              );
            })}
          </div>

          {pendingLeaveRequest && (
            <div className="bg-[#EEEDFE] rounded-lg px-3.5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ArrowRight size={14} strokeWidth={2} className="text-[#534AB7]" />
                <div>
                  <span className="text-[12px] font-medium text-[#1A1A1A] block">{pendingLeaveRequest.title}</span>
                  <span className="text-[10px] text-[#888888]">{pendingLeaveRequest.dateRange}</span>
                </div>
              </div>
              <span className="text-[11px] font-medium text-[#534AB7] bg-white px-2.5 py-1 rounded-full shrink-0">
                {pendingLeaveRequest.status}
              </span>
            </div>
          )}
        </div>

        {/* Payslip card */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-md bg-[#EEEDFE] flex items-center justify-center shrink-0">
                <Wallet size={16} strokeWidth={1.8} className="text-[#534AB7]" />
              </div>
              <div>
                <span className="text-[10px] text-[#AAAAAA] block">{latestPayslip?.label ?? 'Latest Payslip'}</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">
                  {latestPayslip?.period ?? 'No payslip yet'}
                </span>
              </div>
            </div>
            <button
              type="button"
              aria-label="Download payslip"
              onClick={handleDownloadPayslip}
              disabled={!latestPayslip?.id}
              className="text-[#888888] hover:text-[#1A1A1A] disabled:opacity-40"
            >
              <Download size={16} strokeWidth={1.8} />
            </button>
          </div>

          {latestPayslip ? (
            <>
              <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide block mb-1">
                {latestPayslip.netPayLabel}
              </span>
              <div className="text-[22px] font-bold text-[#1A1A1A] leading-none mb-4">{latestPayslip.netPay}</div>

              <div className="h-1.5 w-full rounded-full bg-[#F0F0F0] overflow-hidden mb-3">
                <div
                  className="h-full bg-[#7B68EE] rounded-full"
                  style={{ width: `${latestPayslip.breakdownPct}%` }}
                />
              </div>

              <div className="flex items-center gap-4">
                {latestPayslip.legend.map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[10px] text-[#888888]">{item.label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <span className="text-[11px] text-[#888888]">Your latest payslip will appear here.</span>
          )}
        </div>
      </div>

      {/* Bottom row: Announcements + Calendar/Holidays */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        {/* Team announcements */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5 h-fit">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[14px] font-semibold text-[#1A1A1A]">Team Announcements</span>
            {canManageTeam && (
              <button
                type="button"
                onClick={() => {
                  setEditingAnnouncementId(null);
                  setAnnouncementTitle('');
                  setAnnouncementContent('');
                  setShowAnnouncementForm(true);
                }}
                className="flex items-center gap-1 text-[11px] font-medium text-[#534AB7] hover:underline"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>
          {showAnnouncementForm && canManageTeam && (
            <div className="border border-[#E0E0E0] rounded-lg p-3 mb-4 flex flex-col gap-2">
              <input
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Title"
                className="text-[12px] border border-[#E0E0E0] rounded-md px-2.5 py-1.5"
              />
              <textarea
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Message"
                rows={3}
                className="text-[12px] border border-[#E0E0E0] rounded-md px-2.5 py-1.5 resize-none"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAnnouncementForm(false)}
                  className="text-[11px] px-3 py-1.5 border border-[#E0E0E0] rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!announcementTitle.trim() || !announcementContent.trim() || announcementMutation.isPending}
                  onClick={() => announcementMutation.mutate()}
                  className="text-[11px] px-3 py-1.5 bg-[#7B68EE] text-white rounded-md disabled:opacity-50"
                >
                  {editingAnnouncementId ? 'Update' : 'Post'}
                </button>
              </div>
            </div>
          )}
          <div className="flex flex-col gap-4">
            {teamAnnouncements.length === 0 ? (
              <span className="text-[11px] text-[#888888]">No team announcements yet.</span>
            ) : (
              teamAnnouncements.map((item) => (
                <div key={item.id} className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0">
                    <span className="text-[#534AB7] font-semibold text-[10px]">{item.initials}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-medium text-[#1A1A1A] truncate">{item.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        {canManageTeam && item.isOwn && (
                          <>
                            <button
                              type="button"
                              aria-label="Edit announcement"
                              onClick={() => {
                                setEditingAnnouncementId(item.id);
                                setAnnouncementTitle(item.title ?? item.message.slice(0, 40));
                                setAnnouncementContent(item.message);
                                setShowAnnouncementForm(true);
                              }}
                              className="text-[#888888] hover:text-[#1A1A1A]"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              type="button"
                              aria-label="Delete announcement"
                              onClick={() => deleteAnnouncementMutation.mutate(item.id)}
                              className="text-[#888888] hover:text-[#A32D2D]"
                            >
                              <Trash2 size={12} />
                            </button>
                          </>
                        )}
                        <span className="text-[10px] text-[#AAAAAA]">{item.time}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#888888] leading-snug block mt-0.5">{item.message}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Calendar + Holidays */}
        <div className="flex flex-col gap-4">
          {/* Calendar */}
          <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-semibold text-[#1A1A1A]">
                {calendar?.label ?? 'Calendar'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() => shiftCalendarMonth(-1)}
                  className="text-[#888888] hover:text-[#1A1A1A]"
                >
                  <ChevronLeft size={16} strokeWidth={1.8} />
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() => shiftCalendarMonth(1)}
                  className="text-[#888888] hover:text-[#1A1A1A]"
                >
                  <ChevronRight size={16} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {(calendar?.weekdays ?? ['M', 'T', 'W', 'T', 'F', 'S', 'S']).map((d, i) => (
                <span key={i} className="text-[9px] font-medium text-[#AAAAAA] text-center">
                  {d}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              {(calendar?.weeks ?? []).map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-1">
                  {week.map((cell, ci) => (
                    <div
                      key={ci}
                      className="aspect-square rounded-md flex items-center justify-center"
                      style={{ backgroundColor: dayBgColor(cell.status) }}
                    >
                      {cell.day !== null && (
                        <span
                          className="text-[10px] font-medium"
                          style={{ color: dayTextColor(cell.status) }}
                        >
                          {cell.day}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {(calendar?.legend ?? []).map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] text-[#888888]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming holidays */}
          <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <span className="text-[14px] font-semibold text-[#1A1A1A]">Upcoming Holidays</span>
              {canManageTeam && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingHolidayId(null);
                    setHolidayTitle('');
                    setHolidayDate('');
                    setShowHolidayForm(true);
                  }}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#534AB7] hover:underline"
                >
                  <Plus size={12} /> Add
                </button>
              )}
            </div>
            {showHolidayForm && canManageTeam && (
              <div className="px-5 pb-3 flex flex-col gap-2">
                <input
                  value={holidayTitle}
                  onChange={(e) => setHolidayTitle(e.target.value)}
                  placeholder="Holiday title"
                  className="text-[12px] border border-[#E0E0E0] rounded-md px-2.5 py-1.5"
                />
                <input
                  type="date"
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="text-[12px] border border-[#E0E0E0] rounded-md px-2.5 py-1.5"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowHolidayForm(false)}
                    className="text-[11px] px-3 py-1.5 border border-[#E0E0E0] rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!holidayTitle.trim() || !holidayDate || holidayMutation.isPending}
                    onClick={() => holidayMutation.mutate()}
                    className="text-[11px] px-3 py-1.5 bg-[#7B68EE] text-white rounded-md disabled:opacity-50"
                  >
                    {editingHolidayId ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            )}
            <div className="flex flex-col">
              {upcomingHolidays.length === 0 ? (
                <span className="text-[11px] text-[#888888] px-5 pb-4">No upcoming holidays.</span>
              ) : (
                upcomingHolidays.map((holiday, idx) => (
                  <div
                    key={holiday.id}
                    className={`flex items-center gap-3 px-5 py-3 ${
                      idx !== upcomingHolidays.length - 1 ? 'border-b border-[#E0E0E0]' : ''
                    }`}
                  >
                    <div
                      className={`w-10 rounded-md flex flex-col items-center justify-center py-1 shrink-0 ${
                        holiday.highlighted ? 'bg-[#EEEDFE]' : 'bg-[#F8F9FC] border border-[#E0E0E0]'
                      }`}
                    >
                      <span
                        className="text-[8px] font-semibold uppercase"
                        style={{ color: holiday.highlighted ? '#534AB7' : '#AAAAAA' }}
                      >
                        {holiday.month}
                      </span>
                      <span
                        className="text-[13px] font-bold leading-none"
                        style={{ color: holiday.highlighted ? '#534AB7' : '#1A1A1A' }}
                      >
                        {holiday.day}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[12px] font-medium text-[#1A1A1A] block truncate">{holiday.title}</span>
                      <span className="text-[10px] text-[#AAAAAA]">{holiday.subtitle}</span>
                    </div>
                    {canManageTeam && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          aria-label="Edit holiday"
                          onClick={() => {
                            setEditingHolidayId(holiday.id);
                            setHolidayTitle(holiday.title);
                            setHolidayDate(holiday.dateIso);
                            setShowHolidayForm(true);
                          }}
                          className="text-[#888888] hover:text-[#1A1A1A]"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete holiday"
                          onClick={() => deleteHolidayMutation.mutate(holiday.id)}
                          className="text-[#888888] hover:text-[#A32D2D]"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
