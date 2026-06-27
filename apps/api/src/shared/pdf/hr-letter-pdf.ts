import PDFDocument from 'pdfkit';

interface HrLetterPdfInput {
  subject: string;
  body: string;
  employeeName: string;
  letterType: string;
  generatedAt: Date;
}

export function buildHrLetterPdf(input: HrLetterPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(10).fillColor('#888888').text('Antrosys ERP — Human Resources', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(18).fillColor('#1A1A1A').text(input.subject, { align: 'left' });
    doc.moveDown(0.3);
    doc.fontSize(10).fillColor('#888888').text(
      `${input.letterType.replace(/_/g, ' ')} · ${input.generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    );
    doc.moveDown(1.5);

    doc.fontSize(12).fillColor('#333333').text(`Dear ${input.employeeName},`, { align: 'left' });
    doc.moveDown(1);

    for (const paragraph of input.body.split('\n').filter(Boolean)) {
      doc.fontSize(11).fillColor('#333333').text(paragraph, { align: 'left', lineGap: 4 });
      doc.moveDown(0.8);
    }

    doc.moveDown(2);
    doc.fontSize(11).fillColor('#333333').text('Regards,');
    doc.moveDown(0.3);
    doc.text('Human Resources');
    doc.text('Antrosys ERP');

    doc.end();
  });
}
