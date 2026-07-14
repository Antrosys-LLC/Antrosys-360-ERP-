import PDFDocument from 'pdfkit';

export interface PayslipPdfInput {
  employeeName: string;
  employeeCode: string | null;
  department: string | null;
  designation: string | null;
  employeeType: string | null;
  workLocation: string | null;
  joiningDate: Date | null;
  periodStart: Date;
  periodEnd: Date;
  periodLabel: string;
  payslipNumber: string;
  paymentDate: Date;
  currencyCode: string;
  status: string;

  basicSalary: number;
  allowances: number;
  overtime: number;
  bonuses: number;
  grossPay: number;
  incomeTax: number;
  providentFund: number;
  healthInsurance: number;
  deductionsTotal: number;
  netPay: number;

  ytdGross: number;
  ytdDeductions: number;
  ytdNet: number;
}

function numberToWords(n: number): string {
  if (n === 0) return 'Zero';

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertBelow1000 = (num: number): string => {
    const parts: string[] = [];
    if (num >= 100) {
      parts.push(ones[Math.floor(num / 100)] + ' Hundred');
      num %= 100;
    }
    if (num >= 20) {
      parts.push(tens[Math.floor(num / 10)]);
      num %= 10;
    }
    if (num > 0) {
      parts.push(ones[num]);
    }
    return parts.join(' ');
  };

  const integerPart = Math.floor(n);
  const words: string[] = [];
  const crores = Math.floor(integerPart / 10000000);
  const lakhs = Math.floor((integerPart % 10000000) / 100000);
  const thousands = Math.floor((integerPart % 100000) / 1000);
  const hundreds = integerPart % 1000;

  if (crores > 0) {
    words.push(convertBelow1000(crores) + ' Crore');
  }
  if (lakhs > 0) {
    words.push(convertBelow1000(lakhs) + ' Lakh');
  }
  if (thousands > 0) {
    words.push(convertBelow1000(thousands) + ' Thousand');
  }
  if (hundreds > 0) {
    words.push(convertBelow1000(hundreds));
  }

  return words.join(' ') + ' Rupees Only';
}

function fmt(value: number, currencyCode: string) {
  return `${currencyCode} ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtPeriod(start: Date, end: Date): string {
  const s = start.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const e = end.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${s} – ${e}`;
}

interface LineItem {
  label: string;
  value: string;
}

function drawSection(doc: PDFKit.PDFDocument, title: string, items: LineItem[], x: number, y: number): number {
  doc.fontSize(10).fillColor('#1A1A1A').text(title, x, y);
  let cy = y + 18;
  doc.fontSize(9).fillColor('#333333');
  for (const item of items) {
    doc.text(item.label, x, cy, { width: 180 });
    doc.text(item.value, x + 180, cy, { align: 'right' });
    cy += 16;
  }
  return cy;
}

