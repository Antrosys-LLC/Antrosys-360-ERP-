import { PrismaClient, LeaveType } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedLeaveData() {
  console.log('🌴 Seeding Leave Data...');

  const saraUser = await prisma.user.findFirst({ where: { email: 'sara.javed@antrosys.com' } });
  const fawadUser = await prisma.user.findFirst({ where: { email: 'fawad.khan@antrosys.com' } });
  const subManager = await prisma.user.findFirst({ where: { email: 'sub_manager@antrosys.com' } });

  const saraEmp = await prisma.employee.findFirst({ where: { userId: saraUser?.id } });
  const fawadEmp = await prisma.employee.findFirst({ where: { userId: fawadUser?.id } });
  const mgrEmp = await prisma.employee.findFirst({ where: { userId: subManager?.id } });

  if (!saraEmp || !fawadEmp || !mgrEmp) {
    console.error('Required employees not found, skipping leave seed.');
    return;
  }

  // Clear existing leave requests and balances
  await prisma.leaveRequest.deleteMany({});
  await prisma.leaveBalance.deleteMany({});

  // Year for balances
  const currentYear = new Date().getFullYear();

  // Create Leave Balances for Sara Javed (matches mock UI)
  await prisma.leaveBalance.createMany({
    data: [
      { employeeId: saraEmp.id, year: currentYear, type: LeaveType.ANNUAL, totalDays: 20, takenDays: 8 }, // 12 remaining
      { employeeId: saraEmp.id, year: currentYear, type: LeaveType.SICK, totalDays: 10, takenDays: 2 }, // 8 remaining
      { employeeId: saraEmp.id, year: currentYear, type: LeaveType.CASUAL, totalDays: 6, takenDays: 3 }, // 3 remaining
      { employeeId: saraEmp.id, year: currentYear, type: LeaveType.WFH, totalDays: 20, takenDays: 6 }, // 14 remaining
      { employeeId: saraEmp.id, year: currentYear, type: LeaveType.UNPAID, totalDays: 0, takenDays: 0 },
    ],
  });

  // Create Leave Requests for Sara
  await prisma.leaveRequest.create({
    data: {
      employeeId: saraEmp.id,
      type: LeaveType.ANNUAL,
      startDate: new Date('2024-05-22T00:00:00.000Z'),
      endDate: new Date('2024-05-24T00:00:00.000Z'),
      durationDays: 3,
      status: 'PENDING',
      reason: 'Family trip',
    },
  });

  await prisma.leaveRequest.create({
    data: {
      employeeId: saraEmp.id,
      type: LeaveType.WFH,
      startDate: new Date('2024-05-17T00:00:00.000Z'),
      endDate: new Date('2024-05-17T00:00:00.000Z'),
      durationDays: 1,
      status: 'PENDING',
      reason: 'Personal work',
    },
  });

  // Create Leave Requests for Fawad
  await prisma.leaveRequest.create({
    data: {
      employeeId: fawadEmp.id,
      type: LeaveType.SICK,
      startDate: new Date('2024-05-14T00:00:00.000Z'),
      endDate: new Date('2024-05-15T00:00:00.000Z'),
      durationDays: 2,
      status: 'PENDING',
      reason: 'Flu & fever',
    },
  });

  console.log('✅ Leave Data Seeded!');
}
