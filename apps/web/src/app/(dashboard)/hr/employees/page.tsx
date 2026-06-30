"use client";

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { ChevronDown, ChevronUp, UserPlus, Users, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// --- Interfaces for Data ---
interface BackendEmployee {
  id: string;
  firstName: string;
  lastName: string;
  designation: string;
  department: string | null;
  user: { email: string };
}

interface Employee {
  id: string;
  name: string;
  role: string;
  email: string;
  initials: string;
  avatarBgColor: string;
}

interface Department {
  id: string;
  name: string;
  employeeCount: number;
  employees: Employee[];
}

// Generate random bg colors for avatars to match the mock behavior
const bgColors = [
  'bg-blue-100 text-blue-700',
  'bg-pink-100 text-pink-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
  'bg-orange-100 text-orange-700',
  'bg-green-100 text-green-700',
  'bg-red-100 text-red-700',
];

function getAvatarColor(id: string) {
  // Use a simple hash of the ID to consistently pick a color
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bgColors[Math.abs(hash) % bgColors.length];
}

function formatDepartmentDisplayName(department?: string | null): string {
  const raw = (department || 'Unassigned').replace(/ dept$/i, '').trim();
  if (raw === 'Unassigned') return raw;
  return raw
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}

function departmentMatchesParam(departmentName: string, param: string): boolean {
  const normalizedParam = param.trim().replace(/ dept$/i, '').replace(/\s+/g, '_');
  return (
    departmentName.toLowerCase() === normalizedParam.toLowerCase()
    || formatDepartmentDisplayName(departmentName).toLowerCase() === param.trim().toLowerCase()
  );
}

// --- Inner Content Component (reads search params) ---
function EmployeesContent() {
  const searchParams = useSearchParams();
  const departmentParam = searchParams.get('department');

  const [departmentsData, setDepartmentsData] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const { default: apiClient } = await import('@/lib/api-client');
        const res = await apiClient.get('/employees');
        const employeesList: BackendEmployee[] = res.data.data.employees;

        // Group by department
        const grouped = employeesList.reduce((acc, emp) => {
          const deptName = emp.department || 'Unassigned';
          if (!acc[deptName]) {
            acc[deptName] = [];
          }
          acc[deptName].push({
            id: emp.id,
            name: `${emp.firstName} ${emp.lastName}`,
            role: emp.designation || 'Employee',
            email: emp.user?.email || '',
            initials: (emp.firstName?.[0] || '') + (emp.lastName?.[0] || ''),
            avatarBgColor: getAvatarColor(emp.id),
          });
          return acc;
        }, {} as Record<string, Employee[]>);

        // Convert to array format matching old mock
        const mappedData: Department[] = Object.keys(grouped)
          .sort()
          .map((deptName) => ({
            id: `dept-${deptName.toLowerCase().replace(/\s+/g, '-')}`,
            name: deptName,
            employeeCount: grouped[deptName].length,
            employees: grouped[deptName],
          }));

        setDepartmentsData(mappedData);

        // Set initial expanded section based on search param or fallback to first
        let initialExpanded: Record<string, boolean> = {};
        if (departmentParam) {
          const matchingDept = mappedData.find((d) => departmentMatchesParam(d.name, departmentParam));
          if (matchingDept) {
            initialExpanded = { [matchingDept.id]: true };
          }
        } else if (mappedData.length > 0) {
          initialExpanded = { [mappedData[0].id]: true };
        }
        setExpandedSections(initialExpanded);

      } catch (error) {
        console.error('Failed to fetch employees', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, [departmentParam]);

  useEffect(() => {
    if (!departmentParam || isLoading) return;

    const matchingDept = departmentsData.find((d) => departmentMatchesParam(d.name, departmentParam));
    if (!matchingDept || !expandedSections[matchingDept.id]) return;

    sectionRefs.current[matchingDept.id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [departmentParam, departmentsData, expandedSections, isLoading]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="w-full font-sans">
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
            Employees
          </h1>
          <p className="mt-2 text-base text-muted-foreground font-medium">
            Manage your workforce directory
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-all">
          <UserPlus className="h-4 w-4" />
          Add Employee
        </button>
      </header>

      {/* Main Content Area */}
      <main className="w-full">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : departmentsData.length === 0 ? (
          /* --- Empty State Fallback --- */
          <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-background/50 px-6 py-16 text-center">
            <Users className="mb-4 h-12 w-12 text-muted-foreground/60" />
            <h3 className="text-xl font-bold text-foreground">No employees found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground font-medium">
              Add employees to build your organization&apos;s workforce directory.
            </p>
          </div>
        ) : (
          /* --- Populated State --- */
          <div className="space-y-5">
            {departmentsData.map((department) => {
              const isExpanded = expandedSections[department.id];
              return (
                <div
                  key={department.id}
                  ref={(node) => {
                    sectionRefs.current[department.id] = node;
                  }}
                  className="border border-border/80 rounded-xl bg-card shadow-sm overflow-hidden transition-all duration-200"
                >
                  {/* Department Header */}
                  <button
                    onClick={() => toggleSection(department.id)}
                    className="w-full flex items-center justify-between px-6 py-4 gap-3 bg-card hover:bg-muted/30 transition-colors focus:outline-none"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <h2 className="text-[17px] font-semibold text-foreground tracking-tight">
                        {formatDepartmentDisplayName(department.name)}
                      </h2>
                      <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-muted/80 px-2 text-xs font-semibold text-muted-foreground">
                        {department.employeeCount}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground/70 transition-transform" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground/70 transition-transform" />
                    )}
                  </button>

                  {/* Expandable Employee List */}
                  {isExpanded && (
                    <div className="border-t border-border/60 custom-scrollbar">
                      {department.employees.map((employee, index) => (
                        <a
                          key={employee.id}
                          href={`/employee/employee_profile_personal?id=${employee.id}`}
                          className={`flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/10 transition-colors cursor-pointer ${
                            index < department.employees.length - 1 ? 'border-b border-border/40' : ''
                          }`}
                        >
                          {/* Left: Avatar, Name, Role */}
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold tracking-wide ${employee.avatarBgColor}`}>
                              {employee.initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-semibold text-[#7B6AE6] hover:underline">
                                {employee.name}
                              </span>
                              <span className="text-[13.5px] text-muted-foreground mt-0.5">
                                {employee.role}
                              </span>
                            </div>
                          </div>

                          {/* Right: Email */}
                          <div className="text-[13.5px] text-muted-foreground hidden sm:block font-medium">
                            {employee.email}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

// --- Main Page Component (Suspense boundary for useSearchParams) ---
export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <EmployeesContent />
    </Suspense>
  );
}