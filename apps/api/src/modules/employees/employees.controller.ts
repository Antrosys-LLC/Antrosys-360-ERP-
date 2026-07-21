import { FastifyRequest, FastifyReply } from 'fastify';
import {
  employeeParamsSchema,
  listEmployeesQuerySchema,
  updatePersonalBodySchema,
  updateEmploymentBodySchema,
  upsertSkillBodySchema,
  deleteSkillParamsSchema,
  employeePayslipsQuerySchema,
  employeePayslipParamsSchema,
  employeeAttendanceQuerySchema,
  managerOptionsQuerySchema,
} from './employees.schema';
import * as employeesService from './employees.service';
import { buildOfficeAccessForEmployee } from './office-access';
import { canUserEditEmployee } from './employees.scope';

// ============================================================================
// GET /employees – List all employees
// ============================================================================

export async function listEmployeesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listEmployeesQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const result = await employeesService.listEmployees(parsed.data);

    return reply.code(200).send({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to list employees',
    });
  }
}

// ============================================================================
// GET /employees/:id – Get full employee profile
// ============================================================================

export async function getEmployeeHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = employeeParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const employee = await employeesService.getEmployeeById(parsed.data.id);
    if (!employee) {
      return reply.code(404).send({ error: 'Employee not found' });
    }

    // ----- Format response to match frontend data contracts -----

    // Calculate tenure from joining date
    const joiningDate = employee.joiningDate ? new Date(employee.joiningDate) : null;
    let tenure = '';
    let sinceDate = '—';
    if (joiningDate) {
      const now = new Date();
      const years = now.getFullYear() - joiningDate.getFullYear();
      tenure = years <= 0 ? '< 1 yr tenure' : `${years} yrs tenure`;
      sinceDate = joiningDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }

    // Attendance percentage from recent records
    const attendanceRecords = employee.attendances || [];
    const presentCount = attendanceRecords.filter(
      (a) => a.status === 'PRESENT' || a.status === 'LATE',
    ).length;
    const attendancePercentage =
      attendanceRecords.length > 0 ? Math.round((presentCount / attendanceRecords.length) * 100) : 0;

    // Manager name
    const reportsTo = employee.manager
      ? `${employee.manager.firstName} ${employee.manager.lastName}`
      : null;

    // Initials
    const initials =
      (employee.firstName?.[0] || '') + (employee.lastName?.[0] || '');

    // Full name
    const fullName = `${employee.firstName} ${employee.lastName}`;

    // Skills: separate tags (all) vs progress bars (those with percentage)
    const skillTags = employee.skills.map((s) => s.skillName);
    const skillProgress = employee.skills
      .filter((s) => s.percentage !== null)
      .map((s) => ({ skill: s.skillName, percentage: s.percentage }));

    const data = {
      employee: {
        id: employee.id,
        employeeCode: employee.employeeCode,
        firstName: employee.firstName,
        lastName: employee.lastName,
        preferredName: employee.preferredName,
        dateOfBirth: employee.dateOfBirth,
        gender: employee.gender,
        nationality: employee.nationality,
        cnic: employee.cnic,
        personalEmail: employee.personalEmail,
        personalPhone: employee.personalPhone,
        phone: employee.phone,
        department: employee.department,
        designation: employee.designation,
        grade: employee.grade,
        location: employee.location,
        employeeType: employee.employeeType,
        employmentStatus: employee.employmentStatus,
        contractType: employee.contractType,
        joiningDate: employee.joiningDate,
        probationEnd: employee.probationEnd,
        socialHandle: employee.socialHandle,
        homeAddress: employee.homeAddress,
        emergencyContactName: employee.emergencyContactName,
        emergencyContactRelation: employee.emergencyContactRelation,
        emergencyContactPhone: employee.emergencyContactPhone,
        performanceScore: employee.performanceScore,
        kpiScore: employee.kpiScore,
        isActive: employee.isActive,
        managerId: employee.managerId,
        email: employee.user.email,
        role: employee.user.role,
      },

      headerData: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        name: fullName,
        initials: initials.toUpperCase(),
        role: employee.designation || '',
        department: employee.department ? `${employee.department} dept` : '',
        sinceDate,
        status: employee.employmentStatus || (employee.isActive ? 'Active' : 'Inactive'),
        type: employee.employeeType || employee.contractType || '',
        location: employee.location || '',
        tenure,
        empId: employee.employeeCode ? `ID: ${employee.employeeCode}` : '',
        email: employee.user.email,
        phone: employee.phone || '',
        handle: employee.socialHandle || '',
        reportsTo: reportsTo || '',
        contractType: employee.contractType || '',
        metrics: [
          {
            label: 'Attendance',
            value: `${attendancePercentage}%`,
            strokeColor: '#7B6AE6',
            percentage: attendancePercentage,
          },
          {
            label: 'Performance',
            value: `${employee.performanceScore ?? 0}%`,
            strokeColor: '#10B981',
            percentage: employee.performanceScore ?? 0,
          },
          {
            label: 'KPI avg',
            value: `${employee.kpiScore ?? 0}%`,
            strokeColor: '#F59E0B',
            percentage: employee.kpiScore ?? 0,
          },
        ],
      },

      personalInformation: {
        fields: [
          { label: 'Full name', value: fullName },
          { label: 'Preferred name', value: employee.preferredName || '' },
          {
            label: 'Date of birth',
            value: employee.dateOfBirth
              ? new Date(employee.dateOfBirth).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '',
          },
          { label: 'Gender', value: employee.gender || '' },
          { label: 'Nationality', value: employee.nationality || '' },
          { label: 'CNIC', value: employee.cnic || '' },
          { label: 'Personal email', value: employee.personalEmail || '' },
          { label: 'Personal phone', value: employee.personalPhone || '' },
        ],
        emergencyContact: employee.emergencyContactName
          ? `${employee.emergencyContactName}${employee.emergencyContactRelation ? ` (${employee.emergencyContactRelation})` : ''} — ${employee.emergencyContactPhone || 'N/A'}`
          : '',
        homeAddress: employee.homeAddress || '',
      },

      employmentSnapshot: [
        { label: 'Employee ID', value: employee.employeeCode || 'N/A', isLink: false },
        { label: 'Department', value: employee.department || 'N/A', isLink: false },
        { label: 'Designation', value: employee.designation || 'N/A', isLink: false },
        { label: 'Grade', value: employee.grade || 'N/A', isLink: false },
        { label: 'Line Manager', value: reportsTo || 'N/A', isLink: !!reportsTo },
        {
          label: 'Join Date',
          value: employee.joiningDate
            ? new Date(employee.joiningDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'N/A',
          isLink: false,
        },
        {
          label: 'Probation End',
          value: employee.probationEnd
            ? new Date(employee.probationEnd).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })
            : 'N/A',
          isLink: false,
          verified: !!employee.probationEnd,
        },
        { label: 'Emp Type', value: employee.contractType || 'N/A', isLink: false },
      ],

      skillsData: {
        tags: skillTags,
        progress: skillProgress,
      },

      skills: employee.skills.map((s) => ({
        id: s.id,
        skillName: s.skillName,
        percentage: s.percentage,
      })),

      officeAccess: await buildOfficeAccessForEmployee(employee),
    };

    const canEdit = await canUserEditEmployee(request.user.id, request.user.role, employee.id);

    return reply.code(200).send({ status: 'success', data, canEdit });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to get employee profile',
    });
  }
}

