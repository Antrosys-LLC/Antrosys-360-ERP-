import { LeaveType, Prisma } from '@prisma/client';
import { DEFAULT_LEAVE_QUOTA } from './leave-quota.constants';

type LeaveBalanceDb = Pick<Prisma.TransactionClient, 'leaveBalance'>;

/** Returns true when a leave must be escalated to Operations Head after manager approval. */
export async function requiresOpsHeadApproval(
  db: LeaveBalanceDb,
  employeeId: string,
  type: LeaveType,
  durationDays: number,
  year: number,
  month: number,
): Promise<boolean> {
  if (type === 'OTHER') return true;

  const balance = await db.leaveBalance.findUnique({
    where: { employeeId_leaveType_year_month: { employeeId, leaveType: type, year, month } },
  });

  const allocated = Number(balance?.allocatedDays ?? DEFAULT_LEAVE_QUOTA[type]);
  const used = Number(balance?.usedDays ?? 0);
  const pending = Number(balance?.pendingDays ?? 0);

  return used + pending + durationDays > allocated;
}
