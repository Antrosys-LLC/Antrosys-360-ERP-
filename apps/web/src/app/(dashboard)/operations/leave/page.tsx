'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  fetchLeaveBalances,
  fetchLeaveMetrics,
  fetchLeaveRequests,
  createLeaveRequest,
  LeaveType,
} from '@/lib/leave-api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';

const RenderIcon = ({ type, className = 'w-5 h-5' }: { type: string; className?: string }) => {
  switch (type) {
    case 'tree': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M9 7l3-3 3 3M8 12l4-4 4 4M6 17l6-6 6 6" /></svg>;
    case 'heart': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>;
    case 'coffee': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 14a6 6 0 0110.657-3.543L19 14H6zm14-4h.01M4 20h16a1 1 0 011 1H3a1 1 0 011-1z" /></svg>;
    case 'home': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
    case 'plug': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
    case 'question': return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M12 18h.01m-6.175 4h12.35a2.25 2.25 0 002.25-2.25V4.25A2.25 2.25 0 0018.175 2H5.825a2.25 2.25 0 00-2.25 2.25v15.5a2.25 2.25 0 002.25 2.25z" /></svg>;
    default: return null;
  }
};

const leaveTypeConfig: Record<LeaveType, { label: string; icon: string; color: string }> = {
  ANNUAL: { label: 'ANNUAL LEAVE', icon: 'tree', color: 'bg-primary' },
  SICK: { label: 'SICK LEAVE', icon: 'heart', color: 'bg-destructive' },
  CASUAL: { label: 'CASUAL LEAVE', icon: 'coffee', color: 'bg-[#4CAF50]' },
  WFH: { label: 'WORK FROM HOME', icon: 'home', color: 'bg-[#5CACF6]' },
  UNPAID: { label: 'UNPAID LEAVE', icon: 'plug', color: 'bg-muted-foreground' },
  OTHER: { label: 'OTHER', icon: 'question', color: 'bg-[#9E9E9E]' },
};

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function LeavePage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState<LeaveType>('ANNUAL');
  const [selectedDates, setSelectedDates] = useState<number[]>([]);
  const [submitReason, setSubmitReason] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const [currentDate, setCurrentDate] = useState(new Date());
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const realCurrentDate = useMemo(() => new Date(), []);

  const isCurrentMonthOrPast = useMemo(() => {
    return currentYear < realCurrentDate.getFullYear() ||
      (currentYear === realCurrentDate.getFullYear() && currentMonth <= realCurrentDate.getMonth());
  }, [currentYear, currentMonth, realCurrentDate]);

  const daysInMonth = useMemo(() => new Date(currentYear, currentMonth + 1, 0).getDate(), [currentYear, currentMonth]);
  const startOffset = useMemo(() => new Date(currentYear, currentMonth, 1).getDay(), [currentYear, currentMonth]);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const isPastDate = (dayNum: number) => {
    if (currentYear < realCurrentDate.getFullYear()) return true;
    if (currentYear > realCurrentDate.getFullYear()) return false;
    if (currentMonth < realCurrentDate.getMonth()) return true;
    if (currentMonth > realCurrentDate.getMonth()) return false;
    return dayNum < realCurrentDate.getDate();
  };

  const requiresDetailedReason = selectedType === 'UNPAID' || selectedType === 'OTHER';

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const { data: balances, isLoading: loadingBalances } = useQuery({
    queryKey: ['leave-balances'],
    queryFn: fetchLeaveBalances,
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['leave-metrics'],
    queryFn: fetchLeaveMetrics,
  });

  const { data: myRequests, isLoading: loadingRequests } = useQuery({
    queryKey: ['my-leave-requests'],
    queryFn: () => fetchLeaveRequests({ limit: 10 }),
  });

  // ─── Mutations ──────────────────────────────────────────────────────────

  const submitRequestMutation = useMutation({
    mutationFn: createLeaveRequest,
    onSuccess: () => {
      toast({
        title: 'Request Submitted',
        description: `Your ${selectedType.toLowerCase().replace('_', ' ')} leave request has been submitted for manager approval.`,
        variant: 'default',
      });
      setSelectedDates([]);
      setShowSubmitModal(false);
      setSubmitReason('');
      queryClient.invalidateQueries({ queryKey: ['my-leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balances'] });
      queryClient.invalidateQueries({ queryKey: ['leave-metrics'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Request Failed',
        description: error.response?.data?.error || 'An error occurred.',
        variant: 'destructive',
      });
    },
  });

  // ─── Handlers ───────────────────────────────────────────────────────────

  const handleDateClick = (dayNum: number) => {
    if (isPastDate(dayNum)) return;

    if (selectedDates.length === 0) {
      setSelectedDates([dayNum]);
    } else if (selectedDates.length === 1) {
      if (dayNum === selectedDates[0]) {
        setSelectedDates([]);
      } else {
        const min = Math.min(selectedDates[0], dayNum);
        const max = Math.max(selectedDates[0], dayNum);
        const range: number[] = [];
        for (let i = min; i <= max; i++) {
          if (!isPastDate(i)) range.push(i);
        }
        setSelectedDates(range);
      }
    } else {
      setSelectedDates([dayNum]);
    }
  };

  const changeMonth = (offset: number) => {
    if (offset < 0 && isCurrentMonthOrPast) return;
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
    setSelectedDates([]);
  };

  const handleOpenSubmitModal = () => {
    if (selectedDates.length === 0) {
      toast({ title: 'Select Dates', description: 'Please select at least one date.', variant: 'default' });
      return;
    }
    setShowSubmitModal(true);
  };

  const handleConfirmSubmit = () => {
    if (requiresDetailedReason && (!submitReason || submitReason.trim().length === 0)) {
      toast({
        title: 'Reason Required',
        description: `A detailed reason is required for ${selectedType.toLowerCase()} leave.`,
        variant: 'destructive',
      });
      return;
    }
    const firstDate = selectedDates[0];
    const lastDate = selectedDates[selectedDates.length - 1];

    const startDate = new Date(currentYear, currentMonth, firstDate).toISOString();
    const endDate = new Date(currentYear, currentMonth, lastDate).toISOString();

    submitRequestMutation.mutate({
      type: selectedType,
      startDate,
      endDate,
      reason: submitReason.trim() || undefined,
    });
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-card w-full max-w-md rounded-xl shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-bold text-lg">Confirm Leave Request</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-muted-foreground hover:text-foreground">
                <RenderIcon type="close" className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground">
                You are requesting <span className="font-semibold text-foreground">{selectedDates.length} day(s)</span> of <span className="font-semibold text-foreground capitalize">{selectedType.toLowerCase().replace('_', ' ')} Leave</span>.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Reason {requiresDetailedReason ? <span className="text-destructive">(required)</span> : <span className="text-muted-foreground">(optional)</span>}
                </label>
                <textarea
                  value={submitReason}
                  onChange={(e) => setSubmitReason(e.target.value)}
                  placeholder={requiresDetailedReason
                    ? `Please provide a detailed reason for your ${selectedType.toLowerCase().replace('_', ' ')} leave request...`
                    : 'E.g. Family trip, doctor appointment...'}
                  className="w-full h-24 p-3 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                />
                {requiresDetailedReason && submitReason.trim().length === 0 && (
                  <p className="text-xs text-destructive">A detailed reason is required for this leave type.</p>
                )}
              </div>
            </div>
            <div className="p-5 border-t border-border bg-muted/30 flex justify-end gap-3">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 text-sm font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground">
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
              disabled={submitRequestMutation.isPending || (requiresDetailedReason && !submitReason.trim())}
              className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                {submitRequestMutation.isPending ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      <PageHeader
        title="Leave Management"
        subtitle="Submit attendance leave requests and view your balances"
      />

      {/* ─── Balance Cards ──────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {loadingBalances ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-[var(--radius)] p-5 h-[100px] animate-pulse">
              <div className="h-4 bg-muted w-1/2 mb-2 rounded"></div>
              <div className="h-6 bg-muted w-1/4 rounded"></div>
            </div>
          ))
        ) : (
          (Object.keys(leaveTypeConfig) as LeaveType[]).map((typeKey) => {
            const balance = balances?.find(b => b.type === typeKey);
            const config = leaveTypeConfig[typeKey];
            const totalDays = balance?.totalDays ?? 20;
            const remainingDays = balance?.remainingDays ?? 20;
            const pct = totalDays > 0 ? (remainingDays / totalDays) * 100 : 0;
            return (
              <article key={typeKey} className="bg-card text-card-foreground border border-border rounded-[var(--radius)] p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold tracking-wider text-muted-foreground block">{config.label}</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold">
                        {typeKey === 'UNPAID' || typeKey === 'OTHER' ? '∞' : remainingDays}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {typeKey === 'UNPAID' || typeKey === 'OTHER' ? 'unlimited' : 'days left'}
                      </span>
                    </div>
                  </div>
                  <div className="p-1.5 rounded text-muted-foreground">
                    <RenderIcon type={config.icon} className="w-5 h-5 opacity-70" />
                  </div>
                </div>
                {typeKey !== 'UNPAID' && typeKey !== 'OTHER' && totalDays > 0 && (
                  <div className="w-full bg-muted h-1.5 rounded-full mt-5 overflow-hidden">
                    <div className={`h-full rounded-full ${config.color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                )}
              </article>
            );
          })
        )}
      </section>

      {/* ─── Main Content: Form + Recent Requests ──────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ─── Leave Request Form ───────────────────────────────────────── */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Request Leave</h2>

          <div className="bg-card border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-6">
            {/* Leave Type Selector */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground block">Leave Type</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(leaveTypeConfig) as LeaveType[]).map((typeKey) => {
                  const config = leaveTypeConfig[typeKey];
                  const isSelected = selectedType === typeKey;
                  return (
                    <div
                      key={typeKey}
                      onClick={() => {
                        setSelectedType(typeKey);
                        setSubmitReason('');
                      }}
                      className={`flex items-center justify-between p-3 rounded-[var(--radius)] border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5 text-primary ring-1 ring-primary/20'
                          : 'border-border bg-card text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 text-sm font-medium">
                        <RenderIcon type={config.icon} className="w-4 h-4" />
                        <span className="capitalize">{typeKey.toLowerCase().replace('_', ' ')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Date Selection */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground block">
                Select Dates ({MONTH_NAMES[currentMonth]})
              </label>

              {/* Month Navigation */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => changeMonth(-1)}
                  disabled={isCurrentMonthOrPast}
                  className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30 disabled:cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="text-sm font-bold min-w-[80px] text-center">{MONTH_NAMES[currentMonth]} {currentYear}</span>
                <button
                  onClick={() => changeMonth(1)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </button>
                {selectedDates.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {selectedDates.length} day(s) selected
                  </span>
                )}
              </div>

              {/* Calendar Grid */}
              <div className="border border-border rounded-[var(--radius)] p-5 bg-card">
                <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold text-muted-foreground mb-3">
                  <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                </div>
                <div className="grid grid-cols-7 gap-y-2 text-center text-sm">
                  {Array(startOffset).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
                  {currentMonthDays.map((dayNum) => {
                    const past = isPastDate(dayNum);
                    const isSelected = selectedDates.includes(dayNum);
                    let itemClass = "text-foreground hover:bg-muted rounded-full";
                    if (isSelected) itemClass = "bg-primary text-primary-foreground font-medium rounded-full";
                    if (past) itemClass = "text-muted-foreground/30 cursor-not-allowed";

                    return (
                      <div key={`day-${dayNum}`} className="py-0.5 flex items-center justify-center">
                        <span
                          onClick={() => handleDateClick(dayNum)}
                          className={`w-8 h-8 flex items-center justify-center text-sm transition-colors ${!past && 'cursor-pointer'} ${itemClass}`}>
                          {dayNum}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>



            {/* Submit Button */}
            {selectedDates.length > 0 && (
              <button
                onClick={handleOpenSubmitModal}
              disabled={submitRequestMutation.isPending}
              className="w-full bg-primary hover:opacity-90 text-primary-foreground font-medium text-sm py-3 rounded-[var(--radius)] transition-opacity flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 mt-4">
                <span>{submitRequestMutation.isPending ? 'Submitting...' : `Request Leave (${selectedDates.length} days)`}</span>
              </button>
            )}
          </div>
        </div>

        {/* ─── Recent Requests + Metrics ──────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">

          {/* Recent Requests */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">My Recent Requests</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
              {loadingRequests ? (
                <div className="h-16 bg-card border border-border animate-pulse rounded-[var(--radius)]" />
              ) : myRequests?.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent requests.</p>
              ) : (
                myRequests?.items.map((req) => (
                  <div key={req.id} className={`bg-card border border-border rounded-[var(--radius)] p-4 flex items-center justify-between shadow-sm border-l-4 ${
                    req.status === 'APPROVED' ? 'border-l-[#4CAF50]' :
                    req.status === 'REJECTED' ? 'border-l-destructive' :
                    'border-l-[#FFC107]'
                  }`}>
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">{req.type}</h4>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()} ({req.durationDays} days)
                      </p>
                      {req.declineNote && req.status === 'REJECTED' && (
                        <p className="text-xs text-destructive mt-1">{req.declineNote}</p>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                      req.status === 'PENDING' ? 'bg-[#FFFDF5] text-[#FFC107] border border-[#FFE082]' :
                      req.status === 'APPROVED' ? 'bg-[#F6FDF7] text-[#2E7D32] border border-[#C8E6C9]' :
                      req.status === 'REJECTED' ? 'bg-[#FEECEB] text-destructive border border-[#FDD8D8]' :
                      'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Metrics */}
          <div className="bg-card border border-border rounded-[var(--radius)] p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Leave Overview</h3>
            {loadingMetrics ? (
              <div className="grid grid-cols-4 gap-2">
                {Array(4).fill(0).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded" />)}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">{metrics?.pending || 0}</div>
                  <div className="text-[11px] text-muted-foreground font-medium">Pending</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">{metrics?.totalTaken || 0}</div>
                  <div className="text-[11px] text-muted-foreground font-medium">Total Taken</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-[#4CAF50]">{metrics?.attendance || '100%'}</div>
                  <div className="text-[11px] text-muted-foreground font-medium">Attendance</div>
                </div>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">{metrics?.onLeaveToday || 0}</div>
                  <div className="text-[11px] text-muted-foreground font-medium">On Leave</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #E2E8F0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #CBD5E1;
        }
      `}} />
    </div>
  );
}
