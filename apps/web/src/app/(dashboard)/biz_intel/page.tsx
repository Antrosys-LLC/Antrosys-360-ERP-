'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchBiDashboard,
  fetchChartPreview,
  createReport,
  runReport,
  toggleFavourite,
  deleteReport,
  deleteSchedule,
  BIReport,
  BIDashboardData,
} from '@/lib/biz-intel-api';

import {
  TrendingUp,
  Filter,
  Target,
  Users,
  Check,
  X,
  ChevronRight,
  RefreshCw,
  Settings,
  Bell,
  Plus,
  Star,
  Trash2,
  BarChart2,
  ChevronDown,
  Clock,
  Mail,
  FileCheck,
  Download
} from 'lucide-react';

// ==========================================
// STATIC CONFIGS (non-data tabs, etc.)
// ==========================================

const ALL_TABS = [
  { id: 'library', name: 'Report Library' },
  { id: 'builder', name: 'Custom Builder' },
  { id: 'scheduled', name: 'Scheduled Reports' },
  { id: 'shared', name: 'Shared with me' },
  { id: 'favourites', name: 'Favourites' },
];

const CATEGORY_FILTERS = [
  { label: 'All reports', value: 'all' },
  { label: 'Finance', value: 'Finance' },
  { label: 'HR & people', value: 'HR' },
  { label: 'Operations', value: 'Operations' },
  { label: 'Sales', value: 'Sales' },
];

const DATA_SOURCES = [
  { category: 'Finance', items: ['Revenue', 'Expenses', 'Margin %'] },
  { category: 'HR', items: ['Headcount', 'Payroll cost'] },
  { category: 'Time Dimensions', items: ['Month'] },
];

const EXPORT_FORMATS = ['PDF Document (.pdf)', 'Excel Spreadsheet (.xlsx)', 'CSV File (.csv)'];

// ==========================================
// ICON HELPER
// ==========================================
function ReportIcon({ iconType }: { iconType: string }) {
  return (
    <div className="w-10 h-10 rounded bg-[#f0effd] flex items-center justify-center text-[#7B6AE6] mb-4">
      {iconType === 'trend' && <TrendingUp className="w-5 h-5" />}
      {iconType === 'pipeline' && <Filter className="w-5 h-5" />}
      {iconType === 'target' && <Target className="w-5 h-5" />}
      {iconType === 'turnover' && <Users className="w-5 h-5" />}
    </div>
  );
}

// ==========================================
// TOAST COMPONENT
// ==========================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl text-sm font-semibold transition-all animate-slide-up
        ${type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}
    >
      {type === 'success' ? (
        <Check className="w-4 h-4 shrink-0" strokeWidth={2.5} />
      ) : (
        <X className="w-4 h-4 shrink-0" strokeWidth={2.5} />
      )}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ==========================================
