import PDFDocument from 'pdfkit';

export interface PayslipPdfInput {
  employeeName: string;
  employeeCode: string | null;
  department: string | null;
  designation: string | null;
  periodLabel: string;
  grossAmount: number;
  grossPay: number;
  deductionsAmount: number;
  deductionsTotal: number;
  taxAmount: number;
  netAmount: number;
  netPay: number;
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
      `Generated ${input.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    );
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#333333').text('Employee details', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Name: ${input.employeeName}`);
    if (input.employeeCode) doc.text(`Employee ID: ${input.employeeCode}`);
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#333333').text('Earnings summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Gross pay:        ${fmt(input.grossPay)}`);
    doc.text(`Deductions:       ${fmt(input.deductionsTotal)}`);
    doc.text(`Tax withheld:     ${fmt(input.taxAmount)}`);
    doc.moveDown(0.5);
    doc.fontSize(13).fillColor('#1A1A1A').text(`Net pay:          ${fmt(input.netPay)}`, { continued: false });

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#AAAAAA').text(
      'This is a system-generated payslip from Antrosys ERP. For queries, contact Human Resources.',
      { align: 'center' },
    );

    doc.end();
  });
}

