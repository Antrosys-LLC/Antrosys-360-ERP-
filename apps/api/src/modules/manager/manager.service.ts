import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { PostAnnouncementInput } from './manager.schema';

export async function getDashboardData(userId: string, userRole: string) {
  // 1. Get logged-in user's employee record
  const employee = await prisma.employee.findUnique({
    where: { userId },
  });

  if (!employee) {
    throw new Error('Logged in user is not registered as an employee');
  }

  const isSubManager = userRole === 'SUB_MANAGER';

  // 2. Resolve data scope (team employees)
  let teamEmployees: any[] = [];
  if (isSubManager) {
    // Sub-Manager: reports to Main Manager, only manages direct reports
    teamEmployees = await prisma.employee.findMany({
      where: { managerId: employee.id, isActive: true, user: { role: 'EMPLOYEE' } },
      include: {
        user: {
          select: { email: true }
        }
      }
    });
  } else {
    // Main Manager / CEO / Operations Head: manages all active employees in their department
    // or all active employees globally (excluding themselves)
    teamEmployees = await prisma.employee.findMany({
      where: {
        id: { not: employee.id },
        isActive: true,
        user: { role: 'EMPLOYEE' },
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    });
  }

  const teamEmployeeIds = teamEmployees.map((e) => e.id);
  const teamUserIds = teamEmployees.map((e) => e.userId);

  // 3. Define start of today in UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // 4. Fetch today's attendance for the team
  const attendancesToday = await prisma.attendance.findMany({
    where: {
      employeeId: { in: teamEmployeeIds },
      date: today,
    },
  });

  const attendanceMap = new Map(attendancesToday.map((a) => [a.employeeId, a]));

  // 5. Build team attendance table data
  const attendanceTable = teamEmployees.map((emp) => {
    const att = attendanceMap.get(emp.id);
    return {
      employeeId: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      role: emp.designation || 'Staff',
      checkIn: att?.checkIn ? att.checkIn.toISOString() : null,
      checkOut: att?.checkOut ? att.checkOut.toISOString() : null,
      status: att?.status || 'ABSENT',
      hours: att?.hours ? Number(att.hours) : 0,
      isFlagged: att?.isFlagged || false,
    };
  });

  // 6. Calculate summary metrics
  const totalEmployees = teamEmployees.length;
  const presentCount = attendanceTable.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
  const absentCount = totalEmployees - presentCount;

  // 7. Fetch pending leave requests for the team
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: teamEmployeeIds },
      status: 'PENDING',
    },
    include: {
      employee: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const leavesPendingCount = leaveRequests.length;

  const formattedLeaves = leaveRequests.map((req) => ({
    id: req.id,
    name: `${req.employee.firstName} ${req.employee.lastName}`,
    type: req.type,
    startDate: req.startDate.toISOString(),
    endDate: req.endDate.toISOString(),
    durationDays: req.durationDays,
    status: req.status,
    reason: req.reason,
  }));

  // 8. Fetch department KPIs
  const departmentName = employee.department || 'Operations';
  let kpis = await prisma.departmentKpi.findUnique({
    where: { department: departmentName },
  });

  // Fallback to default KPIs if not seeded yet
  if (!kpis) {
    kpis = {
      id: 'default',
      department: departmentName,
      sprintVelocity: 84,
      bugResolution: 72,
      codeReview: 78,
      deliveryOnTime: 91,
      teamUtilization: 82,
      openTickets: 64,
      documentation: 48,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  // 9. Fetch announcements (latest 50 to allow scrolling)
  const announcements = await prisma.announcement.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  const formattedAnnouncements = announcements.map((ann) => ({
    id: ann.id,
    author: `${ann.author.firstName} ${ann.author.lastName}`,
    title: ann.title,
    content: ann.content,
    createdAt: ann.createdAt.toISOString(),
  }));

  // 10. Fetch weekly mood pulse stats
  const weeklyMood = await prisma.teamMoodPulse.findFirst({
    where: { department: departmentName },
    orderBy: { date: 'desc' },
  });

  const moodPulse = {
    happy: weeklyMood?.happy || 4,
    neutral: weeklyMood?.neutral || 3,
    stressed: weeklyMood?.stressed || 2,
    unknown: weeklyMood?.unknown || 1,
  };

  return {
    metrics: {
      presentCount,
      totalEmployees,
      absentCount,
      leavesPendingCount,
      deptKpiAvg: Math.round((kpis.sprintVelocity + kpis.bugResolution + kpis.codeReview) / 3),
    },
    attendance: attendanceTable,
    leaves: formattedLeaves,
    kpis: {
      sprintVelocity: kpis.sprintVelocity,
      bugResolution: kpis.bugResolution,
      codeReview: kpis.codeReview,
      deliveryOnTime: kpis.deliveryOnTime,
      teamUtilization: kpis.teamUtilization,
      openTickets: kpis.openTickets,
      documentation: kpis.documentation,
    },
    announcements: formattedAnnouncements,
    moodPulse,
  };
}

export async function updateLeaveStatus(leaveId: string, status: 'APPROVED' | 'REJECTED', userId: string, userRole: string) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
  });

  if (!employee) {
    throw new Error('Logged in user is not registered as an employee');
  }

  const leave = await prisma.leaveRequest.findUnique({
    where: { id: leaveId },
    include: { employee: true },
  });

  if (!leave) {
    return null;
  }

  // Sub-manager check: can only edit leaves for direct reports
  if (userRole === 'SUB_MANAGER' && leave.employee.managerId !== employee.id) {
    throw new Error('Unauthorized: Sub-manager can only manage leaves for their team');
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status,
        approvedById: status === 'APPROVED' ? employee.id : null,
      },
    });

    // Write audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: `LEAVE_${status}`,
        metadata: {
          leaveId,
          employeeId: leave.employeeId,
          status,
        },
      },
    });

    return updated;
  });
}

