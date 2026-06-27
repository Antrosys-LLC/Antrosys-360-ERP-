import { Prisma } from '@prisma/client';
import { prisma } from '../../../config/database';
import type { CreateOnboardingBody, UpdateOnboardingBody, ToggleTaskBody, CommunicateBody } from './onboarding.schema';

type MutationAction = 'ONBOARDING_CREATE' | 'ONBOARDING_UPDATE' | 'ONBOARDING_TASK_TOGGLE' | 'ONBOARDING_COMMUNICATE';

async function writeAuditLog(tx: Prisma.TransactionClient, userId: string, action: MutationAction, metadata: Prisma.InputJsonValue) {
  await tx.auditLog.create({ data: { userId, action, metadata } });
}

export async function listOnboardings() {
  const onboardings = await prisma.onboarding.findMany({
    orderBy: { startDate: 'desc' },
    include: {
      employee: { select: { firstName: true, lastName: true, department: true } },
      buddy: { select: { firstName: true, lastName: true, designation: true } },
      tasks: { orderBy: { phase: 'asc' } },
      documents: true,
    },
  });

  const items = onboardings.map((o) => {
    const phaseLabels = ['Pre-joining', 'IT setup', 'HR docs', 'Team Intros', 'Training'];
    const total = o.tasks.length;
    const done = o.tasks.filter((t) => t.done).length;
    return {
      id: o.id,
      name: `${o.employee.firstName} ${o.employee.lastName}`,
      dept: o.employee.department || 'General',
      startDate: o.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      phase: o.phase,
      completion: o.completion || (total > 0 ? Math.round((done / total) * 100) : 0),
      buddy: {
        name: o.buddy ? `${o.buddy.firstName} ${o.buddy.lastName}` : 'Unassigned',
        initials: o.buddy ? `${o.buddy.firstName[0]}${o.buddy.lastName[0]}` : '--',
        role: o.buddy?.designation || '',
      },
      avatarText: `${o.employee.firstName[0]}${o.employee.lastName[0]}`,
      color: getColor(o.phase),
      email: `${o.employee.firstName.toLowerCase()}.${o.employee.lastName.toLowerCase()}@antrosys.com`,
      templateType: o.templateType || 'Standard Welcome - General',
      hasWarning: o.completion < 25 && o.phase > 1,
      tasks: o.tasks.map((t) => ({
        id: t.id,
        text: t.text,
        subtext: t.subtext,
        hasAction: t.hasAction,
        phase: t.phase,
        done: t.done,
      })),
      documents: o.documents.map((d) => ({
        id: d.id,
        name: d.name,
        type: d.type,
        status: d.status,
      })),
    };
  });

  return items;
}

export async function getOnboardingById(onboardingId: string) {
  const o = await prisma.onboarding.findUnique({
    where: { id: onboardingId },
    include: {
      employee: { select: { firstName: true, lastName: true, department: true, designation: true } },
      buddy: { select: { firstName: true, lastName: true, designation: true } },
      tasks: { orderBy: { phase: 'asc' } },
      documents: true,
    },
  });
  if (!o) return null;

  const total = o.tasks.length;
  const done = o.tasks.filter((t) => t.done).length;
  return {
    id: o.id,
    name: `${o.employee.firstName} ${o.employee.lastName}`,
    dept: o.employee.department || 'General',
    startDate: o.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    phase: o.phase,
    completion: o.completion || (total > 0 ? Math.round((done / total) * 100) : 0),
    buddy: {
      name: o.buddy ? `${o.buddy.firstName} ${o.buddy.lastName}` : 'Unassigned',
      initials: o.buddy ? `${o.buddy.firstName[0]}${o.buddy.lastName[0]}` : '--',
      role: o.buddy?.designation || '',
    },
    avatarText: `${o.employee.firstName[0]}${o.employee.lastName[0]}`,
    color: getColor(o.phase),
    email: `${o.employee.firstName.toLowerCase()}.${o.employee.lastName.toLowerCase()}@antrosys.com`,
    templateType: o.templateType || 'Standard Welcome - General',
    hasWarning: o.completion < 25 && o.phase > 1,
    tasks: o.tasks.map((t) => ({
      id: t.id,
      text: t.text,
      subtext: t.subtext,
      hasAction: t.hasAction,
      phase: t.phase,
      done: t.done,
    })),
    documents: o.documents.map((d) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      status: d.status,
    })),
  };
}

