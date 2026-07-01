import { z } from 'zod';
import { dateOfBirthErrorMessage, isValidEmployeeDateOfBirth } from '../../shared/validation/date-of-birth';
import {
  isProbationEndAfterJoinDate,
  isValidJoiningDate,
  joiningDateErrorMessage,
  probationEndErrorMessage,
} from '../../shared/validation/employment-dates';

const dateFieldSchema = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
]);

const dateOfBirthSchema = dateFieldSchema
  .nullable()
  .optional()
  .refine((value) => value == null || value === '' || isValidEmployeeDateOfBirth(value), {
    message: dateOfBirthErrorMessage(),
  });

// ============================================================================
// PARAMS
// ============================================================================

export const employeeParamsSchema = z.object({
  id: z.string().min(1, 'Employee ID is required'),
});

export type EmployeeParams = z.infer<typeof employeeParamsSchema>;

// ============================================================================
// QUERY – list employees (supports optional department filter)
// ============================================================================

export const listEmployeesQuerySchema = z.object({
  department: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  page: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : 50)),
});

export type ListEmployeesQuery = z.infer<typeof listEmployeesQuerySchema>;

// ============================================================================
// BODY – update personal information
// ============================================================================

export const updatePersonalBodySchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  preferredName: z.string().nullable().optional(),
  dateOfBirth: dateOfBirthSchema,
  gender: z.string().nullable().optional(),
  nationality: z.string().nullable().optional(),
  cnic: z.string().nullable().optional(),
  personalEmail: z.union([z.string().email(), z.literal('')]).nullable().optional(),
  personalPhone: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  emergencyContactName: z.string().nullable().optional(),
  emergencyContactRelation: z.string().nullable().optional(),
  emergencyContactPhone: z.string().nullable().optional(),
  homeAddress: z.string().nullable().optional(),
  socialHandle: z.string().nullable().optional(),
});

export type UpdatePersonalBody = z.infer<typeof updatePersonalBodySchema>;

const joiningDateSchema = dateFieldSchema
  .nullable()
  .optional()
  .refine((value) => value == null || value === '' || isValidJoiningDate(value), {
    message: joiningDateErrorMessage(),
  });

export const updateEmploymentBodySchema = z
  .object({
    department: z.string().nullable().optional(),
    designation: z.string().nullable().optional(),
    grade: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    employeeType: z.string().nullable().optional(),
    employmentStatus: z.string().nullable().optional(),
    contractType: z.string().nullable().optional(),
    joiningDate: joiningDateSchema,
    probationEnd: dateFieldSchema.nullable().optional(),
    managerId: z.string().cuid().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.joiningDate && data.probationEnd) {
      if (!isProbationEndAfterJoinDate(data.joiningDate, data.probationEnd)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['probationEnd'],
          message: probationEndErrorMessage(),
        });
      }
    }
  });

export type UpdateEmploymentBody = z.infer<typeof updateEmploymentBodySchema>;

export const managerOptionsQuerySchema = z.object({
  excludeId: z.string().cuid().optional(),
});

export type ManagerOptionsQuery = z.infer<typeof managerOptionsQuerySchema>;

// ============================================================================
// BODY – manage skills (add / update / remove)
// ============================================================================

export const upsertSkillBodySchema = z.object({
  skillName: z.string().min(1),
  percentage: z.number().int().min(0).max(100).nullable().optional(),
});

export const deleteSkillParamsSchema = z.object({
  id: z.string().min(1),
  skillId: z.string().min(1),
});

export type UpsertSkillBody = z.infer<typeof upsertSkillBodySchema>;
export type DeleteSkillParams = z.infer<typeof deleteSkillParamsSchema>;

// ============================================================================
// QUERY – employee payslips
// ============================================================================

export const employeePayslipsQuerySchema = z.object({
  year: z
    .string()
    .optional()
    .transform((v) => (v ? parseInt(v, 10) : new Date().getFullYear())),
});

export const employeePayslipParamsSchema = z.object({
  id: z.string().min(1),
  payslipId: z.string().min(1),
});

export type EmployeePayslipsQuery = z.infer<typeof employeePayslipsQuerySchema>;
export type EmployeePayslipParams = z.infer<typeof employeePayslipParamsSchema>;
