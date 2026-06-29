'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { Mail, Phone, Hash, Pencil, CheckCircle2, ChevronRight, ChevronDown, Download, Loader2, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';

// Form & UI Imports
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// CENTRALIZED DATA STORES
// ============================================================================

// The mock data for the Personal tab has been replaced with dynamic backend state.
const officeAccessData = {
  details: [
    { label: "Location", value: "Islamabad HQ" },
    { label: "Shift", value: "General (09:00 - 18:00)" },
    { label: "Work Mode", value: "Hybrid" },
    { label: "System Access", value: "ESS (Standard)" },
    { label: "Last Login", value: "Today, 08:45 AM" }
  ],
  activeModules: ["ESS", "Attendance", "Leave", "Payslips", "Documents"]
};

const attendanceCalendarWeeks = [
  [null, null, null, null, { status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }],
  [{ status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'L', label: 'Late' }, { status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }],
  [{ status: 'P', label: 'Present' }, { status: 'A', label: 'Absent' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'H', label: 'Half-day' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }],
  [{ status: 'L', label: 'Late' }, { status: 'L', label: 'Late' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }],
  [{ status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'P', label: 'Present' }, { status: 'HO', label: 'Holiday' }, { status: 'HO', label: 'Holiday' }]
];

const attendanceLogsTable = [
  { date: "01 May 2026", day: "Fri", checkIn: "08:55 AM", checkOut: "05:00 PM", total: "8.1 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "04 May 2026", day: "Mon", checkIn: "08:50 AM", checkOut: "06:30 PM", total: "9.6 hrs", ot: "1.6 hrs", otColor: "text-[#7B6AE6]", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "05 May 2026", day: "Tue", checkIn: "08:58 AM", checkOut: "05:05 PM", total: "8.1 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "06 May 2026", day: "Wed", checkIn: "09:00 AM", checkOut: "05:00 PM", total: "8.0 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "07 May 2026", day: "Thu", checkIn: "09:35 AM", checkOut: "06:00 PM", total: "8.4 hrs", ot: "-", status: "Late", textColor: "text-amber-600", color: "bg-amber-50 text-amber-600 border-amber-100" },
  { date: "08 May 2026", day: "Fri", checkIn: "08:50 AM", checkOut: "05:15 PM", total: "8.4 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "11 May 2026", day: "Mon", checkIn: "08:55 AM", checkOut: "05:45 PM", total: "8.8 hrs", ot: "0.8 hrs", otColor: "text-[#7B6AE6]", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "12 May 2026", day: "Tue", checkIn: "08:50 AM", checkOut: "05:00 PM", total: "8.1 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" },
  { date: "13 May 2026", day: "Wed", checkIn: "-", checkOut: "-", total: "0 hrs", ot: "-", status: "Absent", color: "bg-rose-50 text-rose-500 border-rose-100" },
  { date: "14 May 2026", day: "Thu", checkIn: "08:55 AM", checkOut: "05:05 PM", total: "8.1 hrs", ot: "-", status: "Present", color: "bg-purple-50 text-[#7B6AE6] border-purple-100" }
];

// ============================================================================
// FORM SCHEMAS
// ============================================================================

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().nullable().optional(),
  dateOfBirth: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  cnic: z.string().nullable().optional(),
  personalEmail: z.string().email('Invalid email').nullable().optional().or(z.literal('')),
  personalPhone: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactRelation: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  homeAddress: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  grade: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  employeeType: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const skillSchema = z.object({
  skillName: z.string().min(1, 'Skill name is required'),
  percentage: z.number().int().min(0).max(100).nullable().optional(),
});

type SkillFormValues = z.infer<typeof skillSchema>;

interface PayslipRow {
  id: string;
  month: string;
  gross: string;
  deductions: string;
  tax: string;
  net: string;
  status: string;
  color: string;
  downloadable: boolean;
}

interface PayslipsApiData {
  availableYears: number[];
  selectedYear: number;
  currencyCode: string;
  rows: PayslipRow[];
  ytd: { gross: string; deductions: string; net: string };
}

const MAX_VISIBLE_PAYSLIPS = 8;
/** Matches thead `py-3` row height for scroll cap calculation */
const PAYSLIP_TABLE_HEADER_PX = 41;
/** Matches tbody `py-3.5` row height for scroll cap calculation */
const PAYSLIP_TABLE_ROW_PX = 44;

function toDateInputValue(date: string | Date | null | undefined): string {
  if (!date) return '';
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
}

function toApiDateValue(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`).toISOString();
  }
  return value;
}

function employeeToProfileFormValues(employee: {
  firstName?: string | null;
  lastName?: string | null;
  preferredName?: string | null;
  dateOfBirth?: string | Date | null;
  gender?: string | null;
  nationality?: string | null;
  cnic?: string | null;
  personalEmail?: string | null;
  personalPhone?: string | null;
  phone?: string | null;
  emergencyContactName?: string | null;
  emergencyContactRelation?: string | null;
  emergencyContactPhone?: string | null;
  homeAddress?: string | null;
  department?: string | null;
  designation?: string | null;
  grade?: string | null;
  location?: string | null;
  employeeType?: string | null;
}): ProfileFormValues {
  return {
    firstName: employee.firstName || '',
    lastName: employee.lastName || '',
    preferredName: employee.preferredName || '',
    dateOfBirth: toDateInputValue(employee.dateOfBirth),
    gender: employee.gender || '',
    nationality: employee.nationality || '',
    cnic: employee.cnic || '',
    personalEmail: employee.personalEmail || '',
    personalPhone: employee.personalPhone || '',
    phone: employee.phone || '',
    emergencyContactName: employee.emergencyContactName || '',
    emergencyContactRelation: employee.emergencyContactRelation || '',
    emergencyContactPhone: employee.emergencyContactPhone || '',
    homeAddress: employee.homeAddress || '',
    department: employee.department || '',
    designation: employee.designation || '',
    grade: employee.grade || '',
    location: employee.location || '',
    employeeType: employee.employeeType || '',
  };
}

function buildProfilePayload(values: ProfileFormValues) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (value === '') return [key, null];
      if (key === 'dateOfBirth') return [key, toApiDateValue(value as string)];
      return [key, value];
    }),
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function EmployeeDashboardContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const idParam = searchParams.get('id') ?? searchParams.get('employeeId');
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState("Personal");
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSkillsManagerOpen, setIsSkillsManagerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skillSubmitting, setSkillSubmitting] = useState(false);

  // Forms
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '', lastName: '', preferredName: '', dateOfBirth: '', gender: '',
      nationality: '', cnic: '', personalEmail: '', personalPhone: '', phone: '',
      emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
      homeAddress: '', department: '', designation: '', grade: '', location: '', employeeType: ''
    }
  });

  const skillForm = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: { skillName: '', percentage: null }
  });

  // Dynamic backend data state
  const [employeeHeaderData, setEmployeeHeaderData] = useState<{
    firstName: string; lastName: string; name: string; initials: string; role: string; department: string;
    sinceDate: string; status: string; type: string; location: string;
    tenure: string; empId: string; email: string; phone: string;
    handle: string; reportsTo: string; contractType: string;
    metrics: { label: string; value: string; strokeColor: string; percentage: number }[];
  } | null>(null);

  const [personalInformation, setPersonalInformation] = useState<{
    fields: { label: string; value: string }[];
    emergencyContact: string; homeAddress: string;
  } | null>(null);

  const [employmentSnapshot, setEmploymentSnapshot] = useState<{
    label: string; value: string; isLink: boolean; verified?: boolean;
  }[] | null>(null);

  const [skillsData, setSkillsData] = useState<{
    tags: string[]; progress: { skill: string; percentage: number }[];
  } | null>(null);

  // Raw skills for CRUD in the Skills Manager dialog
  const [rawSkills, setRawSkills] = useState<{ id: string; skillName: string; percentage: number | null }[]>([]);
  const profileFormDefaultsRef = useRef<ProfileFormValues | null>(null);

  const [payslipsYear, setPayslipsYear] = useState(new Date().getFullYear());
  const [payslipsData, setPayslipsData] = useState<PayslipsApiData | null>(null);
  const [payslipsLoading, setPayslipsLoading] = useState(false);
  const [downloadingPayslipId, setDownloadingPayslipId] = useState<string | null>(null);

  const fetchPayslips = useCallback(async (year: number) => {
    if (!idParam) return;

    try {
      setPayslipsLoading(true);
      const { default: apiClient } = await import('@/lib/api-client');
      const response = await apiClient.get(`/employees/${idParam}/payslips`, { params: { year } });
      const data = response.data.data as PayslipsApiData;
      setPayslipsData(data);
      setPayslipsYear(data.selectedYear);
    } catch (error) {
      console.error('Failed to load payslips:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load payslips',
        description: 'Could not fetch payslip history. Please try again.',
      });
    } finally {
      setPayslipsLoading(false);
    }
  }, [idParam, toast]);

  const handlePayslipDownload = async (payslipId: string) => {
    if (!idParam) return;

    try {
      setDownloadingPayslipId(payslipId);
      const { default: apiClient } = await import('@/lib/api-client');
      const response = await apiClient.get(
        `/employees/${idParam}/payslips/${payslipId}/download`,
        { responseType: 'blob' },
      );
      const disposition = response.headers['content-disposition'] as string | undefined;
      const filenameMatch = disposition?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? `payslip-${payslipId}.pdf`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download payslip:', error);
      toast({
        variant: 'destructive',
        title: 'Download failed',
        description: 'Could not download the payslip. Please try again.',
      });
    } finally {
      setDownloadingPayslipId(null);
    }
  };

  const fetchEmployeeData = useCallback(async (options?: { silent?: boolean }) => {
    if (!idParam) {
      setIsLoading(false);
      return;
    }
    try {
      if (!options?.silent) {
        setIsLoading(true);
      }
      const { default: apiClient } = await import('@/lib/api-client');
      const response = await apiClient.get(`/employees/${idParam}`);
      const data = response.data.data;

      setEmployeeHeaderData(data.headerData);
      setPersonalInformation(data.personalInformation);
      setEmploymentSnapshot(data.employmentSnapshot);
      setSkillsData(data.skillsData);
      setRawSkills(data.skills || []);
      profileFormDefaultsRef.current = employeeToProfileFormValues(data.employee);
    } catch (error) {
      console.error('Failed to load employee profile:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load profile',
        description: 'Could not fetch employee data. Please try again.',
      });
    } finally {
      if (!options?.silent) {
        setIsLoading(false);
      }
    }
  }, [idParam, toast]);

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  useEffect(() => {
    if (activeTab === 'Payslips' && idParam) {
      fetchPayslips(payslipsYear);
    }
    // Refetch only when opening the tab or switching employees
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, idParam]);

  const handlePayslipsYearChange = (year: number) => {
    setPayslipsYear(year);
    fetchPayslips(year);
  };

  const openEditProfile = () => {
    if (profileFormDefaultsRef.current) {
      profileForm.reset(profileFormDefaultsRef.current);
    }
    setIsEditProfileOpen(true);
  };

  const onProfileSubmit = async (values: ProfileFormValues) => {
    if (!idParam) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Employee ID is missing from the page URL.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.put(`/employees/${idParam}`, buildProfilePayload(values));
      await fetchEmployeeData({ silent: true });
      setIsEditProfileOpen(false);
      toast({ title: 'Profile updated', description: 'Employee information was saved successfully.' });
    } catch (error) {
      console.error('Failed to update profile', error);
      let description = 'Could not save employee information. Please try again.';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          description = 'You do not have permission to edit employee profiles.';
        } else if (error.response?.data?.error) {
          description = String(error.response.data.error);
        }
      }
      toast({ variant: 'destructive', title: 'Save failed', description });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onProfileSubmitError = () => {
    toast({
      variant: 'destructive',
      title: 'Please fix the form errors',
      description: 'Check the highlighted fields and try again.',
    });
  };

  const onSkillSubmit = async (values: SkillFormValues) => {
    if (!idParam) return;

    try {
      setSkillSubmitting(true);
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.post(`/employees/${idParam}/skills`, values);
      await fetchEmployeeData({ silent: true });
      skillForm.reset({ skillName: '', percentage: null });
      toast({ title: 'Skill added' });
    } catch (error) {
      console.error('Failed to add skill', error);
      toast({
        variant: 'destructive',
        title: 'Failed to add skill',
        description: axios.isAxiosError(error) && error.response?.data?.error
          ? String(error.response.data.error)
          : 'Please try again.',
      });
    } finally {
      setSkillSubmitting(false);
    }
  };

  const onSkillDelete = async (skillId: string) => {
    if (!idParam || !confirm('Are you sure you want to remove this skill?')) return;

    try {
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.delete(`/employees/${idParam}/skills/${skillId}`);
      await fetchEmployeeData({ silent: true });
      toast({ title: 'Skill removed' });
    } catch (error) {
      console.error('Failed to delete skill', error);
      toast({
        variant: 'destructive',
        title: 'Failed to remove skill',
        description: 'Please try again.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!employeeHeaderData) {
    return (
      <div className="bg-[#f8f9fa] min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-2">Employee not found</h2>
        <p className="text-muted-foreground mb-6">The employee record you are looking for does not exist or has been removed.</p>
        <Link href="/hr/employees" className="text-primary hover:underline font-medium">Return to Directory</Link>
      </div>
    );
  }

  const navigationTabs = [
    { name: "Personal" },
    { name: "Employment" },
    { name: "Documents" },
    { name: "Assets" },
    { name: "Payslips" },
    { name: "Performance" },
    { name: "Leave history" },
    { name: "Attendance logs" }
  ];

  const payslipRowCount = payslipsData?.rows.length ?? 0;
  const payslipTableScrollable = payslipRowCount > MAX_VISIBLE_PAYSLIPS;
  const payslipTableMaxHeight =
    PAYSLIP_TABLE_HEADER_PX + PAYSLIP_TABLE_ROW_PX * MAX_VISIBLE_PAYSLIPS;

  return (
    <div className="bg-[#f8f9fa] text-foreground min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-8 pt-2">

        {/* ==========================================
            COMPONENT 0: BREADCRUMB & ACTIONS PANEL
           ========================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-2 mb-6">
          <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <Link href="/hr/employees" className="text-muted-foreground hover:text-foreground cursor-pointer">Employees</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <Link href={`/hr/employees?department=${employeeHeaderData.department?.replace(' dept', '') || 'Unassigned'}`} className="text-muted-foreground hover:text-foreground cursor-pointer">{employeeHeaderData.department?.replace(' dept', '') || 'Unassigned'}</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-foreground font-bold">{employeeHeaderData.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button 
              onClick={openEditProfile}
              className="px-4 py-2 border border-border text-xs font-bold text-foreground bg-card hover:bg-muted/50 rounded-[var(--radius)] transition-colors shadow-sm"
            >
              Edit profile
            </button>
            <button
              onClick={() => {
                // Minimal PDF with "TBD" content — no external library needed
                const pdfContent = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 44>>stream
BT /F1 24 Tf 220 700 Td (TBD) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000360 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
435
%%EOF`;
                const blob = new Blob([pdfContent], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `HR_Letter_${employeeHeaderData.name?.replace(/\s+/g, '_') || 'Employee'}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                toast({ title: 'HR Letter Downloaded', description: 'Content is TBD — full letter generation coming soon.' });
              }}
              className="px-4 py-2 border border-border text-xs font-bold text-foreground bg-card hover:bg-muted/50 rounded-[var(--radius)] transition-colors shadow-sm"
            >
              Generate HR letter
            </button>
            <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#7B6AE6] hover:bg-[#6959cf] rounded-[var(--radius)] transition-colors shadow-sm">
              Actions <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
        {/* ==========================================
            COMPONENT 1: HERO PROFILE BANNER
           ========================================== */}
        <header className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm mb-6">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
            
            <div className="flex flex-col sm:flex-row items-start gap-5">
              <div className="flex flex-col items-center gap-1">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#7B6AE6]/10 text-[#7B6AE6] font-bold text-2xl flex items-center justify-center border border-[#7B6AE6]/10">
                    {employeeHeaderData.initials}
                  </div>
                  <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">Since {employeeHeaderData.sinceDate}</span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">{employeeHeaderData.name}</h1>
                  <p className="text-sm text-muted-foreground font-medium mt-0.5">
                    {employeeHeaderData.role} <span className="text-border mx-1">•</span> {employeeHeaderData.department}
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {employeeHeaderData.status}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">{employeeHeaderData.type}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">{employeeHeaderData.location}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">{employeeHeaderData.tenure}</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-muted border border-border text-xs font-medium tracking-wide text-muted-foreground">{employeeHeaderData.empId}</span>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm font-medium text-muted-foreground pt-1">
                  <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                    <Mail className="w-4 h-4 text-muted-foreground/60" /> {employeeHeaderData.email}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                    <Phone className="w-4 h-4 text-muted-foreground/60" /> {employeeHeaderData.phone}
                  </span>
                  <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
                    <Hash className="w-4 h-4 text-muted-foreground/60" /> {employeeHeaderData.handle}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 border-t xl:border-t-0 pt-4 xl:pt-0 border-border">
              <div className="border-l border-border pl-6 pr-4 hidden sm:block">
                <table className="text-xs font-medium border-separate border-spacing-y-1.5">
                  <tbody>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Reports to:</td>
                      <td className="text-[#7B6AE6] hover:underline cursor-pointer font-bold">{employeeHeaderData.reportsTo}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Department:</td>
                      <td className="text-foreground font-semibold">Engineering</td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Location:</td>
                      <td className="text-foreground font-semibold">Islamabad HQ</td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Contract:</td>
                      <td className="text-foreground font-semibold">Permanent</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="border-l border-border pl-6 flex items-center gap-6 justify-between w-full sm:w-auto">
                {employeeHeaderData.metrics.map((metric, idx) => {
                  const radius = 16;
                  const circumference = 2 * Math.PI * radius;
                  const strokeDashoffset = circumference - (metric.percentage / 100) * circumference;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center gap-1">
                      <div className="relative w-12 h-12 flex items-center justify-center">
                        <svg className="absolute w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle className="text-muted/40" strokeWidth="2.5" stroke="currentColor" fill="none" cx="18" cy="18" r={radius} />
                          <circle 
                            strokeWidth="2.5" 
                            strokeDasharray={circumference} 
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-500" 
                            stroke={metric.strokeColor} 
                            strokeLinecap="round" 
fill="none" 
                            cx="18" 
                            cy="18" 
                            r={radius} 
                          />
                        </svg>
                        <span className="text-xs font-bold text-foreground z-10">{metric.value}</span>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground tracking-tight whitespace-nowrap">{metric.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </header>

        {/* =========================================================================
            COMPONENT 2: NAVIGATION TAB BAR
           ========================================================================= */}
        <div className="bg-white border border-border rounded-[var(--radius)] px-5 py-2.5 shadow-sm mb-6">
          <nav className="flex items-center gap-10 overflow-x-auto no-scrollbar bg-transparent">
            {navigationTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(tab.name)}
                className={`pb-1 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-b-2 tracking-tight ${
                  activeTab === tab.name
                    ? "border-[#7B6AE6] text-[#7B6AE6]" 
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* ==========================================
            COMPONENT 3: DATA PANELS CONTAINER
           ========================================== */}

        {/* EMPLOYMENT STUB */}
        {activeTab === "Employment" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <Hash className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Employment details</h2>
            <p className="text-sm text-muted-foreground max-w-md">Job history, promotions, contract details, and organizational changes will appear here.</p>
          </div>
        )}

        {/* DOCUMENTS STUB */}
        {activeTab === "Documents" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <Download className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Documents</h2>
            <p className="text-sm text-muted-foreground max-w-md">Uploaded documents, certificates, ID copies, and signed agreements will appear here.</p>
          </div>
        )}

        {/* ASSETS STUB */}
        {activeTab === "Assets" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Assigned assets</h2>
            <p className="text-sm text-muted-foreground max-w-md">Laptops, access cards, equipment, and other assigned company assets will appear here.</p>
          </div>
        )}

        {/* PAYSLIPS VIEW */}
        {activeTab === "Payslips" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm flex flex-col">
            
            <div className="p-6 pb-4 flex justify-between items-center">
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                Payslips · {payslipsData?.selectedYear ?? payslipsYear}
              </h2>
              <div className="relative">
                <select
                  value={payslipsYear}
                  onChange={(e) => handlePayslipsYearChange(Number(e.target.value))}
                  disabled={payslipsLoading || !payslipsData?.availableYears.length}
                  className="appearance-none bg-white border border-border rounded-[var(--radius)] pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground shadow-sm focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  {(payslipsData?.availableYears ?? [payslipsYear]).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            {payslipsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : (
              <>
                <div
                  className={`overflow-x-auto w-full ${payslipTableScrollable ? 'overflow-y-auto custom-scrollbar' : ''}`}
                  style={payslipTableScrollable ? { maxHeight: payslipTableMaxHeight } : undefined}
                >
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-t border-b border-border text-muted-foreground font-semibold bg-white ${payslipTableScrollable ? 'sticky top-0 z-10' : ''}`}>
                        <th className="px-6 py-3 font-semibold text-left">Month</th>
                        <th className="px-6 py-3 font-semibold text-right">Gross</th>
                        <th className="px-6 py-3 font-semibold text-right">Deductions</th>
                        <th className="px-6 py-3 font-semibold text-right">Tax</th>
                        <th className="px-6 py-3 font-semibold text-right">Net pay</th>
                        <th className="px-6 py-3 font-semibold text-left">Status</th>
                        <th className="px-6 py-3 font-semibold text-left">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payslipsData?.rows.length ? (
                        payslipsData.rows.map((row) => (
                          <tr key={row.id} className="border-b last:border-0 border-border bg-white hover:bg-muted/10 transition-colors">
                            <td className="px-6 py-3.5 font-medium text-foreground">{row.month}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-muted-foreground">{row.gross}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-muted-foreground">{row.deductions}</td>
                            <td className="px-6 py-3.5 text-right font-medium text-muted-foreground">{row.tax}</td>
                            <td className="px-6 py-3.5 text-right font-bold text-foreground">{row.net}</td>
                            <td className="px-6 py-3.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.color}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-6 py-3.5">
                              <button
                                type="button"
                                onClick={() => handlePayslipDownload(row.id)}
                                disabled={!row.downloadable || downloadingPayslipId === row.id}
                                className="inline-flex items-center gap-1.5 text-[#7B6AE6] hover:underline font-bold text-xs disabled:opacity-50 disabled:no-underline"
                              >
                                {downloadingPayslipId === row.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                Download
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-sm text-muted-foreground">
                            No payslips found for {payslipsData?.selectedYear ?? payslipsYear}.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-6 pt-4 pb-6 flex flex-wrap gap-2.5">
                  <div className="px-3.5 py-1.5 border border-border/70 rounded-full text-xs font-semibold text-foreground bg-[#f8f9fa] shadow-sm">
                    YTD gross: {payslipsData?.ytd.gross ?? '—'}
                  </div>
                  <div className="px-3.5 py-1.5 border border-border/70 rounded-full text-xs font-semibold text-foreground bg-[#f8f9fa] shadow-sm">
                    YTD deductions: {payslipsData?.ytd.deductions ?? '—'}
                  </div>
                  <div className="px-3.5 py-1.5 border border-border/70 rounded-full text-xs font-semibold text-foreground bg-[#f8f9fa] shadow-sm">
                    YTD net: {payslipsData?.ytd.net ?? '—'}
                  </div>
                </div>
              </>
            )}

          </div>
        )}

        {/* PERFORMANCE STUB */}
        {activeTab === "Performance" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <Pencil className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Performance reviews</h2>
            <p className="text-sm text-muted-foreground max-w-md">KPI scores, review cycles, manager feedback, and goal tracking will appear here.</p>
          </div>
        )}

        {/* LEAVE HISTORY STUB */}
        {activeTab === "Leave history" && (
          <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-12 shadow-sm flex flex-col items-center justify-center text-center min-h-[320px]">
            <div className="w-14 h-14 rounded-full bg-[#7B6AE6]/10 flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-[#7B6AE6]" />
            </div>
            <h2 className="text-lg font-bold text-foreground tracking-tight mb-1">Leave history</h2>
            <p className="text-sm text-muted-foreground max-w-md">Leave balances, approved requests, and absence records will appear here.</p>
          </div>
        )}

        {/* ATTENDANCE LOGS VIEW */}
        {activeTab === "Attendance logs" && (
          
          /* ==================================================================================
             ATTENDANCE VIEW BLOCK 
             ================================================================================== */
          <div className="space-y-6">
            
            {/* Main Log Sheet Card Box Component Container */}
            <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm flex flex-col">
              
              {/* Top Heading Actions Header Block */}
              <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Attendance logs · May 2026</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select className="appearance-none bg-white border border-border rounded-[var(--radius)] pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground shadow-sm focus:outline-none cursor-pointer">
                      <option>May 2026</option>
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                  <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-[var(--radius)] text-xs font-bold bg-white hover:bg-muted/50 transition-colors text-foreground shadow-sm">
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </div>
              </div>

              {/* Calendar View subdivision box */}
              <div className="px-6 pb-6">
                <div className="border border-border rounded-[var(--radius)] p-4 bg-white shadow-none">
                  <div className="overflow-x-auto no-scrollbar">
                    <div className="min-w-[700px] space-y-2">
                      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground pb-1">
                        <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                      </div>
                      
                      {attendanceCalendarWeeks.map((week, wIdx) => (
                        <div key={wIdx} className="grid grid-cols-7 gap-2">
                          {week.map((day, dIdx) => {
                            if (!day) return <div key={dIdx} className="h-10"></div>;
                            
                            let baseColor = "bg-muted/40 text-muted-foreground";
                            if (day.status === 'P') baseColor = "bg-[#7B6AE6]/10 text-[#7B6AE6]";
                            if (day.status === 'L') baseColor = "bg-amber-100/70 text-amber-800";
                            if (day.status === 'A') baseColor = "bg-rose-100/60 text-rose-700";
                            if (day.status === 'H') baseColor = "bg-emerald-100/70 text-emerald-800";
                            if (day.status === 'HO') baseColor = "bg-blue-50 text-blue-500";

                            return (
                              <div 
                                key={dIdx} 
                                className={`h-10 rounded-[var(--radius)] flex items-center justify-center text-xs font-bold ${baseColor}`}
                                title={day.label}
                              >
                                {day.status}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grid Label Legend */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 mt-3 border-t border-border text-[11px] font-semibold text-muted-foreground">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-[#7B6AE6]/10 inline-block"></span>Present 12</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-amber-100/70 inline-block"></span>Late 1</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-rose-100/60 inline-block"></span>Absent 1</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-emerald-100/70 inline-block"></span>Leaves 2</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-50 inline-block"></span>Holidays 1</div>
                  </div>
                </div>
              </div>

              {/* List Table subdivision box */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-t border-b border-border text-muted-foreground font-bold bg-white">
                      <th className="px-6 py-3 font-semibold">Date</th>
                      <th className="px-6 py-3 font-semibold">Day</th>
                      <th className="px-6 py-3 font-semibold">Check-in</th>
                      <th className="px-6 py-3 font-semibold">Check-out</th>
                      <th className="px-6 py-3 font-semibold">Total hrs</th>
                      <th className="px-6 py-3 font-semibold">OT</th>
                      <th className="px-6 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceLogsTable.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0 border-border bg-white hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-foreground">{row.date}</td>
                        <td className="px-6 py-3.5 font-medium text-muted-foreground">{row.day}</td>
                        <td className={`px-6 py-3.5 font-semibold ${row.textColor || 'text-foreground'}`}>{row.checkIn}</td>
                        <td className="px-6 py-3.5 font-semibold text-foreground">{row.checkOut}</td>
                        <td className="px-6 py-3.5 font-bold text-foreground">{row.total}</td>
                        <td className={`px-6 py-3.5 font-bold ${row.otColor || 'text-muted-foreground'}`}>{row.ot}</td>
                        <td className="px-6 py-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.color}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>

            {/* ================================================================
                SEPARATED INDEPENDENT MONTHLY SUMMARY CARD
               ================================================================ */}
            <div className="bg-white border border-border rounded-[var(--radius)] px-6 py-4 flex flex-row justify-between items-center text-xs font-bold shadow-sm">
              <span className="text-muted-foreground font-medium">
                Monthly summary: <span className="text-foreground font-bold">156.4 hrs</span> · <span className="text-foreground font-bold">2.4 hrs OT</span> · <span className="text-foreground font-bold">94% attendance</span>
              </span>
              <button className="text-[#7B6AE6] hover:underline transition-all">
                View full log
              </button>
            </div>

          </div>
        )}

        {/* PERSONAL VIEW */}
        {activeTab === "Personal" && (
          
          /* =========================================================
             STANDARD DEFAULT PERSONAL INFO VIEW BLOCK
             ========================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            <div className="lg:col-span-7 space-y-6">
              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Personal information</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                  {personalInformation?.fields.map((field, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="block text-xs font-medium text-muted-foreground tracking-tight">{field.label}</span>
                      <span className="block text-sm text-foreground font-semibold">{field.value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-4">
                  <div className="space-y-1">
                    <span className="block text-xs font-medium text-muted-foreground tracking-tight">Emergency contact</span>
                    <span className="block text-sm text-foreground font-semibold">{personalInformation?.emergencyContact}</span>
                  </div>
                  
                  <div className="border-t border-border pt-4 space-y-1">
                    <span className="block text-xs font-medium text-muted-foreground tracking-tight">Home address</span>
                    <span className="block text-sm text-foreground font-semibold leading-relaxed">{personalInformation?.homeAddress}</span>
                  </div>
                </div>
              </section>

              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-foreground tracking-tight">Skills & expertise</h2>
                  <button 
                    onClick={() => setIsSkillsManagerOpen(true)}
                    className="text-muted-foreground/70 hover:text-foreground p-1 transition-colors border border-border rounded bg-muted/20" aria-label="Modify Matrix"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {skillsData?.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-muted/40 border border-border rounded-[var(--radius)] text-xs font-semibold text-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-4 pt-2">
                  {skillsData?.progress.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-bold tracking-tight">
                        <span className="text-foreground">{item.skill}</span>
                        <span className="text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-muted rounded-full">
                        <div 
                          className="h-full bg-[#7B6AE6] rounded-full transition-all duration-500" 
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-transparent">
                      <th colSpan={2} className="px-6 py-4 text-base font-bold text-foreground tracking-tight">
                        Employment snapshot
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {employmentSnapshot?.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0 border-border bg-transparent hover:bg-muted/10 transition-colors">
                        <td className="px-6 py-3.5 font-medium text-muted-foreground w-[40%] tracking-tight">{row.label}</td>
                        <td className="px-6 py-3.5 font-bold text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className={row.isLink ? "text-[#7B6AE6] cursor-pointer hover:underline" : ""}>
                              {row.value}
                            </span>
                            {row.verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              <section className="bg-white text-card-foreground border border-border rounded-[var(--radius)] p-6 shadow-sm space-y-5">
                <h2 className="text-lg font-bold text-foreground tracking-tight">Office & access</h2>
                
                <div className="space-y-3.5">
                  {officeAccessData.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b last:border-0 border-dashed border-border/70">
                      <span className="font-medium text-muted-foreground tracking-tight">{detail.label}</span>
                      <span className="font-bold text-foreground tracking-tight">{detail.value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <span className="block text-xs font-bold text-muted-foreground tracking-tight">Active Modules</span>
                  <div className="flex flex-wrap gap-1.5">
                    {officeAccessData.activeModules.map((mod, idx) => (
                      <span 
                        key={idx} 
                        className={`px-2 py-0.5 border rounded text-[10px] font-bold tracking-wider ${
                          mod === "ESS" 
                            ? "bg-[#7B6AE6]/10 text-[#7B6AE6] border-[#7B6AE6]/20" 
                            : "bg-muted/40 text-muted-foreground border-border"
                        }`}
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>
              </section>
            </div>

          </div>
        )}

        {/* ==========================================
            MODALS & SLIDING SHEETS
           ========================================== */}
        <Sheet open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
            <SheetHeader className="mb-6">
              <SheetTitle>Edit Profile Information</SheetTitle>
            </SheetHeader>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit, onProfileSubmitError)} className="space-y-6">
              
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground tracking-tight border-b pb-2">Personal Info</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">First Name <span className="text-red-500">*</span></Label>
                    <Input {...profileForm.register('firstName')} className="text-sm" />
                    {profileForm.formState.errors.firstName && (
                      <p className="text-xs text-red-500">{profileForm.formState.errors.firstName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Last Name <span className="text-red-500">*</span></Label>
                    <Input {...profileForm.register('lastName')} className="text-sm" />
                    {profileForm.formState.errors.lastName && (
                      <p className="text-xs text-red-500">{profileForm.formState.errors.lastName.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Preferred Name</Label>
                    <Input {...profileForm.register('preferredName')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date of Birth</Label>
                    <Input type="date" {...profileForm.register('dateOfBirth')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Gender</Label>
                    <Input {...profileForm.register('gender')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Nationality</Label>
                    <Input {...profileForm.register('nationality')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">CNIC</Label>
                    <Input {...profileForm.register('cnic')} className="text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground tracking-tight border-b pb-2">Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Personal Email</Label>
                    <Input type="email" {...profileForm.register('personalEmail')} className="text-sm" />
                    {profileForm.formState.errors.personalEmail && (
                      <p className="text-xs text-red-500">{profileForm.formState.errors.personalEmail.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Personal Phone</Label>
                    <Input {...profileForm.register('personalPhone')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Work Phone</Label>
                    <Input {...profileForm.register('phone')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Home Address</Label>
                    <Input {...profileForm.register('homeAddress')} className="text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground tracking-tight border-b pb-2">Emergency Contact</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Name</Label>
                    <Input {...profileForm.register('emergencyContactName')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Relation</Label>
                    <Input {...profileForm.register('emergencyContactRelation')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Phone Number</Label>
                    <Input {...profileForm.register('emergencyContactPhone')} className="text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground tracking-tight border-b pb-2">Employment</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department</Label>
                    <Input {...profileForm.register('department')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Designation</Label>
                    <Input {...profileForm.register('designation')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Grade</Label>
                    <Input {...profileForm.register('grade')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Location</Label>
                    <Input {...profileForm.register('location')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Employment Type</Label>
                    <Input {...profileForm.register('employeeType')} className="text-sm" />
                  </div>
                </div>
              </div>

              <div className="pt-6 pb-8 border-t flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="bg-[#7B6AE6] hover:bg-[#6959cf] text-white font-bold">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Changes
                </Button>
              </div>
            </form>
          </SheetContent>
        </Sheet>

        <Dialog open={isSkillsManagerOpen} onOpenChange={setIsSkillsManagerOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Skills & Expertise</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Current Skills</h4>
                {rawSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-md bg-muted/20">No skills added yet.</p>
                ) : (
                  <ul className="space-y-2 max-h-[250px] overflow-y-auto px-1">
                    {rawSkills.map((s) => (
                      <li key={s.id} className="flex items-center justify-between p-2.5 border rounded-md bg-card">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground">{s.skillName}</span>
                          {s.percentage !== null && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">{s.percentage}%</span>
                          )}
                        </div>
                        <button 
                          onClick={() => onSkillDelete(s.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form onSubmit={skillForm.handleSubmit(onSkillSubmit)} className="space-y-4 border-t pt-4">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Add New Skill</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs">Skill Name <span className="text-red-500">*</span></Label>
                    <Input {...skillForm.register('skillName')} placeholder="e.g. React" className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Proficiency %</Label>
                    <Input 
                      type="number" 
                      min="0" max="100" 
                      placeholder="Optional" 
                      {...skillForm.register('percentage', { valueAsNumber: true, setValueAs: v => v === "" || isNaN(v) ? null : v })} 
                      className="text-sm" 
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={skillSubmitting} className="w-full sm:w-auto bg-[#7B6AE6] hover:bg-[#6959cf] text-white font-bold">
                    {skillSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Add Skill
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

export default function EmployeeDashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground font-semibold">Loading profile...</span>
        </div>
      </div>
    }>
      <EmployeeDashboardContent />
    </Suspense>
  );
}