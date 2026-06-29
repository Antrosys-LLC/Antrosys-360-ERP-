import { parseDateOnly } from './date-of-birth';

function toDay(value: string | Date): Date | null {
  const parsed = value instanceof Date ? new Date(value) : parseDateOnly(value);
  if (!parsed) return null;

  const day = new Date(parsed);
  day.setHours(0, 0, 0, 0);
  return day;
}

export function isValidJoiningDate(value: string | Date): boolean {
  const joinDay = toDay(value);
  if (!joinDay) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return joinDay <= today;
}

export function isProbationEndAfterJoinDate(
  joinDate: string | Date,
  probationEnd: string | Date,
): boolean {
  const joinDay = toDay(joinDate);
  const probationDay = toDay(probationEnd);
  if (!joinDay || !probationDay) return false;

  return probationDay > joinDay;
}

export function joiningDateErrorMessage(): string {
  return 'Join date cannot be in the future';
}

export function probationEndErrorMessage(): string {
  return 'Probation end must be after join date';
}

export function validateEmploymentDates(
  joiningDate: string | Date | null | undefined,
  probationEnd: string | Date | null | undefined,
): string | null {
  if (joiningDate) {
    if (!isValidJoiningDate(joiningDate)) {
      return joiningDateErrorMessage();
    }
  }

  if (joiningDate && probationEnd) {
    if (!isProbationEndAfterJoinDate(joiningDate, probationEnd)) {
      return probationEndErrorMessage();
    }
  }

  return null;
}
