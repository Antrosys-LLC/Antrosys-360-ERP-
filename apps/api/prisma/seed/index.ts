import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'process';

const prisma = new PrismaClient();

const SEED_PASSWORD = 'Antrosys@2026';

interface SeedUser {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  department: string;
  designation?: string;
}

const seedUsers: SeedUser[] = [
  { email: 'ceo@antrosys.com', role: 'CEO', firstName: 'Chief', lastName: 'Executive', department: 'Executive', designation: 'CEO' },
  { email: 'cfo@antrosys.com', role: 'CFO', firstName: 'Chief', lastName: 'Financial', department: 'Finance', designation: 'CFO' },
  { email: 'operations_head@antrosys.com', role: 'OPERATIONS_HEAD', firstName: 'Operations', lastName: 'Head', department: 'Operations', designation: 'Head of Operations' },
  { email: 'hr_head@antrosys.com', role: 'HR_HEAD', firstName: 'HR', lastName: 'Head', department: 'Human Resources', designation: 'Head of HR' },
  { email: 'finance_manager@antrosys.com', role: 'FINANCE_MANAGER', firstName: 'Finance', lastName: 'Manager', department: 'Finance', designation: 'Finance Manager' },
  { email: 'project_manager@antrosys.com', role: 'PROJECT_MANAGER', firstName: 'Project', lastName: 'Manager', department: 'Projects', designation: 'Project Manager' },
  { email: 'manager@antrosys.com', role: 'MANAGER', firstName: 'General', lastName: 'Manager', department: 'Operations', designation: 'General Manager' },
  { email: 'sub_manager@antrosys.com', role: 'SUB_MANAGER', firstName: 'Sub', lastName: 'Manager', department: 'Operations', designation: 'Sub Manager' },
  { email: 'team_lead@antrosys.com', role: 'TEAM_LEAD', firstName: 'Team', lastName: 'Lead', department: 'Engineering', designation: 'Team Lead' },
  
  // Reports for sub-manager & manager
  { email: 'sara.javed@antrosys.com', role: 'EMPLOYEE', firstName: 'Sara', lastName: 'Javed', department: 'Operations', designation: 'Senior Dev' },
  { email: 'fawad.khan@antrosys.com', role: 'EMPLOYEE', firstName: 'Fawad', lastName: 'Khan', department: 'Operations', designation: 'Backend' },
  { email: 'bilal.hassan@antrosys.com', role: 'EMPLOYEE', firstName: 'Bilal', lastName: 'Hassan', department: 'Operations', designation: 'DevOps' },
  { email: 'hina.baig@antrosys.com', role: 'EMPLOYEE', firstName: 'Hina', lastName: 'Baig', department: 'Operations', designation: 'Frontend' },
  { email: 'omar.mirza@antrosys.com', role: 'EMPLOYEE', firstName: 'Omar', lastName: 'Mirza', department: 'Operations', designation: 'QA Eng' },
  { email: 'maria.raza@antrosys.com', role: 'EMPLOYEE', firstName: 'Maria', lastName: 'Raza', department: 'Operations', designation: 'UX Design' },
  { email: 'nadia.qureshi@antrosys.com', role: 'EMPLOYEE', firstName: 'Nadia', lastName: 'Qureshi', department: 'Operations', designation: 'Product' },
];

