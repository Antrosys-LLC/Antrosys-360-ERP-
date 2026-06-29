const MIN_EMPLOYEE_AGE = 15;

export function parseDateOnly(value: string): Date | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(`${value}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function isValidEmployeeDateOfBirth(value: string | Date): boolean {
  const dob = value instanceof Date ? value : parseDateOnly(value);
  if (!dob) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dobDay = new Date(dob);
  dobDay.setHours(0, 0, 0, 0);

  if (dobDay >= today) {
    return false;
  }

  const youngestAllowed = new Date(today);
  youngestAllowed.setFullYear(youngestAllowed.getFullYear() - MIN_EMPLOYEE_AGE);

  return dobDay <= youngestAllowed;
}

export function dateOfBirthErrorMessage(): string {
  return `Date of birth must be in the past and the employee must be at least ${MIN_EMPLOYEE_AGE} years old`;
}

export { MIN_EMPLOYEE_AGE };
