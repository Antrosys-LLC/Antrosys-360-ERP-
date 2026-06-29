import PDFDocument from 'pdfkit';

interface PayslipPdfInput {
  employeeName: string;
  employeeCode: string | null;
  periodLabel: string;
  currencyCode: string;
  grossPay: number;
  netPay: number;
  taxAmount: number;
  deductionsTotal: number;
  generatedAt: Date;
}

export function buildPayslipPdf(input: PayslipPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const fmt = (value: number) =>
      `${input.currencyCode} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    doc.fontSize(10).fillColor('#888888').text('Antrosys ERP — Payroll', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor('#1A1A1A').text('Payslip', { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#888888').text(
      `${input.periodLabel} · ${input.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    );
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#333333').text(`Employee: ${input.employeeName}`, { align: 'left' });
    if (input.employeeCode) {
      doc.text(`Employee ID: ${input.employeeCode}`);
    }
    doc.moveDown(1);

    const rows: [string, string][] = [
      ['Gross Pay', fmt(input.grossPay)],
      ['Tax Withheld', fmt(input.taxAmount)],
      ['Other Deductions', fmt(input.deductionsTotal)],
      ['Net Pay', fmt(input.netPay)],
    ];

    for (const [label, value] of rows) {
      doc.fontSize(11).fillColor('#333333').text(`${label}:`, { continued: true });
      doc.text(`  ${value}`, { align: 'right' });
      doc.moveDown(0.5);
    }

    doc.moveDown(2);
    doc.fontSize(10).fillColor('#888888').text('This is a system-generated payslip. For queries contact HR.', {
      align: 'left',
    });

    doc.end();
  });
}
