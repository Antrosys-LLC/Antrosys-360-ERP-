import { PrismaClient } from '@prisma/client';

export async function seedBizIntelData(prisma: PrismaClient) {
  console.log('📊 Seeding Business Intelligence module...');

  // Find a creator (CFO or CEO)
  const cfoUser = await prisma.user.findFirst({
    where: { role: 'CFO' },
  });
  const ceoUser = await prisma.user.findFirst({
    where: { role: 'CEO' },
  });

  const creator = cfoUser || ceoUser;
  if (!creator) {
    console.warn('⚠️ No CFO or CEO user found to assign BI reports to.');
    return;
  }

  // 1. Clear existing BI data to prevent duplicates
  await prisma.bIExecution.deleteMany();
  await prisma.bISchedule.deleteMany();
  await prisma.bIReport.deleteMany();

  // 2. Seed BI Reports
  const reports = [
    {
      title: 'Monthly P&L',
      description: 'Standard profit and loss statement with MoM variance.',
      category: 'Finance',
      iconType: 'trend',
      isFavourite: false,
      isShared: true,
      config: {
        xAxis: 'Month',
        yAxis: ['Revenue', 'Expenses', 'Margin %'],
        settings: { showDataLabels: true, showLegend: true, trendline: false },
        filters: [{ field: 'Date', operator: 'last_n_months', value: 6 }],
        exportFormat: 'pdf',
      },
    },
    {
      title: 'Sales Pipeline',
      description: 'Active deals by stage, probability, and expected close date.',
      category: 'Sales',
      iconType: 'pipeline',
      isFavourite: false,
      isShared: false,
      config: {
        xAxis: 'Stage',
        yAxis: ['Deals Count', 'Expected Value'],
        settings: { showDataLabels: true, showLegend: true, trendline: false },
        filters: [],
        exportFormat: 'pdf',
      },
    },
    {
      title: 'Budget vs Actual',
      description: 'Departmental spending analysis against allocated budgets.',
      category: 'Finance',
      iconType: 'target',
      isFavourite: false,
      isShared: false,
      config: {
        xAxis: 'Department',
        yAxis: ['Allocated Budget', 'Actual Spend'],
        settings: { showDataLabels: true, showLegend: true, trendline: false },
        filters: [],
        exportFormat: 'pdf',
      },
    },
    {
      title: 'Employee Turnover',
      description: 'Attrition rates by department and tenure brackets.',
      category: 'HR',
      iconType: 'turnover',
      isFavourite: false,
      isShared: true,
      config: {
        xAxis: 'Department',
        yAxis: ['Attrition Rate', 'Headcount'],
        settings: { showDataLabels: true, showLegend: true, trendline: false },
        filters: [],
        exportFormat: 'pdf',
      },
    },
    {
      title: 'Revenue overview',
      description: 'Monthly cash inflow trends and projection analytics.',
      category: 'Finance',
      iconType: 'trend',
      isFavourite: true,
      isShared: false,
      config: {
        xAxis: 'Month',
        yAxis: ['Revenue'],
        settings: { showDataLabels: true, showLegend: true, trendline: true },
        filters: [],
        exportFormat: 'pdf',
      },
    },
    {
      title: 'Headcount & attrition',
      description: 'Total active headcount, joining and exit analytics.',
      category: 'HR',
      iconType: 'target',
      isFavourite: true,
      isShared: false,
      config: {
        xAxis: 'Month',
        yAxis: ['Headcount'],
        settings: { showDataLabels: true, showLegend: true, trendline: false },
        filters: [],
        exportFormat: 'pdf',
      },
    },
    {
      title: 'Payroll cost analysis',
      description: 'Sum of gross and net salary payouts over calendar months.',
      category: 'Finance',
      iconType: 'target',
      isFavourite: false,
      isShared: false,
      config: {
        xAxis: 'Month',
        yAxis: ['Payroll cost'],
        settings: { showDataLabels: true, showLegend: true, trendline: false },
        filters: [],
        exportFormat: 'pdf',
      },
    },
  ];

  const seededReports = [];
  for (const report of reports) {
    const r = await prisma.bIReport.create({
      data: {
        ...report,
        createdById: creator.id,
      },
    });
    seededReports.push(r);
  }
  console.log(`✅ Seeded ${seededReports.length} BI Reports.`);

  // 3. Seed Schedules
  const monthlyPlReport = seededReports.find((r) => r.title === 'Monthly P&L');
  const salesPipelineReport = seededReports.find((r) => r.title === 'Sales Pipeline');

  if (monthlyPlReport) {
    await prisma.bISchedule.create({
      data: {
        reportId: monthlyPlReport.id,
        title: 'Monthly P&L',
        cronExpression: '0 9 1 * *',
        info: '1st of Month, 9:00 AM',
        deliveryMethod: 'pdf',
        isActive: true,
      },
    });
  }

  if (salesPipelineReport) {
    await prisma.bISchedule.create({
      data: {
        reportId: salesPipelineReport.id,
        title: 'Weekly Sales',
        cronExpression: '0 8 * * 1',
        info: 'Every Mon, 8:00 AM',
        deliveryMethod: 'email',
        isActive: true,
      },
    });
  }
  console.log('✅ Seeded BI Schedules.');

  // 4. Seed executions (Recent activity)
  const revenueReport = seededReports.find((r) => r.title === 'Revenue overview');
  const headcountReport = seededReports.find((r) => r.title === 'Headcount & attrition');
  const payrollReport = seededReports.find((r) => r.title === 'Payroll cost analysis');

  const executions = [
    {
      reportId: revenueReport?.id || null,
      name: 'Revenue overview',
      duration: '1.2s',
      status: 'Completed',
      failed: false,
      userId: creator.id,
    },
    {
      reportId: headcountReport?.id || null,
      name: 'Headcount & attrition',
      duration: '3.4s',
      status: 'Completed',
      failed: false,
      userId: creator.id,
    },
    {
      reportId: payrollReport?.id || null,
      name: 'Payroll cost analysis',
      duration: '-',
      status: 'Failed',
      failed: true,
      userId: creator.id,
    },
  ];

  for (const execution of executions) {
    await prisma.bIExecution.create({
      data: execution,
    });
  }
  console.log('✅ Seeded BI Executions.');
}
