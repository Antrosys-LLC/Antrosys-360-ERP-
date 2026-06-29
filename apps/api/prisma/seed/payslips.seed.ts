import { PrismaClient, PayslipStatus } from '@prisma/client';
import { APP_DEFAULT_CURRENCY } from '../../src/shared/currency/currency-constants';

function periodMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1));
}

interface PayslipSeedRow {
  email: string;
  year: number;
  month: number;
  gross: number;
  deductions: number;
  tax: number;
  status: PayslipStatus;
  currencyCode?: string;
}

const PAYSLIP_SEEDS: PayslipSeedRow[] = [
  // Sara Javed — full history matching the original UI mock
  { email: 'sara.javed@antrosys.com', year: 2026, month: 5, gross: 350000, deductions: 15000, tax: 25000, status: 'PROCESSING' },
  { email: 'sara.javed@antrosys.com', year: 2026, month: 4, gross: 350000, deductions: 15000, tax: 25000, status: 'PAID' },
  { email: 'sara.javed@antrosys.com', year: 2026, month: 3, gross: 350000, deductions: 15000, tax: 25000, status: 'PAID' },
  { email: 'sara.javed@antrosys.com', year: 2026, month: 2, gross: 350000, deductions: 15000, tax: 25000, status: 'PAID' },
  { email: 'sara.javed@antrosys.com', year: 2026, month: 1, gross: 350000, deductions: 15000, tax: 25000, status: 'PAID' },
  { email: 'sara.javed@antrosys.com', year: 2025, month: 12, gross: 310000, deductions: 12000, tax: 20000, status: 'PAID' },
  // Additional employees for directory testing
  { email: 'fawad.khan@antrosys.com', year: 2026, month: 5, gross: 280000, deductions: 12000, tax: 18000, status: 'PAID' },
  { email: 'fawad.khan@antrosys.com', year: 2026, month: 4, gross: 280000, deductions: 12000, tax: 18000, status: 'PAID' },
  { email: 'fawad.khan@antrosys.com', year: 2026, month: 3, gross: 280000, deductions: 12000, tax: 18000, status: 'PAID' },
  { email: 'omar.mirza@antrosys.com', year: 2026, month: 5, gross: 220000, deductions: 8000, tax: 14000, status: 'PROCESSING' },
  { email: 'omar.mirza@antrosys.com', year: 2026, month: 4, gross: 220000, deductions: 8000, tax: 14000, status: 'PAID' },
  { email: 'omar.mirza@antrosys.com', year: 2025, month: 12, gross: 210000, deductions: 7500, tax: 13000, status: 'PAID' },
];

export async function seedPayslipsData(prisma: PrismaClient) {
  console.log('💰 Seeding employee payslips...');

  for (const row of PAYSLIP_SEEDS) {
    const employee = await prisma.employee.findFirst({
      where: { user: { email: row.email } },
      select: { id: true },
    });

    if (!employee) {
      console.warn(`  ⚠️ Skipping payslip seed — employee not found: ${row.email}`);
      continue;
    }

    const net = row.gross - row.deductions - row.tax;
    const monthDate = periodMonth(row.year, row.month);

    await prisma.employeePayslip.upsert({
      where: {
        employeeId_periodMonth: {
          employeeId: employee.id,
          periodMonth: monthDate,
        },
      },
      update: {
        grossAmount: row.gross,
        deductionsAmount: row.deductions,
        taxAmount: row.tax,
        netAmount: net,
        currencyCode: row.currencyCode ?? APP_DEFAULT_CURRENCY,
        status: row.status,
      },
      create: {
        employeeId: employee.id,
        periodMonth: monthDate,
        grossAmount: row.gross,
        deductionsAmount: row.deductions,
        taxAmount: row.tax,
        netAmount: net,
        currencyCode: row.currencyCode ?? APP_DEFAULT_CURRENCY,
        status: row.status,
      },
    });
  }

  console.log(`  ✅ Seeded ${PAYSLIP_SEEDS.length} payslip records`);
}
