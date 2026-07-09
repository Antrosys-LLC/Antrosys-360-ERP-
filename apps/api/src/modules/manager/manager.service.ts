import { AttendanceStatus, LeaveRequestStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { incrementLeaveBalanceOnApproval } from '../../shared/leaveBalance/increment-leave-balance';
import { notifyUsersByRoles } from '../../shared/notifications/notify-by-role';
import { PostAnnouncementInput } from './manager.schema';
import {
  buildAttendanceTable,
  buildTeamKpiReportCsv,
  computeTeamKpis,
  computeTeamScheduleStats,
  getTodayUtc,
  TeamKpiReport,
} from './manager-team-stats';

function mapOverrideStatus(status: string): AttendanceStatus {
  if (status === 'ON LEAVE') return AttendanceStatus.LEAVE;
  if (status === 'PRESENT') return AttendanceStatus.PRESENT;
  if (status === 'ABSENT') return AttendanceStatus.ABSENT;
  if (status === 'LATE') return AttendanceStatus.LATE;
  return AttendanceStatus.ABSENT;
}

async function loadTeamSnapshot(teamId: string, today: Date) {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      manager: { select: { firstName: true, lastName: true } },
      directMembers: {
        where: { isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          designation: true,
          kpiScore: true,
          performanceScore: true,
        },
      },
    },
  });

  if (!team) {
    return null;
  }

  const teamEmployees = team.directMembers;
  const teamEmployeeIds = teamEmployees.map((member) => member.id);

  const [attendancesToday, pendingLeaves, approvedTeamLeaves] = await Promise.all([
    prisma.attendance.findMany({
      where: { employeeId: { in: teamEmployeeIds }, date: today },
    }),
    prisma.leaveRequest.findMany({
      where: { employeeId: { in: teamEmployeeIds }, status: 'PENDING' },
    }),
    prisma.leaveRequest.findMany({
      where: {
        employeeId: { in: teamEmployeeIds },
        status: 'APPROVED',
        endDate: { gte: today },
      },
    }),
  ]);

  const attendanceTable = buildAttendanceTable(teamEmployees, attendancesToday);
  const teamSchedule = computeTeamScheduleStats(
    attendanceTable,
    approvedTeamLeaves,
    pendingLeaves.length,
    today,
  );
  const kpis = computeTeamKpis(teamEmployees, teamSchedule, pendingLeaves.length);

  return {
    id: team.id,
    name: team.name,
    memberCount: teamEmployees.length,
    managerName: team.manager ? `${team.manager.firstName} ${team.manager.lastName}` : null,
    kpis,
    teamSchedule,
    attendanceSummary: {
      present: teamSchedule.presentCount,
      absent: teamSchedule.absentCount,
      onLeave: teamSchedule.onLeaveToday,
      total: teamEmployees.length,
    },
  };
}

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
  let managedTeam = null;
  
  if (isSubManager || userRole === 'MANAGER') {
    // Sub-Manager / Manager manages a specific team
    managedTeam = await prisma.team.findUnique({
      where: { managerId: employee.id }
    });
    
    if (managedTeam) {
      teamEmployees = await prisma.employee.findMany({
        where: { teamId: managedTeam.id, isActive: true },
        include: { user: { select: { email: true } } }
      });
    }
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

  const today = getTodayUtc();

  const attendancesToday = await prisma.attendance.findMany({
    where: {
      employeeId: { in: teamEmployeeIds },
      date: today,
    },
  });

  const attendanceTable = buildAttendanceTable(
    teamEmployees.map((emp) => ({
      id: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      designation: emp.designation,
      kpiScore: emp.kpiScore,
      performanceScore: emp.performanceScore,
    })),
    attendancesToday,
  );

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

  const approvedTeamLeaves = await prisma.leaveRequest.findMany({
    where: {
      employeeId: { in: teamEmployeeIds },
      status: 'APPROVED',
      endDate: { gte: today },
    },
  });

  const allTeamLeaves = [...leaveRequests, ...approvedTeamLeaves];

  const teamSchedule = computeTeamScheduleStats(
    attendanceTable,
    approvedTeamLeaves,
    leavesPendingCount,
    today,
  );

  const kpis = computeTeamKpis(
    teamEmployees.map((emp) => ({
      kpiScore: emp.kpiScore,
      performanceScore: emp.performanceScore,
    })),
    teamSchedule,
    leavesPendingCount,
  );

  let teams: Awaited<ReturnType<typeof loadTeamSnapshot>>[] = [];
  if (userRole === 'MANAGER') {
    const allTeams = await prisma.team.findMany({ select: { id: true }, orderBy: { name: 'asc' } });
    const snapshots = await Promise.all(allTeams.map((team) => loadTeamSnapshot(team.id, today)));
    teams = snapshots.filter((snapshot): snapshot is NonNullable<typeof snapshot> => snapshot != null);
  } else if (managedTeam) {
    const ownTeam = await loadTeamSnapshot(managedTeam.id, today);
    if (ownTeam) {
      teams = [ownTeam];
    }
  }

  const formattedLeaves = leaveRequests.map((req) => {
    // Consistent avatar color hash based on name
    const firstName = req.employee.firstName || '';
    const lastName = req.employee.lastName || '';
    const hash = firstName.charCodeAt(0) + (lastName ? lastName.charCodeAt(0) : 0);
    const colors = [
      { bg: 'bg-[#E3D5FF] dark:bg-purple-900/40', text: 'text-[#4A154B] dark:text-purple-300' },
      { bg: 'bg-[#CDEADD] dark:bg-emerald-900/40', text: 'text-[#1B4B36] dark:text-emerald-300' },
      { bg: 'bg-[#FFE2D5] dark:bg-orange-900/40', text: 'text-[#9C3915] dark:text-orange-300' },
      { bg: 'bg-[#D5E8FF] dark:bg-blue-900/40', text: 'text-[#154B9C] dark:text-blue-300' },
    ];
    const avatarColor = colors[hash % colors.length];
    
    // Check overlap
    const reqStart = new Date(req.startDate).getTime();
    const reqEnd = new Date(req.endDate).getTime();
    
    const overlapDetected = allTeamLeaves.some(otherReq => {
       if (otherReq.id === req.id) return false;
       const otherStart = new Date(otherReq.startDate).getTime();
       const otherEnd = new Date(otherReq.endDate).getTime();
       return reqStart <= otherEnd && reqEnd >= otherStart;
    });

    return {
      id: req.id,
      name: `${firstName} ${lastName}`,
      type: req.type,
      startDate: req.startDate.toISOString(),
      endDate: req.endDate.toISOString(),
      durationDays: req.durationDays,
      status: req.status,
      reason: req.reason,
      attachment: req.attachmentUrl || null,
      avatarColor,
      overlapDetected
    };
  });

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

  // 10. Fetch weekly mood pulse from team check-out moods
  const weekStart = new Date();
  weekStart.setUTCDate(weekStart.getUTCDate() - 6);
  weekStart.setUTCHours(0, 0, 0, 0);

  const teamMemberIds = teamEmployees.map((e) => e.id);
  const weeklyMoods = teamMemberIds.length > 0
    ? await prisma.employeeDailyMood.findMany({
        where: {
          employeeId: { in: teamMemberIds },
          date: { gte: weekStart },
        },
      })
    : [];

  const moodPulse = {
    happy: weeklyMoods.filter((m) => m.mood === 'HAPPY').length,
    neutral: weeklyMoods.filter((m) => m.mood === 'NEUTRAL').length,
    stressed: weeklyMoods.filter((m) => m.mood === 'STRESSED').length,
    unknown: Math.max(0, teamMemberIds.length - weeklyMoods.length),
  };

  const { presentCount, absentCount } = teamSchedule;
  const totalEmployees = teamEmployees.length;

  return {
    managedTeam: managedTeam
      ? { id: managedTeam.id, name: managedTeam.name }
      : null,
    teams,
    metrics: {
      presentCount,
      totalEmployees,
      absentCount,
      leavesPendingCount,
      deptKpiAvg: Math.round((kpis.sprintVelocity + kpis.bugResolution + kpis.codeReview) / 3),
    },
    attendance: attendanceTable,
    leaves: formattedLeaves,
    kpis,
    announcements: formattedAnnouncements,
    moodPulse,
    teamSchedule,
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

  if (leave.status !== 'PENDING') {
    throw new Error('Leave request is not pending');
  }

  // Sub-manager / Manager check: can only edit leaves for direct team
  if (userRole === 'SUB_MANAGER' || userRole === 'MANAGER') {
    const managedTeam = await prisma.team.findUnique({
      where: { managerId: employee.id }
    });
    if (!managedTeam || leave.employee.teamId !== managedTeam.id) {
      throw new Error('Unauthorized: You can only manage leaves for your team');
    }
  }

  const isFinalApproval = status === 'APPROVED' && !leave.requiresOpsHeadApproval;
  const nextStatus: LeaveRequestStatus =
    status === 'APPROVED' && leave.requiresOpsHeadApproval
      ? 'PENDING_OPS_HEAD'
      : status;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: nextStatus,
        approvedById: isFinalApproval ? employee.id : null,
        managerApprovedById:
          status === 'APPROVED' && leave.requiresOpsHeadApproval ? employee.id : undefined,
        managerApprovedAt:
          status === 'APPROVED' && leave.requiresOpsHeadApproval ? new Date() : undefined,
      },
    });

    if (isFinalApproval) {
      await incrementLeaveBalanceOnApproval(tx, {
        employeeId: leave.employeeId,
        leaveType: leave.type,
        startDate: leave.startDate,
        durationDays: leave.durationDays,
      });
    }

    if (nextStatus === 'PENDING_OPS_HEAD') {
      await notifyUsersByRoles(
        tx,
        ['OPERATIONS_HEAD'],
        'Leave Pending Operations Review',
        `${leave.employee.firstName} ${leave.employee.lastName}'s ${leave.type} leave (${leave.durationDays} day(s)) requires your approval.`,
      );
    }

    // Write audit log
    await tx.auditLog.create({
      data: {
        userId,
        action:
          nextStatus === 'PENDING_OPS_HEAD'
            ? 'MANAGER_ESCALATE_LEAVE_TO_OPS_HEAD'
            : `LEAVE_${status}`,
        metadata: {
          leaveId,
          employeeId: leave.employeeId,
          status: nextStatus,
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

  const isSubManager = userRole === 'SUB_MANAGER' || userRole === 'MANAGER';
  let targetFilter = {};
  if (isSubManager) {
    const managedTeam = await prisma.team.findUnique({
      where: { managerId: employee.id }
    });
    if (!managedTeam) {
      throw new Error('Unauthorized: No team assigned to manage leaves');
    }
    targetFilter = { employee: { teamId: managedTeam.id } };
  }

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

    let approvedCount = 0;

    for (const leave of pendingLeaves) {
      const isFinalApproval = !leave.requiresOpsHeadApproval;
      const nextStatus: LeaveRequestStatus =
        leave.requiresOpsHeadApproval ? 'PENDING_OPS_HEAD' : 'APPROVED';

      await tx.leaveRequest.update({
        where: { id: leave.id },
        data: {
          status: nextStatus,
          approvedById: isFinalApproval ? employee.id : null,
          managerApprovedById: leave.requiresOpsHeadApproval ? employee.id : undefined,
          managerApprovedAt: leave.requiresOpsHeadApproval ? new Date() : undefined,
        },
      });

      if (isFinalApproval) {
        await incrementLeaveBalanceOnApproval(tx, {
          employeeId: leave.employeeId,
          leaveType: leave.type,
          startDate: leave.startDate,
          durationDays: leave.durationDays,
        });
      }

      if (nextStatus === 'PENDING_OPS_HEAD') {
        await notifyUsersByRoles(
          tx,
          ['OPERATIONS_HEAD'],
          'Leave Pending Operations Review',
          `${leave.employee.firstName} ${leave.employee.lastName}'s ${leave.type} leave (${leave.durationDays} day(s)) requires your approval.`,
        );
      }

      await tx.auditLog.create({
        data: {
          userId,
          action:
            nextStatus === 'PENDING_OPS_HEAD'
              ? 'MANAGER_ESCALATE_LEAVE_TO_OPS_HEAD'
              : 'LEAVE_APPROVED_ALL',
          metadata: {
            leaveId: leave.id,
            employeeId: leave.employeeId,
            status: nextStatus,
          },
        },
      });

      approvedCount++;
    }

    return { count: approvedCount };
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
    let teamEmployees: { userId: string }[] = [];

    if (isSubManager) {
      const managedTeam = await tx.team.findUnique({
        where: { managerId: employee.id }
      });
      if (managedTeam) {
        teamEmployees = await tx.employee.findMany({
          where: { teamId: managedTeam.id, isActive: true },
        });
      }
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

  if (userRole === 'SUB_MANAGER' || userRole === 'MANAGER') {
    const managedTeam = await prisma.team.findUnique({
      where: { managerId: managerEmployee.id }
    });
    if (!managedTeam || targetEmployee.teamId !== managedTeam.id) {
      throw new Error('Unauthorized: You can only override attendance for your team');
    }
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

    const attendanceStatus = mapOverrideStatus(status);
    const checkInTime = attendanceStatus === AttendanceStatus.PRESENT || attendanceStatus === AttendanceStatus.LATE ? new Date() : null;
    const checkOutTime = attendanceStatus === AttendanceStatus.ABSENT || attendanceStatus === AttendanceStatus.LEAVE ? null : null;
    const workingHours = attendanceStatus === AttendanceStatus.PRESENT ? 8.0 : attendanceStatus === AttendanceStatus.LATE ? 6.5 : 0;

    if (existingAttendance) {
      result = await tx.attendance.update({
        where: { id: existingAttendance.id },
        data: {
          status: attendanceStatus,
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
          status: attendanceStatus,
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

  if (userRole === 'SUB_MANAGER' || userRole === 'MANAGER') {
    const managedTeam = await prisma.team.findUnique({
      where: { managerId: managerEmployee.id }
    });
    if (!managedTeam || targetEmployee.teamId !== managedTeam.id) {
      throw new Error('Unauthorized: You can only flag attendance for your team');
    }
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

export async function generateKpiReportCsv(userId: string, userRole: string, teamId?: string) {
  const employee = await prisma.employee.findUnique({
    where: { userId },
  });

  if (!employee) {
    throw new Error('Logged in user is not registered as an employee');
  }

  const today = getTodayUtc();
  const managedTeam =
    userRole === 'MANAGER' || userRole === 'SUB_MANAGER'
      ? await prisma.team.findUnique({ where: { managerId: employee.id } })
      : null;

  if (userRole === 'SUB_MANAGER') {
    if (!managedTeam) {
      throw new Error('Unauthorized: No team assigned to generate KPI report');
    }
    if (teamId && teamId !== managedTeam.id) {
      throw new Error('Unauthorized: You can only download KPI reports for your team');
    }
  }

  let teamIds: string[] = [];
  if (teamId) {
    teamIds = [teamId];
  } else if (userRole === 'MANAGER') {
    const allTeams = await prisma.team.findMany({ select: { id: true }, orderBy: { name: 'asc' } });
    teamIds = allTeams.map((team) => team.id);
  } else if (managedTeam) {
    teamIds = [managedTeam.id];
  } else {
    throw new Error('No team available for KPI report generation');
  }

  const snapshots = await Promise.all(teamIds.map((id) => loadTeamSnapshot(id, today)));
  const reports: TeamKpiReport[] = snapshots
    .filter((snapshot): snapshot is NonNullable<typeof snapshot> => snapshot != null)
    .map((snapshot) => ({
      teamId: snapshot.id,
      teamName: snapshot.name,
      memberCount: snapshot.memberCount,
      managerName: snapshot.managerName,
      schedule: snapshot.teamSchedule,
      kpis: snapshot.kpis,
    }));

  if (reports.length === 0) {
    throw new Error('No team data available for KPI report generation');
  }

  return {
    csv: buildTeamKpiReportCsv(reports),
    filename:
      reports.length === 1
        ? `team-kpi-${reports[0].teamName.replace(/\s+/g, '-').toLowerCase()}.csv`
        : 'all-teams-kpi-report.csv',
  };
}
