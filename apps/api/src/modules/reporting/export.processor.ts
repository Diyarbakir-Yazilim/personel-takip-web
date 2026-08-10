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
    this.logger.log(`Processing export job ${job.id} of type ${job.data.format}`);
    
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
    data.forEach(d => sheet.addRow([d.id, d.zone, d.status]));
    const buffer = await workbook.xlsx.writeBuffer();
    return { url: 'https://storage.dtso.org.tr/exports/report.xlsx' };
  }

  private async generatePDF(data: any[]) {
    return new Promise((resolve) => {
      const doc = new PDFDocument();
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        resolve({ url: 'https://storage.dtso.org.tr/exports/report.pdf' });
      });
      doc.text('DTSO Temizlik Takip Sistemi Raporu');
      doc.end();
    });
  }
}