export function buildPayslipPdf(input: PayslipPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    doc.fontSize(14).fillColor('#1A1A1A').text('ANTROSYS TECHNOLOGIES', 50, 50, { align: 'center' });
    doc.fontSize(8).fillColor('#555555').text('Antrosys Technologies PVT LTD.', 50, 70, { align: 'center' });
    doc.fontSize(8).fillColor('#555555').text('Software Technology Park, I-9/3, Islamabad, 44000, Pakistan', 50, 84, { align: 'center' });
    doc.fontSize(8).fillColor('#555555').text('hr@antrosys.com  |  www.antrosys.com', 50, 98, { align: 'center' });

    doc.moveTo(50, 115).lineTo(50 + pageWidth, 115).strokeColor('#CCCCCC').stroke();

    doc.fontSize(16).fillColor('#1A1A1A').text('PAYSLIP', 50, 130, { align: 'center' });

    doc.fontSize(8).fillColor('#333333');
    doc.text(`Pay Period: ${fmtPeriod(input.periodStart ?? new Date(), input.periodEnd ?? new Date())}`, 50, 155);
    doc.text(`Payslip No: ${input.payslipNumber}`, 50, 168);
    doc.text(`Payment Date: ${fmtDate(input.paymentDate)}`, 50, 181);

    const statusColors: Record<string, string> = { PAID: '#16a34a', PROCESSING: '#d97706', CANCELLED: '#dc2626' };
    const statusColor = statusColors[input.status.toUpperCase()] ?? '#333333';
    doc.fontSize(10).fillColor(statusColor).text(input.status, 50 + pageWidth - 100, 155, { width: 100, align: 'right' });

    doc.moveTo(50, 200).lineTo(50 + pageWidth, 200).strokeColor('#E5E5E5').stroke();

    let cy = 215;
    cy = drawSection(doc, 'Employee Information', [
      { label: 'Employee Name', value: input.employeeName },
      { label: 'Employee ID', value: input.employeeCode ?? '-' },
      { label: 'Designation', value: input.designation ?? '-' },
      { label: 'Department', value: input.department ?? '-' },
      { label: 'Employment Type', value: input.employeeType ?? '-' },
      { label: 'Work Location', value: input.workLocation ?? '-' },
      { label: 'Currency', value: input.currencyCode },
      { label: 'Date of Joining', value: input.joiningDate ? fmtDate(input.joiningDate) : '-' },
    ], 50, cy);

    cy += 10;
    doc.moveTo(50, cy).lineTo(50 + pageWidth, cy).strokeColor('#E5E5E5').stroke();
    cy += 10;

    const earningsItems: LineItem[] = [
      { label: 'Basic Salary', value: fmt(input.basicSalary, input.currencyCode) },
      { label: 'Allowances', value: fmt(input.allowances, input.currencyCode) },
      { label: 'Overtime', value: fmt(input.overtime, input.currencyCode) },
      { label: 'Bonuses', value: fmt(input.bonuses, input.currencyCode) },
    ];
    cy = drawSection(doc, 'Earnings', earningsItems, 50, cy);

    doc.fontSize(9).fillColor('#1A1A1A');
    doc.text('Gross Pay', 50 + pageWidth - 220, cy, { width: 90 });
    doc.text(fmt(input.grossPay, input.currencyCode), 50 + pageWidth - 130, cy, { width: 130, align: 'right' });
    cy += 16;

    cy += 10;
    doc.moveTo(50, cy).lineTo(50 + pageWidth, cy).strokeColor('#E5E5E5').stroke();
    cy += 10;

    const deductionsItems: LineItem[] = [
      { label: 'Income Tax', value: fmt(input.incomeTax, input.currencyCode) },
      { label: 'Provident Fund', value: fmt(input.providentFund, input.currencyCode) },
      { label: 'Health Insurance', value: fmt(input.healthInsurance, input.currencyCode) },
    ];
    cy = drawSection(doc, 'Deductions', deductionsItems, 50, cy);

    doc.fontSize(9).fillColor('#1A1A1A');
    doc.text('Total Deductions', 50 + pageWidth - 220, cy, { width: 90 });
    doc.text(fmt(input.deductionsTotal, input.currencyCode), 50 + pageWidth - 130, cy, { width: 130, align: 'right' });
    cy += 16;

    cy += 10;
    doc.moveTo(50, cy).lineTo(50 + pageWidth, cy).strokeColor('#CCCCCC').stroke();
    cy += 10;

    doc.fontSize(12).fillColor('#1A1A1A');
    doc.text('NET PAY', 50, cy, { width: 90 });
    doc.text(fmt(input.netPay, input.currencyCode), 50 + pageWidth - 130, cy, { width: 130, align: 'right' });

    cy += 20;
    doc.fontSize(9).fillColor('#555555');
    const amountWords = numberToWords(input.netPay);
    doc.text(amountWords, 50, cy);

    cy += 25;
    doc.moveTo(50, cy).lineTo(50 + pageWidth, cy).strokeColor('#E5E5E5').stroke();
    cy += 10;

    doc.fontSize(10).fillColor('#1A1A1A').text('Year-to-Date Summary', 50, cy);
    cy += 18;

    const ytdItems: LineItem[] = [
      { label: 'YTD Gross', value: fmt(input.ytdGross, input.currencyCode) },
      { label: 'YTD Deductions', value: fmt(input.ytdDeductions, input.currencyCode) },
      { label: 'YTD Net', value: fmt(input.ytdNet, input.currencyCode) },
    ];
    doc.fontSize(9).fillColor('#333333');
    for (const item of ytdItems) {
      doc.text(item.label, 50, cy, { width: 180 });
      doc.text(item.value, 50 + 180, cy, { align: 'right' });
      cy += 16;
    }

    cy += 20;
    doc.moveTo(50, cy).lineTo(50 + pageWidth, cy).strokeColor('#CCCCCC').stroke();
    cy += 12;

    doc.fontSize(8).fillColor('#888888').text(
      'This is a system-generated payslip issued by Antrosys 360 ERP and does not require a signature. For queries, contact hr@antrosys.com.',
      50, cy, { align: 'center' },
    );

    doc.end();
  });
}