export async function approveAllLeaves(userId: string, userRole: string) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
  });

  if (!employee) {
    throw new Error('Logged in user is not registered as an employee');
  }

  const isSubManager = userRole === 'SUB_MANAGER';
  const targetFilter = isSubManager
    ? { employee: { managerId: employee.id } }
    : {};

  return prisma.$transaction(async (tx) => {
    const pendingLeaves = await tx.leaveRequest.findMany({
      where: {
        status: 'PENDING',
        ...targetFilter,
      },
      include: { employee: true },
    });

    if (pendingLeaves.length === 0) {
      return { count: 0 };
    }

    const updated = await tx.leaveRequest.updateMany({
      where: {
        id: { in: pendingLeaves.map((l) => l.id) },
      },
      data: {
        status: 'APPROVED',
        approvedById: employee.id,
      },
    });

    // Write audit logs
    for (const leave of pendingLeaves) {
      await tx.auditLog.create({
        data: {
          userId,
          action: 'LEAVE_APPROVED_ALL',
          metadata: {
            leaveId: leave.id,
            employeeId: leave.employeeId,
          },
        },
      });
    }

    return { count: updated.count };
  });
}

export async function postAnnouncement(userId: string, userRole: string, payload: PostAnnouncementInput) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
  });

  if (!employee) {
    throw new Error('Logged in user is not registered as an employee');
  }

  return prisma.$transaction(async (tx) => {
    // 1. Create the announcement
    const announcement = await tx.announcement.create({
      data: {
        title: payload.title,
        content: payload.content,
        authorId: employee.id,
      },
    });

    // 2. Identify scoped team users to notify
    const isSubManager = userRole === 'SUB_MANAGER';
    let teamEmployees = [];

    if (isSubManager) {
      teamEmployees = await tx.employee.findMany({
        where: { managerId: employee.id, isActive: true },
      });
    } else {
      teamEmployees = await tx.employee.findMany({
        where: { id: { not: employee.id }, isActive: true },
      });
    }

    // Include the manager itself
    const recipientUserIds = [userId, ...teamEmployees.map((e) => e.userId)];

    // 3. Create notifications for all recipients
    for (const recipientId of recipientUserIds) {
      await tx.notification.create({
        data: {
          userId: recipientId,
          title: 'New Announcement',
          message: `${employee.firstName} posted: "${payload.title}"`,
        },
      });
    }

    // 4. Log the audit record
    await tx.auditLog.create({
      data: {
        userId,
        action: 'ANNOUNCEMENT_CREATE',
        metadata: {
          announcementId: announcement.id,
          title: payload.title,
        },
      },
    });

    return announcement;
  });
}

