import ExcelJS from "exceljs";
import puppeteer, { Browser, Page } from "puppeteer";
import { logger } from "../../shared/logger/logger";
import { AppError } from "../../shared/errors/app-error";

class BrowserPool {
  private browser: Browser | null = null;
  private pagesCount = 0;
  private readonly maxPages = 5;
  private queue: ((page: Page) => void)[] = [];

  async getPage(): Promise<Page> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"]
      });
    }

    if (this.pagesCount < this.maxPages) {
      this.pagesCount++;
      return await this.browser.newPage();
    }

    return new Promise<Page>((resolve) => {
      this.queue.push(resolve);
    });
  }

  async releasePage(page: Page) {
    await page.close().catch((err) => logger.warn({ err }, "Failed to close page"));
    
    if (this.queue.length > 0) {
      const nextResolve = this.queue.shift()!;
      if (this.browser) {
        try {
          const newPage = await this.browser.newPage();
          nextResolve(newPage);
        } catch (error) {
          logger.error({ error }, "Failed to create new page for queued request");
          this.pagesCount--;
        }
      }
    } else {
      this.pagesCount--;
    }
  }
}

const browserPool = new BrowserPool();

const ensurePrintable = (value: unknown): string => {
  if (value === null || value === undefined) {
    return "-";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
};

const flattenRows = (rows: Record<string, unknown>[]) => {
  const allKeys = new Set<string>();

  for (const row of rows) {
    Object.keys(row).forEach((key) => allKeys.add(key));
  }

  return [...allKeys];
};

export const reportsExport = {
  async toExcelBuffer(input: {
    title: string;
    generatedAt: Date;
    kpis: Record<string, unknown>;
    rows: Record<string, unknown>[];
  }) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");

    sheet.addRow([input.title]);
    sheet.addRow([`Generated at: ${input.generatedAt.toISOString()}`]);
    sheet.addRow([]);
    sheet.addRow(["KPIs"]);

    Object.entries(input.kpis).forEach(([key, value]) => {
      sheet.addRow([key, ensurePrintable(value)]);
    });

    sheet.addRow([]);

    const headers = flattenRows(input.rows);
    if (headers.length) {
      sheet.addRow(headers);
      input.rows.forEach((row) => {
        sheet.addRow(headers.map((key) => ensurePrintable(row[key])));
      });
    } else {
      sheet.addRow(["No rows"]);
    }

    return Buffer.from(await workbook.xlsx.writeBuffer());
  },

  async toPdfBuffer(input: {
    title: string;
    generatedAt: Date;
    kpis: Record<string, unknown>;
    rows: Record<string, unknown>[];
  }) {
    const headers = flattenRows(input.rows);
    
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${input.title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            teal: {
              500: '#14b8a6',
              700: '#0f766e',
            },
            slate: {
              50: '#f8fafc',
            }
          }
        }
      }
    }
  </script>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Cairo', sans-serif;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .glass {
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    thead { display: table-header-group; }
    tfoot { display: table-footer-group; }
  </style>
</head>
<body class="bg-slate-50 p-8 text-slate-800">
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-center border-b-2 border-teal-500 pb-4 mb-6">
      <h1 class="text-3xl font-bold text-teal-700">${input.title}</h1>
      <div class="text-sm text-slate-500">
        <p>تاريخ الإصدار: ${input.generatedAt.toLocaleString('ar-SA')}</p>
      </div>
    </div>
    
    <!-- KPIs -->
    <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
      ${Object.entries(input.kpis).map(([k,v]) => `
      <div class="glass p-4 rounded-xl border-l-4 border-emerald-500 bg-white">
        <div class="text-sm text-slate-500 mb-1">${k}</div>
        <div class="text-xl font-bold text-slate-800">${ensurePrintable(v)}</div>
      </div>
      `).join('')}
    </div>

    <!-- Data Table -->
    ${headers.length ? `
    <div class="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <table class="min-w-full text-sm text-right">
        <thead class="bg-teal-600 text-white font-semibold">
          <tr>
            ${headers.map(h => `<th class="px-4 py-3 border-b border-teal-700 whitespace-nowrap">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-100">
          ${input.rows.map((row, i) => `
          <tr class="${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}">
            ${headers.map(h => `<td class="px-4 py-3 whitespace-nowrap">${ensurePrintable(row[h])}</td>`).join('')}
          </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : '<p class="text-center text-slate-500 py-8">لا توجد بيانات</p>'}
  </div>
</body>
</html>`;

    try {
      const page = await browserPool.getPage();
      
      try {
        await page.setContent(html, { waitUntil: "load" });
        
        // Give Tailwind CSS CDN script time to evaluate and apply styles
        await new Promise((resolve) => setTimeout(resolve, 1000));
        
        const pdfBuffer = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" }
        });

        return Buffer.from(pdfBuffer);
      } finally {
        await browserPool.releasePage(page);
      }
    } catch (error) {
      logger.error({ error, title: input.title }, "Failed to generate PDF report");
      throw new AppError("Failed to generate PDF report", 500);
    }
  }
};
