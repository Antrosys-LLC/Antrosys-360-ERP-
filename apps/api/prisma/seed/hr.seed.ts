import {
  PrismaClient,
  Department,
  Gender,
  EmploymentStatus,
  ApplicationStage,
  JobPostingStatus,
  OnboardingPhase,
} from '@prisma/client';

const prisma = new PrismaClient();

function daysAgo(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

const EMAIL_DEPARTMENT: Record<string, Department> = {
  'ceo@antrosys.com': 'OTHER',
  'cfo@antrosys.com': 'FINANCE',
  'finance_manager@antrosys.com': 'FINANCE',
  'operations_head@antrosys.com': 'OPERATIONS',
  'hr_head@antrosys.com': 'HR',
  'project_manager@antrosys.com': 'OTHER',
  'manager@antrosys.com': 'OPERATIONS',
  'sub_manager@antrosys.com': 'OPERATIONS',
  'team_lead@antrosys.com': 'ENGINEERING',
};

export async function seedHrData() {
  console.log('👥 Seeding HR dashboard data...');

  const hrHead = await prisma.user.findUnique({ where: { email: 'hr_head@antrosys.com' } });
  if (!hrHead) {
    console.warn('  ⚠️ HR head user not found — skipping HR seed');
    return;
  }

  const allEmployees = await prisma.employee.findMany({ include: { user: true } });
  const genders: Gender[] = ['MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE', 'FEMALE', 'OTHER'];
  for (let i = 0; i < allEmployees.length; i++) {
    const emp = allEmployees[i];
    const department = EMAIL_DEPARTMENT[emp.user.email] ?? 'OPERATIONS';
    await prisma.employee.update({
      where: { id: emp.id },
      data: {
        gender: genders[i % genders.length],
        department,
        employmentStatus: 'ACTIVE',
      },
    });
  }

  await prisma.jobApplication.deleteMany({ where: { email: { contains: '@example.com' } } });
  await prisma.jobPosting.deleteMany({ where: { createdByUserId: hrHead.id } });

  const jobSpecs: { title: string; department: Department; status: JobPostingStatus }[] = [
    { title: 'Senior Product Designer', department: 'ENGINEERING', status: 'OPEN' },
    { title: 'Backend Engineer', department: 'ENGINEERING', status: 'OPEN' },
    { title: 'Marketing Manager', department: 'SALES', status: 'OPEN' },
    { title: 'Sales Executive', department: 'SALES', status: 'OPEN' },
    { title: 'Finance Analyst', department: 'FINANCE', status: 'OPEN' },
    { title: 'HR Coordinator', department: 'HR', status: 'CLOSED' },
  ];

  const postings = [];
  for (const spec of jobSpecs) {
    const posting = await prisma.jobPosting.create({
      data: {
        title: spec.title,
        department: spec.department,
        description: `${spec.title} role at Antrosys`,
        status: spec.status,
        postedAt: daysAgo(30),
        createdByUserId: hrHead.id,
      },
    });
    postings.push(posting);
  }

  const candidateSpecs: {
    firstName: string;
    lastName: string;
    email: string;
    stage: ApplicationStage;
    jobIndex: number;
    appliedDaysAgo: number;
  }[] = [
    { firstName: 'Ayesha', lastName: 'Malik', email: 'ayesha.malik@example.com', stage: 'APPLIED', jobIndex: 0, appliedDaysAgo: 5 },
    { firstName: 'Bilal', lastName: 'Rashid', email: 'bilal.rashid@example.com', stage: 'APPLIED', jobIndex: 1, appliedDaysAgo: 8 },
    { firstName: 'Sana', lastName: 'Tariq', email: 'sana.tariq@example.com', stage: 'SCREENING', jobIndex: 0, appliedDaysAgo: 12 },
    { firstName: 'Usman', lastName: 'Farooq', email: 'usman.farooq@example.com', stage: 'SCREENING', jobIndex: 2, appliedDaysAgo: 15 },
    { firstName: 'Zara', lastName: 'Imtiaz', email: 'zara.imtiaz@example.com', stage: 'INTERVIEW', jobIndex: 1, appliedDaysAgo: 18 },
    { firstName: 'Hamza', lastName: 'Siddiqui', email: 'hamza.siddiqui@example.com', stage: 'INTERVIEW', jobIndex: 3, appliedDaysAgo: 20 },
    { firstName: 'Mehreen', lastName: 'Akhtar', email: 'mehreen.akhtar@example.com', stage: 'OFFER_SENT', jobIndex: 2, appliedDaysAgo: 25 },
    { firstName: 'Kamran', lastName: 'Shah', email: 'kamran.shah@example.com', stage: 'HIRED', jobIndex: 0, appliedDaysAgo: 30 },
  ];

  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay() + 1);
  weekStart.setUTCHours(10, 0, 0, 0);

  for (const spec of candidateSpecs) {
    const appliedAt = daysAgo(spec.appliedDaysAgo);
    const posting = postings[spec.jobIndex];
    await prisma.jobApplication.create({
      data: {
        jobPostingId: posting.id,
        firstName: spec.firstName,
        lastName: spec.lastName,
        email: spec.email,
        stage: spec.stage,
        appliedAt,
        stageChangedAt: appliedAt,
        interviewAt: spec.stage === 'INTERVIEW' ? weekStart : undefined,
        offerSentAt: ['OFFER_SENT', 'HIRED'].includes(spec.stage) ? daysAgo(3) : undefined,
        offerAcceptedAt: spec.stage === 'HIRED' ? daysAgo(2) : undefined,
        hiredAt: spec.stage === 'HIRED' ? daysAgo(1) : undefined,
      },
    });
  }

  const recentHireUpdates: {
    email: string;
    status: EmploymentStatus;
    joiningDaysAgo: number;
    phase?: OnboardingPhase;
  }[] = [
    { email: 'sara.javed@antrosys.com', status: 'ONBOARDING', joiningDaysAgo: 15, phase: 'IT_SETUP' },
    { email: 'fawad.khan@antrosys.com', status: 'ACTIVE', joiningDaysAgo: 26 },
    { email: 'hina.baig@antrosys.com', status: 'OFFER_SIGNED', joiningDaysAgo: 5 },
    { email: 'omar.mirza@antrosys.com', status: 'ONBOARDING', joiningDaysAgo: 8, phase: 'DOCUMENTATION' },
  ];

  // Ordered onboarding phases (mirrors backend PHASE_ORDER).
  const PHASE_ORDER: OnboardingPhase[] = [
    'PENDING',
    'DOCUMENTATION',
    'IT_SETUP',
    'HR_ORIENTATION',
    'TEAM_INTRO',
    'COMPLETED',
  ];

  // Standard onboarding checklist grouped by phase.
  const CHECKLIST: { phase: OnboardingPhase; title: string; description?: string }[] = [
    { phase: 'PENDING', title: 'Sign your offer letter', description: 'Review and e-sign the offer letter.' },
    { phase: 'PENDING', title: 'Submit personal details', description: 'Complete your profile and emergency contacts.' },
    { phase: 'DOCUMENTATION', title: 'Upload ID & tax documents', description: 'CNIC, tax forms and bank details.' },
    { phase: 'DOCUMENTATION', title: 'Sign company policies', description: 'Acknowledge the employee handbook.' },
    { phase: 'IT_SETUP', title: 'Set up your work laptop', description: 'Collect and configure your device.' },
    { phase: 'IT_SETUP', title: 'Configure email & VPN', description: 'Access your corporate accounts.' },
    { phase: 'HR_ORIENTATION', title: 'Attend HR orientation', description: 'Company overview and benefits session.' },
    { phase: 'TEAM_INTRO', title: 'Meet your team', description: 'Intro session with your squad.' },
    { phase: 'TEAM_INTRO', title: '1:1 with your manager', description: 'Align on goals for your first 30 days.' },
  ];

  for (const item of recentHireUpdates) {
    const emp = await prisma.employee.findFirst({ where: { user: { email: item.email } } });
    if (!emp) continue;
    const joiningDate = daysAgo(item.joiningDaysAgo);
    await prisma.employee.update({
      where: { id: emp.id },
      data: { employmentStatus: item.status, joiningDate },
    });

    if (item.status === 'ONBOARDING') {
      const phase = item.phase ?? 'PENDING';
      await prisma.onboardingRecord.upsert({
        where: { employeeId: emp.id },
        update: { status: 'IN_PROGRESS', currentPhase: phase, startDate: joiningDate, targetEndDate: daysFromNow(14) },
        create: {
          employeeId: emp.id,
          status: 'IN_PROGRESS',
          currentPhase: phase,
          startDate: joiningDate,
          targetEndDate: daysFromNow(14),
          createdByUserId: hrHead.id,
        },
      });

      // Reset & seed onboarding artefacts so the pipeline has content.
      await prisma.employeeTask.deleteMany({ where: { employeeId: emp.id } });
      await prisma.onboardingMeeting.deleteMany({ where: { employeeId: emp.id } });
      await prisma.message.deleteMany({ where: { recipientId: emp.id } });

      const phaseIdx = PHASE_ORDER.indexOf(phase);
      for (const task of CHECKLIST) {
        const taskPhaseIdx = PHASE_ORDER.indexOf(task.phase);
        const completed = taskPhaseIdx < phaseIdx;
        await prisma.employeeTask.create({
          data: {
            employeeId: emp.id,
            title: task.title,
            description: task.description ?? null,
            phase: task.phase,
            status: completed ? 'COMPLETED' : 'PENDING',
            completedAt: completed ? daysAgo(item.joiningDaysAgo - taskPhaseIdx) : null,
            assignedById: hrHead.id,
          },
        });
      }

      await prisma.onboardingMeeting.create({
        data: {
          employeeId: emp.id,
          title: 'HR Orientation',
          description: 'Welcome session covering company culture, policies and benefits.',
          scheduledAt: daysFromNow(1),
          durationMins: 45,
          location: 'Zoom',
          phase: 'HR_ORIENTATION',
          createdByUserId: hrHead.id,
        },
      });
      await prisma.onboardingMeeting.create({
        data: {
          employeeId: emp.id,
          title: 'Team Intro & Lunch',
          description: 'Meet your new teammates.',
          scheduledAt: daysFromNow(3),
          durationMins: 60,
          location: 'Room 4 / Cafeteria',
          phase: 'TEAM_INTRO',
          createdByUserId: hrHead.id,
        },
      });

      await prisma.message.create({
        data: {
          senderId: hrHead.id,
          recipientId: emp.id,
          subject: 'Welcome to Antrosys!',
          body: `Hi ${emp.firstName},\n\nWelcome aboard! We're thrilled to have you. Please work through your onboarding checklist and reach out if you need anything.\n\nBest,\nThe HR Team`,
        },
      });
    }
  }

  console.log('  ✅ HR dashboard seed complete');
}
