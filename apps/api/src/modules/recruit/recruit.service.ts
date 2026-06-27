import { PipelineStage, Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import type {
  CreateRequisitionBody,
  UpdateRequisitionBody,
  ListRequisitionsQuery,
  CreateCandidateBody,
  ListCandidatesQuery,
} from './recruit.schema';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Map UI column IDs (e.g. 'applied') → DB enum (e.g. 'APPLIED') */
const STAGE_TO_PROGRESS: Record<PipelineStage, number> = {
  APPLIED: 1,
  SCREENING: 2,
  INTERVIEW: 3,
  OFFER: 4,
  HIRED: 5,
  REJECTED: 0,
};

// ─── Job Requisitions ──────────────────────────────────────────────────────

export async function listRequisitions(query: ListRequisitionsQuery) {
  const { status, department, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.JobRequisitionWhereInput = {
    ...(status && { status }),
    ...(department && { department: { contains: department, mode: 'insensitive' } }),
  };

  const [items, total] = await Promise.all([
    prisma.jobRequisition.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { candidates: true } },
        candidates: { select: { pipelineStage: true } },
        createdBy: { select: { employee: { select: { firstName: true, lastName: true } } } },
      },
    }),
    prisma.jobRequisition.count({ where }),
  ]);

  // Build pipeline health array [applied, screening, interview, offer, hired]
  const stages: PipelineStage[] = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED'];
  const enriched = items.map((req) => {
    const pipeline = stages.map(
      (s) => req.candidates.filter((c) => c.pipelineStage === s).length,
    );
    const applicants = req._count.candidates;
    const createdAt = req.createdAt;
    const postedAgo = formatPostedAgo(createdAt);

    return {
      id: req.id,
      title: req.title,
      department: req.department,
      status: req.status,
      applicants,
      pipeline,
      postedAgo,
    };
  });

  return { items: enriched, total, page, limit };
}

export async function createRequisition(body: CreateRequisitionBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const job = await tx.jobRequisition.create({
      data: { title: body.title, department: body.department, status: body.status, createdByUserId: userId },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE_JOB_REQUISITION',
        metadata: { jobId: job.id, title: job.title, department: job.department },
      },
    });

    return job;
  });
}

export async function updateRequisition(id: string, body: UpdateRequisitionBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.jobRequisition.findUnique({ where: { id } });
    if (!existing) return null;

    const updated = await tx.jobRequisition.update({
      where: { id },
      data: body,
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_JOB_REQUISITION',
        metadata: { jobId: id, changes: body },
      },
    });

    return updated;
  });
}

export async function deleteRequisition(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.jobRequisition.findUnique({ where: { id } });
    if (!existing) return null;

    const deleted = await tx.jobRequisition.delete({ where: { id } });

    await tx.auditLog.create({
      data: { userId, action: 'DELETE_JOB_REQUISITION', metadata: { jobId: id } },
    });

    return deleted;
  });
}

// ─── Candidates ────────────────────────────────────────────────────────────

export async function listCandidates(query: ListCandidatesQuery) {
  const { jobRequisitionId, pipelineStage, page, limit } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.CandidateWhereInput = {
    ...(jobRequisitionId && { jobRequisitionId }),
    ...(pipelineStage && { pipelineStage }),
  };

  const [items, total] = await Promise.all([
    prisma.candidate.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.candidate.count({ where }),
  ]);

  return { items, total, page, limit };
}

export async function createCandidate(body: CreateCandidateBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const requisition = await tx.jobRequisition.findUnique({ where: { id: body.jobRequisitionId } });
    if (!requisition) throw new Error('Job requisition not found');

    const candidate = await tx.candidate.create({
      data: {
        jobRequisitionId: body.jobRequisitionId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        role: body.role,
        experience: body.experience,
        rating: body.rating !== undefined ? new Prisma.Decimal(body.rating) : undefined,
        ratingType: body.ratingType,
        filesCount: body.filesCount,
        tag: body.tag,
        tagColor: body.tagColor,
        pipelineStage: body.pipelineStage,
        pipelineProgress: STAGE_TO_PROGRESS[body.pipelineStage],
        skills: body.skills,
        interviewTitle: body.interviewTitle,
        interviewLocation: body.interviewLocation,
        interviewAt: body.interviewAt,
      },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'CREATE_CANDIDATE',
        metadata: { candidateId: candidate.id, name: candidate.name, requisitionId: body.jobRequisitionId },
      },
    });

    return candidate;
  });
}

export async function updateCandidateStage(id: string, stage: PipelineStage, userId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.candidate.findUnique({ where: { id } });
    if (!existing) return null;

    const candidate = await tx.candidate.update({
      where: { id },
      data: { pipelineStage: stage, pipelineProgress: STAGE_TO_PROGRESS[stage] },
    });

    await tx.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_CANDIDATE_STAGE',
        metadata: { candidateId: id, fromStage: existing.pipelineStage, toStage: stage },
      },
    });

    return candidate;
  });
}

export async function deleteCandidate(id: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.candidate.findUnique({ where: { id } });
    if (!existing) return null;

    const deleted = await tx.candidate.delete({ where: { id } });

    await tx.auditLog.create({
      data: { userId, action: 'DELETE_CANDIDATE', metadata: { candidateId: id } },
    });

    return deleted;
  });
}

// ─── Metrics ───────────────────────────────────────────────────────────────

export async function getRecruitmentMetrics() {
  const [totalApplicants, openPositions, interviewsToday, stageBreakdown] = await Promise.all([
    prisma.candidate.count(),
    prisma.jobRequisition.count({ where: { status: 'ACTIVE' } }),
    prisma.candidate.count({
      where: {
        interviewAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    }),
    prisma.candidate.groupBy({ by: ['pipelineStage'], _count: { id: true } }),
  ]);

  const hiredCount = stageBreakdown.find((s) => s.pipelineStage === 'HIRED')?._count?.id ?? 0;
  const offerCount = stageBreakdown.find((s) => s.pipelineStage === 'OFFER')?._count?.id ?? 0;
  const offerAcceptancePct =
    offerCount > 0 ? Math.round((hiredCount / offerCount) * 100 * 10) / 10 : 0;

  // Avg time to hire: avg days between APPLIED and HIRED (via updatedAt for HIRED candidates)
  const hiredCandidates = await prisma.candidate.findMany({
    where: { pipelineStage: 'HIRED' },
    select: { createdAt: true, updatedAt: true },
  });

  let avgDays = 18; // default fallback
  if (hiredCandidates.length > 0) {
    const totalDays = hiredCandidates.reduce((sum, c) => {
      const diff = (c.updatedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return sum + diff;
    }, 0);
    avgDays = Math.round(totalDays / hiredCandidates.length);
  }

  return {
    totalApplicants,
    avgTimeToHire: `${avgDays} Days`,
    offerAcceptance: `${offerAcceptancePct}%`,
    openPositions,
    interviewsToday,
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────

function formatPostedAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d ago';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}
