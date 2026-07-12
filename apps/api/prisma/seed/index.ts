import { PrismaClient, Role, Department, Gender, EmploymentStatus, LeaveType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Antrosys@2026';

interface SeedUser {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  department: Department;
  designation?: string;
  gender: Gender;
  employeeCode?: string;
  preferredName?: string;
  nationality?: string;
  cnic?: string;
  personalEmail?: string;
  personalPhone?: string;
  emergencyContactName?: string;
  emergencyContactRelation?: string;
  emergencyContactPhone?: string;
  homeAddress?: string;
  grade?: string;
  employeeType?: string;
  location?: string;
  employmentStatus?: EmploymentStatus;
  socialHandle?: string;
  performanceScore?: number;
  kpiScore?: number;
  skills?: { name: string; percentage: number | null }[];
}

const seedUsers: SeedUser[] = [
  { email: 'ceo@antrosys.com', role: 'CEO', firstName: 'Chief', lastName: 'Executive', department: 'OTHER', designation: 'CEO', gender: 'MALE' },
  { email: 'cfo@antrosys.com', role: 'CFO', firstName: 'Chief', lastName: 'Financial', department: 'FINANCE', designation: 'CFO', gender: 'MALE' },
  { email: 'operations_head@antrosys.com', role: 'OPERATIONS_HEAD', firstName: 'Operations', lastName: 'Head', department: 'OPERATIONS', designation: 'Head of Operations', gender: 'MALE' },
  { email: 'hr_head@antrosys.com', role: 'HR_HEAD', firstName: 'HR', lastName: 'Head', department: 'HR', designation: 'Head of HR', gender: 'FEMALE' },
  { email: 'finance_manager@antrosys.com', role: 'FINANCE_MANAGER', firstName: 'Finance', lastName: 'Manager', department: 'FINANCE', designation: 'Finance Manager', gender: 'FEMALE' },
  { email: 'project_manager@antrosys.com', role: 'PROJECT_MANAGER', firstName: 'Project', lastName: 'Manager', department: 'OTHER', designation: 'Project Manager', gender: 'MALE' },
  { email: 'manager@antrosys.com', role: 'MANAGER', firstName: 'General', lastName: 'Manager', department: 'OPERATIONS', designation: 'General Manager', gender: 'MALE' },
  { email: 'sub_manager@antrosys.com', role: 'SUB_MANAGER', firstName: 'Sub', lastName: 'Manager', department: 'OPERATIONS', designation: 'Sub Manager', gender: 'MALE' },
  { email: 'team_lead@antrosys.com', role: 'TEAM_LEAD', firstName: 'Team', lastName: 'Lead', department: 'ENGINEERING', designation: 'Team Lead', gender: 'FEMALE' },

  {
    email: 'sara.javed@antrosys.com',
    role: 'EMPLOYEE',
    firstName: 'Sara',
    lastName: 'Javed',
    department: 'ENGINEERING',
    designation: 'Senior Engineer',
    gender: 'FEMALE',
    employeeCode: 'EMP-00142',
    preferredName: 'Sara',
    nationality: 'Pakistani',
    cnic: '61101-1234567-8',
    personalEmail: 'sara.j.95@gmail.com',
    personalPhone: '+92 321 7654321',
    emergencyContactName: 'Javed Khan',
    emergencyContactRelation: 'Father',
    emergencyContactPhone: '+92 333 1112233',
    homeAddress: 'House 42, Street 10, Sector F-8/4, Islamabad, Pakistan 44000',
    grade: 'L4',
    employeeType: 'Permanent',
    location: 'Islamabad HQ',
    employmentStatus: 'ACTIVE',
    socialHandle: '@sara.eng',
    performanceScore: 88,
    kpiScore: 72,
    skills: [
      { name: 'React', percentage: 90 },
      { name: 'TypeScript', percentage: 80 },
      { name: 'System Design', percentage: 70 },
      { name: 'Node.js', percentage: null },
      { name: 'AWS', percentage: null },
    ],
  },
  { email: 'fawad.khan@antrosys.com', role: 'EMPLOYEE', firstName: 'Fawad', lastName: 'Khan', department: 'ENGINEERING', designation: 'Backend Engineer', gender: 'MALE' },
  { email: 'bilal.hassan@antrosys.com', role: 'EMPLOYEE', firstName: 'Bilal', lastName: 'Hassan', department: 'OPERATIONS', designation: 'DevOps', gender: 'MALE' },
  { email: 'hina.baig@antrosys.com', role: 'EMPLOYEE', firstName: 'Hina', lastName: 'Baig', department: 'SALES', designation: 'Marketing Manager', gender: 'FEMALE' },
  { email: 'omar.mirza@antrosys.com', role: 'EMPLOYEE', firstName: 'Omar', lastName: 'Mirza', department: 'SALES', designation: 'Sales Executive', gender: 'MALE' },
  { email: 'maria.raza@antrosys.com', role: 'EMPLOYEE', firstName: 'Maria', lastName: 'Raza', department: 'OPERATIONS', designation: 'UX Design', gender: 'FEMALE' },
  { email: 'nadia.qureshi@antrosys.com', role: 'EMPLOYEE', firstName: 'Nadia', lastName: 'Qureshi', department: 'OPERATIONS', designation: 'Product', gender: 'FEMALE' },
];

function employeeProfileData(seedUser: SeedUser) {
  return {
    firstName: seedUser.firstName,
    lastName: seedUser.lastName,
    department: seedUser.department,
    gender: seedUser.gender,
    designation: seedUser.designation || 'Staff',
    employmentStatus: seedUser.employmentStatus ?? 'ACTIVE',
    employeeCode: seedUser.employeeCode,
    preferredName: seedUser.preferredName,
    nationality: seedUser.nationality,
    cnic: seedUser.cnic,
    personalEmail: seedUser.personalEmail,
    personalPhone: seedUser.personalPhone,
    emergencyContactName: seedUser.emergencyContactName,
    emergencyContactRelation: seedUser.emergencyContactRelation,
    emergencyContactPhone: seedUser.emergencyContactPhone,
    homeAddress: seedUser.homeAddress,
    grade: seedUser.grade,
    employeeType: seedUser.employeeType,
    location: seedUser.location,
    socialHandle: seedUser.socialHandle,
    performanceScore: seedUser.performanceScore,
    kpiScore: seedUser.kpiScore,
  };
}

async function main() {
  console.log('🌱 Starting seed...');

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  for (const seedUser of seedUsers) {
    const user = await prisma.user.upsert({
      where: { email: seedUser.email },
      update: {},
      create: {
        email: seedUser.email,
        passwordHash,
        role: seedUser.role,
        mfaEnabled: false,
        isActive: true,
      },
    });

    console.log(`✅ Created user: ${user.email} (${user.role})`);

    const profile = employeeProfileData(seedUser);
    const empRecord = await prisma.employee.upsert({
      where: { userId: user.id },
      update: profile,
      create: {
        userId: user.id,
        ...profile,
        joiningDate: new Date('2024-01-01'),
        isActive: true,
      },
    });
    console.log(`  📋 Created employee record for ${seedUser.email}`);

    if (seedUser.skills && seedUser.skills.length > 0) {
      for (const skill of seedUser.skills) {
        const existing = await prisma.employeeSkill.findFirst({
          where: { employeeId: empRecord.id, skillName: skill.name },
        });
        if (!existing) {
          await prisma.employeeSkill.create({
            data: {
              employeeId: empRecord.id,
              skillName: skill.name,
              percentage: skill.percentage,
            },
          });
        }
      }
      console.log(`  🛠️ Seeded ${seedUser.skills.length} skills for ${seedUser.email}`);
    }
  }

  console.log('🔗 Connecting management hierarchy and teams...');
  const mainManager = await prisma.employee.findFirst({
    where: { user: { email: 'manager@antrosys.com' } },
  });
  const subManager = await prisma.employee.findFirst({
    where: { user: { email: 'sub_manager@antrosys.com' } },
  });
  const teamLead = await prisma.employee.findFirst({
    where: { user: { email: 'team_lead@antrosys.com' } },
  });

  if (mainManager && subManager && teamLead) {
    // Create per-department teams with their respective managers
    const operationsTeam = await prisma.team.upsert({
      where: { managerId: subManager.id },
      update: { name: 'Operations Team', department: 'OPERATIONS' },
      create: { name: 'Operations Team', department: 'OPERATIONS', managerId: subManager.id },
    });

    const engineeringTeam = await prisma.team.upsert({
      where: { managerId: teamLead.id },
      update: { name: 'Engineering Team', department: 'ENGINEERING' },
      create: { name: 'Engineering Team', department: 'ENGINEERING', managerId: teamLead.id },
    });

    // Set up management chain: team_lead -> sub_manager -> main_manager
    await prisma.employee.update({
      where: { id: subManager.id },
      data: { managerId: mainManager.id, teamId: operationsTeam.id },
    });
    await prisma.employee.update({
      where: { id: teamLead.id },
      data: { managerId: subManager.id, teamId: engineeringTeam.id },
    });

    // Auto-assign all EMPLOYEE role users to the team matching their department
    const departmentTeamMap: Record<string, { teamId: string; managerId: string }> = {};
    departmentTeamMap['OPERATIONS'] = { teamId: operationsTeam.id, managerId: subManager.id };
    departmentTeamMap['ENGINEERING'] = { teamId: engineeringTeam.id, managerId: teamLead.id };

    const allEmployees = await prisma.employee.findMany({
      where: {
        user: { role: 'EMPLOYEE' },
        NOT: { id: { in: [mainManager.id, subManager.id, teamLead.id] } },
      },
      include: { user: { select: { email: true } } },
    });

    for (const emp of allEmployees) {
      const assignment = emp.department ? departmentTeamMap[emp.department] : null;
      if (assignment) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { managerId: assignment.managerId, teamId: assignment.teamId },
        });
      } else {
        // No team exists for this department (SALES, FINANCE, HR, etc.) — report to mainManager
        await prisma.employee.update({
          where: { id: emp.id },
          data: { managerId: mainManager.id },
        });
      }
    }
  }

  console.log('✈️ Seeding leave requests...');
  const leaveData: {
    email: string;
    type: LeaveType;
    duration: number;
    reason: string;
  }[] = [
    { email: 'sara.javed@antrosys.com', type: LeaveType.SICK, duration: 1, reason: 'Flu & headache' },
    { email: 'fawad.khan@antrosys.com', type: LeaveType.ANNUAL, duration: 3, reason: 'Family trip' },
    { email: 'omar.mirza@antrosys.com', type: LeaveType.CASUAL, duration: 1, reason: 'Personal errand' },
    { email: 'maria.raza@antrosys.com', type: LeaveType.MATERNITY, duration: 90, reason: 'Maternity leave starts' },
    { email: 'nadia.qureshi@antrosys.com', type: LeaveType.ANNUAL, duration: 5, reason: 'Travel plan' },
  ];

  for (const item of leaveData) {
    const emp = await prisma.employee.findFirst({ where: { user: { email: item.email } } });
    if (emp) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: emp.id,
          type: item.type,
          startDate: new Date(),
          endDate: new Date(Date.now() + item.duration * 24 * 60 * 60 * 1000),
          durationDays: item.duration,
          status: 'PENDING',
          reason: item.reason,
        },
      });
    }
  }

  console.log('📢 Seeding announcements timelines...');
  const opsHead = await prisma.employee.findFirst({
    where: { user: { email: 'operations_head@antrosys.com' } },
  });

  if (opsHead) {
    const announcements = [
      { title: 'Sprint 42 Schedule', content: 'Updated the deployment schedule for Sprint 42. Please review.' },
      { title: 'Server Maintenance', content: 'Server maintenance scheduled for this weekend.' },
      { title: 'Team Budget Approved', content: 'New team building budget approved for Q3.' },
    ];

    for (const ann of announcements) {
      await prisma.announcement.create({
        data: {
          title: ann.title,
          content: ann.content,
          authorId: opsHead.id,
        },
      });
    }
  }

  console.log('📊 Seeding KPIs and Mood Pulse metrics...');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  await prisma.departmentKpi.upsert({
    where: { department: 'Operations' },
    update: {},
    create: {
      department: 'Operations',
      sprintVelocity: 84,
      bugResolution: 72,
      codeReview: 78,
      deliveryOnTime: 91,
      teamUtilization: 82,
      openTickets: 64,
      documentation: 48,
    },
  });

  await prisma.teamMoodPulse.upsert({
    where: { department_date: { department: 'Operations', date: today } },
    update: {},
    create: {
      department: 'Operations',
      date: today,
      happy: 4,
      neutral: 3,
      stressed: 2,
      unknown: 1,
    },
  });

  const { seedCfoData } = await import('./cfo.seed');
  await seedCfoData();

  const { seedCeoData } = await import('./ceo.seed');
  await seedCeoData();

  const { seedClientsData } = await import('./clients.seed');
  await seedClientsData();

  const { seedRecruitData } = await import('./recruit.seed');
  await seedRecruitData();
  const { seedBizIntelData } = await import('./biz_intel.seed');
  await seedBizIntelData(prisma);
  const { seedHrData } = await import('./hr.seed');
  await seedHrData();

  const { seedLeaveData } = await import('./leave.seed');
  await seedLeaveData();

  const { seedOperationHeadData } = await import('./operation_head.seed');
  await seedOperationHeadData(prisma);

  const { seedLedgerData } = await import('./ledger.seed');
  await seedLedgerData(prisma);

  const { seedPayslipsData, seedPayrollData } = await import('./payroll.seed');
  await seedPayslipsData(prisma);
  await seedPayrollData(prisma);
  const { seedEmployeeDashboardData } = await import('./employee_dashboard.seed');
  await seedEmployeeDashboardData();

  const { seedBankFeedsData } = await import('./bank_feeds.seed');
  await seedBankFeedsData(prisma);

  const { seedInventoryData } = await import('./inventory.seed');
  await seedInventoryData();

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
