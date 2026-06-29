import PDFDocument from 'pdfkit';
import { formatCurrencyAmount } from '../currency/format-currency';

export interface PayslipPdfInput {
  employeeName: string;
  employeeCode: string | null;
  department: string | null;
  designation: string | null;
  periodLabel: string;
  grossAmount: number;
  deductionsAmount: number;
  taxAmount: number;
  netAmount: number;
  currencyCode: string;
  status: string;
  generatedAt: Date;
}

export function buildPayslipPdf(input: PayslipPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fmt = (n: number) => formatCurrencyAmount(n, input.currencyCode);

    doc.fontSize(10).fillColor('#888888').text('Antrosys ERP — Payslip', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor('#1A1A1A').text(`Payslip · ${input.periodLabel}`, { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#888888').text(
      `Generated ${input.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} · Status: ${input.status}`,
    );
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#333333').text('Employee details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Name: ${input.employeeName}`);
    if (input.employeeCode) doc.text(`Employee ID: ${input.employeeCode}`);
    if (input.department) doc.text(`Department: ${input.department}`);
    if (input.designation) doc.text(`Designation: ${input.designation}`);
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#333333').text('Earnings summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Gross pay:        ${fmt(input.grossAmount)}`);
    doc.text(`Deductions:       ${fmt(input.deductionsAmount)}`);
    doc.text(`Tax withheld:     ${fmt(input.taxAmount)}`);
    doc.moveDown(0.5);
    doc.fontSize(13).fillColor('#1A1A1A').text(`Net pay:          ${fmt(input.netAmount)}`, { continued: false });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#AAAAAA').text(
      'This is a system-generated payslip from Antrosys ERP. For queries, contact Human Resources.',
      { align: 'center' },
    );

    doc.end();
  });
}
