"use client";

import React, { useState, Suspense } from 'react';
import { ChevronDown, ChevronUp, UserPlus, Users, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// --- Interfaces for Mock Data ---
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

// --- Mock Data ---
// Tip: Set this to `[]` to test the empty state fallback!
const mockData: Department[] = [
  {
    id: 'dept1',
    name: 'Engineering',
    employeeCount: 3,
    employees: [
      {
        id: 'emp1',
        name: 'Ali Hassan',
        role: 'Frontend Dev',
        email: 'ali.hassan@company.com',
        initials: 'AH',
        avatarBgColor: 'bg-blue-100 text-blue-700',
      },
      {
        id: 'emp2',
        name: 'Sara Khan',
        role: 'Backend Dev',
        email: 'sara.khan@company.com',
        initials: 'SK',
        avatarBgColor: 'bg-pink-100 text-pink-700',
      },
      {
        id: 'emp3',
        name: 'Usman Tariq',
        role: 'DevOps',
        email: 'usman.tariq@company.com',
        initials: 'UT',
        avatarBgColor: 'bg-indigo-100 text-indigo-700',
      },
    ],
  },
  {
    id: 'dept2',
    name: 'Design',
    employeeCount: 2,
    employees: [
      {
        id: 'emp4',
        name: 'Jane Doe',
        role: 'UI/UX Designer',
        email: 'jane.doe@company.com',
        initials: 'JD',
        avatarBgColor: 'bg-teal-100 text-teal-700',
      },
      {
        id: 'emp5',
        name: 'John Smith',
        role: 'Visual Designer',
        email: 'john.smith@company.com',
        initials: 'JS',
        avatarBgColor: 'bg-orange-100 text-orange-700',
      },
    ],
  },
  {
    id: 'dept3',
    name: 'HR',
    employeeCount: 2,
    employees: [
      {
        id: 'emp6',
        name: 'Alice Johnson',
        role: 'HR Manager',
        email: 'alice.johnson@company.com',
        initials: 'AJ',
        avatarBgColor: 'bg-green-100 text-green-700',
      },
      {
        id: 'emp7',
        name: 'Bob Brown',
        role: 'Recruiter',
        email: 'bob.brown@company.com',
        initials: 'BB',
        avatarBgColor: 'bg-red-100 text-red-700',
      },
    ],
  },
];

// --- Inner Content Component (reads search params) ---
function EmployeesContent() {
  const searchParams = useSearchParams();
  const departmentParam = searchParams.get('department');

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    if (departmentParam) {
      const matchingDept = mockData.find(
        (d) => d.name.toLowerCase() === departmentParam.toLowerCase()
      );
      if (matchingDept) return { [matchingDept.id]: true };
    }
    return { dept1: true };
  });

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
        {mockData.length === 0 ? (
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
            {mockData.map((department) => {
              const isExpanded = expandedSections[department.id];
              return (
                <div
                  key={department.id}
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
                        {department.name}
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
                        <div
                          key={employee.id}
                          className={`flex items-center justify-between gap-4 px-6 py-4 hover:bg-muted/10 transition-colors ${
                            index < department.employees.length - 1 ? 'border-b border-border/40' : ''
                          }`}
                        >
                          {/* Left: Avatar, Name, Role */}
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[15px] font-bold tracking-wide ${employee.avatarBgColor}`}>
                              {employee.initials}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[15px] font-semibold text-foreground">
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
                        </div>
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