async function main() {
  console.log('🌱 Starting seed...');

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 12);

  // 1. Create Users & Employees
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

    // Create Employee record for all users
    await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        department: seedUser.department,
        designation: seedUser.designation || 'Staff',
        joiningDate: new Date('2024-01-01'),
        isActive: true,
      },
    });
    console.log(`  📋 Created employee record for ${seedUser.email}`);
  }

  // 2. Resolve Relationships
  console.log('🔗 Connecting management hierarchy...');
  const mainManager = await prisma.employee.findFirst({
    where: { user: { email: 'manager@antrosys.com' } },
  });
  const subManager = await prisma.employee.findFirst({
    where: { user: { email: 'sub_manager@antrosys.com' } },
  });

  if (mainManager && subManager) {
    // Sub-manager reports to Main Manager
    await prisma.employee.update({
      where: { id: subManager.id },
      data: { managerId: mainManager.id },
    });

    // Sub-manager team reports
    const subManagerReports = ['sara.javed@antrosys.com', 'fawad.khan@antrosys.com', 'bilal.hassan@antrosys.com', 'hina.baig@antrosys.com'];
    for (const email of subManagerReports) {
      const emp = await prisma.employee.findFirst({ where: { user: { email } } });
      if (emp) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { managerId: subManager.id },
        });
      }
    }

    // Main manager direct reports (others report directly to main manager)
    const mainManagerReports = ['omar.mirza@antrosys.com', 'maria.raza@antrosys.com', 'nadia.qureshi@antrosys.com'];
    for (const email of mainManagerReports) {
      const emp = await prisma.employee.findFirst({ where: { user: { email } } });
      if (emp) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { managerId: mainManager.id },
        });
      }
    }
  }

  // 3. Seed Attendance Records for Today
  console.log('📅 Seeding daily attendance logs...');
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const attendanceData = [
    { email: 'sara.javed@antrosys.com', checkIn: '08:45', status: 'PRESENT', hours: 4.2 },
    { email: 'omar.mirza@antrosys.com', checkIn: '09:02', status: 'PRESENT', hours: 3.9 },
    { email: 'bilal.hassan@antrosys.com', checkIn: null, status: 'ABSENT', hours: 0 },
    { email: 'hina.baig@antrosys.com', checkIn: null, status: 'LEAVE', hours: 0 },
    { email: 'fawad.khan@antrosys.com', checkIn: '10:15', status: 'LATE', hours: 2.7 },
    { email: 'nadia.qureshi@antrosys.com', checkIn: '08:50', status: 'PRESENT', hours: 4.1 },
    { email: 'maria.raza@antrosys.com', checkIn: '08:55', status: 'PRESENT', hours: 4.0 },
  ];

  for (const item of attendanceData) {
    const emp = await prisma.employee.findFirst({ where: { user: { email: item.email } } });
    if (emp) {
      let checkInDate = null;
      if (item.checkIn) {
        const [h, m] = item.checkIn.split(':').map(Number);
        checkInDate = new Date();
        checkInDate.setHours(h, m, 0, 0);
      }
      await prisma.attendance.upsert({
        where: { employeeId_date: { employeeId: emp.id, date: today } },
        update: {},
        create: {
          employeeId: emp.id,
          date: today,
          status: item.status,
          checkIn: checkInDate,
          hours: item.hours,
        },
      });
    }
  }

  // 4. Seed Pending Leave Requests
  console.log('✈️ Seeding leave requests...');
  const leaveData = [
    { email: 'sara.javed@antrosys.com', type: 'Sick Leave', duration: 1, reason: 'Flu & headache' },
    { email: 'fawad.khan@antrosys.com', type: 'Annual Leave', duration: 3, reason: 'Family trip' },
    { email: 'omar.mirza@antrosys.com', type: 'Casual Leave', duration: 1, reason: 'Personal errand' },
    { email: 'maria.raza@antrosys.com', type: 'Maternity Leave', duration: 90, reason: 'Maternity leave starts' },
    { email: 'nadia.qureshi@antrosys.com', type: 'Annual Leave', duration: 5, reason: 'Travel plan' },
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

  // 5. Seed Announcements
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

  // 6. Seed Department KPIs & Team Mood Pulse
  console.log('📊 Seeding KPIs and Mood Pulse metrics...');
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

  // 7. Seed CFO specific data if needed
  const { seedCfoData } = await import('./cfo.seed');
  await seedCfoData();

  const { seedCeoData } = await import('./ceo.seed');
  await seedCeoData();

  const { seedKpiData } = await import('./kpi.seed');
  await seedKpiData();

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
