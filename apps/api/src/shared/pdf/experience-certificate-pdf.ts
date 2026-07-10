import PDFDocument from 'pdfkit';

interface ExperienceCertificateInput {
  employeeName: string;
  employeeCode: string;
  designation: string;
  department: string;
  employeeType: string;
  contractType: string;
  employmentStatus: string;
  joiningDate: Date | null;
  workLocation: string;
  officialEmail: string;
  contactNumber: string;
  generatedAt: Date;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function buildExperienceCertificatePdf(input: ExperienceCertificateInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 60, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const pageWidth = doc.page.width - 120;
    const gold = '#B8860B';
    const dark = '#1a1a1a';
    const gray = '#555555';

    doc.fontSize(20).font('Helvetica-Bold').fillColor(dark).text('ANTROSYS', { align: 'center' });
    doc.fontSize(10).font('Helvetica').fillColor(dark).text('Antrosys Technologies PVT LTD.', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(8).fillColor(gray).text(
      'Software Technology Park, I-9/3, Islamabad, 44000, Pakistan',
      { align: 'center' },
    );
    doc.fontSize(8).fillColor(gray).text(
      'hr@antrosys.com  |  www.antrosys.com',
      { align: 'center' },
    );

    doc.moveDown(0.5);
    doc.moveTo(60, doc.y).lineTo(pageWidth + 60, doc.y).strokeColor(gold).lineWidth(1.5).stroke();
    doc.moveDown(1);

    const year = input.generatedAt.getFullYear();
    const refNumber = `HR/${input.employeeCode}/${year}`;
    doc.x = doc.page.margins.left;
    doc.fontSize(9).font('Helvetica').fillColor(dark).text(`Ref: ${refNumber}`);
    doc.text(`Date: ${formatDate(input.generatedAt)}`);

    doc.moveDown(2);
    doc.fontSize(14).font('Helvetica-Bold').fillColor(dark).text(
      'TO WHOMSOEVER IT MAY CONCERN',
      { align: 'center' },
    );

    doc.moveDown(1.5);
    const joinDateStr = input.joiningDate ? formatDate(input.joiningDate) : 'N/A';
    doc.x = doc.page.margins.left;
    doc.fontSize(10).font('Helvetica').fillColor(dark).text(
      `This is to certify that ${input.employeeName} (Employee ID: ${input.employeeCode}) is a bona fide employee of Antrosys Technologies PVT LTD, currently serving as ${input.designation} in the ${input.department} department. ${input.employeeName} has been associated with the organization since ${joinDateStr} and continues to serve in this capacity as of the date of this letter.`,
      { align: 'left', lineGap: 4 },
    );

    doc.moveDown(1.5);
    doc.x = doc.page.margins.left;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(dark).text('Employment Details');
    doc.moveDown(0.5);

    const tableData: { label: string; value: string }[] = [
      { label: 'Employee Name', value: input.employeeName },
      { label: 'Employee ID', value: input.employeeCode },
      { label: 'Designation', value: input.designation },
      { label: 'Department', value: input.department },
      { label: 'Employment Type', value: input.employeeType },
      { label: 'Contract Type', value: input.contractType },
      { label: 'Employment Status', value: input.employmentStatus },
      { label: 'Date of Joining', value: joinDateStr },
      { label: 'Work Location', value: input.workLocation },
      { label: 'Official Email', value: input.officialEmail },
      { label: 'Contact Number', value: input.contactNumber },
    ];

    const tableTop = doc.y;
    const col1X = 60;
    const col2X = 220;
    const rowHeight = 18;
    const headerBg = '#F5F0FF';
    const borderColor = '#E5E0EB';

    doc.rect(col1X, tableTop, col2X - col1X, rowHeight).fill(headerBg);
    doc.rect(col2X, tableTop, pageWidth + 60 - col2X, rowHeight).fill(headerBg);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(dark);
    doc.text('Detail', col1X + 8, tableTop + 5);
    doc.text('Information', col2X + 8, tableTop + 5);

    let yPos = tableTop + rowHeight;

    for (const row of tableData) {
      doc.rect(col1X, yPos, col2X - col1X, rowHeight).fillColor('#FAFAFA').fill();
      doc.rect(col1X, yPos, col2X - col1X, rowHeight).fillColor(borderColor).lineWidth(0.5).stroke();
      doc.rect(col2X, yPos, pageWidth + 60 - col2X, rowHeight).fillColor('#FAFAFA').fill();
      doc.rect(col2X, yPos, pageWidth + 60 - col2X, rowHeight).fillColor(borderColor).lineWidth(0.5).stroke();

      doc.fontSize(9).font('Helvetica').fillColor(dark);
      doc.text(row.label, col1X + 8, yPos + 4.5);
      doc.fontSize(9).font('Helvetica-Bold').fillColor(dark);
      doc.text(row.value, col2X + 8, yPos + 4.5);

      yPos += rowHeight;
    }

    doc.y = yPos;

    doc.moveDown(0.5);
    doc.x = doc.page.margins.left;
    doc.fontSize(9).font('Helvetica').fillColor(gray).text(
      'This letter is issued at the request of the employee for whatever legitimate purpose it may serve, including but not limited to visa applications, bank account opening, loan processing, or other official verification purposes. Should you require any further information or clarification, please do not hesitate to contact our Human Resources department at the details provided above.',
      { align: 'left' },
    );

    doc.moveDown(2);
    doc.x = doc.page.margins.left;
    doc.fontSize(11).font('Helvetica-Bold').fillColor(dark).text('Sincerely,');
    doc.x = doc.page.margins.left;
    doc.fontSize(10).font('Helvetica').fillColor(dark).text('Human Resources Department');
    doc.x = doc.page.margins.left;
    doc.fontSize(10).font('Helvetica').fillColor(dark).text('Antrosys Technologies PVT LTD.');

    doc.moveDown(1.5);
    doc.moveTo(60, doc.y).lineTo(pageWidth + 60, doc.y).strokeColor(gold).lineWidth(0.5).stroke();
    doc.moveDown(0.5);
    doc.fontSize(7.5).font('Helvetica-Oblique').fillColor('#999999').text(
      `This is a system-generated letter issued by Antrosys 360 ERP on ${formatDate(input.generatedAt)} and does not require a physical signature.`,
      { align: 'center' },
    );

    doc.end();
  });
}
