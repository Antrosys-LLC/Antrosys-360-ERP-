'use client';

import { useState } from 'react';
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
} from 'lucide-react';

// ============================================================================
// MOCK DATA — replace with API fetches later (React Query hooks)
// ============================================================================

const currentUser = {
  initials: 'SJ',
  name: 'Sara Javed',
  title: 'Senior Frontend Developer',
  greeting: 'Good morning, Sara',
  subtitle: "Here's what's happening today.",
  tenure: '3 yrs',
  teamSize: 247,
  location: 'Islamabad',
};

const attendanceToday = {
  currentTime: '09:41 AM',
  location: 'Office · Floor 3',
  checkIn: '--:--',
  checkOut: '--:--',
  hours: '0h 0m',
  overtime: '0h',
  hasCheckedIn: false,
};

const leaveBalances = [
  { type: 'Annual', icon: Sun, value: 12, bg: '#EEEDFE', iconColor: '#534AB7' },
  { type: 'Sick', icon: Sandwich, value: 5, bg: '#EEEDFE', iconColor: '#534AB7' },
  { type: 'Casual', icon: Umbrella, value: 2, bg: '#FCEBEB', iconColor: '#A32D2D' },
];

const pendingLeaveRequest = {
  title: 'Annual Leave Request',
  dateRange: 'May 21 - 23 · Monday',
  status: '2 days',
};

const teamAnnouncements = [
  {
    initials: 'AM',
    name: 'Aisha Malik',
    message: 'Q3 Engineering All-Hands meeting schedule update',
    time: '2h ago',
  },
  {
    initials: 'TS',
    name: 'Tariq Siddiqui',
    message: 'Please review the new firewall deployment protocol',
    time: 'Yesterday',
  },
  {
    initials: 'RF',
    name: 'Raza Farouk',
    message: 'Office maintenance scheduled for the 3rd floor next week',
    time: 'Mon',
  },
];

const latestPayslip = {
  label: 'Latest Payslip',
  period: 'April 2026 payslip',
  netPayLabel: 'NET PAY',
  netPay: 'PKR 285,000',
  breakdownPct: 78,
  legend: [
    { label: 'Net', color: '#7B68EE' },
    { label: 'Tax', color: '#E0DCFB' },
    { label: 'Ded.', color: '#F0F0F0' },
  ],
};

type DayStatus = 'present' | 'half' | 'absent' | 'holiday' | 'today' | 'none';

const calendarMonth = {
  label: 'May 2026',
  weekdays: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
  // 1 = Friday in this 5x7 grid per screenshot (May 2026 starts Friday)
  weeks: [
    [
      { day: null, status: 'none' as DayStatus },
      { day: null, status: 'none' as DayStatus },
      { day: null, status: 'none' as DayStatus },
      { day: null, status: 'none' as DayStatus },
      { day: 1, status: 'present' as DayStatus },
      { day: 2, status: 'none' as DayStatus },
      { day: 3, status: 'none' as DayStatus },
    ],
    [
      { day: 4, status: 'present' as DayStatus },
      { day: 5, status: 'present' as DayStatus },
      { day: 6, status: 'present' as DayStatus },
      { day: 7, status: 'half' as DayStatus },
      { day: 8, status: 'present' as DayStatus },
      { day: 9, status: 'none' as DayStatus },
      { day: 10, status: 'none' as DayStatus },
    ],
    [
      { day: 11, status: 'present' as DayStatus },
      { day: 12, status: 'present' as DayStatus },
      { day: 13, status: 'present' as DayStatus },
      { day: 14, status: 'today' as DayStatus },
      { day: 15, status: 'none' as DayStatus },
      { day: 16, status: 'none' as DayStatus },
      { day: 17, status: 'none' as DayStatus },
    ],
    [
      { day: 18, status: 'absent' as DayStatus },
      { day: 19, status: 'none' as DayStatus },
      { day: 20, status: 'none' as DayStatus },
      { day: 21, status: 'none' as DayStatus },
      { day: 22, status: 'none' as DayStatus },
      { day: 23, status: 'none' as DayStatus },
      { day: 24, status: 'none' as DayStatus },
    ],
    [
      { day: 25, status: 'holiday' as DayStatus },
      { day: 26, status: 'holiday' as DayStatus },
      { day: 27, status: 'none' as DayStatus },
      { day: 28, status: 'none' as DayStatus },
      { day: 29, status: 'none' as DayStatus },
      { day: 30, status: 'none' as DayStatus },
      { day: 31, status: 'none' as DayStatus },
    ],
  ],
  legend: [
    { label: 'Present', color: '#C4BDF8' },
    { label: 'Half', color: '#86EFAC' },
    { label: 'Absent', color: '#F8B4B4' },
    { label: 'Holiday', color: '#FDE68A' },
  ],
};

