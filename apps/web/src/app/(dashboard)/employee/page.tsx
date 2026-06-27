'use client';

import { useState, useEffect } from 'react';
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
  Info,
} from 'lucide-react';
import apiClient from '@/lib/api-client';

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<{ module?: string; status?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  useEffect(() => {
    apiClient.get('/hr/employees')
      .then(res => setData(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 min-h-screen items-center justify-center">
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-[#7B68EE]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-[#888888] font-medium">Loading employee dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4 min-h-screen items-center justify-center">
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-6 shadow-sm text-center max-w-md">
          <div className="w-12 h-12 rounded-full bg-[#FCEBEB] flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-[#A32D2D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">Failed to load</h3>
          <p className="text-xs text-[#888888]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* API Status */}
      <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-3 flex items-center gap-3">
        <div className="size-8 rounded-full bg-[#EEEDFE] flex items-center justify-center shrink-0">
          <Info size={14} strokeWidth={1.8} className="text-[#534AB7]" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide">Module:</span>
          <span className="text-[12px] font-semibold text-[#1A1A1A]">{data?.module || 'N/A'}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            data?.status === 'wip' ? 'bg-[#FAEEDA] text-[#633806]' : 'bg-[#EEEDFE] text-[#534AB7]'
          }`}>
            {data?.status || 'unknown'}
          </span>
        </div>
      </div>

      {/* Greeting */}
      <div>
        <h1 className="text-[22px] font-semibold text-[#1A1A1A] leading-tight flex items-center gap-2">
          Employee Dashboard
        </h1>
        <p className="text-[13px] text-[#888888] mt-0.5">Powered by /hr/employees API</p>
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
              <div className="text-[22px] font-bold text-[#1A1A1A] leading-none">--:--</div>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="flex items-center gap-1 bg-[#F8F9FC] border border-[#E0E0E0] rounded-full px-2.5 py-1">
                  <MapPin size={11} strokeWidth={2} className="text-[#888888]" />
                  <span className="text-[11px] text-[#888888]">Office · Floor 3</span>
                </span>
              </div>
            </div>
          </div>
          <div className="border-t border-[#E0E0E0] mt-4 pt-4 grid grid-cols-4 gap-2">
            {['Check-in', 'Check-out', 'Hours', 'Overtime'].map(label => (
              <div key={label}>
                <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide block mb-1">{label}</span>
                <span className="text-[13px] font-medium text-[#1A1A1A]">--:--</span>
              </div>
            ))}
          </div>
        </div>

        {/* Profile card */}
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5 flex flex-col items-center text-center">
          <div className="size-14 rounded-full bg-[#7B68EE] flex items-center justify-center mb-3">
            <span className="text-white font-bold text-[16px]">—</span>
          </div>
          <span className="text-[14px] font-semibold text-[#1A1A1A]">Employee</span>
          <span className="text-[11px] text-[#534AB7] bg-[#EEEDFE] px-2.5 py-1 rounded-full mt-1.5">Role</span>
          <div className="border border-[#E0E0E0] rounded-lg w-full mt-4 grid grid-cols-3 divide-x divide-[#E0E0E0]">
            {['Tenure', 'Team Size', 'Location'].map(label => (
              <div key={label} className="flex flex-col items-center py-2.5">
                <span className="text-[14px] font-bold text-[#1A1A1A]">—</span>
                <span className="text-[9px] text-[#AAAAAA] mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle row: Leave balances + Payslip */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[14px] font-semibold text-[#1A1A1A]">Leave Balances</span>
            <button type="button" className="text-[11px] font-medium text-[#534AB7] hover:underline">View History</button>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { type: 'Annual', icon: Sun, value: '—', bg: '#EEEDFE', iconColor: '#534AB7' },
              { type: 'Sick', icon: Sandwich, value: '—', bg: '#EEEDFE', iconColor: '#534AB7' },
              { type: 'Casual', icon: Umbrella, value: '—', bg: '#FCEBEB', iconColor: '#A32D2D' },
            ].map((leave) => {
              const Icon = leave.icon;
              return (
                <div key={leave.type} className="border border-[#E0E0E0] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="size-7 rounded-md flex items-center justify-center" style={{ backgroundColor: leave.bg }}>
                      <Icon size={14} strokeWidth={1.8} style={{ color: leave.iconColor }} />
                    </div>
                    <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide">{leave.type}</span>
                  </div>
                  <div className="text-[20px] font-bold leading-none text-[#1A1A1A]">{leave.value}</div>
                  <span className="text-[10px] text-[#AAAAAA]">Days available</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-md bg-[#EEEDFE] flex items-center justify-center shrink-0">
                <Wallet size={16} strokeWidth={1.8} className="text-[#534AB7]" />
              </div>
              <div>
                <span className="text-[10px] text-[#AAAAAA] block">Latest Payslip</span>
                <span className="text-[12px] font-medium text-[#1A1A1A]">Pending</span>
              </div>
            </div>
          </div>
          <span className="text-[9px] font-semibold text-[#AAAAAA] uppercase tracking-wide block mb-1">NET PAY</span>
          <div className="text-[22px] font-bold text-[#1A1A1A] leading-none mb-4">—</div>
        </div>
      </div>

      {/* Bottom row: Announcements + Calendar */}
      <div className="grid grid-cols-[1.6fr_1fr] gap-4">
        <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5 h-fit">
          <span className="text-[14px] font-semibold text-[#1A1A1A] block mb-4">Team Announcements</span>
          <div className="flex items-center justify-center min-h-[100px]">
            <p className="text-[11px] text-[#888888]">Announcements pending</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="bg-white border border-[#E0E0E0] rounded-[10px] p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-semibold text-[#1A1A1A]">Calendar</span>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="text-[9px] font-medium text-[#AAAAAA] text-center">{d}</span>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-[10px] overflow-hidden">
            <span className="text-[14px] font-semibold text-[#1A1A1A] block px-5 pt-4 pb-3">Upcoming Holidays</span>
            <div className="px-5 pb-4 flex items-center justify-center min-h-[80px]">
              <p className="text-[11px] text-[#888888]">Holiday data pending</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
