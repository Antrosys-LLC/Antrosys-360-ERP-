import { FastifyRequest, FastifyReply } from 'fastify';
import {
  createKpiBodySchema,
  kpiParamsSchema,
  listKpisQuerySchema,
  updateKpiBodySchema,
} from './kpi.schema';
import * as kpiService from './kpi.service';
import { canManageDepartmentKpis } from './kpi.scope';

// ============================================================================
// GET /kpi – List KPIs (filterable + paginated)
// ============================================================================

export async function listKpisHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listKpisQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const result = await kpiService.listKpis(parsed.data);
    return reply.code(200).send({ status: 'success', data: result });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to list KPIs',
    });
  }
}

// ============================================================================
// GET /kpi/overview – Summary banner stats
// ============================================================================

export async function getKpiOverviewHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listKpisQuerySchema.partial().safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const overview = await kpiService.getKpiOverview(parsed.data);
    return reply.code(200).send({ status: 'success', data: overview });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to load KPI overview',
    });
  }
}

// ============================================================================
// GET /kpi/departments – Department-level aggregates
// ============================================================================

export async function getDepartmentAggregatesHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listKpisQuerySchema.partial().safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const departments = await kpiService.getDepartmentAggregates(parsed.data);
    return reply.code(200).send({ status: 'success', data: departments });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to load department KPI aggregates',
    });
  }
}

// ============================================================================
// GET /kpi/export – CSV export
// ============================================================================

export async function exportKpisHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = listKpisQuerySchema.partial().safeParse(request.query);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const result = await kpiService.exportKpisCsv(parsed.data);
    return reply
      .header('Content-Type', 'text/csv; charset=utf-8')
      .header('Content-Disposition', `attachment; filename="${result.filename}"`)
      .send(result.csv);
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to export KPIs',
    });
  }
}

// ============================================================================
// GET /kpi/owners – Owner picker options
// ============================================================================

export async function listKpiOwnersHandler(_request: FastifyRequest, reply: FastifyReply) {
  try {
    const owners = await kpiService.listKpiOwners();
    return reply.code(200).send({ status: 'success', data: owners });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to list KPI owners',
    });
  }
}

// ============================================================================
// GET /kpi/:id – Single KPI
// ============================================================================

export async function getKpiHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = kpiParamsSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  try {
    const kpi = await kpiService.getKpiById(parsed.data.id);
    if (!kpi) {
      return reply.code(404).send({ error: 'KPI not found' });
    }
    return reply.code(200).send({ status: 'success', data: kpi });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to get KPI',
    });
  }
}

// ============================================================================
// POST /kpi – Create
// ============================================================================

export async function createKpiHandler(request: FastifyRequest, reply: FastifyReply) {
  const parsed = createKpiBodySchema.safeParse(request.body);
  if (!parsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: parsed.error.flatten() });
  }

  const scoped = await canManageDepartmentKpis(
    request.user.id,
    request.user.role,
    parsed.data.department ?? null,
  );
  if (!scoped) {
    return reply.code(403).send({ error: 'Insufficient permissions for this department' });
  }

  try {
    const kpi = await kpiService.createKpi(request.user.id, parsed.data);
    return reply.code(201).send({ status: 'success', data: kpi });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to create KPI',
    });
  }
}

// ============================================================================
// PATCH /kpi/:id – Update
// ============================================================================

export async function updateKpiHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = kpiParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  const bodyParsed = updateKpiBodySchema.safeParse(request.body);
  if (!bodyParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: bodyParsed.error.flatten() });
  }

  try {
    const existing = await kpiService.getKpiById(paramsParsed.data.id);
    if (!existing) {
      return reply.code(404).send({ error: 'KPI not found' });
    }

    const scoped = await canManageDepartmentKpis(
      request.user.id,
      request.user.role,
      bodyParsed.data.department !== undefined
        ? bodyParsed.data.department
        : existing.department,
    );
    if (!scoped) {
      return reply.code(403).send({ error: 'Insufficient permissions for this department' });
    }

    const updated = await kpiService.updateKpi(request.user.id, paramsParsed.data.id, bodyParsed.data);
    return reply.code(200).send({ status: 'success', data: updated });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to update KPI',
    });
  }
}

// ============================================================================
// DELETE /kpi/:id – Soft delete
// ============================================================================

export async function deleteKpiHandler(request: FastifyRequest, reply: FastifyReply) {
  const paramsParsed = kpiParamsSchema.safeParse(request.params);
  if (!paramsParsed.success) {
    return reply.code(400).send({ error: 'Validation failed', details: paramsParsed.error.flatten() });
  }

  try {
    const existing = await kpiService.getKpiById(paramsParsed.data.id);
    if (!existing) {
      return reply.code(404).send({ error: 'KPI not found' });
    }

    const scoped = await canManageDepartmentKpis(
      request.user.id,
      request.user.role,
      existing.department,
    );
    if (!scoped) {
      return reply.code(403).send({ error: 'Insufficient permissions for this department' });
    }

    const result = await kpiService.deleteKpi(request.user.id, paramsParsed.data.id);
    return reply.code(200).send({ status: 'success', data: result });
  } catch (error) {
    return reply.code(500).send({
      error: error instanceof Error ? error.message : 'Failed to delete KPI',
    });
  }
}
