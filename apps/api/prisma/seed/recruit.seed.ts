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

  // 3. Create Job Requisitions (created once — matched by title + creator)
  const requisitionSpecs = [
    {
      title: 'Senior Product Designer',
      department: 'Design Operations',
      status: 'ACTIVE',
      daysAgo: 2,
    },
    {
      title: 'Lead Frontend Engineer',
      department: 'Engineering',
      status: 'ACTIVE',
      daysAgo: 5,
    },
  ];

  const reqs: string[] = [];
  for (const spec of requisitionSpecs) {
    let req = await prisma.jobRequisition.findFirst({
      where: { title: spec.title, createdByUserId: creator.id },
    });
    if (!req) {
      req = await prisma.jobRequisition.create({
        data: {
          title: spec.title,
          department: spec.department,
          status: spec.status,
          createdByUserId: creator.id,
          createdAt: new Date(Date.now() - spec.daysAgo * 24 * 60 * 60 * 1000),
        },
      });
    }
    reqs.push(req.id);
  }

  const req1Id = reqs[0];
  const req2Id = reqs[1];

  // 4. Create Candidates matching the exact mock data from original UI
  const candidatesData = [
    {
      jobRequisitionId: req1Id,
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
      jobRequisitionId: req1Id,
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
      jobRequisitionId: req1Id,
      name: 'Elena Rodriguez',
      role: 'Visual Designer',
      experience: '2yrs exp',
      rating: null,
      filesCount: 0,
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      pipelineStage: PipelineStage.APPLIED,
    },
    {
      jobRequisitionId: req1Id,
      name: 'Marcus Thorne',
      role: 'Product Lead',
      experience: '',
      rating: null,
      filesCount: 0,
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      pipelineStage: PipelineStage.SCREENING,
    },
    {
      jobRequisitionId: req1Id,
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
      jobRequisitionId: req2Id,
      name: 'David Miller',
      role: 'Sr. Frontend Engineer',
      experience: '',
      rating: null,
      filesCount: 0,
      createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      pipelineStage: PipelineStage.OFFER,
    },
    {
      jobRequisitionId: req2Id,
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
    const existing = await prisma.candidate.findFirst({
      where: { name: c.name, jobRequisitionId: c.jobRequisitionId },
    });
    if (existing) continue;
    await prisma.candidate.create({
      data: c
    });
  }

  console.log('✅ Recruitment Data Seeded!');
}
