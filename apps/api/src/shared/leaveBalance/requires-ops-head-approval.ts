import { LeaveType, Prisma } from '@prisma/client';
import { DEFAULT_LEAVE_QUOTA } from './leave-quota.constants';

type LeaveBalanceClient = {
  leaveBalance: {
    findUnique: (args: {
      where: { employeeId_leaveType_year: { employeeId: string; leaveType: LeaveType; year: number } };
    }) => Promise<{ allocatedDays: Prisma.Decimal; usedDays: Prisma.Decimal; pendingDays: Prisma.Decimal } | null>;
  };
};

/** Returns true when a leave must be escalated to Operations Head after manager approval. */
export async function requiresOpsHeadApproval(
  db: LeaveBalanceClient,
  employeeId: string,
  type: LeaveType,
  durationDays: number,
): Promise<boolean> {
  if (type === 'OTHER') return true;

  const year = new Date().getFullYear();
  const balance = await db.leaveBalance.findUnique({
    where: { employeeId_leaveType_year: { employeeId, leaveType: type, year } },
  });

  const allocated = Number(balance?.allocatedDays ?? DEFAULT_LEAVE_QUOTA[type]);
  const used = Number(balance?.usedDays ?? 0);
  const pending = Number(balance?.pendingDays ?? 0);

  return used + pending + durationDays > allocated;
}