// ============================================================================
// GET /employees/manager-options – Line manager picker options
// ============================================================================

export async function listManagerOptionsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = managerOptionsQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const options = await employeesService.listManagerOptions(parsed.data);
    return reply.code(200).send({ status: 'success', data: options });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to list manager options',
    });
  }
}

export async function getEmploymentFieldOptionsHandler(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const options = await employeesService.getEmploymentFieldOptions();
    return reply.code(200).send({ status: 'success', data: options });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to get employment field options',
    });
  }
}

// ============================================================================
// PUT /employees/:id – Update employee personal info
// ============================================================================

export async function updateEmployeeHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = updatePersonalBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const updated = await employeesService.updateEmployee(paramsParsed.data.id, bodyParsed.data);
  if (!updated) {
    return reply.code(404).send({ error: 'Employee not found' });
  }

  return reply.code(200).send({ status: 'success', data: updated });
}

// ============================================================================
// PUT /employees/:id/employment – Update employee employment info
// ============================================================================

export async function updateEmployeeEmploymentHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = updateEmploymentBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  try {
    const updated = await employeesService.updateEmployeeEmployment(paramsParsed.data.id, bodyParsed.data);
    if (!updated) {
      return reply.code(404).send({ error: 'Employee not found' });
    }

    return reply.code(200).send({ status: 'success', data: updated });
  } catch (error) {
    return reply.code(400).send({
      error: error instanceof Error ? error.message : 'Failed to update employment details',
    });
  }
}