const upcomingHolidays = [
  { month: 'MAY', day: '26', title: 'Independence Day', subtitle: 'Sunday', highlighted: true },
  { month: 'JUN', day: '05', title: 'Eid-ul-Adha', subtitle: 'Wednesday - Thursday', highlighted: false },
  { month: 'AUG', day: '14', title: 'National Holiday', subtitle: 'Wednesday', highlighted: false },
];

// ============================================================================
// HELPERS
// ============================================================================

function dayBgColor(status: DayStatus): string {
  switch (status) {
    case 'present':
      return '#EEEDFE';
    case 'half':
      return '#86EFAC';
    case 'absent':
      return '#F8B4B4';
    case 'holiday':
      return '#FDE68A';
    case 'today':
      return '#7B68EE';
    default:
      return 'transparent';
  }
}

function dayTextColor(status: DayStatus): string {
  return status === 'today' ? '#FFFFFF' : '#1A1A1A';
}

// ============================================================================
// PAGE
// ============================================================================

export default function EmployeeDashboardPage() {
  const [isCheckedIn, setIsCheckedIn] = useState(attendanceToday.hasCheckedIn);

  return (
    <div className="flex flex-col gap-4">
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
              onClick={() => setIsCheckedIn(!isCheckedIn)}
              className="size-16 rounded-full bg-[#7B68EE] hover:bg-[#6A5ACD] flex items-center justify-center shrink-0 transition-colors"
            >
              <span className="text-white text-[10px] font-medium text-center leading-tight">
                Tap to
                <br />
                check in
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
            <button type="button" className="text-[11px] font-medium text-[#534AB7] hover:underline">
              View History
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {leaveBalances.map((leave) => {
              const Icon = leave.icon;
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
        </div>

        {/* Payslip card */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-md bg-[#EEEDFE] flex items-center justify-center shrink-0">
                <Wallet size={16} strokeWidth={1.8} className="text-[#534AB7]" />
              </div>
              <div>
                <span className="text-[10px] text-[#AAAAAA] block">{latestPayslip.label}</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">{latestPayslip.period}</span>
              </div>
            </div>
            <button type="button" aria-label="Download payslip" className="text-[#888888] hover:text-[#1A1A1A]">
              <Download size={16} strokeWidth={1.8} />
            </button>
          </div>

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
        </div>
      </div>

      {/* Bottom row: Announcements + Calendar/Holidays */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        {/* Team announcements */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5 h-fit">
          <span className="text-[14px] font-semibold text-[#1A1A1A] block mb-4">Team Announcements</span>
          <div className="flex flex-col gap-4">
            {teamAnnouncements.map((item) => (
              <div key={item.name} className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0">
                  <span className="text-[#534AB7] font-semibold text-[10px]">{item.initials}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-medium text-[#1A1A1A] truncate">{item.name}</span>
                    <span className="text-[10px] text-[#AAAAAA] shrink-0">{item.time}</span>
                  </div>
                  <span className="text-[11px] text-[#888888] leading-snug block mt-0.5">{item.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Calendar + Holidays */}
        <div className="flex flex-col gap-4">
          {/* Calendar */}
          <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-semibold text-[#1A1A1A]">{calendarMonth.label}</span>
              <div className="flex items-center gap-1">
                <button type="button" aria-label="Previous month" className="text-[#888888] hover:text-[#1A1A1A]">
                  <ChevronLeft size={16} strokeWidth={1.8} />
                </button>
                <button type="button" aria-label="Next month" className="text-[#888888] hover:text-[#1A1A1A]">
                  <ChevronRight size={16} strokeWidth={1.8} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {calendarMonth.weekdays.map((d, i) => (
                <span key={i} className="text-[9px] font-medium text-[#AAAAAA] text-center">
                  {d}
                </span>
              ))}
            </div>

            <div className="flex flex-col gap-1">
              {calendarMonth.weeks.map((week, wi) => (
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
              {calendarMonth.legend.map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <span className="size-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[9px] text-[#888888]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming holidays */}
          <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden">
            <span className="text-[14px] font-semibold text-[#1A1A1A] block px-5 pt-4 pb-3">
              Upcoming Holidays
            </span>
            <div className="flex flex-col">
              {upcomingHolidays.map((holiday, idx) => (
                <div
                  key={holiday.title}
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
                  <div className="min-w-0">
                    <span className="text-[12px] font-medium text-[#1A1A1A] block truncate">{holiday.title}</span>
                    <span className="text-[10px] text-[#AAAAAA]">{holiday.subtitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}