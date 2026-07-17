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

type ProfileLoadError = 'missing_id' | 'not_found' | 'forbidden' | 'network';

const MIN_EMPLOYEE_AGE = 15;

const selectFieldClassName =
  'w-full bg-background border border-input rounded-md px-3 py-2 text-sm appearance-none focus:ring-1 focus:ring-ring outline-none';

function getMaxDateOfBirth(): string {
  const latest = new Date();
  latest.setFullYear(latest.getFullYear() - MIN_EMPLOYEE_AGE);
  return toDateInputValue(latest);
}

function isValidEmployeeDateOfBirth(value: string): boolean {
  if (!value) return true;

  const dob = new Date(`${value}T00:00:00`);
  if (Number.isNaN(dob.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dob.setHours(0, 0, 0, 0);

  if (dob >= today) return false;

  const youngestAllowed = new Date(today);
  youngestAllowed.setFullYear(youngestAllowed.getFullYear() - MIN_EMPLOYEE_AGE);

  return dob <= youngestAllowed;
}

function isValidJoiningDate(value: string): boolean {
  if (!value) return true;

  const joinDay = new Date(`${value}T00:00:00`);
  if (Number.isNaN(joinDay.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  joinDay.setHours(0, 0, 0, 0);

  return joinDay <= today;
}

function isProbationEndAfterJoinDate(joinDate: string, probationEnd: string): boolean {
  if (!joinDate || !probationEnd) return true;

  const joinDay = new Date(`${joinDate}T00:00:00`);
  const probationDay = new Date(`${probationEnd}T00:00:00`);
  if (Number.isNaN(joinDay.getTime()) || Number.isNaN(probationDay.getTime())) return false;

  joinDay.setHours(0, 0, 0, 0);
  probationDay.setHours(0, 0, 0, 0);

  return probationDay > joinDay;
}

function getMaxJoinDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMinProbationEndDate(joinDate: string): string {
  if (!joinDate) return '';
  const parsed = new Date(`${joinDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  parsed.setDate(parsed.getDate() + 1);
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface AttendanceMonthOption {
  month: number;
  year: number;
  label: string;
}

interface AttendanceCalendarCell {
  day: number | null;
  code: string | null;
  label: string;
}

interface AttendanceLogRow {
  id: string;
  date: string;
  day: string;
  checkIn: string;
  checkOut: string;
  total: string;
  ot: string;
  status: string;
  color: string;
  textColor?: string;
}

interface AttendanceLegendItem {
  label: string;
  count: number;
  color: string;
}

interface AttendanceApiData {
  selectedMonth: AttendanceMonthOption;
  availableMonths: AttendanceMonthOption[];
  calendar: {
    label: string;
    weekdays: string[];
    weeks: AttendanceCalendarCell[][];
    legend: AttendanceLegendItem[];
  };
  rows: AttendanceLogRow[];
  summary: {
    totalHours: string;
    overtimeHours: string;
    attendancePercentage: number;
  };
}

const MAX_VISIBLE_ATTENDANCE_ROWS = 8;
const ATTENDANCE_TABLE_HEADER_PX = 41;
const ATTENDANCE_TABLE_ROW_PX = 44;

function attendanceMonthKey(month: number, year: number): string {
  return `${year}-${month}`;
}

function getAttendanceCodeColor(code: string | null): string {
  switch (code) {
    case 'P':
      return 'bg-[#7B6AE6]/10 text-[#7B6AE6]';
    case 'L':
      return 'bg-amber-100/70 text-amber-800';
    case 'A':
      return 'bg-rose-100/60 text-rose-700';
    case 'H':
    case 'LV':
      return 'bg-emerald-100/70 text-emerald-800';
    case 'HO':
      return 'bg-blue-50 text-blue-500';
    case 'T':
      return 'bg-slate-100 text-slate-600 ring-1 ring-[#7B6AE6]/30';
    default:
      return 'bg-muted/40 text-muted-foreground';
  }
}

// ============================================================================
// FORM SCHEMAS
// ============================================================================

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  preferredName: z.string().nullable().optional(),
  dateOfBirth: z
    .string()
    .nullable()
    .optional()
    .refine((value) => !value || isValidEmployeeDateOfBirth(value), {
      message: `Date of birth must be in the past and the employee must be at least ${MIN_EMPLOYEE_AGE} years old`,
    }),
  gender: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  cnic: z.string().nullable().optional(),
  personalEmail: z.string().email('Invalid email').nullable().optional(),
  personalPhone: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactRelation: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  homeAddress: z.string().nullable().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const employmentSchema = z
  .object({
    department: z.string().nullable().optional(),
    designation: z.string().nullable().optional(),
    grade: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    employeeType: z.string().nullable().optional(),
    contractType: z.string().nullable().optional(),
    employmentStatus: z.string().min(1, 'Employment status is required'),
    joiningDate: z
      .string()
      .nullable()
      .optional()
      .refine((value) => !value || isValidJoiningDate(value), {
        message: 'Join date cannot be in the future',
      }),
    probationEnd: z.string().nullable().optional(),
    managerId: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.joiningDate && data.probationEnd && !isProbationEndAfterJoinDate(data.joiningDate, data.probationEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['probationEnd'],
        message: 'Probation end must be after join date',
      });
    }
  });

type EmploymentFormValues = z.infer<typeof employmentSchema>;

interface EnumOption {
  value: string;
  label: string;
}

interface EmploymentFieldOptions {
  departments: EnumOption[];
  employmentStatuses: EnumOption[];
  contractTypes: string[];
  employeeTypes: string[];
}

interface ManagerOption {
  id: string;
  name: string;
  designation: string | null;
  department: string | null;
}

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
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  };
}

function employeeToEmploymentFormValues(employee: {
  department?: string | null;
  designation?: string | null;
  grade?: string | null;
  location?: string | null;
  employeeType?: string | null;
  contractType?: string | null;
  employmentStatus?: string | null;
  joiningDate?: string | Date | null;
  probationEnd?: string | Date | null;
  managerId?: string | null;
}): EmploymentFormValues {
  return {
    department: employee.department || '',
    designation: employee.designation || '',
    grade: employee.grade || '',
    location: employee.location || '',
    employeeType: employee.employeeType || '',
    contractType: employee.contractType || '',
    employmentStatus: employee.employmentStatus || 'ACTIVE',
    joiningDate: toDateInputValue(employee.joiningDate),
    probationEnd: toDateInputValue(employee.probationEnd),
    managerId: employee.managerId || '',
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

function buildEmploymentPayload(values: EmploymentFormValues) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (value === '') return [key, null];
      if (key === 'joiningDate' || key === 'probationEnd') {
        return [key, toApiDateValue(value as string)];
      }
      return [key, value];
    }),
  );
}

function formatDepartmentLabel(department?: string | null): string {
  if (!department) return 'Unassigned';
  return department.replace(/ dept$/i, '').trim();
}

function formatDepartmentDisplayName(department?: string | null): string {
  const raw = formatDepartmentLabel(department);
  if (raw === 'Unassigned') return raw;
  return raw
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function departmentDirectoryParam(department?: string | null): string {
  return formatDepartmentLabel(department);
}

function displayOrDash(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '—';
}

function ProfileErrorView({
  title,
  description,
  backHref,
  backLabel,
}: {
  title: string;
  description: string;
  backHref: string;
  backLabel: string;
}) {
  return (
    <div className="bg-[#f8f9fa] min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      <Link href={backHref} className="text-primary hover:underline font-medium">{backLabel}</Link>
    </div>
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
  const [canEditProfile, setCanEditProfile] = useState(false);

  const employeesDirectoryHref = '/hr/employees';
  const employeesDirectoryLabel = 'Employees';

  const [activeTab, setActiveTab] = useState("Personal");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<ProfileLoadError | null>(null);
  
  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isEditEmploymentOpen, setIsEditEmploymentOpen] = useState(false);
  const [isSkillsManagerOpen, setIsSkillsManagerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employmentSubmitting, setEmploymentSubmitting] = useState(false);
  const [employmentOptionsLoading, setEmploymentOptionsLoading] = useState(false);
  const [skillSubmitting, setSkillSubmitting] = useState(false);

  // Forms
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '', lastName: '', preferredName: '', dateOfBirth: '', gender: '',
      nationality: '', cnic: '', personalEmail: '', personalPhone: '', phone: '',
      emergencyContactName: '', emergencyContactRelation: '', emergencyContactPhone: '',
      homeAddress: '',
    }
  });

  const employmentForm = useForm<EmploymentFormValues>({
    resolver: zodResolver(employmentSchema),
    defaultValues: {
      department: '', designation: '', grade: '', location: '',
      employeeType: '', contractType: '', employmentStatus: 'ACTIVE',
      joiningDate: '', probationEnd: '', managerId: '',
    },
  });

  const watchedJoiningDate = employmentForm.watch('joiningDate');

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

  const [officeAccess, setOfficeAccess] = useState<{
    details: { label: string; value: string }[];
    activeModules: string[];
  } | null>(null);

  const [employmentFieldOptions, setEmploymentFieldOptions] = useState<EmploymentFieldOptions | null>(null);
  const [managerOptions, setManagerOptions] = useState<ManagerOption[]>([]);

  const [skillsData, setSkillsData] = useState<{
    tags: string[]; progress: { skill: string; percentage: number }[];
  } | null>(null);

  // Raw skills for CRUD in the Skills Manager dialog
  const [rawSkills, setRawSkills] = useState<{ id: string; skillName: string; percentage: number | null }[]>([]);
  const profileFormDefaultsRef = useRef<ProfileFormValues | null>(null);
  const employmentFormDefaultsRef = useRef<EmploymentFormValues | null>(null);

  const [payslipsYear, setPayslipsYear] = useState(new Date().getFullYear());
  const [payslipYearOptions, setPayslipYearOptions] = useState<number[]>(() => {
    const currentYear = new Date().getFullYear();
    return [currentYear, currentYear - 1, currentYear - 2];
  });
  const [payslipsData, setPayslipsData] = useState<PayslipsApiData | null>(null);
  const [payslipsLoading, setPayslipsLoading] = useState(false);
  const [downloadingPayslipId, setDownloadingPayslipId] = useState<string | null>(null);

  const now = new Date();
  const [attendanceMonth, setAttendanceMonth] = useState({
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  });
  const [attendanceMonthOptions, setAttendanceMonthOptions] = useState<AttendanceMonthOption[]>(() => [
    {
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      label: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    },
  ]);
  const [attendanceData, setAttendanceData] = useState<AttendanceApiData | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceExporting, setAttendanceExporting] = useState(false);

  const fetchPayslips = useCallback(async (year: number) => {
    if (!idParam) return;

    try {
      setPayslipsLoading(true);
      const { default: apiClient } = await import('@/lib/api-client');
      const response = await apiClient.get(`/employees/${idParam}/payslips`, { params: { year } });
      const data = response.data.data as PayslipsApiData;
      setPayslipsData(data);
      setPayslipsYear(data.selectedYear);
      if (data.availableYears.length > 0) {
        setPayslipYearOptions(data.availableYears);
      }
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

  const fetchAttendance = useCallback(async (month: number, year: number) => {
    if (!idParam) return;

    try {
      setAttendanceLoading(true);
      setAttendanceData(null);
      const { default: apiClient } = await import('@/lib/api-client');
      const response = await apiClient.get(`/employees/${idParam}/attendance`, { params: { month, year } });
      const data = response.data.data as AttendanceApiData;
      setAttendanceData(data);
      setAttendanceMonth({
        month: data.selectedMonth.month,
        year: data.selectedMonth.year,
      });
      if (data.availableMonths.length > 0) {
        setAttendanceMonthOptions(data.availableMonths);
      }
    } catch (error) {
      console.error('Failed to load attendance logs:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to load attendance',
        description: 'Could not fetch attendance logs. Please try again.',
      });
    } finally {
      setAttendanceLoading(false);
    }
  }, [idParam, toast]);

  const handleAttendanceExport = async () => {
    if (!idParam) return;

    try {
      setAttendanceExporting(true);
      const { default: apiClient } = await import('@/lib/api-client');
      const response = await apiClient.get(`/employees/${idParam}/attendance/export`, {
        params: { month: attendanceMonth.month, year: attendanceMonth.year },
        responseType: 'blob',
      });
      const disposition = response.headers['content-disposition'] as string | undefined;
      const filenameMatch = disposition?.match(/filename="([^"]+)"/);
      const filename =
        filenameMatch?.[1]
        ?? `attendance-${attendanceMonth.year}-${String(attendanceMonth.month).padStart(2, '0')}.csv`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export attendance:', error);
      toast({
        variant: 'destructive',
        title: 'Export failed',
        description: 'Could not download the attendance CSV. Please try again.',
      });
    } finally {
      setAttendanceExporting(false);
    }
  };

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
      setLoadError('missing_id');
      setEmployeeHeaderData(null);
      setIsLoading(false);
      return;
    }

    try {
      if (!options?.silent) {
        setIsLoading(true);
      }
      setLoadError(null);
      const { default: apiClient } = await import('@/lib/api-client');
      const response = await apiClient.get(`/employees/${idParam}`);
      const data = response.data.data;
      setCanEditProfile(response.data.canEdit === true);

      setEmployeeHeaderData(data.headerData);
      setPersonalInformation(data.personalInformation);
      setEmploymentSnapshot(data.employmentSnapshot);
      setOfficeAccess(data.officeAccess ?? null);
      setSkillsData(data.skillsData);
      setRawSkills(data.skills || []);
      profileFormDefaultsRef.current = employeeToProfileFormValues(data.employee);
      employmentFormDefaultsRef.current = employeeToEmploymentFormValues(data.employee);
    } catch (error) {
      console.error('Failed to load employee profile:', error);
      setEmployeeHeaderData(null);
      setPersonalInformation(null);
      setEmploymentSnapshot(null);
      setOfficeAccess(null);
      setSkillsData(null);
      setRawSkills([]);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          setLoadError('forbidden');
        } else if (error.response?.status === 404) {
          setLoadError('not_found');
        } else {
          setLoadError('network');
        }
      } else {
        setLoadError('network');
      }

      if (!options?.silent) {
        toast({
          variant: 'destructive',
          title: 'Failed to load profile',
          description: axios.isAxiosError(error) && error.response?.status === 403
            ? 'You do not have permission to view this employee profile.'
            : 'Could not fetch employee data. Please try again.',
        });
      }
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

  useEffect(() => {
    if (activeTab === 'Attendance logs' && idParam) {
      fetchAttendance(attendanceMonth.month, attendanceMonth.year);
    }
    // Refetch only when opening the tab or switching employees
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, idParam]);

  const handlePayslipsYearChange = (year: number) => {
    setPayslipsYear(year);
    fetchPayslips(year);
  };

  const handleAttendanceMonthChange = (monthKey: string) => {
    const [year, month] = monthKey.split('-').map(Number);
    if (!month || !year) {
      toast({
        variant: 'destructive',
        title: 'Invalid month selection',
        description: 'Could not parse the selected month. Please try again.',
      });
      return;
    }
    setAttendanceMonth({ month, year });
    fetchAttendance(month, year);
  };

  const openEditProfile = () => {
    if (profileFormDefaultsRef.current) {
      profileForm.reset(profileFormDefaultsRef.current);
    }
    setIsEditProfileOpen(true);
  };

  const openEditEmployment = async () => {
    if (!idParam) return;

    try {
      setEmploymentOptionsLoading(true);
      const { default: apiClient } = await import('@/lib/api-client');
      const [optionsRes, managersRes] = await Promise.all([
        apiClient.get('/employees/employment-options'),
        apiClient.get('/employees/manager-options', { params: { excludeId: idParam } }),
      ]);
      setEmploymentFieldOptions(optionsRes.data.data as EmploymentFieldOptions);
      setManagerOptions(managersRes.data.data as ManagerOption[]);
      if (employmentFormDefaultsRef.current) {
        employmentForm.reset(employmentFormDefaultsRef.current);
      }
      setIsEditEmploymentOpen(true);
    } catch (error) {
      console.error('Failed to load employment editor options', error);
      toast({
        variant: 'destructive',
        title: 'Could not open employment editor',
        description: 'Failed to load employment field options. Please try again.',
      });
    } finally {
      setEmploymentOptionsLoading(false);
    }
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

  const onEmploymentSubmit = async (values: EmploymentFormValues) => {
    if (!idParam) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'Employee ID is missing from the page URL.',
      });
      return;
    }

    try {
      setEmploymentSubmitting(true);
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.put(`/employees/${idParam}/employment`, buildEmploymentPayload(values));
      await fetchEmployeeData({ silent: true });
      setIsEditEmploymentOpen(false);
      toast({ title: 'Employment updated', description: 'Employment details were saved successfully.' });
    } catch (error) {
      console.error('Failed to update employment', error);
      let description = 'Could not save employment details. Please try again.';
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          description = 'You do not have permission to edit employment details.';
        } else if (error.response?.data?.error) {
          description = String(error.response.data.error);
        }
      }
      toast({ variant: 'destructive', title: 'Save failed', description });
    } finally {
      setEmploymentSubmitting(false);
    }
  };

  const onEmploymentSubmitError = () => {
    toast({
      variant: 'destructive',
      title: 'Please fix the form errors',
      description: 'Check the highlighted fields and try again.',
    });
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

  if (loadError === 'missing_id') {
    return (
      <ProfileErrorView
        title="Employee ID required"
        description="Open an employee profile from the directory or manager dashboard so the page URL includes an employee id."
        backHref={employeesDirectoryHref}
        backLabel={`Return to ${employeesDirectoryLabel}`}
      />
    );
  }

  if (loadError === 'forbidden') {
    return (
      <ProfileErrorView
        title="Access denied"
        description="You do not have permission to view this employee profile."
        backHref={employeesDirectoryHref}
        backLabel={`Return to ${employeesDirectoryLabel}`}
      />
    );
  }

  if (loadError === 'not_found') {
    return (
      <ProfileErrorView
        title="Employee not found"
        description="The employee record you are looking for does not exist or has been removed."
        backHref={employeesDirectoryHref}
        backLabel={`Return to ${employeesDirectoryLabel}`}
      />
    );
  }

  if (loadError === 'network' || !employeeHeaderData) {
    return (
      <ProfileErrorView
        title="Failed to load profile"
        description="Could not fetch employee data. Please try again from the directory."
        backHref={employeesDirectoryHref}
        backLabel={`Return to ${employeesDirectoryLabel}`}
      />
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

  const attendanceRowCount = attendanceData?.rows.length ?? 0;
  const attendanceTableScrollable = attendanceRowCount > MAX_VISIBLE_ATTENDANCE_ROWS;
  const attendanceTableMaxHeight =
    ATTENDANCE_TABLE_HEADER_PX + ATTENDANCE_TABLE_ROW_PX * MAX_VISIBLE_ATTENDANCE_ROWS;

  const selectedAttendanceMonthKey = attendanceMonthKey(attendanceMonth.month, attendanceMonth.year);
  const attendanceMonthSelectOptions = attendanceMonthOptions.some(
    (option) => attendanceMonthKey(option.month, option.year) === selectedAttendanceMonthKey,
  )
    ? attendanceMonthOptions
    : [
        {
          month: attendanceMonth.month,
          year: attendanceMonth.year,
          label: attendanceData?.selectedMonth.label
            ?? new Date(attendanceMonth.year, attendanceMonth.month - 1, 1).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            }),
        },
        ...attendanceMonthOptions,
      ];

  const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const departmentBreadcrumbLabel = formatDepartmentDisplayName(employeeHeaderData?.department);
  const departmentBreadcrumbHref = `${employeesDirectoryHref}?department=${encodeURIComponent(
    departmentDirectoryParam(employeeHeaderData?.department),
  )}`;

  return (
    <div className="bg-[#f8f9fa] text-foreground min-h-screen">
      <div className="max-w-[1400px] mx-auto px-4 md:px-6 pb-8 pt-2">

        {/* ==========================================
            COMPONENT 0: BREADCRUMB & ACTIONS PANEL
           ========================================== */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1 pb-2 mb-6">
          <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
            <Link href={employeesDirectoryHref} className="text-muted-foreground hover:text-foreground cursor-pointer">{employeesDirectoryLabel}</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <Link href={departmentBreadcrumbHref} className="text-muted-foreground hover:text-foreground cursor-pointer">{departmentBreadcrumbLabel}</Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground/60" />
            <span className="text-foreground font-bold">{employeeHeaderData.name}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {canEditProfile && (
              <>
              <button 
                onClick={openEditProfile}
                className="px-4 py-2 border border-border text-xs font-bold text-foreground bg-card hover:bg-muted/50 rounded-[var(--radius)] transition-colors shadow-sm"
              >
                Edit profile
              </button>
              <button
                onClick={openEditEmployment}
                disabled={employmentOptionsLoading}
                className="px-4 py-2 border border-border text-xs font-bold text-foreground bg-card hover:bg-muted/50 rounded-[var(--radius)] transition-colors shadow-sm disabled:opacity-50"
              >
                {employmentOptionsLoading ? 'Loading…' : 'Edit employment'}
              </button>
              </>
            )}
            <button
              onClick={async () => {
                try {
                  const { default: apiClient } = await import('@/lib/api-client');
                  const response = await apiClient.get(`/employees/${idParam}/letter`, {
                    responseType: 'blob',
                  });
                  const blob = new Blob([response.data], { type: 'application/pdf' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `HR_Letter_${employeeHeaderData.name?.replace(/\s+/g, '_') || 'Employee'}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                  toast({ title: 'HR Letter Downloaded', description: 'Experience certificate has been generated.' });
                } catch (error) {
                  let description = 'Could not generate the HR letter. Please try again.';
                  if (axios.isAxiosError(error)) {
                    if (error.response?.status === 403) {
                      description = 'You do not have permission to download this letter.';
                    } else if (error.response?.status === 404) {
                      description = 'Employee record not found. The letter cannot be generated.';
                    }
                  }
                  toast({
                    variant: 'destructive',
                    title: 'Download failed',
                    description,
                  });
                }
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
                      <td className="text-foreground font-semibold">{displayOrDash(formatDepartmentLabel(employeeHeaderData.department))}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Location:</td>
                      <td className="text-foreground font-semibold">{displayOrDash(employeeHeaderData.location)}</td>
                    </tr>
                    <tr>
                      <td className="text-muted-foreground pr-6 whitespace-nowrap">Contract:</td>
                      <td className="text-foreground font-semibold">{displayOrDash(employeeHeaderData.contractType)}</td>
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
                  disabled={payslipsLoading}
                  className="appearance-none bg-white border border-border rounded-[var(--radius)] pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground shadow-sm focus:outline-none cursor-pointer disabled:opacity-50"
                >
                  {(payslipYearOptions.includes(payslipsYear)
                    ? payslipYearOptions
                    : [payslipsYear, ...payslipYearOptions]
                  ).map((year) => (
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
          <div className="space-y-6">
            <div className="bg-white text-card-foreground border border-border rounded-[var(--radius)] overflow-hidden shadow-sm flex flex-col">
              <div className="p-6 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Attendance logs · {attendanceData?.selectedMonth.label ?? attendanceMonthSelectOptions.find(
                    (option) => attendanceMonthKey(option.month, option.year) === selectedAttendanceMonthKey,
                  )?.label ?? '—'}
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select
                      className="appearance-none bg-white border border-border rounded-[var(--radius)] pl-3 pr-8 py-1.5 text-xs font-semibold text-foreground shadow-sm focus:outline-none cursor-pointer"
                      value={selectedAttendanceMonthKey}
                      onChange={(e) => handleAttendanceMonthChange(e.target.value)}
                      disabled={attendanceLoading}
                    >
                      {attendanceMonthSelectOptions.map((option) => (
                        <option
                          key={attendanceMonthKey(option.month, option.year)}
                          value={attendanceMonthKey(option.month, option.year)}
                        >
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-2.5 top-2.5 pointer-events-none" />
                  </div>
                  <button
                    type="button"
                    onClick={handleAttendanceExport}
                    disabled={attendanceLoading || attendanceExporting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-[var(--radius)] text-xs font-bold bg-white hover:bg-muted/50 transition-colors text-foreground shadow-sm disabled:opacity-50"
                  >
                    {attendanceExporting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    Export
                  </button>
                </div>
              </div>

              {attendanceLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <>
                  <div className="px-6 pb-6">
                    <div className="border border-border rounded-[var(--radius)] p-4 bg-white shadow-none">
                      <div className="overflow-x-auto no-scrollbar">
                        <div className="min-w-[700px] space-y-2">
                          <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-muted-foreground pb-1">
                            {weekdayLabels.map((label) => (
                              <div key={label}>{label}</div>
                            ))}
                          </div>

                          {(attendanceData?.calendar.weeks ?? []).map((week, wIdx) => (
                            <div key={wIdx} className="grid grid-cols-7 gap-2">
                              {week.map((cell, dIdx) => {
                                if (!cell.day) {
                                  return <div key={dIdx} className="h-10" />;
                                }

                                return (
                                  <div
                                    key={dIdx}
                                    className={`h-10 rounded-[var(--radius)] flex flex-col items-center justify-center text-[10px] font-bold leading-tight ${getAttendanceCodeColor(cell.code)}`}
                                    title={cell.label ? `${cell.day} — ${cell.label}` : cell.day ? String(cell.day) : undefined}
                                  >
                                    {cell.code ? (
                                      <>
                                        <span className="text-[9px] font-medium opacity-70">{cell.day}</span>
                                        <span>{cell.code}</span>
                                      </>
                                    ) : cell.day ? (
                                      <span className="text-[11px] font-medium text-muted-foreground/80">{cell.day}</span>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-4 mt-3 border-t border-border text-[11px] font-semibold text-muted-foreground">
                        {(attendanceData?.calendar.legend ?? []).map((item) => (
                          <div key={item.label} className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded inline-block"
                              style={{ backgroundColor: `${item.color}33` }}
                            />
                            {item.label} {item.count}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`overflow-x-auto w-full ${attendanceTableScrollable ? 'overflow-y-auto custom-scrollbar' : ''}`}
                    style={attendanceTableScrollable ? { maxHeight: attendanceTableMaxHeight } : undefined}
                  >
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-t border-b border-border text-muted-foreground font-bold bg-white ${attendanceTableScrollable ? 'sticky top-0 z-10' : ''}`}>
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
                        {attendanceData?.rows.length ? (
                          attendanceData.rows.map((row) => (
                            <tr
                              key={row.id}
                              className="border-b last:border-0 border-border bg-white hover:bg-muted/10 transition-colors"
                            >
                              <td className="px-6 py-3.5 font-bold text-foreground">{row.date}</td>
                              <td className="px-6 py-3.5 font-medium text-muted-foreground">{row.day}</td>
                              <td className={`px-6 py-3.5 font-semibold ${row.textColor || 'text-foreground'}`}>
                                {row.checkIn}
                              </td>
                              <td className="px-6 py-3.5 font-semibold text-foreground">{row.checkOut}</td>
                              <td className="px-6 py-3.5 font-bold text-foreground">{row.total}</td>
                              <td
                                className={`px-6 py-3.5 font-bold ${
                                  row.ot !== '0 hrs' ? 'text-[#7B6AE6]' : 'text-muted-foreground'
                                }`}
                              >
                                {row.ot}
                              </td>
                              <td className="px-6 py-3.5">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.color}`}>
                                  {row.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                              No attendance records for {attendanceData?.selectedMonth.label ?? 'this month'}.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            <div className="bg-white border border-border rounded-[var(--radius)] px-6 py-4 flex flex-row justify-between items-center text-xs font-bold shadow-sm">
              <span className="text-muted-foreground font-medium">
                Monthly summary:{' '}
                <span className="text-foreground font-bold">{attendanceData?.summary.totalHours ?? '0 hrs'}</span>
                {' · '}
                <span className="text-foreground font-bold">{attendanceData?.summary.overtimeHours ?? '0 hrs'} OT</span>
                {' · '}
                <span className="text-foreground font-bold">
                  {attendanceData?.summary.attendancePercentage ?? '—'}% attendance
                </span>
              </span>
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
                  {canEditProfile && (
                    <button 
                      onClick={() => setIsSkillsManagerOpen(true)}
                      className="text-muted-foreground/70 hover:text-foreground p-1 transition-colors border border-border rounded bg-muted/20" aria-label="Modify Matrix"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
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
                        <div className="flex items-center justify-between gap-3">
                          <span>Employment snapshot</span>
                          {canEditProfile && (
                            <button
                              type="button"
                              onClick={openEditEmployment}
                              disabled={employmentOptionsLoading}
                              className="text-muted-foreground/70 hover:text-foreground p-1 transition-colors border border-border rounded bg-muted/20 disabled:opacity-50"
                              aria-label="Edit employment"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
                  {officeAccess?.details.map((detail, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs pb-2 border-b last:border-0 border-dashed border-border/70">
                      <span className="font-medium text-muted-foreground tracking-tight">{detail.label}</span>
                      <span className="font-bold text-foreground tracking-tight">{detail.value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <span className="block text-xs font-bold text-muted-foreground tracking-tight">Active Modules</span>
                  <div className="flex flex-wrap gap-1.5">
                    {officeAccess?.activeModules.map((mod, idx) => (
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
        {canEditProfile && (
          <>
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
                    <Input
                      type="date"
                      max={getMaxDateOfBirth()}
                      {...profileForm.register('dateOfBirth')}
                      className="text-sm"
                    />
                    {profileForm.formState.errors.dateOfBirth && (
                      <p className="text-xs text-red-500">{profileForm.formState.errors.dateOfBirth.message}</p>
                    )}
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

        <Sheet open={isEditEmploymentOpen} onOpenChange={setIsEditEmploymentOpen}>
          <SheetContent className="overflow-y-auto w-full sm:max-w-xl">
            <SheetHeader className="mb-6">
              <SheetTitle>Edit Employment Details</SheetTitle>
            </SheetHeader>
            <form onSubmit={employmentForm.handleSubmit(onEmploymentSubmit, onEmploymentSubmitError)} className="space-y-6">
              <div className="rounded-md border border-border bg-muted/20 px-4 py-3 text-xs text-muted-foreground">
                Employee ID is assigned by the system and cannot be changed here. You can update the line manager and other employment fields below.
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground tracking-tight border-b pb-2">Role & organization</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Department</Label>
                    <select {...employmentForm.register('department')} className={selectFieldClassName}>
                      <option value="">Unassigned</option>
                      {employmentFieldOptions?.departments.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Designation</Label>
                    <Input {...employmentForm.register('designation')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Grade</Label>
                    <Input {...employmentForm.register('grade')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Location</Label>
                    <Input {...employmentForm.register('location')} className="text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Employment Status</Label>
                    <select {...employmentForm.register('employmentStatus')} className={selectFieldClassName}>
                      {employmentFieldOptions?.employmentStatuses.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    {employmentForm.formState.errors.employmentStatus && (
                      <p className="text-xs text-red-500">{employmentForm.formState.errors.employmentStatus.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Work Mode</Label>
                    <Input
                      {...employmentForm.register('employeeType')}
                      list="employee-type-options"
                      className="text-sm"
                      placeholder="e.g. Hybrid, Remote, Onsite"
                    />
                    <datalist id="employee-type-options">
                      {employmentFieldOptions?.employeeTypes.map((value) => (
                        <option key={value} value={value} />
                      ))}
                    </datalist>
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Contract Type</Label>
                    <Input
                      {...employmentForm.register('contractType')}
                      list="contract-type-options"
                      className="text-sm"
                      placeholder="e.g. Permanent, Contract"
                    />
                    <datalist id="contract-type-options">
                      {employmentFieldOptions?.contractTypes.map((value) => (
                        <option key={value} value={value} />
                      ))}
                    </datalist>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground tracking-tight border-b pb-2">Dates & reporting</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Join Date</Label>
                    <Input
                      type="date"
                      max={getMaxJoinDate()}
                      {...employmentForm.register('joiningDate')}
                      className="text-sm"
                    />
                    {employmentForm.formState.errors.joiningDate && (
                      <p className="text-xs text-red-500">{employmentForm.formState.errors.joiningDate.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Probation End</Label>
                    <Input
                      type="date"
                      min={watchedJoiningDate ? getMinProbationEndDate(watchedJoiningDate) : undefined}
                      {...employmentForm.register('probationEnd')}
                      className="text-sm"
                    />
                    {employmentForm.formState.errors.probationEnd && (
                      <p className="text-xs text-red-500">{employmentForm.formState.errors.probationEnd.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 col-span-2">
                    <Label className="text-xs">Line Manager</Label>
                    <select {...employmentForm.register('managerId')} className={selectFieldClassName}>
                      <option value="">No line manager</option>
                      {managerOptions.map((manager) => (
                        <option key={manager.id} value={manager.id}>
                          {manager.name}
                          {manager.designation ? ` · ${manager.designation}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-6 pb-8 border-t flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsEditEmploymentOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={employmentSubmitting} className="bg-[#7B6AE6] hover:bg-[#6959cf] text-white font-bold">
                  {employmentSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Save Employment
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
          </>
        )}

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