export async function createOnboarding(payload: CreateOnboardingBody, userId: string) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.onboarding.findFirst({
      where: { employeeId: payload.employeeId },
    });
    if (existing) {
      throw new Error('Employee already has an onboarding record');
    }

    const onboarding = await tx.onboarding.create({
      data: {
        employeeId: payload.employeeId,
        buddyId: payload.buddyId ?? null,
        startDate: payload.startDate,
        templateType: payload.templateType ?? null,
        phase: 1,
        completion: 0,
        tasks: {
          create: [
            { text: 'Complete personal information form', phase: 1, done: false },
            { text: 'Upload identification documents', phase: 1, done: false },
            { text: 'Sign employment contract', phase: 1, done: false },
            { text: 'IT equipment setup request', phase: 2, done: false },
            { text: 'Email and system accounts created', phase: 2, done: false },
            { text: 'VPN and security access configured', phase: 2, done: false },
            { text: 'Submit HR onboarding forms', phase: 3, done: false },
            { text: 'Review employee handbook', phase: 3, done: false },
            { text: 'Set up payroll and benefits', phase: 3, done: false },
            { text: 'Meet team members', phase: 4, done: false },
            { text: 'Schedule 1:1 with manager', phase: 4, done: false, hasAction: true, subtext: 'Find a 30m slot this week with your manager' },
            { text: 'Attend team standup meetings', phase: 4, done: false },
            { text: 'Complete role-specific training modules', phase: 5, done: false },
            { text: 'Set up development environment', phase: 5, done: false },
            { text: 'First project assignment briefing', phase: 5, done: false },
          ],
        },
        documents: {
          create: [
            { name: 'Employee Handbook', type: 'handbook', status: 'pending' },
            { name: 'Offer Letter', type: 'offer-letter', status: 'pending' },
            { name: 'Employee Form', type: 'employee-form', status: 'pending' },
          ],
        },
      },
      include: { tasks: true, documents: true },
    });

    await writeAuditLog(tx, userId, 'ONBOARDING_CREATE', {
      onboardingId: onboarding.id,
      employeeId: payload.employeeId,
    });

    return onboarding;
  });
}

export async function updateOnboarding(onboardingId: string, payload: UpdateOnboardingBody, userId: string) {
  const current = await prisma.onboarding.findUnique({ where: { id: onboardingId } });
  if (!current) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.onboarding.update({
      where: { id: onboardingId },
      data: {
        ...(payload.phase !== undefined ? { phase: payload.phase } : {}),
        ...(payload.completion !== undefined ? { completion: payload.completion } : {}),
        ...(payload.buddyId !== undefined ? { buddyId: payload.buddyId } : {}),
        ...(payload.templateType !== undefined ? { templateType: payload.templateType } : {}),
      },
    });
    await writeAuditLog(tx, userId, 'ONBOARDING_UPDATE', { onboardingId });
    return updated;
  });
}

export async function toggleTask(taskId: string, payload: ToggleTaskBody, userId: string) {
  const task = await prisma.onboardingTask.findUnique({ where: { id: taskId } });
  if (!task) return null;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.onboardingTask.update({
      where: { id: taskId },
      data: { done: payload.done },
    });

    const allTasks = await tx.onboardingTask.findMany({
      where: { onboardingId: task.onboardingId },
    });
    const total = allTasks.length;
    const done = allTasks.filter((t) => t.done).length;
    const completion = total > 0 ? Math.round((done / total) * 100) : 0;

    await tx.onboarding.update({
      where: { id: task.onboardingId },
      data: { completion },
    });

    await writeAuditLog(tx, userId, 'ONBOARDING_TASK_TOGGLE', {
      taskId,
      onboardingId: task.onboardingId,
      done: payload.done,
    });

    return updated;
  });
}

export async function sendCommunication(onboardingId: string, payload: CommunicateBody, userId: string) {
  const onboarding = await prisma.onboarding.findUnique({
    where: { id: onboardingId },
    include: { employee: { select: { firstName: true, lastName: true } } },
  });
  if (!onboarding) return null;

  await prisma.$transaction(async (tx) => {
    await tx.onboarding.update({
      where: { id: onboardingId },
      data: { templateType: payload.templateType },
    });
    await writeAuditLog(tx, userId, 'ONBOARDING_COMMUNICATE', {
      onboardingId,
      templateType: payload.templateType,
      recipient: payload.recipientEmail,
    });
  });

  return {
    sent: true,
    recipient: payload.recipientEmail,
    templateType: payload.templateType,
    messageBody: payload.messageBody,
  };
}

export async function getOnboardingSummary() {
  const onboardings = await prisma.onboarding.findMany({
    include: { tasks: true },
  });

  const active = onboardings.length;
  const totalTasks = onboardings.reduce((sum, o) => sum + o.tasks.length, 0);
  const doneTasks = onboardings.reduce((sum, o) => sum + o.tasks.filter((t) => t.done).length, 0);
  const avgCompletion = active > 0 ? Math.round((doneTasks / Math.max(totalTasks, 1)) * 100) : 0;
  const overdueTasks = onboardings.reduce((sum, o) => {
    if (o.completion < 30 && o.phase > 1) return sum + o.tasks.filter((t) => !t.done).length;
    return sum;
  }, 0);
  const completingSoon = onboardings.filter((o) => o.completion >= 80 && o.completion < 100).length;

  return {
    active,
    avgCompletion,
    overdueTasks,
    completingSoon,
  };
}

function getColor(phase: number): string {
  const colors = [
    'bg-primary text-primary-foreground',
    'bg-blue-500 text-white',
    'bg-rose-500 text-white',
    'bg-amber-500 text-white',
    'bg-emerald-500 text-white',
  ];
  return colors[Math.min(phase - 1, colors.length - 1)];
}
