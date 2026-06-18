'use client';

import { useState } from 'react';
import {
  Users,
  UserX,
  CalendarDays,
  TrendingUp,
  MoreVertical,
  Flag,
  FileText,
  Check,
  X,
  ClipboardCheck,
  Eye,
  Play,
  Megaphone,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Types for Leave Request
interface LeaveRequest {
  id: string;
  name: string;
  type: string;
  duration: string;
}

// Initial Leave Requests mock data matching the screenshot
const INITIAL_LEAVE_REQUESTS: LeaveRequest[] = [
  { id: '1', name: 'Sara Javed', type: 'Sick Leave', duration: 'Tomorrow (1d)' },
  { id: '2', name: 'Fawad Khan', type: 'Annual Leave', duration: 'Next Mon-Wed (3d)' },
  { id: '3', name: 'Omar Mirza', type: 'Casual Leave', duration: 'Friday (1d)' },
  { id: '4', name: 'Maria Raza', type: 'Maternity Leave', duration: 'Starts Jun 1' },
  { id: '5', name: 'Nadia Qureshi', type: 'Annual Leave', duration: 'Jun 10-14 (5d)' },
];

export default function ManagerDashboard() {
  const { toast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(INITIAL_LEAVE_REQUESTS);

  // Dynamic calculations based on state
  const leavesPendingCount = leaveRequests.length;
  const presentCount = 16;
  const totalEmployees = 18;

  // Handle single leave action (approve or reject)
  const handleLeaveAction = (id: string, name: string, approved: boolean) => {
    setLeaveRequests((prev) => prev.filter((req) => req.id !== id));
    toast({
      title: approved ? 'Leave Approved' : 'Leave Rejected',
      description: `${name}'s leave request has been ${approved ? 'approved' : 'rejected'}.`,
      className: approved 
        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200' 
        : 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/20 dark:text-rose-200',
    });
  };

  // Approve all requests
  const handleApproveAll = () => {
    if (leaveRequests.length === 0) return;
    setLeaveRequests([]);
    toast({
      title: 'Approved All Leaves',
      description: `Successfully approved all ${leaveRequests.length} pending leave requests.`,
      className: 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-200',
    });
  };

  // Trigger quick action feedback
  const handleQuickAction = (actionName: string) => {
    toast({
      title: 'Action Triggered',
      description: `Action "${actionName}" has been executed successfully.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Metrics Row (Icon on Left, Text on Right) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Present Today */}
        <div className="flex items-center gap-4 rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold tracking-tight text-foreground">{presentCount}</span>
              <span className="text-sm font-medium text-muted-foreground">/{totalEmployees}</span>
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
              <span className="text-3xl font-bold tracking-tight text-foreground">2</span>
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
              <span className="text-3xl font-bold tracking-tight text-foreground">
                {leavesPendingCount}
              </span>
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
              <span className="text-3xl font-bold tracking-tight text-foreground">78%</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">DEPT KPI AVG</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Attendance & Leave Approvals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 items-stretch">
        
        {/* Left Widget: Team Attendance (Col Span 3) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-3 flex flex-col justify-between">
          <div>
            {/* Header section with title and menu */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-semibold text-foreground text-lg">Team attendance · today</h3>
              <button className="rounded-md p-1 text-muted-foreground hover:bg-slate-50 transition-colors">
                <MoreVertical className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            
            {/* Heatmap check-ins tracker aligning on the right */}
            <div className="flex justify-end py-3">
              <div className="grid grid-cols-7 gap-[3px] text-center w-[186px] pr-2">
                {/* Day headers */}
                <span className="w-[24px] text-slate-400 font-medium text-[11px]">M</span>
                <span className="w-[24px] text-slate-400 font-medium text-[11px]">T</span>
                <span className="w-[24px] text-slate-400 font-medium text-[11px]">W</span>
                <span className="w-[24px] text-slate-400 font-medium text-[11px]">T</span>
                <span className="w-[24px] text-slate-400 font-medium text-[11px]">F</span>
                <span className="w-[24px] text-slate-400 font-medium text-[11px]">S</span>
                <span className="w-[24px] text-slate-400 font-medium text-[11px]">S</span>
                
                {/* Row 1 cells */}
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#E5E6FF] dark:bg-[#4F46E5]/15"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#6E66FF] dark:bg-[#4F46E5]/75"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#4F46E5] dark:bg-[#4F46E5]"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#E5E6FF] dark:bg-[#4F46E5]/15"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#E5E7EB] dark:bg-slate-800"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#F3F4F6] dark:bg-slate-900/40"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#F3F4F6] dark:bg-slate-900/40"></div>

                {/* Row 2 cells */}
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#4F46E5] dark:bg-[#4F46E5]"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#E5E6FF] dark:bg-[#4F46E5]/15"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#E5E7EB] dark:bg-slate-800"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#6E66FF] dark:bg-[#4F46E5]/75"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#4F46E5] dark:bg-[#4F46E5]"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#F3F4F6] dark:bg-slate-900/40"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#F3F4F6] dark:bg-slate-900/40"></div>

                {/* Row 3 cells */}
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#E5E7EB] dark:bg-slate-800"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#4F46E5] dark:bg-[#4F46E5]"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#6E66FF] dark:bg-[#4F46E5]/75"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#4F46E5] dark:bg-[#4F46E5]"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#E5E6FF] dark:bg-[#4F46E5]/15"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#F3F4F6] dark:bg-slate-900/40"></div>
                <div className="h-[20px] w-[24px] rounded-[2px] bg-[#F3F4F6] dark:bg-slate-900/40"></div>
              </div>
            </div>

            {/* Attendance Table */}
            <div className="overflow-x-auto -mx-6">
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
                  {/* Row 1: Sara */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-medium">Sara Javed</td>
                    <td className="py-4 px-4 text-slate-500 font-normal">Senior Dev</td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">08:45 AM</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF7EE] text-[#2F7A47] dark:bg-emerald-950/20 dark:text-emerald-400">Present</span>
                    </td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">4.2h</td>
                    <td className="py-4 px-6 text-right">-</td>
                  </tr>

                  {/* Row 2: Omar */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-medium">Omar Mirza</td>
                    <td className="py-4 px-4 text-slate-500 font-normal">QA Eng</td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">09:02 AM</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF7EE] text-[#2F7A47] dark:bg-emerald-950/20 dark:text-emerald-400">Present</span>
                    </td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">3.9h</td>
                    <td className="py-4 px-6 text-right">-</td>
                  </tr>

                  {/* Row 3: Bilal */}
                  <tr className="bg-[#F4F5F8] hover:bg-[#EAECEF] dark:bg-slate-800/40 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-medium">Bilal Hassan</td>
                    <td className="py-4 px-4 text-slate-500 font-normal">DevOps</td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">-</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FDECEF] text-[#C93B4E] dark:bg-rose-950/20 dark:text-rose-400">Absent</span>
                    </td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">0h</td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleQuickAction('Flag Bilal Hassan')} 
                        className="text-rose-500 hover:text-rose-700 transition-colors inline-flex align-middle"
                        title="Flag absent member"
                      >
                        <Flag className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 4: Hina */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-medium">Hina Baig</td>
                    <td className="py-4 px-4 text-slate-500 font-normal">Frontend</td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">-</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#ECEFF3] text-[#5A6E85] dark:bg-slate-800 dark:text-slate-400">On leave</span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-normal">-</td>
                    <td className="py-4 px-6 text-right">-</td>
                  </tr>

                  {/* Row 5: Fawad */}
                  <tr className="bg-[#F4F5F8] hover:bg-[#EAECEF] dark:bg-slate-800/40 dark:hover:bg-slate-800/60 transition-colors">
                    <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-medium">Fawad Khan</td>
                    <td className="py-4 px-4 text-slate-500 font-normal">Backend</td>
                    <td className="py-4 px-4 text-red-600 dark:text-rose-400 font-semibold">10:15 AM</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FEF5E7] text-[#C98B2C] dark:bg-amber-950/20 dark:text-amber-400">Late</span>
                    </td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">2.7h</td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => handleQuickAction('Write Note for Fawad Khan')}
                        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors inline-flex align-middle"
                        title="Add note"
                      >
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>

                  {/* Row 6: Nadia */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-medium">Nadia Qureshi</td>
                    <td className="py-4 px-4 text-slate-500 font-normal">Product</td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">08:50 AM</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF7EE] text-[#2F7A47] dark:bg-emerald-950/20 dark:text-emerald-400">Present</span>
                    </td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">4.1h</td>
                    <td className="py-4 px-6 text-right">-</td>
                  </tr>

                  {/* Row 7: Maria */}
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-6 text-slate-900 dark:text-slate-100 font-medium">Maria Raza</td>
                    <td className="py-4 px-4 text-slate-500 font-normal">UX Design</td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">08:55 AM</td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF7EE] text-[#2F7A47] dark:bg-emerald-950/20 dark:text-emerald-400">Present</span>
                    </td>
                    <td className="py-4 px-4 text-slate-800 dark:text-slate-200 font-normal">4.0h</td>
                    <td className="py-4 px-6 text-right">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Widget: Leave Approvals (Col Span 2) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-semibold text-foreground text-lg">Leave approvals</h3>
              {leavesPendingCount > 0 && (
                <span className="rounded-full bg-amber-50 text-amber-700 px-2.5 py-0.5 text-xs font-semibold border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40">
                  {leavesPendingCount} pending
                </span>
              )}
            </div>

            {/* List of Leave Requests with vertical left stripes */}
            <div className="mt-4 space-y-3">
              {leaveRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <ClipboardCheck className="h-10 w-10 text-muted/50 mb-3" />
                  <p className="text-sm font-semibold">No pending requests</p>
                  <p className="text-xs mt-1">All leave approvals are processed!</p>
                </div>
              ) : (
                leaveRequests.map((req) => (
                  <div 
                    key={req.id} 
                    className="flex items-center justify-between rounded-[6px] border border-slate-200/80 border-l-[4px] border-l-amber-500 bg-[#F8F8FD] dark:bg-slate-900/40 p-3.5 shadow-[0_2px_5px_rgba(0,0,0,0.05)] hover:shadow-md transition-shadow"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight">{req.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {req.type} · {req.duration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Reject button */}
                      <button 
                        onClick={() => handleLeaveAction(req.id, req.name, false)}
                        className="h-8 w-8 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-rose-600 hover:text-rose-700 transition-colors flex items-center justify-center dark:bg-slate-950 dark:border-slate-800"
                        aria-label="Reject Request"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      
                      {/* Approve button */}
                      <button 
                        onClick={() => handleLeaveAction(req.id, req.name, true)}
                        className="h-8 w-8 rounded-md bg-[#4F46E5] hover:bg-[#4338CA] text-white transition-colors flex items-center justify-center dark:bg-indigo-600 dark:hover:bg-indigo-700"
                        aria-label="Approve Request"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Approve All Button */}
          {leaveRequests.length > 0 && (
            <Button 
              onClick={handleApproveAll}
              className="w-full mt-4 bg-[#E5E5F4] hover:bg-[#DADAED] text-[#4F4A85] border-none shadow-none font-bold py-2.5 rounded-lg transition-colors"
            >
              Approve all {leaveRequests.length}
            </Button>
          )}
        </div>
      </div>

      {/* Bottom Grid: KPI Progress, Recent Announcements & Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 items-stretch">
        
        {/* Column 1: Dept KPI Progress (All Purple Circular Gauges) */}
        <div className="rounded-xl border bg-card p-6 shadow-sm flex flex-col justify-between h-full">
          <div>
            <h3 className="font-semibold text-foreground text-lg border-b pb-4">Dept KPI progress</h3>
            
            {/* Radial SVGs Grid */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              
              {/* Sprint Velocity */}
              <div className="flex flex-col items-center">
                <div className="relative h-16 w-16">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="24" className="stroke-muted" strokeWidth="4" fill="transparent" />
                    <circle 
                      cx="32" cy="32" r="24" 
                      className="stroke-primary" 
                      strokeWidth="4" 
                      strokeDasharray={2 * Math.PI * 24} 
                      strokeDashoffset={(2 * Math.PI * 24) * (1 - 0.84)} 
                      strokeLinecap="round" 
                      fill="transparent" 
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">84%</span>
                </div>
                <span className="mt-2 text-center text-[10px] font-semibold text-muted-foreground leading-tight">Sprint<br />velocity</span>
              </div>

              {/* Bug Resolution */}
              <div className="flex flex-col items-center">
                <div className="relative h-16 w-16">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="24" className="stroke-muted" strokeWidth="4" fill="transparent" />
                    <circle 
                      cx="32" cy="32" r="24" 
                      className="stroke-primary" 
                      strokeWidth="4" 
                      strokeDasharray={2 * Math.PI * 24} 
                      strokeDashoffset={(2 * Math.PI * 24) * (1 - 0.72)} 
                      strokeLinecap="round" 
                      fill="transparent" 
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">72%</span>
                </div>
                <span className="mt-2 text-center text-[10px] font-semibold text-muted-foreground leading-tight">Bug<br />resolution</span>
              </div>

              {/* Code Review */}
              <div className="flex flex-col items-center">
                <div className="relative h-16 w-16">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="32" cy="32" r="24" className="stroke-muted" strokeWidth="4" fill="transparent" />
                    <circle 
                      cx="32" cy="32" r="24" 
                      className="stroke-primary" 
                      strokeWidth="4" 
                      strokeDasharray={2 * Math.PI * 24} 
                      strokeDashoffset={(2 * Math.PI * 24) * (1 - 0.78)} 
                      strokeLinecap="round" 
                      fill="transparent" 
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">78%</span>
                </div>
                <span className="mt-2 text-center text-[10px] font-semibold text-muted-foreground leading-tight">Code<br />review</span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="mt-6 space-y-3.5">
              {/* Delivery on time */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>Delivery on time</span>
                  <span>91%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '91%' }} />
                </div>
              </div>

              {/* Team utilization */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>Team utilization</span>
                  <span>82%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: '82%' }} />
                </div>
              </div>

              {/* Open tickets */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>Open tickets</span>
                  <span>64%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '64%' }} />
                </div>
              </div>

              {/* Documentation */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-foreground">
                  <span>Documentation</span>
                  <span>48%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 mt-1">
                  <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '48%' }} />
                </div>
              </div>
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
        <div className="rounded-xl border bg-card p-6 shadow-sm h-full">
          <h3 className="font-semibold text-foreground text-lg border-b pb-4">Recent announcements</h3>
          
          <div className="mt-5 space-y-5 relative border-l border-muted pl-4 ml-2">
            {/* Announcement 1 */}
            <div className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-[22.5px] top-1.5 bg-card h-3 w-3 rounded-full border-[2.5px] border-blue-500" />
              <div className="text-xs">
                <span className="font-bold text-foreground">Aisha Malik</span>
                <p className="text-muted-foreground font-normal mt-1 leading-relaxed text-sm">
                  Updated the deployment schedule for Sprint 42. Please review.
                </p>
                <p className="text-muted-foreground mt-1 text-[10px]">10:30 AM</p>
              </div>
            </div>

            {/* Announcement 2 */}
            <div className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-[22.5px] top-1.5 bg-card h-3 w-3 rounded-full border-[2.5px] border-amber-500" />
              <div className="text-xs">
                <span className="font-bold text-foreground">Khalid Abbasi</span>
                <p className="text-muted-foreground font-normal mt-1 leading-relaxed text-sm">
                  Server maintenance scheduled for this weekend.
                </p>
                <p className="text-muted-foreground mt-1 text-[10px]">Yesterday, 4:15 PM</p>
              </div>
            </div>

            {/* Announcement 3 */}
            <div className="relative">
              {/* Timeline marker */}
              <div className="absolute -left-[22.5px] top-1.5 bg-card h-3 w-3 rounded-full border-[2.5px] border-emerald-500" />
              <div className="text-xs">
                <span className="font-bold text-foreground">Raza Farouk</span>
                <p className="text-muted-foreground font-normal mt-1 leading-relaxed text-sm">
                  New team building budget approved for Q3.
                </p>
                <p className="text-muted-foreground mt-1 text-[10px]">Mon, 09:00 AM</p>
              </div>
            </div>

            {/* Announcement 4 (Faded / Greyed out) */}
            <div className="relative opacity-60">
              {/* Timeline marker */}
              <div className="absolute -left-[22.5px] top-1.5 bg-slate-300 dark:bg-slate-700 h-3 w-3 rounded-full border border-slate-300 dark:border-slate-700" />
              <div className="text-xs text-slate-500 dark:text-slate-400">
                <span className="font-bold">Zara Khan</span>
                <p className="font-normal mt-1 leading-relaxed text-sm">
                  Welcome our new QA Engineer, Omar Mirza!
                </p>
                <p className="mt-1 text-[10px]">Last week</p>
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
              {/* Action 1: Approve all leave */}
              <button 
                onClick={() => handleQuickAction('Approve all leave')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
              >
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <span>Approve all leave ({leavesPendingCount})</span>
              </button>

              {/* Action 2: View team attendance */}
              <button 
                onClick={() => handleQuickAction('View team attendance')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
              >
                <Eye className="h-5 w-5" />
                <span>View team attendance</span>
              </button>

              {/* Action 3: Start performance review (Active/Highlighted state matching mockup) */}
              <button 
                onClick={() => handleQuickAction('Start performance review')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm bg-primary/10 text-primary hover:bg-primary/15 transition-colors font-medium text-left"
              >
                <Play className="h-5 w-5 fill-current" />
                <span>Start performance review</span>
              </button>

              {/* Action 4: Post team announcement */}
              <button 
                onClick={() => handleQuickAction('Post team announcement')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
              >
                <Megaphone className="h-5 w-5" />
                <span>Post team announcement</span>
              </button>

              {/* Action 5: Flag absent member */}
              <button 
                onClick={() => handleQuickAction('Flag absent member')}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors font-medium text-left"
              >
                <Flag className="h-5 w-5" />
                <span>Flag absent member</span>
              </button>

              {/* Action 6: Generate team report */}
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
            
            {/* Segmented bar */}
            <div className="mt-2.5 flex h-3.5 w-full gap-0.5 overflow-hidden rounded-full">
              <div className="flex-[4] bg-emerald-500/20 dark:bg-emerald-500/10 hover:bg-emerald-500/30 transition-colors" title="Happy (40%)" />
              <div className="flex-[3] bg-amber-500/20 dark:bg-amber-500/10 hover:bg-amber-500/30 transition-colors" title="Neutral (30%)" />
              <div className="flex-[2] bg-rose-500/20 dark:bg-rose-500/10 hover:bg-rose-500/30 transition-colors" title="Stressed (20%)" />
              <div className="flex-[1] bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors" title="Unknown (10%)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
