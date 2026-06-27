import { PrismaClient, PipelineStage } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedRecruitData() {
  console.log('🧑‍💼 Seeding Recruitment Data...');

  // 1. Get a user to act as the creator
  const creator = await prisma.user.findFirst({
    where: { email: 'hr_head@antrosys.com' }
  });

  if (!creator) {
    console.error('HR Head not found, skipping recruitment seed.');
    return;
  }

  // 2. Cleanup existing recruit data (to avoid duplicates if re-running)
  await prisma.candidate.deleteMany({});
  await prisma.jobRequisition.deleteMany({});

  // 3. Create Job Requisitions
  const req1 = await prisma.jobRequisition.create({
    data: {
      title: 'Senior Product Designer',
      department: 'Design Operations',
      status: 'ACTIVE',
      createdByUserId: creator.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    }
  });

  const req2 = await prisma.jobRequisition.create({
    data: {
      title: 'Lead Frontend Engineer',
      department: 'Engineering',
      status: 'ACTIVE',
      createdByUserId: creator.id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    }
  });

  // 4. Create Candidates matching the exact mock data from original UI
  const candidatesData = [
    {
      jobRequisitionId: req1.id,
      name: 'Sara Jenkins',
      role: 'UI Designer',
      experience: '4yrs exp',
      rating: 4.8,
      ratingType: 'default',
      filesCount: 2,
      createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h ago
      pipelineStage: PipelineStage.APPLIED,
    },
    {
      jobRequisitionId: req1.id,
      name: 'Bilal Hussain',
      role: 'UX Architect',
      experience: '6yrs exp',
      rating: 5.0,
      ratingType: 'primary',
      filesCount: 4,
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2h ago
      pipelineStage: PipelineStage.APPLIED,
    },
    {
      jobRequisitionId: req1.id,
      name: 'Elena Rodriguez',
      role: 'Visual Designer',
      experience: '2yrs exp',
      rating: null,
      filesCount: 0,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      pipelineStage: PipelineStage.APPLIED,
    },
    {
      jobRequisitionId: req1.id,
      name: 'Marcus Thorne',
      role: 'Product Lead',
      experience: '',
      rating: null,
      filesCount: 0,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      pipelineStage: PipelineStage.SCREENING,
    },
    {
      jobRequisitionId: req1.id,
      name: 'Linda Chen',
      role: 'Systems Analyst',
      experience: '',
      rating: null,
      filesCount: 0,
      createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      pipelineStage: PipelineStage.INTERVIEW,
      tag: 'Urgent',
      tagColor: 'bg-destructive/10 text-destructive',
      interviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      interviewTitle: 'Technical Interview',
      interviewLocation: 'Zoom',
    },
    {
      jobRequisitionId: req2.id,
      name: 'David Miller',
      role: 'Sr. Frontend Engineer',
      experience: '',
      rating: null,
      filesCount: 0,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      pipelineStage: PipelineStage.OFFER,
    },
    {
      jobRequisitionId: req2.id,
      name: 'Jessica Wong',
      role: 'Frontend Dev',
      experience: '3yrs exp',
      rating: 4.2,
      ratingType: 'default',
      filesCount: 1,
      createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000),
      pipelineStage: PipelineStage.HIRED,
    }
  ];

  for (const c of candidatesData) {
    await prisma.candidate.create({
      data: c
    });
  }

  console.log('✅ Recruitment Data Seeded!');
}
