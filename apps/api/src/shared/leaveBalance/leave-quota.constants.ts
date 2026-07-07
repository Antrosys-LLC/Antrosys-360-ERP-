import { LeaveType } from '@prisma/client';

/** Monthly quota per leave type. Reset on the 1st of each month. */
export const DEFAULT_LEAVE_QUOTA: Record<LeaveType, number> = {
  ANNUAL: 20,
  SICK: 20,
  CASUAL: 20,
  WFH: 20,
  UNPAID: 20,
  MATERNITY: 20,
  OTHER: 20,
};
