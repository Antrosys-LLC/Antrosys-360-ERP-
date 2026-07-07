import { LeaveType, Prisma } from '@prisma/client';
import { DEFAULT_LEAVE_QUOTA } from './leave-quota.constants';

export async function incrementLeaveBalanceOnApproval(
  tx: Prisma.TransactionClient,
  params: {
    employeeId: string;
    leaveType: LeaveType;
    startDate: Date;
    durationDays: number;
  },
) {
  const year = params.startDate.getFullYear();
  const month = params.startDate.getMonth() + 1;
  await tx.leaveBalance.upsert({
    where: {
      employeeId_leaveType_year_month: {
        employeeId: params.employeeId,
        leaveType: params.leaveType,
        year,
        month,
      },
    },
    update: {
      usedDays: { increment: params.durationDays },
    },
    create: {
      employeeId: params.employeeId,
      year,
      month,
      leaveType: params.leaveType,
      allocatedDays: DEFAULT_LEAVE_QUOTA[params.leaveType],
      usedDays: params.durationDays,
      pendingDays: 0,
    },
  });
}
