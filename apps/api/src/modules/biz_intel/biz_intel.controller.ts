import { FastifyReply, FastifyRequest } from 'fastify';
import * as bizIntelService from './biz_intel.service';
import {
  createReportSchema,
  createScheduleSchema,
  reportIdParamSchema,
  toggleFavouriteSchema,
  chartQuerySchema,
} from './biz_intel.schema';

export async function getDashboardHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user.id;
    const dashboardData = await bizIntelService.getDashboardData(userId);
    return reply.code(200).send({
      status: 'success',
      data: dashboardData,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      status: 'error',
      message: error.message || 'Failed to fetch BI dashboard data',
    });
  }
}

export async function getChartDataHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsedQuery = chartQuerySchema.safeParse(request.query);
    if (!parsedQuery.success) {
      return reply.code(400).send({
        status: 'error',
        message: 'Invalid query parameters',
        details: parsedQuery.error.flatten(),
      });
    }

    const { xAxis, yAxis } = parsedQuery.data;
    const yAxisList = yAxis.split(',').map(m => m.trim());
    
    const chartData = await bizIntelService.getChartData(xAxis, yAxisList);
    return reply.code(200).send({
      status: 'success',
      data: chartData,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      status: 'error',
      message: error.message || 'Failed to fetch chart data',
    });
  }
}

export async function createReportHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsedBody = createReportSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        status: 'error',
        message: 'Validation failed',
        details: parsedBody.error.flatten(),
      });
    }

    const userId = request.user.id;
    const report = await bizIntelService.createReport(userId, parsedBody.data);
    return reply.code(201).send({
      status: 'success',
      data: report,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      status: 'error',
      message: error.message || 'Failed to create report',
    });
  }
}

export async function runReportHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsedParams = reportIdParamSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.code(400).send({
        status: 'error',
        message: 'Invalid report ID',
      });
    }

    const userId = request.user.id;
    const execution = await bizIntelService.runReport(userId, parsedParams.data.id);
    return reply.code(200).send({
      status: 'success',
      data: execution,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      status: 'error',
      message: error.message || 'Failed to run report',
    });
  }
}

export async function toggleFavouriteHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsedParams = reportIdParamSchema.safeParse(request.params);
    const parsedBody = toggleFavouriteSchema.safeParse(request.body);

    if (!parsedParams.success || !parsedBody.success) {
      return reply.code(400).send({
        status: 'error',
        message: 'Invalid params or body',
      });
    }

    const userId = request.user.id;
    const report = await bizIntelService.toggleFavourite(
      userId,
      parsedParams.data.id,
      parsedBody.data.isFavourite,
    );

    return reply.code(200).send({
      status: 'success',
      data: report,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      status: 'error',
      message: error.message || 'Failed to toggle favourite status',
    });
  }
}

export async function deleteReportHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsedParams = reportIdParamSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.code(400).send({
        status: 'error',
        message: 'Invalid report ID',
      });
    }

    const userId = request.user.id;
    await bizIntelService.deleteReport(userId, parsedParams.data.id);
    return reply.code(200).send({
      status: 'success',
      data: { id: parsedParams.data.id },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      status: 'error',
      message: error.message || 'Failed to delete report',
    });
  }
}

export async function createScheduleHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsedBody = createScheduleSchema.safeParse(request.body);
    if (!parsedBody.success) {
      return reply.code(400).send({
        status: 'error',
        message: 'Validation failed',
        details: parsedBody.error.flatten(),
      });
    }

    const userId = request.user.id;
    const schedule = await bizIntelService.createSchedule(userId, parsedBody.data);
    return reply.code(201).send({
      status: 'success',
      data: schedule,
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      status: 'error',
      message: error.message || 'Failed to create schedule',
    });
  }
}

export async function deleteScheduleHandler(request: FastifyRequest, reply: FastifyReply) {
  try {
    const parsedParams = reportIdParamSchema.safeParse(request.params);
    if (!parsedParams.success) {
      return reply.code(400).send({
        status: 'error',
        message: 'Invalid schedule ID',
      });
    }

    const userId = request.user.id;
    await bizIntelService.deleteSchedule(userId, parsedParams.data.id);
    return reply.code(200).send({
      status: 'success',
      data: { id: parsedParams.data.id },
    });
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({
      status: 'error',
      message: error.message || 'Failed to delete schedule',
    });
  }
}
