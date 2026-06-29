import { LeaveType } from '@prisma/client';

/** Quota per leave type (days/year). Adjust as per HR policy. */
export const DEFAULT_LEAVE_QUOTA: Record<LeaveType, number> = {
  ANNUAL: 20,
  SICK: 10,
  CASUAL: 6,
  WFH: 20,
  UNPAID: 0,
  MATERNITY: 90,
  OTHER: 0,
};
