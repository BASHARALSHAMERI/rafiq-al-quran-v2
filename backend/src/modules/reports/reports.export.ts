import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

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
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];

    return await new Promise<Buffer>((resolve, reject) => {
      doc.on("data", (chunk) => chunks.push(chunk as Buffer));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      doc.fontSize(16).text(input.title, { align: "left" });
      doc.moveDown(0.5);
      doc.fontSize(9).text(`Generated at: ${input.generatedAt.toISOString()}`);
      doc.moveDown();
      doc.fontSize(12).text("KPIs");
      doc.moveDown(0.3);

      Object.entries(input.kpis).forEach(([key, value]) => {
        doc.fontSize(9).text(`${key}: ${ensurePrintable(value)}`);
      });

      doc.moveDown();
      doc.fontSize(12).text("Rows");
      doc.moveDown(0.3);

      const headers = flattenRows(input.rows);
      if (!headers.length) {
        doc.fontSize(9).text("No rows");
      } else {
        input.rows.slice(0, 300).forEach((row, index) => {
          const rendered = headers.map((key) => `${key}=${ensurePrintable(row[key])}`).join(" | ");
          doc.fontSize(8).text(`${index + 1}. ${rendered}`);
        });
      }

      doc.end();
    });
  }
};
