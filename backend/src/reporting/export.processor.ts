import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';

@Processor('export-queue')
@Injectable()
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(
      `Processing export job ${job.id} of type ${job.data.format}`,
    );

    if (job.data.format === 'xlsx') {
      return this.generateExcel(job.data.dataset);
    } else if (job.data.format === 'pdf') {
      return this.generatePDF(job.data.dataset);
    }

    throw new Error('Unsupported format');
  }

  private async generateExcel(data: any[]) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');
    sheet.addRow(['ID', 'Zone', 'Status']);
    if (data && Array.isArray(data)) {
      data.forEach((d) => sheet.addRow([d.id, d.zone, d.status]));
    }
    const buffer = await workbook.xlsx.writeBuffer();

    // Wire up real logic: save to local disk and return dynamic path
    const fs = require('fs');
    const path = require('path');
    const exportsDir = path.join(process.cwd(), 'public', 'exports');
    if (!fs.existsSync(exportsDir))
      fs.mkdirSync(exportsDir, { recursive: true });

    const fileName = `report-${Date.now()}.xlsx`;
    const filePath = path.join(exportsDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(buffer));

    return { url: `/exports/${fileName}` };
  }

  private async generatePDF(data: any[]) {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const fs = require('fs');
        const path = require('path');
        const exportsDir = path.join(process.cwd(), 'public', 'exports');
        if (!fs.existsSync(exportsDir))
          fs.mkdirSync(exportsDir, { recursive: true });

        const fileName = `report-${Date.now()}.pdf`;
        const filePath = path.join(exportsDir, fileName);
        fs.writeFileSync(filePath, Buffer.concat(buffers));

        resolve({ url: `/exports/${fileName}` });
      });
      doc.text('Temizlik Takip Sistemi Raporu');
      if (data && Array.isArray(data)) {
        data.forEach((d) =>
          doc.text(`ID: ${d.id}, Zone: ${d.zone}, Status: ${d.status}`),
        );
      }
      doc.end();
    });
  }
}
