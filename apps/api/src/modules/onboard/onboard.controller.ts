import { FastifyRequest, FastifyReply } from 'fastify';
import {
  listOnboardEmployeesQuerySchema,
  onboardParamsSchema,
  createEmployeeBodySchema,
  updateEmployeeBodySchema,
  createTaskBodySchema,
  updateTaskBodySchema,
  taskParamsSchema,
  createTeamBodySchema,
  updateTeamBodySchema,
  teamMemberParamsSchema,
  addTeamMemberBodySchema,
  sendMessageBodySchema,
  messageParamsSchema,
  updatePhaseBodySchema,
  createMeetingBodySchema,
  updateMeetingBodySchema,
  meetingParamsSchema,
} from './onboard.schema';
import * as onboardService from './onboard.service';

export async function listOnboardEmployeesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listOnboardEmployeesQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const result = await onboardService.listOnboardEmployees(parsed.data);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function getOnboardEmployeeHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = onboardParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const employee = await onboardService.getOnboardEmployee(parsed.data.id);
  if (!employee) {
    return reply.code(404).send({ error: 'Employee not found' });
  }

  return reply.code(200).send({ status: 'success', data: employee });
}

export async function createEmployeeHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createEmployeeBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const employee = await onboardService.createEmployee(parsed.data, request.user!.id);
  return reply.code(201).send({ status: 'success', data: employee });
}

export async function updateEmployeeHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = onboardParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = updateEmployeeBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const updated = await onboardService.updateEmployee(paramsParsed.data.id, bodyParsed.data);
  if (!updated) {
    return reply.code(404).send({ error: 'Employee not found' });
  }

  return reply.code(200).send({ status: 'success', data: updated });
}

export async function deleteEmployeeHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = onboardParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const deleted = await onboardService.deleteEmployee(parsed.data.id);
  if (!deleted) {
    return reply.code(404).send({ error: 'Employee not found' });
  }

  return reply.code(200).send({ status: 'success', data: { deleted: true } });
}

export async function getDashboardStatsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const stats = await onboardService.getDashboardStats();
  return reply.code(200).send({ status: 'success', data: stats });
}

export async function getEmployeeTasksHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = onboardParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const tasks = await onboardService.getEmployeeTasks(parsed.data.id);
  return reply.code(200).send({ status: 'success', data: tasks });
}

export async function createEmployeeTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = onboardParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = createTaskBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const task = await onboardService.createEmployeeTask(paramsParsed.data.id, bodyParsed.data, request.user!.id);
  return reply.code(201).send({ status: 'success', data: task });
}

export async function updateTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = taskParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const bodyParsed = updateTaskBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const task = await onboardService.updateTask(parsed.data.taskId, bodyParsed.data);
  return reply.code(200).send({ status: 'success', data: task });
}

export async function deleteTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = taskParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const deleted = await onboardService.deleteTask(parsed.data.taskId);
  if (!deleted) {
    return reply.code(404).send({ error: 'Task not found' });
  }

  return reply.code(200).send({ status: 'success', data: { deleted: true } });
}

export async function listTeamsHandler(_request: FastifyRequest, reply: FastifyReply) {
  const teams = await onboardService.listTeams();
  return reply.code(200).send({ status: 'success', data: teams });
}

export async function getTeamHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = onboardParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const team = await onboardService.getTeam(parsed.data.id);
  if (!team) {
    return reply.code(404).send({ error: 'Team not found' });
  }

  return reply.code(200).send({ status: 'success', data: team });
}

export async function createTeamHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createTeamBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const team = await onboardService.createTeam(parsed.data);
  return reply.code(201).send({ status: 'success', data: team });
}

export async function updateTeamHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = onboardParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = updateTeamBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const team = await onboardService.updateTeam(paramsParsed.data.id, bodyParsed.data);
  return reply.code(200).send({ status: 'success', data: team });
}

export async function deleteTeamHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = onboardParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const deleted = await onboardService.deleteTeam(parsed.data.id);
  if (!deleted) {
    return reply.code(404).send({ error: 'Team not found' });
  }

  return reply.code(200).send({ status: 'success', data: { deleted: true } });
}

export async function addTeamMemberHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = onboardParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = addTeamMemberBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const result = await onboardService.addTeamMember(paramsParsed.data.id, bodyParsed.data.employeeId);
  if (!result) {
    return reply.code(404).send({ error: 'Team or Employee not found' });
  }

  return reply.code(201).send({ status: 'success', data: result });
}

export async function removeTeamMemberHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = teamMemberParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const deleted = await onboardService.removeTeamMember(parsed.data.id, parsed.data.employeeId);
  if (!deleted) {
    return reply.code(404).send({ error: 'Team member not found' });
  }

  return reply.code(200).send({ status: 'success', data: { deleted: true } });
}

export async function listMessagesHandler(request: FastifyRequest, reply: FastifyReply) {
  const { employeeId } = request.query as { employeeId?: string };
  const messages = await onboardService.listMessages(employeeId);
  return reply.code(200).send({ status: 'success', data: messages });
}

export async function sendMessageHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = sendMessageBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const message = await onboardService.sendMessage(parsed.data, request.user!.id);
  return reply.code(201).send({ status: 'success', data: message });
}

export async function markMessageReadHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = messageParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const message = await onboardService.markMessageRead(parsed.data.id);
  return reply.code(200).send({ status: 'success', data: message });
}

// ----- Phase progression -----

export async function updatePhaseHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = onboardParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = updatePhaseBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const updated = await onboardService.advancePhase(paramsParsed.data.id, bodyParsed.data.currentPhase);
  if (!updated) {
    return reply.code(404).send({ error: 'Onboarding record not found' });
  }

  return reply.code(200).send({ status: 'success', data: updated });
}

// ----- Meetings -----

export async function listMeetingsHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = onboardParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const meetings = await onboardService.listMeetings(parsed.data.id);
  return reply.code(200).send({ status: 'success', data: meetings });
}

export async function createMeetingHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = onboardParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = createMeetingBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const meeting = await onboardService.createMeeting(paramsParsed.data.id, bodyParsed.data, request.user!.id);
  if (!meeting) {
    return reply.code(404).send({ error: 'Employee not found' });
  }

  return reply.code(201).send({ status: 'success', data: meeting });
}

export async function updateMeetingHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = meetingParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = updateMeetingBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const meeting = await onboardService.updateMeeting(paramsParsed.data.meetingId, bodyParsed.data);
  if (!meeting) {
    return reply.code(404).send({ error: 'Meeting not found' });
  }

  return reply.code(200).send({ status: 'success', data: meeting });
}

export async function deleteMeetingHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = meetingParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const deleted = await onboardService.deleteMeeting(parsed.data.meetingId);
  if (!deleted) {
    return reply.code(404).send({ error: 'Meeting not found' });
  }

  return reply.code(200).send({ status: 'success', data: { deleted: true } });
}

// ----- Employee self-service -----

export async function getMyOnboardingHandler(request: FastifyRequest, reply: FastifyReply) {
  const result = await onboardService.getMyOnboarding(request.user!.id);
  return reply.code(200).send({ status: 'success', data: result });
}

export async function updateMyTaskHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = taskParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const bodyParsed = updateTaskBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  const result = await onboardService.updateMyTask(request.user!.id, parsed.data.taskId, bodyParsed.data);
  if (result.forbidden) {
    return reply.code(403).send({ error: 'You can only update your own onboarding tasks' });
  }

  return reply.code(200).send({ status: 'success', data: result.task });
}