export async function overrideAttendance(targetEmployeeId: string, status: string, userId: string, userRole: string) {
  const managerEmployee = await prisma.employee.findUnique({
    where: { userId },
  });

  if (!managerEmployee) {
    throw new Error('Logged in user is not registered as an employee');
  }

  const targetEmployee = await prisma.employee.findUnique({
    where: { id: targetEmployeeId },
  });

  if (!targetEmployee) {
    throw new Error('Target employee not found');
  }

  if (userRole === 'SUB_MANAGER' && targetEmployee.managerId !== managerEmployee.id) {
    throw new Error('Unauthorized: Sub-manager can only override attendance for their team');
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: targetEmployeeId,
        date: today,
      },
    },
  });

  return prisma.$transaction(async (tx) => {
    let result;

    const checkInTime = status === 'PRESENT' || status === 'LATE' ? new Date() : null;
    const checkOutTime = status === 'ABSENT' || status === 'LEAVE' ? null : null;
    const workingHours = status === 'PRESENT' ? 8.0 : status === 'LATE' ? 6.5 : 0;

    if (existingAttendance) {
      result = await tx.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          hours: workingHours,
        },
      });
    } else {
      result = await tx.attendance.create({
        data: {
          employeeId: targetEmployeeId,
          date: today,
          status,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          hours: workingHours,
        },
      });
    }

    // Create Notification for the overridden employee
    await tx.notification.create({
      data: {
        userId: targetEmployee.userId,
        title: 'Attendance Status Override',
        message: `Your attendance status for today was updated to ${status} by your manager.`,
      },
    });

    // Write audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: 'ATTENDANCE_OVERRIDE',
        metadata: {
          targetEmployeeId,
          originalStatus: existingAttendance?.status || 'NONE',
          newStatus: status,
        },
      },
    });

    return result;
  });
}

export async function toggleFlag(targetEmployeeId: string, isFlagged: boolean, userId: string, userRole: string) {
  const managerEmployee = await prisma.employee.findUnique({
    where: { userId },
  });

  if (!managerEmployee) {
    throw new Error('Logged in user is not registered as an employee');
  }

  const targetEmployee = await prisma.employee.findUnique({
    where: { id: targetEmployeeId },
  });

  if (!targetEmployee) {
    throw new Error('Target employee not found');
  }

  if (userRole === 'SUB_MANAGER' && targetEmployee.managerId !== managerEmployee.id) {
    throw new Error('Unauthorized: Sub-manager can only flag attendance for their team');
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const existingAttendance = await prisma.attendance.findUnique({
    where: {
      employeeId_date: {
        employeeId: targetEmployeeId,
        date: today,
      },
    },
  });

  return prisma.$transaction(async (tx) => {
    let result;

    if (existingAttendance) {
      result = await tx.attendance.update({
        where: { id: existingAttendance.id },
        data: { isFlagged },
      });
    } else {
      result = await tx.attendance.create({
        data: {
          employeeId: targetEmployeeId,
          date: today,
          status: 'ABSENT',
          isFlagged,
        },
      });
    }

    // Notify employee if flagged
    if (isFlagged) {
      await tx.notification.create({
        data: {
          userId: targetEmployee.userId,
          title: 'Flagged Check-in',
          message: 'Your attendance check-in for today has been flagged by your manager.',
        },
      });
    }

    // Write audit log
    await tx.auditLog.create({
      data: {
        userId,
        action: isFlagged ? 'ATTENDANCE_FLAG' : 'ATTENDANCE_UNFLAG',
        metadata: {
          targetEmployeeId,
        },
      },
    });

    return result;
  });
}