// NEW REPORT MODAL
// ==========================================
function NewReportModal({ onClose, onSave }: { onClose: () => void; onSave: (data: any) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Finance');
  const [iconType, setIconType] = useState<'trend' | 'pipeline' | 'target' | 'turnover'>('trend');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">New Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Report Title *</label>
            <input
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-[#7B6AE6] transition-colors"
              placeholder="e.g. Quarterly P&L Summary"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Description</label>
            <textarea
              className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-[#7B6AE6] resize-none transition-colors"
              rows={2}
              placeholder="Brief description of this report..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Category *</label>
              <select
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-[#7B6AE6] transition-colors bg-white"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option>Finance</option>
                <option>HR</option>
                <option>Operations</option>
                <option>Sales</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Icon Type</label>
              <select
                className="w-full border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-[#7B6AE6] transition-colors bg-white"
                value={iconType}
                onChange={e => setIconType(e.target.value as any)}
              >
                <option value="trend">Trend</option>
                <option value="pipeline">Pipeline</option>
                <option value="target">Target</option>
                <option value="turnover">Turnover</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 rounded text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
          <button
            onClick={() => title && onSave({ title, description, category, iconType })}
            disabled={!title}
            className="px-4 py-2 rounded text-sm font-semibold bg-[#7B6AE6] text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Create Report
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MAIN PAGE COMPONENT
// ==========================================
export default function BusinessIntelligenceDashboard() {
  const queryClient = useQueryClient();

  // UI State
  const [activeTab, setActiveTab] = useState('library');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Builder State
  const [xAxis, setXAxis] = useState('Month');
  const [yAxisList, setYAxisList] = useState<string[]>(['Revenue', 'Payroll cost']);
  const [showDataLabels, setShowDataLabels] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [trendline, setTrendline] = useState(false);
  const [activeFilter2, setActiveFilter2] = useState('Date: Last 6 Months');
  const [exportFormat, setExportFormat] = useState(EXPORT_FORMATS[0]);
  const [reportTitle, setReportTitle] = useState('Custom Report');
  const [runningReportId, setRunningReportId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // ---- QUERIES ----
  const dashboardQuery = useQuery({
    queryKey: ['biz-intel', 'dashboard'],
    queryFn: fetchBiDashboard,
  });

  const chartQuery = useQuery({
    queryKey: ['biz-intel', 'chart', xAxis, yAxisList.join(',')],
    queryFn: () => fetchChartPreview(xAxis, yAxisList),
    enabled: yAxisList.length > 0,
  });

  const dashboard: BIDashboardData | undefined = dashboardQuery.data;

  // ---- MUTATIONS ----
  const runReportMutation = useMutation({
    mutationFn: (reportId: string) => runReport(reportId),
    onSuccess: (_, reportId) => {
      setRunningReportId(null);
      queryClient.invalidateQueries({ queryKey: ['biz-intel', 'dashboard'] });
      showToast('Report executed successfully!', 'success');
    },
    onError: () => {
      setRunningReportId(null);
      showToast('Report execution failed.', 'error');
    },
  });

  const favouriteMutation = useMutation({
    mutationFn: ({ reportId, isFavourite }: { reportId: string; isFavourite: boolean }) =>
      toggleFavourite(reportId, isFavourite),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biz-intel', 'dashboard'] });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: (reportId: string) => deleteReport(reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biz-intel', 'dashboard'] });
      showToast('Report deleted.', 'success');
    },
    onError: () => showToast('Failed to delete report.', 'error'),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: (scheduleId: string) => deleteSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biz-intel', 'dashboard'] });
      showToast('Schedule removed.', 'success');
    },
    onError: () => showToast('Failed to remove schedule.', 'error'),
  });

  const createReportMutation = useMutation({
    mutationFn: (input: any) => createReport(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biz-intel', 'dashboard'] });
      setShowNewReportModal(false);
      showToast('Report created successfully!', 'success');
      setActiveTab('library');
    },
    onError: () => showToast('Failed to create report.', 'error'),
  });

  const saveAndRunMutation = useMutation({
    mutationFn: () =>
      createReport({
        title: reportTitle,
        category: 'Finance',
        iconType: 'trend',
        config: {
          xAxis,
          yAxis: yAxisList,
          settings: { showDataLabels, showLegend, trendline },
          filters: activeFilter2 ? [{ field: 'Date', operator: 'last_6_months', value: 6 }] : [],
          exportFormat,
        },
      }),
    onSuccess: (report) => {
      queryClient.invalidateQueries({ queryKey: ['biz-intel', 'dashboard'] });
      showToast(`"${report.title}" saved & queued for execution.`, 'success');
    },
    onError: () => showToast('Failed to save & run report.', 'error'),
  });

  const handleExport = async () => {
    if (exportFormat.includes('pdf')) {
      const chartElement = document.getElementById('chart-preview-container');
      if (!chartElement) return;
      try {
        const html2canvas = (await import('html2canvas')).default;
        const { jsPDF } = await import('jspdf');
        const canvas = await html2canvas(chartElement);
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${reportTitle || 'report'}.pdf`);
        showToast('Exported as PDF', 'success');
      } catch (err) {
        showToast('Failed to export PDF', 'error');
      }
    } else {
      if (chartBars.length === 0) {
        showToast('No data to export', 'error');
        return;
      }
      const headers = ['Month', ...chartMetrics];
      const rows = chartBars.map((item: any) => {
        const rowData = [item.month];
        chartMetrics.forEach(metric => {
          const key = `${metric.replace(/\\s+/g, '').replace('%', 'Pct')}Val`;
          rowData.push(item[key] || 0);
        });
        return rowData.join(',');
      });
      const csvContent = [headers.join(','), ...rows].join('\\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportTitle || 'report'}.csv`; 
      link.click();
      URL.revokeObjectURL(url);
      showToast(`Exported as ${exportFormat.includes('xlsx') ? 'Excel CSV' : 'CSV'}`, 'success');
    }
  };

  // ---- DERIVED DATA ----
  const filteredReports = (() => {
    if (!dashboard?.reports) return [];
    let list = dashboard.reports;
    if (activeTab === 'favourites') list = list.filter(r => r.isFavourite);
    if (activeTab === 'shared') list = list.filter(r => r.isShared);
    if (activeTab === 'library' || activeTab === 'scheduled' || activeTab === 'builder') {
      // library shows all; builder / scheduled show library reports too for context
    }
    if (activeFilter !== 'all') list = list.filter(r => r.category === activeFilter);
    return list;
  })();

  const categoryChips = CATEGORY_FILTERS.map(f => ({
    ...f,
    count: f.value === 'all'
      ? (dashboard?.reports?.length ?? 0)
      : (dashboard?.reports?.filter(r => r.category === f.value).length ?? 0),
  }));

  // ---- CHART DATA ----
  const chartBars = chartQuery.data ?? [];
  const chartMetrics = yAxisList;

  const CHART_COLORS = ['#7B6AE6', '#8c6227', '#10b981', '#f59e0b'];

  function toggleYAxis(item: string) {
    setYAxisList(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
  }

  function formatUpdatedAt(dateStr: string) {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Updated: Today';
    if (diffDays === 1) return 'Updated: Yesterday';
    if (diffDays < 7) return `Updated: ${diffDays}d ago`;
    if (diffDays < 30) return `Updated: ${Math.floor(diffDays / 7)}w ago`;
    return `Updated: ${Math.floor(diffDays / 30)}m ago`;
  }

  const isLoading = dashboardQuery.isLoading;
  const isError = dashboardQuery.isError;

  return (
    <div className="min-h-screen bg-[#F7F8FC] text-[#1A1A1A] font-sans antialiased">

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* New Report Modal */}
      {showNewReportModal && (
        <NewReportModal
          onClose={() => setShowNewReportModal(false)}
          onSave={(data) => createReportMutation.mutate(data)}
        />
      )}

      {/* Top Header Bar */}
      <header className="px-6 py-3 flex items-center justify-between border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
          <span>BI & Reports</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          <span className="text-xl font-bold text-[#7B6AE6]">Business Intelligence</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Refresh */}
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['biz-intel'] })}
            title="Refresh data"
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${dashboardQuery.isFetching ? 'animate-spin' : ''}`} />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full relative transition-colors">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <Bell className="w-4 h-4" />
          </button>

          {/* New Report Button */}
          <button
            onClick={() => setShowNewReportModal(true)}
            className="bg-[#7B6AE6] hover:bg-opacity-90 text-white font-medium text-sm px-4 py-1.5 rounded flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" strokeWidth={3} /> New report
          </button>

          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 ml-1">
            <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xs text-white font-bold">BI</div>
          </div>
        </div>
      </header>

      {/* Sub-Header Navigation Tabs */}
      <nav className="px-6 bg-white border-b border-gray-200 flex gap-6 text-sm font-medium text-gray-500">
        {ALL_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-1 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#7B6AE6] text-[#7B6AE6] font-semibold'
                : 'border-transparent hover:text-gray-900'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </nav>

      {/* Main Canvas */}
      <main className="p-6 max-w-[1600px] mx-auto space-y-6">

        {/* Loading / Error states */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-[#7B6AE6] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Loading dashboard…</p>
            </div>
          </div>
        )}

        {isError && (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 text-sm text-rose-600">
            Failed to load dashboard data. Please refresh.
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {/* Row 1: Segment Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {categoryChips.map((chip) => (
                <button
                  key={chip.value}
                  onClick={() => setActiveFilter(chip.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeFilter === chip.value
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {chip.label} ({chip.count})
                </button>
              ))}
            </div>

            {/* Row 2: Sparkline Mini Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(dashboard?.miniMetrics ?? []).map((card, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-md p-4 border border-gray-200 border-l-4 ${card.borderClass} flex items-center justify-between shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                >
                  <div>
                    <h3 className="text-sm font-bold text-gray-800">{card.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{card.lastRun}</p>
                  </div>
                  <div className="w-24 h-8">
                    <svg className="w-full h-full" viewBox="0 0 100 30">
                      <polyline
                        fill="none"
                        stroke={index === 0 ? '#7B6AE6' : index === 1 ? '#10b981' : '#b45309'}
                        strokeWidth="2"
                        points={card.sparklinePoints}
                      />
                    </svg>
                  </div>
                </div>
              ))}
            </section>

            {/* Row 3: Report Cards Grid — shown only for library / shared / favourites */}
            {(activeTab === 'library' || activeTab === 'shared' || activeTab === 'favourites') && (
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredReports.length === 0 ? (
                  <div className="col-span-4 text-center py-12 text-sm text-gray-400">
                    No reports found in this view.
                  </div>
                ) : (
                  filteredReports.map((report) => (
                    <div
                      key={report.id}
                      className="bg-white rounded-md border border-gray-200 p-5 flex flex-col justify-between hover:border-gray-300 transition-all shadow-sm group"
                    >
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <ReportIcon iconType={report.iconType} />
                          {/* Favourite star */}
                          <button
                            onClick={() => favouriteMutation.mutate({ reportId: report.id, isFavourite: !report.isFavourite })}
                            title={report.isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                            className={`transition-colors mt-0.5 ${report.isFavourite ? 'text-amber-400' : 'text-gray-200 hover:text-amber-300'}`}
                          >
                            <Star className="w-4 h-4" fill={report.isFavourite ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                        <h4 className="text-base font-bold text-gray-900 mb-1">{report.title}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed mb-4">{report.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px] font-semibold text-gray-400">
                        <span>{formatUpdatedAt(report.updatedAt)}</span>
                        <div className="flex items-center gap-2">
                          {/* Delete button (visible on hover) */}
                          <button
                            onClick={() => deleteReportMutation.mutate(report.id)}
                            title="Delete report"
                            className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Run button */}
                          <button
                            onClick={() => {
                              setRunningReportId(report.id);
                              runReportMutation.mutate(report.id);
                            }}
                            disabled={runningReportId === report.id}
                            className="text-[#7B6AE6] hover:text-opacity-80 font-bold tracking-wider uppercase text-[11px] transition-colors disabled:opacity-50 flex items-center gap-1"
                          >
                            {runningReportId === report.id ? (
                              <span className="inline-block w-3 h-3 border border-[#7B6AE6] border-t-transparent rounded-full animate-spin" />
                            ) : 'Run'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </section>
            )}

            <hr className="border-gray-200 my-6" />

            {/* Section: Custom Report Builder */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700 font-bold text-sm tracking-wide">
                <BarChart2 className="w-4 h-4 text-gray-500" />
                <span>Custom Report Builder</span>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 text-gray-900 grid grid-cols-1 lg:grid-cols-12 overflow-hidden shadow-sm">

                {/* Column A: Data Sources */}
                <div className="lg:col-span-3 border-r border-gray-200 p-4 bg-white space-y-4">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Data Sources</h5>

                  {DATA_SOURCES.map((source, sIdx) => (
                    <div key={sIdx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold text-gray-700 py-1">
                        <span>{source.category}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                      <div className="space-y-1 pl-1">
                        {source.items.map((item, iIdx) => (
                          <button
                            key={iIdx}
                            onClick={() => {
                              if (item === 'Month') {
                                setXAxis('Month');
                              } else {
                                toggleYAxis(item);
                              }
                            }}
                            className={`w-full flex items-center gap-2 border rounded px-2 py-1.5 text-xs text-left shadow-sm cursor-pointer transition-colors ${
                              (item === 'Month' && xAxis === 'Month') || (item !== 'Month' && yAxisList.includes(item))
                                ? 'bg-[#f0effd] border-[#cbd2f6] text-[#7B6AE6]'
                                : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                            }`}
                          >
                            <div className="grid grid-cols-2 gap-0.5 opacity-30">
                              <span className="w-1 h-1 bg-gray-600 rounded-full" />
                              <span className="w-1 h-1 bg-gray-600 rounded-full" />
                              <span className="w-1 h-1 bg-gray-600 rounded-full" />
                              <span className="w-1 h-1 bg-gray-600 rounded-full" />
                              <span className="w-1 h-1 bg-gray-600 rounded-full" />
                              <span className="w-1 h-1 bg-gray-600 rounded-full" />
                            </div>
                            <span>{item}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Column B: Canvas Preview */}
                <div className="lg:col-span-6 p-4 flex flex-col justify-between min-h-[420px] bg-white">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Canvas Preview</h5>
                      <button
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['biz-intel', 'chart'] })}
                        title="Refresh chart"
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${chartQuery.isFetching ? 'animate-spin' : ''}`} />
                      </button>
                    </div>

                    {/* X-Axis drop zone */}
                    <div className="grid grid-cols-12 items-center gap-2 bg-white border border-dashed border-gray-300 rounded-lg p-2 min-h-[42px]">
                      <div className="col-span-2 text-xs font-bold text-gray-400 pl-1">X-Axis</div>
                      <div className="col-span-10 flex flex-wrap gap-1.5">
                        {xAxis && (
                          <span className="inline-flex items-center gap-1.5 bg-[#f0effd] text-[#7B6AE6] text-xs font-semibold px-2 py-0.5 rounded border border-[#cbd2f6]">
                            {xAxis}
                            <button onClick={() => setXAxis('')} className="text-sm font-light text-[#7B6AE6] hover:text-opacity-70">×</button>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Y-Axis drop zone */}
                    <div className="grid grid-cols-12 items-center gap-2 bg-white border border-dashed border-gray-300 rounded-lg p-2 min-h-[42px]">
                      <div className="col-span-2 text-xs font-bold text-gray-400 pl-1">Y-Axis</div>
                      <div className="col-span-10 flex flex-wrap gap-1.5">
                        {yAxisList.map((metric, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 bg-[#f0effd] text-[#7B6AE6] text-xs font-semibold px-2 py-0.5 rounded border border-[#cbd2f6]">
                            {metric}
                            <button onClick={() => toggleYAxis(metric)} className="text-sm font-light text-[#7B6AE6] hover:text-opacity-70">×</button>
                          </span>
                        ))}
                        {yAxisList.length === 0 && (
                          <span className="text-xs text-gray-400 italic">Click metrics in the panel to add</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Chart Preview */}
                  <div id="chart-preview-container" className="mt-6 flex-1 flex flex-col justify-end bg-white border border-gray-200 rounded-lg p-4 min-h-[220px]">
                    {chartQuery.isLoading ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="w-6 h-6 border-2 border-[#7B6AE6] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-stretch relative">
                        {/* Y-axis labels */}
                        <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[10px] text-gray-400 font-bold z-10 select-none pointer-events-none">
                          <span>1M</span>
                          <span>500K</span>
                          <span>0</span>
                        </div>

                        {/* Grid lines */}
                        <div className="absolute left-8 right-0 top-0 bottom-6 flex flex-col justify-between pointer-events-none opacity-60">
                          <div className="w-full border-t border-gray-100" />
                          <div className="w-full border-t border-gray-100" />
                          <div className="w-full border-t border-gray-100" />
                        </div>

                        {/* Bars */}
                        <div className="flex-1 ml-8 flex items-end justify-around h-full pb-6 z-20">
                          {(chartBars.length > 0 ? chartBars : [
                            { month: 'Dec' }, { month: 'Jan' }, { month: 'Feb' },
                            { month: 'Mar' }, { month: 'Apr' }, { month: 'May' },
                          ]).map((item: any, idx: number) => (
                            <div key={idx} className="h-full flex flex-col justify-end items-center w-12 group">
                              <div className="flex items-end gap-1 w-full h-full justify-center">
                                {chartMetrics.map((metric, mIdx) => {
                                  const heightKey = `${metric.replace(/\s+/g, '').replace('%', 'Pct')}Height`;
                                  const height = item[heightKey] ?? `${20 + mIdx * 10}%`;
                                  return (
                                    <div
                                      key={mIdx}
                                      className="w-3 rounded-t-sm transition-all relative group/bar"
                                      style={{ height, backgroundColor: CHART_COLORS[mIdx % CHART_COLORS.length] }}
                                      title={`${metric}: ${item[`${metric.replace(/\s+/g, '').replace('%', 'Pct')}Val`] ?? ''}`}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-[10px] text-gray-400 font-bold mt-2 absolute bottom-0">{item.month}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  {showLegend && chartMetrics.length > 0 && (
                    <div className="flex items-center gap-4 mt-3 flex-wrap">
                      {chartMetrics.map((metric, mIdx) => (
                        <div key={mIdx} className="flex items-center gap-1.5 text-xs text-gray-500">
                          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: CHART_COLORS[mIdx % CHART_COLORS.length] }} />
                          <span>{metric}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Column C: Settings */}
                <div className="lg:col-span-3 border-l border-gray-200 p-4 bg-white flex flex-col justify-between">
                  <div className="space-y-4">
                    <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Settings</h5>

                    {/* Report title */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 block">Report Title</label>
                      <input
                        className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[#7B6AE6] transition-colors"
                        value={reportTitle}
                        onChange={e => setReportTitle(e.target.value)}
                        placeholder="Custom Report"
                      />
                    </div>

                    <div className="space-y-3">
                      {/* Show data labels toggle */}
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">Show data labels</label>
                        <button
                          onClick={() => setShowDataLabels(v => !v)}
                          className={`w-8 h-4 rounded-full relative p-0.5 cursor-pointer flex items-center transition-colors ${showDataLabels ? 'bg-[#7B6AE6] justify-end' : 'bg-gray-200 justify-start'}`}
                        >
                          <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                        </button>
                      </div>
                      {/* Show legend toggle */}
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-gray-700">Show legend</label>
                        <button
                          onClick={() => setShowLegend(v => !v)}
                          className={`w-8 h-4 rounded-full relative p-0.5 cursor-pointer flex items-center transition-colors ${showLegend ? 'bg-[#7B6AE6] justify-end' : 'bg-gray-200 justify-start'}`}
                        >
                          <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                        </button>
                      </div>
                      {/* Trendline toggle */}
                      <div className="flex items-center justify-between">
                        <label className={`text-xs font-medium ${trendline ? 'text-gray-700' : 'text-gray-300'}`}>Trendline</label>
                        <button
                          onClick={() => setTrendline(v => !v)}
                          className={`w-8 h-4 rounded-full relative p-0.5 cursor-pointer flex items-center transition-colors ${trendline ? 'bg-[#7B6AE6] justify-end' : 'bg-gray-200 justify-start'}`}
                        >
                          <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                        </button>
                      </div>
                    </div>

                    {/* Active Filters */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 block">Active Filters</label>
                      {activeFilter2 && (
                        <div className="border border-gray-200 rounded px-2.5 py-1.5 flex items-center justify-between bg-white text-xs shadow-sm">
                          <span className="text-gray-800 font-medium">{activeFilter2}</span>
                          <button onClick={() => setActiveFilter2('')} className="text-gray-400 text-sm font-semibold hover:text-gray-600">×</button>
                        </div>
                      )}
                      <button
                        onClick={() => setActiveFilter2('Date: Last 6 Months')}
                        className="text-[11px] text-[#7B6AE6] font-bold hover:underline block pt-1"
                      >
                        + Add filter
                      </button>
                    </div>

                    {/* Export Format */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-500 block">Export Format</label>
                      <div className="relative">
                        <select
                          className="w-full border border-gray-200 rounded px-2.5 py-1.5 text-xs bg-white shadow-sm cursor-pointer hover:bg-gray-50 appearance-none outline-none focus:border-[#7B6AE6] transition-colors"
                          value={exportFormat}
                          onChange={e => setExportFormat(e.target.value)}
                        >
                          {EXPORT_FORMATS.map(f => <option key={f}>{f}</option>)}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={handleExport}
                      className="flex-1 bg-white border border-[#7B6AE6] text-[#7B6AE6] hover:bg-[#f0effd] font-bold text-xs tracking-wide py-2.5 rounded shadow-sm uppercase transition-all flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" strokeWidth={2.5} /> Export
                    </button>
                    <button
                      onClick={() => saveAndRunMutation.mutate()}
                      disabled={saveAndRunMutation.isPending || !reportTitle}
                      className="flex-[1.5] bg-[#7B6AE6] hover:bg-opacity-95 text-white font-bold text-xs tracking-wide py-2.5 rounded shadow-sm uppercase transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {saveAndRunMutation.isPending ? (
                        <>
                          <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                          Saving…
                        </>
                      ) : 'Save & Run'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Scheduled & Recent Runs */}
            <section className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-gray-700 font-bold text-sm tracking-wide">
                <Clock className="w-4 h-4 text-gray-500" />
                <span>Scheduled & Recent Runs</span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                {/* Active Schedules */}
                <div className="lg:col-span-5 space-y-2">
                  <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Schedules</h5>

                  {(dashboard?.schedules ?? []).length === 0 ? (
                    <p className="text-xs text-gray-400 italic">No active schedules.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(dashboard?.schedules ?? []).map((sched) => (
                        <div key={sched.id} className="bg-white border border-gray-200 rounded-md p-4 flex items-start justify-between hover:border-gray-300 transition-all shadow-sm group">
                          <div className="space-y-1">
                            <h6 className="text-xs font-bold text-gray-900">{sched.title}</h6>
                            <p className="text-[11px] text-gray-500 font-medium">{sched.info}</p>
                          </div>
                          <div className="flex items-center gap-2 pl-2">
                            <div className="text-[#7B6AE6] opacity-90">
                              {sched.icon === 'mail' ? (
                                <Mail className="w-4 h-4" />
                              ) : (
                                <FileCheck className="w-4 h-4" />
                              )}
                            </div>
                            {/* Remove schedule */}
                            <button
                              onClick={() => deleteScheduleMutation.mutate(sched.id)}
                              title="Remove schedule"
                              className="text-gray-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Activity Table */}
                <div className="lg:col-span-7 space-y-2">
                  <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Recent Activity</h5>

                  <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/70 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          <th className="py-2.5 px-4">Report Name</th>
                          <th className="py-2.5 px-4">Duration</th>
                          <th className="py-2.5 px-4 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-semibold">
                        {(dashboard?.recentActivity ?? []).length === 0 ? (
                          <tr>
                            <td colSpan={3} className="py-6 text-center text-gray-400 text-xs">No recent activity.</td>
                          </tr>
                        ) : (
                          (dashboard?.recentActivity ?? []).map((row) => (
                            <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className={`py-3 px-4 ${row.failed ? 'text-rose-600 font-bold' : 'text-gray-800'}`}>
                                {row.name}
                              </td>
                              <td className="py-3 px-4 text-gray-400 font-medium">{row.duration}</td>
                              <td className="py-3 px-4 text-right">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                  row.failed
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}