// ============================================================================
// POST /employees/:id/skills – Add or update a skill
// ============================================================================

export async function upsertSkillHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = upsertSkillBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  try {
    const skill = await employeesService.upsertSkill(paramsParsed.data.id, bodyParsed.data);
    return reply.code(200).send({ status: 'success', data: skill });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to upsert skill',
    });
  }
}

// ============================================================================
// DELETE /employees/:id/skills/:skillId – Remove a skill
// ============================================================================

export async function deleteSkillHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = deleteSkillParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  try {
    const deleted = await employeesService.deleteSkill(paramsParsed.data.id, paramsParsed.data.skillId);
    if (!deleted) {
      return reply.code(404).send({ error: 'Skill not found' });
    }

    return reply.code(200).send({ status: 'success', data: { deleted: true } });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to delete skill',
    });
  }
}

// ============================================================================
// GET /employees/:id/payslips – List payslips for a year
// ============================================================================

export async function getEmployeePayslipsHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const queryParsed = employeePayslipsQuerySchema.safeParse(request.query);
  if (!queryParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: queryParsed.error.flatten() });
  }

  try {
    const result = await employeesService.getEmployeePayslips(paramsParsed.data.id, queryParsed.data);
    if (!result) {
      return reply.code(404).send({ error: 'Employee not found' });
    }

    return reply.code(200).send({ status: 'success', data: result });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to get employee payslips',
    });
  }
}

// ============================================================================
// GET /employees/:id/attendance – Monthly attendance logs for profile tab
// ============================================================================

export async function getEmployeeAttendanceHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const queryParsed = employeeAttendanceQuerySchema.safeParse(request.query);
  if (!queryParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: queryParsed.error.flatten() });
  }

  const result = await employeesService.getEmployeeAttendanceLogs(paramsParsed.data.id, queryParsed.data);
  if (!result) {
    return reply.code(404).send({ error: 'Employee not found' });
  }

  return reply.code(200).send({ status: 'success', data: result });
}

// ============================================================================
// GET /employees/:id/attendance/export – CSV export for attendance logs
// ============================================================================

export async function exportEmployeeAttendanceHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = employeeParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const queryParsed = employeeAttendanceQuerySchema.safeParse(request.query);
  if (!queryParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: queryParsed.error.flatten() });
  }

  const result = await employeesService.exportEmployeeAttendanceCsv(paramsParsed.data.id, queryParsed.data);
  if (!result) {
    return reply.code(404).send({ error: 'Employee not found' });
  }

  return reply
    .header('Content-Type', 'text/csv; charset=utf-8')
    .header('Content-Disposition', `attachment; filename="${result.filename}"`)
    .send(result.csv);
}

// ============================================================================
// GET /employees/:id/payslips/:payslipId/download – Download payslip PDF
// ============================================================================

export async function downloadEmployeePayslipHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = employeePayslipParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  try {
    const result = await employeesService.downloadEmployeePayslip(
      paramsParsed.data.id,
      paramsParsed.data.payslipId,
    );

    if (!result) {
      return reply.code(404).send({ error: 'Payslip not found' });
    }

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${result.filename}"`)
      .send(result.buffer);
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to download payslip',
    });
  }
}

// ============================================================================
// GET /employees/:id/letter – Download experience certificate PDF
// ============================================================================

export async function downloadEmployeeLetterHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = employeeParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const result = await employeesService.downloadEmployeeLetter(parsed.data.id);

    if (!result) {
      return reply.code(404).send({ error: 'Employee not found' });
    }

    return reply
      .header('Content-Type', 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${result.filename}"`)
      .send(result.buffer);
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to download employee letter',
    });
  }
}
