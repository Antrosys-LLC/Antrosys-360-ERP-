import { PrismaClient, LeaveType } from '@prisma/client';

const prisma = new PrismaClient();

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

export async function seedLeaveData() {
  console.log('🌴 Seeding Leave Data...');

  const saraUser = await prisma.user.findFirst({ where: { email: 'sara.javed@antrosys.com' } });
  const fawadUser = await prisma.user.findFirst({ where: { email: 'fawad.khan@antrosys.com' } });
  const omarUser = await prisma.user.findFirst({ where: { email: 'omar.mirza@antrosys.com' } });
  const teamLead = await prisma.user.findFirst({ where: { email: 'team_lead@antrosys.com' } });
  const mainManager = await prisma.user.findFirst({ where: { email: 'manager@antrosys.com' } });

  const saraEmp = await prisma.employee.findFirst({ where: { userId: saraUser?.id } });
  const fawadEmp = await prisma.employee.findFirst({ where: { userId: fawadUser?.id } });
  const omarEmp = await prisma.employee.findFirst({ where: { userId: omarUser?.id } });
  const teamLeadEmp = await prisma.employee.findFirst({ where: { userId: teamLead?.id } });
  const managerEmp = await prisma.employee.findFirst({ where: { userId: mainManager?.id } });

  if (!saraEmp || !fawadEmp || !omarEmp || !teamLeadEmp || !managerEmp) {
    console.error('Required employees not found, skipping leave seed.');
    return;
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const today = utcDate(year, month, now.getDate());

  // ── Leave requests ───────────────────────────────────────────────────
  // Seed data is stable: requests are created only if they don't already
  // exist (matched by employee + type + start date + status).
  const requests = [
    {
      employeeId: saraEmp.id,
      type: LeaveType.ANNUAL,
      startDate: utcDate(year, month, 5),
      endDate: utcDate(year, month, 6),
      durationDays: 2,
      status: 'APPROVED',
      reason: 'Personal travel',
      managerApprovedById: teamLeadEmp.id,
    },
    {
      employeeId: saraEmp.id,
      type: LeaveType.SICK,
      startDate: utcDate(year, month, 10),
      endDate: utcDate(year, month, 12),
      durationDays: 3,
      status: 'APPROVED',
      reason: 'Medical treatment',
      managerApprovedById: teamLeadEmp.id,
    },
    {
      employeeId: saraEmp.id,
      type: LeaveType.CASUAL,
      startDate: utcDate(year, month, 14),
      endDate: utcDate(year, month, 15),
      durationDays: 2,
      status: 'APPROVED',
      reason: 'Family function',
      managerApprovedById: teamLeadEmp.id,
    },
    {
      employeeId: saraEmp.id,
      type: LeaveType.WFH,
      startDate: utcDate(year, month, 18),
      endDate: utcDate(year, month, 18),
      durationDays: 1,
      status: 'PENDING',
      reason: 'Home office work',
    },
    {
      // Over-threshold sick leave escalated to ops head (manager-approved).
      employeeId: saraEmp.id,
      type: LeaveType.SICK,
      startDate: today,
      endDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000),
      durationDays: 5,
      status: 'PENDING_OPS_HEAD',
      reason: 'Extended medical recovery — exceeds sick leave quota',
      requiresOpsHeadApproval: true,
      managerApprovedById: teamLeadEmp.id,
    },
    {
      // Fawad reports to Sara (employee_dashboard seed assigns him to her team).
      employeeId: fawadEmp.id,
      type: LeaveType.SICK,
      startDate: utcDate(year, month, 5),
      endDate: utcDate(year, month, 6),
      durationDays: 2,
      status: 'APPROVED',
      reason: 'Flu & fever',
      managerApprovedById: saraEmp.id,
    },
  ];

  for (const r of requests) {
    const existing = await prisma.leaveRequest.findFirst({
      where: {
        employeeId: r.employeeId,
        type: r.type,
        startDate: r.startDate,
        status: r.status as never,
      },
    });
    if (existing) continue;

    await prisma.leaveRequest.create({
      data: {
        employeeId: r.employeeId,
        type: r.type,
        startDate: r.startDate,
        endDate: r.endDate,
        durationDays: r.durationDays,
        status: r.status as never,
        reason: r.reason,
        requiresOpsHeadApproval: r.requiresOpsHeadApproval ?? false,
        managerApprovedById: r.managerApprovedById,
        managerApprovedAt: r.status === 'PENDING' ? null : r.startDate,
      },
    });
  }

  // Omar's OTHER-type leave escalated to ops head queue.
  if (omarEmp) {
    const existing = await prisma.leaveRequest.findFirst({
      where: { employeeId: omarEmp.id, type: LeaveType.OTHER, status: 'PENDING_OPS_HEAD' },
    });
    if (!existing) {
      await prisma.leaveRequest.create({
        data: {
          employeeId: omarEmp.id,
          type: LeaveType.OTHER,
          startDate: today,
          endDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
          durationDays: 3,
          status: 'PENDING_OPS_HEAD',
          reason: 'Bereavement leave — family emergency abroad',
          requiresOpsHeadApproval: true,
          managerApprovedById: managerEmp.id,
          managerApprovedAt: today,
        },
      });
    }
  }

  // ── Leave balances ───────────────────────────────────────────────────
  // Balances are self-consistent with the approved requests above:
  // usedDays = sum of APPROVED request durations for that type; pendingDays
  // = sum of PENDING/PENDING_OPS_HEAD request durations for that type.
  const balances = [
    // Sara Javed — current month
    { employeeId: saraEmp.id, leaveType: LeaveType.ANNUAL, usedDays: 2, pendingDays: 0 },
    { employeeId: saraEmp.id, leaveType: LeaveType.SICK, usedDays: 3, pendingDays: 5 },
    { employeeId: saraEmp.id, leaveType: LeaveType.CASUAL, usedDays: 2, pendingDays: 0 },
    { employeeId: saraEmp.id, leaveType: LeaveType.WFH, usedDays: 0, pendingDays: 1 },
    { employeeId: saraEmp.id, leaveType: LeaveType.UNPAID, usedDays: 0, pendingDays: 0 },
    { employeeId: saraEmp.id, leaveType: LeaveType.OTHER, usedDays: 0, pendingDays: 0 },
    // Fawad Khan — current month
    { employeeId: fawadEmp.id, leaveType: LeaveType.SICK, usedDays: 2, pendingDays: 0 },
  ];
  // Omar Mirza — pending OTHER leave awaiting ops head approval (not deducted)
  if (omarEmp) {
    balances.push({ employeeId: omarEmp.id, leaveType: LeaveType.OTHER, usedDays: 0, pendingDays: 3 });
  }

  for (const b of balances) {
    await prisma.leaveBalance.upsert({
      where: {
        employeeId_leaveType_year_month: {
          employeeId: b.employeeId,
          leaveType: b.leaveType,
          year,
          month,
        },
      },
      update: {
        allocatedDays: 20,
        usedDays: b.usedDays,
        pendingDays: b.pendingDays,
      },
      create: {
        employeeId: b.employeeId,
        leaveType: b.leaveType,
        year,
        month,
        allocatedDays: 20,
        usedDays: b.usedDays,
        pendingDays: b.pendingDays,
      },
    });
  }

  console.log('✅ Leave Data Seeded!');
}
