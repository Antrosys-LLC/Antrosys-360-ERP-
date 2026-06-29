import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import fastifyJwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { env } from './config/env';
import { authPlugin } from './plugins/auth.plugin';
import { rbacPlugin } from './plugins/rbac.plugin';
import { rateLimitPlugin } from './plugins/rate-limit.plugin';
import { auditLoggerHook } from './shared/middleware/audit-logger';

// Module routes
import { authRoutes } from './modules/auth/auth.routes';
import { usersRoutes } from './modules/users/users.routes';
import { invoicesRoutes } from './modules/finance/invoices/invoices.routes';
import { payrollRoutes } from './modules/finance/payroll/payroll.routes';
import { employeesRoutes } from './modules/employees/employees.routes';
import { hrRoutes } from './modules/hr/hr.routes';
import { recruitmentRoutes } from './modules/hr/recruitment/recruitment.routes';
import { onboardingRoutes } from './modules/hr/onboarding/onboarding.routes';
import { performanceRoutes } from './modules/hr/performance/performance.routes';
import { attendanceRoutes } from './modules/operations/attendance/attendance.routes';
import { leaveRoutes } from './modules/operations/leave/leave.routes';
import { manpowerRoutes } from './modules/operations/manpower/manpower.routes';
import { onboardRoutes } from './modules/onboard/onboard.routes';
import { clientsRoutes } from './modules/clients/clients.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { bizIntelRoutes } from './modules/biz_intel/biz_intel.routes';
import { cfoRoutes } from './modules/cfo/cfo.routes';
import { ceoRoutes } from './modules/ceo/ceo.routes';
import { invoiceRoutes } from './modules/invoice/invoice.routes';
import { managerRoutes } from './modules/manager/manager.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { recruitRoutes } from './modules/recruit/recruit.routes';
import { documentsRoutes } from './modules/documents/documents.routes';
import { uploadRouter } from './modules/documents/uploadthing';
import { createRouteHandler } from 'uploadthing/fastify';
import { employeeDashboardRoutes } from './modules/employee/EmployeeDashboard/employee_dashboard.routes';
import { ledgerRoutes } from './modules/ledger/ledger.routes';

export async function buildApp() {
  const app = Fastify({ logger: true });

  // Register plugins in order
  await app.register(cors, {
    origin: env.FRONTEND_URL,
    credentials: true,
  });

  await app.register(helmet);

  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  });

  await app.register(cookie);

  await app.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // Custom plugins
  await app.register(authPlugin);
  await app.register(rbacPlugin);
  await app.register(rateLimitPlugin);

  // Global audit logger hook
  app.addHook('onResponse', auditLoggerHook);

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // UploadThing route handler
  await app.register(createRouteHandler, {
    router: uploadRouter,
  });

  // Register all module routes under /api/v1
  await app.register(
    async function apiV1(api) {
      await api.register(authRoutes, { prefix: '/auth' });
      await api.register(usersRoutes, { prefix: '/users' });
      await api.register(invoicesRoutes, { prefix: '/finance/invoices' });
      await api.register(invoiceRoutes, { prefix: '/invoices' });
      await api.register(payrollRoutes, { prefix: '/finance/payroll' });
      await api.register(cfoRoutes, { prefix: '/cfo' });
      await api.register(ceoRoutes, { prefix: '/ceo' });
      await api.register(hrRoutes, { prefix: '/hr' });
      await api.register(employeesRoutes, { prefix: '/employees' });
      await api.register(recruitmentRoutes, { prefix: '/hr/recruitment' });
      await api.register(onboardingRoutes, { prefix: '/hr/onboarding' });
      await api.register(performanceRoutes, { prefix: '/hr/performance' });
      await api.register(attendanceRoutes, { prefix: '/operations/attendance' });
      await api.register(leaveRoutes, { prefix: '/operations/leave' });
      await api.register(manpowerRoutes, { prefix: '/operations/manpower' });
      await api.register(onboardRoutes, { prefix: '/onboard' });
      await api.register(clientsRoutes, { prefix: '/clients' });
      await api.register(reportsRoutes, { prefix: '/reports' });
      await api.register(adminRoutes, { prefix: '/admin' });
      await api.register(bizIntelRoutes, { prefix: '/biz-intel' });
      await api.register(managerRoutes, { prefix: '/manager' });
      await api.register(notificationsRoutes, { prefix: '/notifications' });
      await api.register(recruitRoutes, { prefix: '/recruit' });
      await api.register(documentsRoutes, { prefix: '/documents' });
      await api.register(employeeDashboardRoutes, { prefix: '/employee/dashboard' });
      await api.register(ledgerRoutes, { prefix: '/ledger' });
    },
    { prefix: '/api/v1' },
  );

  return app;
}
