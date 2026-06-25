import { notifyError } from "../../shared/ui/feedback";

type PrintColumn<T> = {
  label: string;
  render: (row: T, index: number) => string | number | null | undefined;
  align?: "right" | "center" | "left";
};

type PrintSignature = {
  label: string;
};

export type FinanceReportColumn<T> = {
  label: string;
  render: (row: T, index: number) => string | number | null | undefined;
  align?: "right" | "center" | "left";
};

export type FinanceReportKpi = {
  label: string;
  value: string | number;
  color?: string;
};

export type FinanceReportSection<T> = {
  title: string;
  subtitle?: string;
  rows: T[];
  columns: FinanceReportColumn<T>[];
  totalLabel?: string;
  totalValue?: string | number;
};

export type PrintFinanceReportOptions<T> = {
  title: string;
  subtitle?: string;
  periodLabel?: string;
  rows?: T[];
  columns?: FinanceReportColumn<T>[];
  sections?: FinanceReportSection<T>[];
  kpis?: FinanceReportKpi[];
  signatures?: PrintSignature[];
  footerNote?: string;
  logoUrl?: string;
  orgName?: string;
  ar?: boolean;
  orientation?: "portrait" | "landscape";
};

export type ExportFinanceCsvOptions<T> = {
  filename: string;
  rows: T[];
  columns: FinanceReportColumn<T>[];
  extraRows?: Array<Array<string | number | null | undefined>>;
};

type PrintAccountingDocumentOptions<T> = {
  title: string;
  subtitle?: string;
  reportDate?: string;
  rows: T[];
  columns: PrintColumn<T>[];
  summaryHtml?: string;
  signatures?: PrintSignature[];
  footerNote?: string;
  logoUrl?: string;
  orgName?: string;
};

const escapeHtml = (value: unknown): string => {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

export const formatYemeniCurrency = (amount: number | string | null | undefined): string => {
  const numeric = Number(amount ?? 0);
  return new Intl.NumberFormat("ar-YE-u-nu-latn", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numeric) ? numeric : 0) + " ر.ي";
};

export const formatArabicDate = (date?: string | Date | null): string => {
  const value = date ? new Date(date) : new Date();
  if (Number.isNaN(value.getTime())) return "";
  return value.toLocaleDateString("ar-YE-u-nu-latn", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const csvCell = (value: unknown): string => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function exportFinanceCsv<T>({
  filename,
  rows,
  columns,
  extraRows = [],
}: ExportFinanceCsvOptions<T>) {
  const csvRows: string[] = [];
  csvRows.push(columns.map((column) => csvCell(column.label)).join(","));
  rows.forEach((row, index) => {
    csvRows.push(columns.map((column) => csvCell(column.render(row, index))).join(","));
  });
  extraRows.forEach((row) => {
    csvRows.push(row.map(csvCell).join(","));
  });

  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function printFinanceReport<T>({
  title,
  subtitle,
  periodLabel,
  rows = [],
  columns = [],
  sections = [],
  kpis = [],
  signatures,
  footerNote,
  logoUrl,
  orgName,
  ar = true,
  orientation = "portrait",
}: PrintFinanceReportOptions<T>) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) {
    notifyError(ar
      ? "تعذر فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة."
      : "Unable to open the print window. Please allow pop-ups.");
    return;
  }

  const accentColor = "#2D9B7A";
  const accentLight = "#E4F4EE";
  const accentBg = "#F2FAF6";
  const resolvedLogoUrl = logoUrl || "/brand/rafiq-logo.svg";
  const resolvedOrgName = orgName || (ar ? "جمعية رفقاء القرآن" : "Rafiq Al-Quran Association");
  const resolvedFooter = footerNote || (ar
    ? "نظام رفقاء القرآن - تقرير مالي صادر آليًا"
    : "Rafiq Al-Quran System - Automatically generated financial report");
  const resolvedSignatures = signatures || [
    { label: ar ? "المحاسب" : "Accountant" },
    { label: ar ? "أمين الصندوق" : "Treasurer" },
    { label: ar ? "المدير" : "Director" },
  ];
  const emptyLabel = ar ? "لا توجد بيانات" : "No data";

  const renderTable = (tableRows: T[], tableColumns: FinanceReportColumn<T>[]) => {
    if (!tableColumns.length) return "";
    const tableHead = tableColumns
      .map((column) => `<th class="text-${column.align ?? "right"}">${escapeHtml(column.label)}</th>`)
      .join("");
    const tableBody = tableRows.length
      ? tableRows
          .map((row, rowIndex) => {
            const cells = tableColumns
              .map((column) => `<td class="text-${column.align ?? "right"}">${escapeHtml(column.render(row, rowIndex))}</td>`)
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("")
      : `<tr><td colspan="${tableColumns.length}" class="empty-cell">${emptyLabel}</td></tr>`;
    return `<table><thead><tr>${tableHead}</tr></thead><tbody>${tableBody}</tbody></table>`;
  };

  const kpiHtml = kpis.length
    ? `<section class="kpi-bar">${kpis.map((kpi) => {
        const color = kpi.color || accentColor;
        return `
          <div class="kpi-card" style="border-color:${color}33;background:${color}10;">
            <div class="kpi-value" style="color:${color};">${escapeHtml(kpi.value)}</div>
            <div class="kpi-label">${escapeHtml(kpi.label)}</div>
          </div>`;
      }).join("")}</section>`
    : "";

  const mainTableHtml = columns.length ? renderTable(rows, columns) : "";
  const sectionsHtml = sections
    .map((section) => `
      <section class="report-section">
        <div class="section-head">
          <div>
            <h2>${escapeHtml(section.title)}</h2>
            ${section.subtitle ? `<p>${escapeHtml(section.subtitle)}</p>` : ""}
          </div>
          ${section.totalLabel || section.totalValue != null
            ? `<div class="section-total"><span>${escapeHtml(section.totalLabel ?? "")}</span><strong>${escapeHtml(section.totalValue ?? "")}</strong></div>`
            : ""}
        </div>
        ${renderTable(section.rows, section.columns)}
      </section>`)
    .join("");

  const signaturesHtml = resolvedSignatures
    .map((signature) => `
      <div class="sig">
        <div class="sig-line"></div>
        <div class="sig-label">${escapeHtml(signature.label)}</div>
      </div>`)
    .join("");

  const html = `
    <!DOCTYPE html>
    <html dir="${ar ? "rtl" : "ltr"}" lang="${ar ? "ar" : "en"}">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; padding: 34px; color: #253246; background: #F7FAFC; }
          .wrap { max-width: ${orientation === "landscape" ? "1180px" : "960px"}; margin: 0 auto; background: #fff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,.08); overflow: hidden; position: relative; }
          .wrap::before { content: ""; position: absolute; inset-inline: 0; top: 0; height: 6px; background: linear-gradient(90deg, ${accentColor}, ${accentColor}99, ${accentColor}); }
          .inner { padding: 32px 36px 28px; }
          .header { display: flex; align-items: center; gap: 16px; padding-bottom: 18px; border-bottom: 2px solid ${accentLight}; margin-bottom: 22px; }
          .header-logo { width: 52px; height: 52px; object-fit: contain; flex-shrink: 0; }
          .header-center { flex: 1; }
          .header-org-name { font-size: 17px; font-weight: 900; color: #173B33; line-height: 1.3; }
          .header-sub { font-size: 11px; color: ${accentColor}; font-weight: 700; }
          .header-left { text-align: ${ar ? "left" : "right"}; font-size: 11px; color: #718096; font-weight: 700; flex-shrink: 0; }
          .title-section { text-align: center; margin-bottom: 22px; }
          .title-section h1 { font-size: 22px; font-weight: 900; color: #173B33; display: inline-block; position: relative; }
          .title-section h1::after { content: ""; display: block; width: 50%; height: 4px; background: linear-gradient(90deg, transparent, ${accentColor}, transparent); margin: 8px auto 0; border-radius: 2px; }
          .title-sub, .period { font-size: 12px; color: #718096; font-weight: 700; margin-top: 6px; }
          .kpi-bar { display: grid; grid-template-columns: repeat(${Math.min(Math.max(kpis.length, 1), 4)}, minmax(0, 1fr)); gap: 10px; margin-bottom: 20px; }
          .kpi-card { border: 1px solid ${accentLight}; border-radius: 10px; padding: 12px 14px; text-align: center; }
          .kpi-value { font-size: 18px; font-weight: 900; line-height: 1.2; direction: ltr; }
          .kpi-label { font-size: 10px; font-weight: 800; color: #718096; margin-top: 4px; }
          .report-section { margin-top: 18px; break-inside: avoid; }
          .section-head { display: flex; align-items: end; justify-content: space-between; gap: 12px; border-bottom: 2px solid ${accentLight}; padding-bottom: 8px; margin-bottom: 8px; }
          .section-head h2 { font-size: 15px; color: #173B33; font-weight: 900; }
          .section-head p, .section-total span { font-size: 10px; color: #718096; font-weight: 700; }
          .section-total { text-align: ${ar ? "left" : "right"}; }
          .section-total strong { display: block; color: ${accentColor}; font-size: 15px; font-weight: 900; direction: ltr; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: ${accentBg}; color: ${accentColor}; font-size: 10px; font-weight: 900; border: 1px solid ${accentLight}; padding: 9px 8px; }
          td { border: 1px solid #E2E8F0; padding: 7px 8px; font-size: 11px; vertical-align: middle; color: #2D3748; }
          tr:nth-child(even) td { background: #FAFBFC; }
          .text-right { text-align: right; } .text-center { text-align: center; } .text-left { text-align: left; }
          .empty-cell { text-align: center; padding: 24px; color: #A0AEC0; font-weight: 700; }
          .signatures { display: grid; grid-template-columns: repeat(${resolvedSignatures.length}, minmax(0, 1fr)); gap: 18px; padding-top: 24px; border-top: 2px solid ${accentLight}; margin-top: 28px; }
          .sig { text-align: center; }
          .sig-line { width: 130px; border-top: 2px solid #CBD5E0; margin: 30px auto 8px; }
          .sig-label { font-size: 12px; font-weight: 800; color: #4A5568; }
          .footer { text-align: center; margin-top: 18px; padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 9px; color: #A0AEC0; font-weight: 700; }
          @media print {
            body { background: #FFFFFF; padding: 0; }
            .wrap { max-width: none; box-shadow: none; border-radius: 0; }
            .inner { padding: 18px 22px; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            @page { margin: 12mm 10mm; size: A4 ${orientation}; }
          }
        </style>
      </head>
      <body>
        <main class="wrap">
          <div class="inner">
            <header class="header">
              <img class="header-logo" src="${escapeHtml(resolvedLogoUrl)}" alt="Logo" />
              <div class="header-center">
                <div class="header-org-name">${escapeHtml(resolvedOrgName)}</div>
                <div class="header-sub">${escapeHtml(title)}</div>
              </div>
              <div class="header-left">${escapeHtml(formatArabicDate(new Date()))}</div>
            </header>
            <section class="title-section">
              <h1>${escapeHtml(title)}</h1>
              ${subtitle ? `<div class="title-sub">${escapeHtml(subtitle)}</div>` : ""}
              ${periodLabel ? `<div class="period">${escapeHtml(periodLabel)}</div>` : ""}
            </section>
            ${kpiHtml}
            ${mainTableHtml}
            ${sectionsHtml}
            <section class="signatures">${signaturesHtml}</section>
            <footer class="footer">${escapeHtml(resolvedFooter)}</footer>
          </div>
        </main>
        <script>window.onload = function () { window.focus(); setTimeout(function () { window.print(); }, 300); };</script>
      </body>
    </html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printAccountingDocument<T>({
  title,
  subtitle,
  reportDate,
  rows,
  columns,
  summaryHtml,
  signatures = [
    { label: "المحاسب" },
    { label: "مدير المركز" },
    { label: "المدير العام" },
  ],
  footerNote = "تم إنشاء هذا التقرير آليًا من نظام رفقاء القرآن.",
  logoUrl,
  orgName,
}: PrintAccountingDocumentOptions<T>) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");

  if (!printWindow) {
    notifyError("تعذر فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.");
    return;
  }

  const accentColor = "#2D9B7A";
  const accentLight = "#E4F4EE";
  const accentBg = "#F2FAF6";

  const tableHead = columns
    .map((column) => {
      const align = column.align ?? "right";
      return `<th class="text-${align}">${escapeHtml(column.label)}</th>`;
    })
    .join("");

  const tableRows = rows.length
    ? rows
        .map((row, rowIndex) => {
          const cells = columns
            .map((column) => {
              const align = column.align ?? "right";
              return `<td class="text-${align}">${escapeHtml(column.render(row, rowIndex))}</td>`;
            })
            .join("");

          return `<tr>${cells}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${columns.length}" class="empty-cell">لا توجد بيانات</td></tr>`;

  const signaturesHtml = signatures
    .map(
      (signature) => `
        <div class="sig">
          <div class="sig-line"></div>
          <div class="sig-label">${escapeHtml(signature.label)}</div>
        </div>
      `
    )
    .join("");

  const logoHtml = logoUrl
    ? `<img class="header-logo" src="${escapeHtml(logoUrl)}" alt="Logo" />`
    : "";

  const displayOrgName = orgName || "جمعية رفقاء القرآن";

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            padding: 36px;
            color: #2D3748;
            background: #F7FAFC;
          }

          .report-wrap {
            max-width: 1100px;
            margin: 0 auto;
            background: #FFFFFF;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            overflow: hidden;
            position: relative;
          }

          .report-wrap::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, ${accentColor}, ${accentColor}99, ${accentColor});
          }

          .report-inner {
            padding: 32px 36px 28px;
          }

          .header {
            display: flex;
            align-items: center;
            gap: 16px;
            padding-bottom: 18px;
            border-bottom: 2px solid ${accentLight};
            margin-bottom: 22px;
          }

          .header-logo {
            width: 52px;
            height: 52px;
            flex-shrink: 0;
          }

          .header-center { flex: 1; }

          .header-org-name {
            font-size: 17px;
            font-weight: 900;
            color: #1A365D;
            line-height: 1.3;
          }

          .header-sub {
            font-size: 11px;
            color: ${accentColor};
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .header-left {
            text-align: left;
            font-size: 11px;
            color: #718096;
            font-weight: 600;
            flex-shrink: 0;
          }

          .title-section {
            text-align: center;
            margin-bottom: 24px;
          }

          .title-section h1 {
            font-size: 22px;
            font-weight: 900;
            color: #1A365D;
            display: inline-block;
            position: relative;
          }

          .title-section h1::after {
            content: '';
            display: block;
            width: 50%;
            height: 4px;
            background: linear-gradient(90deg, transparent, ${accentColor}, transparent);
            margin: 8px auto 0;
            border-radius: 2px;
          }

          .title-sub {
            font-size: 13px;
            color: #718096;
            font-weight: 600;
            margin-top: 6px;
          }

          .meta-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 0 0 18px;
            font-size: 12px;
            color: #718096;
            font-weight: 600;
          }

          .summary-panel {
            background: ${accentBg};
            border: 1px solid ${accentLight};
            border-radius: 10px;
            padding: 14px 20px;
            margin-bottom: 20px;
            font-size: 13px;
            font-weight: 600;
            color: #2D3748;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }

          th {
            background: ${accentBg};
            color: ${accentColor};
            font-size: 11px;
            font-weight: 800;
            border: 1px solid ${accentLight};
            padding: 10px 8px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }

          td {
            border: 1px solid #E2E8F0;
            padding: 8px;
            font-size: 12px;
            vertical-align: middle;
            color: #2D3748;
          }

          tr:nth-child(even) td {
            background: #FAFBFC;
          }

          tr:hover td {
            background: ${accentBg};
          }

          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }

          .empty-cell {
            text-align: center;
            padding: 24px;
            color: #A0AEC0;
            font-weight: 600;
          }

          .signatures {
            display: flex;
            justify-content: space-around;
            gap: 16px;
            padding-top: 24px;
            border-top: 2px solid ${accentLight};
            margin-top: 28px;
          }

          .sig { text-align: center; flex: 1; }

          .sig-line {
            width: 120px;
            height: 1px;
            border-top: 2px solid #CBD5E0;
            margin: 32px auto 8px;
          }

          .sig-label {
            font-size: 13px;
            font-weight: 700;
            color: #4A5568;
          }

          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 12px;
            border-top: 1px solid #E2E8F0;
          }

          .footer-text {
            font-size: 10px;
            color: #A0AEC0;
            font-weight: 600;
          }

          @media print {
            body {
              background: #FFFFFF;
              padding: 0;
            }
            .report-wrap {
              box-shadow: none;
              border-radius: 0;
            }
            .report-inner { padding: 20px 24px; }
            .no-print { display: none !important; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            @page { margin: 12mm 10mm; size: A4 portrait; }
          }
        </style>
      </head>

      <body>
        <div class="report-wrap">
          <div class="report-inner">
            <div class="header">
              ${logoHtml}
              <div class="header-center">
                <div class="header-org-name">${escapeHtml(displayOrgName)}</div>
                <div class="header-sub">${escapeHtml(title)}</div>
              </div>
              <div class="header-left">${escapeHtml(formatArabicDate(new Date()))}</div>
            </div>

            <div class="title-section">
              <h1>${escapeHtml(title)}</h1>
              ${subtitle ? `<div class="title-sub">${escapeHtml(subtitle)}</div>` : ""}
            </div>

            ${reportDate ? `<div class="meta-row"><div>تاريخ التقرير: ${escapeHtml(reportDate)}</div></div>` : ""}

            ${summaryHtml ? `<div class="summary-panel">${summaryHtml}</div>` : ""}

            <table>
              <thead><tr>${tableHead}</tr></thead>
              <tbody>${tableRows}</tbody>
            </table>

            <div class="signatures">${signaturesHtml}</div>

            <div class="footer">
              <div class="footer-text">${escapeHtml(footerNote)}</div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function () {
            window.focus();
            setTimeout(function () { window.print(); }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printVoucherReceipt(voucher: any, ar: boolean, logoUrl?: string, orgName?: string) {
  const printWindow = window.open("", "_blank", "width=850,height=700");
  if (!printWindow) return;

  const title = voucher.voucherType === "RECEIPT" ? (ar ? "سند قبض" : "Receipt Voucher") : (ar ? "سند صرف" : "Disbursement Voucher");
  const isDisbursement = voucher.voucherType === "DISBURSEMENT";
  const accentColor = isDisbursement ? "#E85858" : "#2D9B7A";
  const accentLight = isDisbursement ? "#FDE8E8" : "#E4F4EE";
  const accentBg = isDisbursement ? "#FFF5F5" : "#F2FAF6";

  const getAccountingStatus = (v: any, isAr: boolean) => {
    if (v.status !== "POSTED") return isAr ? "غير مرحل" : "Not Posted";
    if (v.voucherType === "RECEIPT") {
      if (v.sourceType === "PAYMENT") return isAr ? "القيد مسجل عبر الدفعة" : "Entry registered via payment";
      return isAr ? "تم إنشاء قيد محاسبي" : "Accounting entry created";
    }
    if (v.voucherType === "DISBURSEMENT") return isAr ? "القيد المحاسبي مؤجل" : "Accounting entry deferred";
    return isAr ? "مكتمل" : "Completed";
  };

  const resolvedLogoUrl = logoUrl || "/brand/rafiq-logo.svg";
  const resolvedOrgName = orgName || (ar ? "جمعية رفقاء القرآن" : "Rafiq Al-Quran Association");

  const html = `
    <!DOCTYPE html>
    <html dir="${ar ? "rtl" : "ltr"}" lang="${ar ? "ar" : "en"}">
      <head>
        <meta charset="UTF-8" />
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');

          * { box-sizing: border-box; margin: 0; padding: 0; }

          body {
            font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
            padding: 40px;
            color: #2D3748;
            background: #F7FAFC;
          }

          .voucher {
            max-width: 750px;
            margin: 0 auto;
            background: #FFFFFF;
            border-radius: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.08);
            overflow: hidden;
            position: relative;
          }

          .voucher::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 6px;
            background: linear-gradient(90deg, ${accentColor}, ${accentColor}99, ${accentColor});
          }

          .voucher-inner {
            padding: 36px 40px 32px;
          }

          /* ===== HEADER ===== */
          .header {
            display: flex;
            align-items: center;
            gap: 16px;
            padding-bottom: 20px;
            border-bottom: 2px solid ${accentLight};
            margin-bottom: 24px;
          }

          .header-logo {
            width: 60px;
            height: 60px;
            flex-shrink: 0;
          }

          .header-center {
            flex: 1;
          }

          .header-org-name {
            font-size: 18px;
            font-weight: 900;
            color: #1A365D;
            line-height: 1.3;
          }

          .header-sub {
            font-size: 11px;
            color: ${accentColor};
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
          }

          .header-left {
            text-align: center;
            flex-shrink: 0;
          }

          .header-voucher-no {
            font-size: 13px;
            font-weight: 700;
            color: ${accentColor};
            background: ${accentLight};
            padding: 4px 14px;
            border-radius: 20px;
            display: inline-block;
          }

          /* ===== TITLE BADGE ===== */
          .title-badge {
            text-align: center;
            margin-bottom: 28px;
          }

          .title-badge h1 {
            font-size: 24px;
            font-weight: 900;
            color: #1A365D;
            position: relative;
            display: inline-block;
          }

          .title-badge h1::after {
            content: '';
            display: block;
            width: 60%;
            height: 4px;
            background: linear-gradient(90deg, transparent, ${accentColor}, transparent);
            margin: 8px auto 0;
            border-radius: 2px;
          }

          .title-badge .title-icon {
            font-size: 28px;
            display: block;
            margin-bottom: 4px;
          }

          /* ===== INFO PANEL ===== */
          .info-panel {
            background: ${accentBg};
            border: 1px solid ${accentLight};
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 24px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 28px;
          }

          .info-item {
            display: flex;
            align-items: baseline;
            gap: 6px;
          }

          .info-item.full {
            grid-column: span 2;
          }

          .info-label {
            font-size: 12px;
            font-weight: 700;
            color: ${accentColor};
            white-space: nowrap;
          }

          .info-value {
            font-size: 13px;
            font-weight: 600;
            color: #2D3748;
          }

          .info-value.status-badge {
            display: inline-block;
            background: ${accentColor}18;
            color: ${accentColor};
            padding: 1px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
          }

          /* ===== AMOUNT DISPLAY ===== */
          .amount-section {
            text-align: center;
            margin-bottom: 24px;
            padding: 20px;
            background: linear-gradient(135deg, ${accentBg} 0%, #FFFFFF 100%);
            border: 2px dashed ${accentLight};
            border-radius: 12px;
          }

          .amount-label {
            font-size: 11px;
            font-weight: 700;
            color: ${accentColor};
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }

          .amount-number {
            font-size: 32px;
            font-weight: 900;
            color: ${accentColor};
            line-height: 1.2;
          }

          .amount-words {
            font-size: 13px;
            color: #718096;
            font-weight: 600;
            margin-top: 6px;
          }

          /* ===== FOREIGN CURRENCY ===== */
          .forex-section {
            background: ${accentBg};
            border: 1px solid ${accentLight};
            border-radius: 10px;
            padding: 14px 20px;
            margin-bottom: 20px;
          }
          .forex-title {
            font-size: 11px;
            font-weight: 700;
            color: ${accentColor};
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .forex-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px 24px;
          }
          .forex-item {
            display: flex;
            gap: 4px;
          }
          .forex-label {
            font-size: 11px;
            font-weight: 700;
            color: #4A5568;
          }
          .forex-value {
            font-size: 12px;
            font-weight: 600;
            color: #2D3748;
          }

          /* ===== DESCRIPTION ===== */
          .desc-section {
            margin-bottom: 24px;
          }

          .desc-row {
            display: flex;
            gap: 8px;
            padding: 10px 0;
            border-bottom: 1px solid #EDF2F7;
          }

          .desc-row:last-child {
            border-bottom: none;
          }

          .desc-label {
            font-size: 13px;
            font-weight: 700;
            color: #4A5568;
            min-width: 110px;
            flex-shrink: 0;
          }

          .desc-value {
            font-size: 13px;
            color: #2D3748;
            font-weight: 600;
          }

          .notes-text {
            font-size: 12px;
            color: #718096;
            font-style: italic;
            background: #FFF9E6;
            padding: 8px 14px;
            border-radius: 8px;
            border-right: 3px solid #F6C23E;
            margin-top: 4px;
          }

          /* ===== SIGNATURES ===== */
          .signatures {
            display: flex;
            justify-content: space-around;
            gap: 16px;
            padding-top: 24px;
            border-top: 2px solid ${accentLight};
            margin-top: 8px;
          }

          .sig {
            text-align: center;
            flex: 1;
          }

          .sig-line {
            width: 130px;
            height: 1px;
            border-top: 2px solid #CBD5E0;
            margin: 36px auto 8px;
          }

          .sig-label {
            font-size: 13px;
            font-weight: 700;
            color: #4A5568;
          }

          /* ===== FOOTER ===== */
          .footer {
            text-align: center;
            margin-top: 20px;
            padding-top: 16px;
            border-top: 1px solid #E2E8F0;
          }

          .footer-text {
            font-size: 10px;
            color: #A0AEC0;
            font-weight: 600;
          }

          /* ===== DECORATIVE CORNERS ===== */
          .corner {
            position: absolute;
            width: 40px;
            height: 40px;
            border-color: ${accentColor}40;
            border-style: solid;
          }
          .corner-tl { top: 10px; left: 10px; border-width: 2px 0 0 2px; border-radius: 6px 0 0 0; }
          .corner-tr { top: 10px; right: 10px; border-width: 2px 2px 0 0; border-radius: 0 6px 0 0; }
          .corner-bl { bottom: 10px; left: 10px; border-width: 0 0 2px 2px; border-radius: 0 0 0 6px; }
          .corner-br { bottom: 10px; right: 10px; border-width: 0 2px 2px 0; border-radius: 0 0 6px 0; }

          @media print {
            body {
              background: #FFFFFF;
              padding: 0;
            }
            .voucher {
              box-shadow: none;
              border-radius: 0;
            }
            .voucher-inner {
              padding: 24px 28px;
            }
            @page {
              margin: 12mm 10mm;
              size: A4 portrait;
            }
          }
        </style>
      </head>
      <body>
        <div class="voucher">
          <div class="corner corner-tl"></div>
          <div class="corner corner-tr"></div>
          <div class="corner corner-bl"></div>
          <div class="corner corner-br"></div>

          <div class="voucher-inner">
            <!-- HEADER: Logo + Org Name + Voucher No -->
            <div class="header">
              <img class="header-logo" src="${resolvedLogoUrl}" alt="Logo" />
              <div class="header-center">
                <div class="header-org-name">${resolvedOrgName}</div>
                <div class="header-sub">${ar ? "إدارة الشؤون المالية" : "Financial Affairs Department"}</div>
              </div>
              <div class="header-left">
                <div class="header-voucher-no"># ${escapeHtml(voucher.voucherNo)}</div>
              </div>
            </div>

            <!-- TITLE -->
            <div class="title-badge">
              <span class="title-icon">${isDisbursement ? "&#x1F4E4;" : "&#x1F4E5;"}</span>
              <h1>${title}</h1>
            </div>

            <!-- INFO PANEL -->
            <div class="info-panel">
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">${ar ? "التاريخ:" : "Date:"}</span>
                  <span class="info-value">${new Date(voucher.voucherDate || voucher.createdAt).toLocaleDateString(ar ? "ar-YE-u-nu-latn" : "en-US")}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${ar ? "طريقة الدفع:" : "Method:"}</span>
                  <span class="info-value">${voucher.paymentMethod || "-"}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${ar ? "المركز:" : "Center:"}</span>
                  <span class="info-value">${voucher.center?.name || (ar ? "المركز الرئيسي" : "Main Center")}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">${ar ? "التصنيف المحاسبي:" : "Category:"}</span>
                  <span class="info-value">${voucher.accountingCategory || "-"}</span>
                </div>
                <div class="info-item full">
                  <span class="info-label">${ar ? "حالة القيد:" : "Status:"}</span>
                  <span class="info-value status-badge">${getAccountingStatus(voucher, ar)}</span>
                </div>
              </div>
            </div>

            <!-- AMOUNT -->
            <div class="amount-section">
              <div class="amount-label">${ar ? "المبلغ" : "AMOUNT"}</div>
              <div class="amount-number">${formatYemeniCurrency(voucher.amount)}</div>
              <div class="amount-words">${ar ? "فقط لا غير" : "Only"}</div>
            </div>

            <!-- FOREIGN CURRENCY (FA-UX-4B) -->
            ${(() => {
              const code = (voucher.originalCurrencyCode || "YER").toString().toUpperCase();
              if (code === "YER") return "";
              const orig = Number(voucher.originalAmount ?? 0);
              const rate = Number(voucher.exchangeRateToBase ?? 0);
              const base = Number(voucher.amount ?? 0);
              if (!Number.isFinite(orig) || !Number.isFinite(rate) || orig <= 0 || rate <= 0) return "";
              const fmt = (n: number) =>
                new Intl.NumberFormat(ar ? "ar-YE-u-nu-latn" : "en-US", { maximumFractionDigits: 2 }).format(n);
              return `
                <div class="forex-section">
                  <div class="forex-title">${ar ? "عملة أجنبية" : "Foreign Currency"}</div>
                  <div class="forex-grid">
                    <div class="forex-item"><span class="forex-label">${ar ? "المبلغ الأصلي:" : "Original:"}</span><span class="forex-value">${fmt(orig)} ${escapeHtml(code)}</span></div>
                    <div class="forex-item"><span class="forex-label">${ar ? "سعر الصرف:" : "Rate:"}</span><span class="forex-value">${fmt(rate)}</span></div>
                    <div class="forex-item"><span class="forex-label">${ar ? "العملة:" : "Currency:"}</span><span class="forex-value">${escapeHtml(code)}</span></div>
                    <div class="forex-item"><span class="forex-label">${ar ? "المعادل بالريال:" : "Equivalent:"}</span><span class="forex-value">${formatYemeniCurrency(base)}</span></div>
                  </div>
                </div>
              `;
            })()}

            <!-- BENEFICIARY & DESCRIPTION -->
            <div class="desc-section">
              <div class="desc-row">
                <span class="desc-label">${ar ? "المستفيد:" : "Beneficiary:"}</span>
                <span class="desc-value">${voucher.beneficiary || "_____________________________"}</span>
              </div>
              <div class="desc-row">
                <span class="desc-label">${ar ? "البيان:" : "Description:"}</span>
                <span class="desc-value">${voucher.description || "_____________________________"}</span>
              </div>
              ${voucher.notes ? `
              <div class="desc-row">
                <span class="desc-label">${ar ? "ملاحظات:" : "Notes:"}</span>
                <div class="notes-text">${escapeHtml(voucher.notes)}</div>
              </div>
              ` : ""}
            </div>

            <!-- SIGNATURES -->
            <div class="signatures">
              <div class="sig">
                <div class="sig-line"></div>
                <div class="sig-label">${ar ? "المحاسب" : "Accountant"}</div>
              </div>
              <div class="sig">
                <div class="sig-line"></div>
                <div class="sig-label">${ar ? "المستلم" : "Recipient"}</div>
              </div>
              <div class="sig">
                <div class="sig-line"></div>
                <div class="sig-label">${ar ? "المدير" : "Manager"}</div>
              </div>
            </div>

            <!-- FOOTER -->
            <div class="footer">
              <div class="footer-text">${ar ? "نظام رفقاء القرآن - برنامج إدارة الجمعيات القرآنية" : "Rafiq Al-Quran System - Quranic Society Management"}</div>
            </div>
          </div>
        </div>
        <script>window.onload = () => { window.focus(); setTimeout(() => { window.print(); }, 300); };</script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printSummaryReport(options: {
  title: string;
  subtitle?: string;
  kpis: { label: string; value: string | number; color?: string }[];
  rows: any[];
  columns: PrintColumn<any>[];
  logoUrl?: string;
  orgName?: string;
}) {
  const {
    title, subtitle, kpis, rows, columns, logoUrl, orgName
  } = options;

  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) {
    notifyError("تعذر فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.");
    return;
  }

  const resolvedLogoUrl = logoUrl || "/brand/rafiq-logo.svg";
  const resolvedOrgName = orgName || "جمعية رفقاء القرآن";
  const accentColor = "#2D9B7A";
  const accentLight = "#E4F4EE";
  const accentBg = "#F2FAF6";

  const tableHead = columns
    .map((col) => {
      const align = col.align ?? "right";
      return `<th class="text-${align}">${escapeHtml(col.label)}</th>`;
    })
    .join("");

  const tableRows = rows.length
    ? rows
        .map((row, rowIndex) => {
          const cells = columns
            .map((col) => {
              const align = col.align ?? "right";
              return `<td class="text-${align}">${escapeHtml(col.render(row, rowIndex))}</td>`;
            })
            .join("");
          return `<tr>${cells}</tr>`;
        })
        .join("")
    : `<tr><td colspan="${columns.length}" class="empty-cell">لا توجد بيانات</td></tr>`;

  const kpiCards = kpis
    .map(
      (kpi) => `
        <div class="kpi-card" style="background: ${kpi.color || accentBg}; border-color: ${kpi.color ? kpi.color + "44" : accentLight};">
          <div class="kpi-value" style="color: ${kpi.color || accentColor};">${escapeHtml(kpi.value)}</div>
          <div class="kpi-label">${escapeHtml(kpi.label)}</div>
        </div>`
    )
    .join("");

  const today = formatArabicDate(new Date());

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; padding: 36px; color: #2D3748; background: #F7FAFC; }
          .wrap { max-width: 1100px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; position: relative; }
          .wrap::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, ${accentColor}, ${accentColor}99, ${accentColor}); }
          .inner { padding: 32px 36px 28px; }
          .header { display: flex; align-items: center; gap: 16px; padding-bottom: 18px; border-bottom: 2px solid ${accentLight}; margin-bottom: 22px; }
          .header-logo { width: 52px; height: 52px; flex-shrink: 0; }
          .header-center { flex: 1; }
          .header-org-name { font-size: 17px; font-weight: 900; color: #1A365D; line-height: 1.3; }
          .header-sub { font-size: 11px; color: ${accentColor}; font-weight: 600; }
          .header-left { text-align: left; font-size: 11px; color: #718096; font-weight: 600; flex-shrink: 0; }
          .title-section { text-align: center; margin-bottom: 24px; }
          .title-section h1 { font-size: 22px; font-weight: 900; color: #1A365D; display: inline-block; position: relative; }
          .title-section h1::after { content: ''; display: block; width: 50%; height: 4px; background: linear-gradient(90deg, transparent, ${accentColor}, transparent); margin: 8px auto 0; border-radius: 2px; }
          .title-sub { font-size: 13px; color: #718096; font-weight: 600; margin-top: 6px; }
          .kpi-bar { display: flex; gap: 12px; margin-bottom: 22px; flex-wrap: wrap; justify-content: center; }
          .kpi-card { flex: 1; min-width: 120px; border: 1px solid; border-radius: 10px; padding: 14px 16px; text-align: center; }
          .kpi-value { font-size: 22px; font-weight: 900; line-height: 1.2; }
          .kpi-label { font-size: 11px; font-weight: 700; color: #718096; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: ${accentBg}; color: ${accentColor}; font-size: 11px; font-weight: 800; border: 1px solid ${accentLight}; padding: 10px 8px; }
          td { border: 1px solid #E2E8F0; padding: 8px; font-size: 12px; color: #2D3748; }
          tr:nth-child(even) td { background: #FAFBFC; }
          .text-right { text-align: right; } .text-center { text-align: center; } .text-left { text-align: left; }
          .empty-cell { text-align: center; padding: 24px; color: #A0AEC0; font-weight: 600; }
          .footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #E2E8F0; }
          .footer-text { font-size: 10px; color: #A0AEC0; font-weight: 600; }
          @media print {
            body { background: #FFFFFF; padding: 0; }
            .wrap { box-shadow: none; border-radius: 0; }
            .inner { padding: 20px 24px; }
            @page { margin: 12mm 10mm; size: A4 portrait; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="inner">
            <div class="header">
              <img class="header-logo" src="${escapeHtml(resolvedLogoUrl)}" alt="Logo" />
              <div class="header-center">
                <div class="header-org-name">${escapeHtml(resolvedOrgName)}</div>
                <div class="header-sub">${escapeHtml(title)}</div>
              </div>
              <div class="header-left">${today}</div>
            </div>
            <div class="title-section">
              <h1>${escapeHtml(title)}</h1>
              ${subtitle ? `<div class="title-sub">${escapeHtml(subtitle)}</div>` : ""}
            </div>
            <div class="kpi-bar">${kpiCards}</div>
            <table>
              <thead><tr>${tableHead}</tr></thead>
              <tbody>${tableRows}</tbody>
            </table>
            <div class="footer">
              <div class="footer-text">نظام رفقاء القرآن - برنامج إدارة الجمعيات القرآنية</div>
            </div>
          </div>
        </div>
        <script>window.onload = function () { window.focus(); setTimeout(function () { window.print(); }, 300); };</script>
      </body>
    </html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printRewardsReport(
  batches: any[],
  ar: boolean,
  logoUrl?: string,
  orgName?: string
) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");
  if (!printWindow) return;

  const resolvedLogoUrl = logoUrl || "/brand/rafiq-logo.svg";
  const resolvedOrgName = orgName || (ar ? "جمعية رفقاء القرآن" : "Rafiq Al-Quran Association");
  const accentColor = "#2D9B7A";
  const accentLight = "#E4F4EE";
  const accentBg = "#F2FAF6";

  const statusLabel = (status: string) => {
    if (!ar) return status;
    if (status === "DRAFT") return "مسودة";
    if (status === "APPROVED") return "معتمد";
    if (status === "IN_PROGRESS") return "قيد الصرف";
    if (status === "PARTIALLY_PAID") return "مدفوع جزئياً";
    if (status === "PAID") return "مدفوع بالكامل";
    if (status === "FAILED") return "فشل";
    if (status === "VOIDED") return "ملغى";
    return status;
  };

  const typeLabel = (type: string) => {
    if (!ar) return type;
    if (type === "GENERAL") return "عامة";
    if (type === "PERFORMANCE") return "أداء";
    if (type === "ATTENDANCE") return "حضور";
    if (type === "COMPETITION") return "مسابقة";
    if (type === "OTHER") return "أخرى";
    return type;
  };

  const cycleLabel = (cycle: string) => {
    if (!ar) return cycle;
    if (cycle === "MONTHLY") return "شهري";
    if (cycle === "QUARTERLY") return "ربع سنوي";
    if (cycle === "ANNUAL") return "سنوي";
    return cycle;
  };

  const batchRows = batches
    .map(
      (b, i) => `
      <tr>
        <td class="text-center">${i + 1}</td>
        <td class="text-center">#${b.id}</td>
        <td class="text-center">${b.periodYear} - ${cycleLabel(b.cycle)}</td>
        <td class="text-center">${typeLabel(b.rewardType)}</td>
        <td class="text-center">${b.items?.length || 0}</td>
        <td class="text-left">${formatYemeniCurrency((b.items || []).reduce((acc: number, item: any) => acc + item.amount, 0))}</td>
        <td class="text-center"><span class="status-tag">${statusLabel(b.status)}</span></td>
        <td>${b.description || "-"}</td>
      </tr>`
    )
    .join("");

  const totalAmount = batches.reduce((sum, b) => sum + (b.items || []).reduce((acc: number, item: any) => acc + item.amount, 0), 0);
  const totalBeneficiaries = batches.reduce((sum, b) => sum + (b.items?.length || 0), 0);

  const today = formatArabicDate(new Date());

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${ar ? "كشف المكافآت" : "Rewards Report"}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; padding: 36px; color: #2D3748; background: #F7FAFC; }
          .wrap { max-width: 1100px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; position: relative; }
          .wrap::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 6px; background: linear-gradient(90deg, ${accentColor}, ${accentColor}99, ${accentColor}); }
          .inner { padding: 32px 36px 28px; }
          .header { display: flex; align-items: center; gap: 16px; padding-bottom: 18px; border-bottom: 2px solid ${accentLight}; margin-bottom: 22px; }
          .header-logo { width: 52px; height: 52px; flex-shrink: 0; }
          .header-center { flex: 1; }
          .header-org-name { font-size: 17px; font-weight: 900; color: #1A365D; line-height: 1.3; }
          .header-sub { font-size: 11px; color: ${accentColor}; font-weight: 600; }
          .header-left { text-align: left; font-size: 11px; color: #718096; font-weight: 600; flex-shrink: 0; }
          .title-section { text-align: center; margin-bottom: 24px; }
          .title-section h1 { font-size: 22px; font-weight: 900; color: #1A365D; display: inline-block; position: relative; }
          .title-section h1::after { content: ''; display: block; width: 50%; height: 4px; background: linear-gradient(90deg, transparent, ${accentColor}, transparent); margin: 8px auto 0; border-radius: 2px; }
          .summary-bar { display: flex; gap: 16px; margin-bottom: 22px; }
          .summary-card { flex: 1; background: ${accentBg}; border: 1px solid ${accentLight}; border-radius: 10px; padding: 12px 16px; text-align: center; }
          .summary-card-value { font-size: 20px; font-weight: 900; color: ${accentColor}; }
          .summary-card-label { font-size: 11px; font-weight: 700; color: #718096; margin-top: 2px; }
          table { width: 100%; border-collapse: collapse; }
          th { background: ${accentBg}; color: ${accentColor}; font-size: 11px; font-weight: 800; border: 1px solid ${accentLight}; padding: 10px 8px; }
          td { border: 1px solid #E2E8F0; padding: 8px; font-size: 12px; color: #2D3748; }
          tr:nth-child(even) td { background: #FAFBFC; }
          .text-right { text-align: right; } .text-center { text-align: center; } .text-left { text-align: left; }
          .status-tag { display: inline-block; padding: 2px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; background: ${accentLight}; color: ${accentColor}; }
          .footer { text-align: center; margin-top: 20px; padding-top: 12px; border-top: 1px solid #E2E8F0; }
          .footer-text { font-size: 10px; color: #A0AEC0; font-weight: 600; }
          @media print {
            body { background: #FFFFFF; padding: 0; }
            .wrap { box-shadow: none; border-radius: 0; }
            .inner { padding: 20px 24px; }
            @page { margin: 12mm 10mm; size: A4 landscape; }
          }
        </style>
      </head>
      <body>
        <div class="wrap">
          <div class="inner">
            <div class="header">
              <img class="header-logo" src="${resolvedLogoUrl}" alt="Logo" />
              <div class="header-center">
                <div class="header-org-name">${resolvedOrgName}</div>
                <div class="header-sub">${ar ? "إدارة الشؤون المالية" : "Financial Affairs Department"}</div>
              </div>
              <div class="header-left">${today}</div>
            </div>
            <div class="title-section">
              <h1>${ar ? "كشف المكافآت" : "Rewards Report"}</h1>
            </div>
            <div class="summary-bar">
              <div class="summary-card">
                <div class="summary-card-value">${batches.length}</div>
                <div class="summary-card-label">${ar ? "عدد الدفعات" : "Batches"}</div>
              </div>
              <div class="summary-card">
                <div class="summary-card-value">${totalBeneficiaries}</div>
                <div class="summary-card-label">${ar ? "إجمالي المستفيدين" : "Beneficiaries"}</div>
              </div>
              <div class="summary-card">
                <div class="summary-card-value">${formatYemeniCurrency(totalAmount)}</div>
                <div class="summary-card-label">${ar ? "إجمالي المبالغ" : "Total Amount"}</div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th class="text-center">#</th>
                  <th class="text-center">${ar ? "رقم الدفعة" : "Batch ID"}</th>
                  <th class="text-center">${ar ? "الفترة" : "Period"}</th>
                  <th class="text-center">${ar ? "النوع" : "Type"}</th>
                  <th class="text-center">${ar ? "المستفيدون" : "Beneficiaries"}</th>
                  <th class="text-left">${ar ? "الإجمالي" : "Total"}</th>
                  <th class="text-center">${ar ? "الحالة" : "Status"}</th>
                  <th>${ar ? "الوصف" : "Description"}</th>
                </tr>
              </thead>
              <tbody>${batchRows || `<tr><td colspan="8" class="text-center" style="padding:24px;color:#A0AEC0;">${ar ? "لا توجد بيانات" : "No data"}</td></tr>`}</tbody>
            </table>
            <div class="footer">
              <div class="footer-text">${ar ? "نظام رفقاء القرآن - برنامج إدارة الجمعيات القرآنية" : "Rafiq Al-Quran System - Quranic Society Management"}</div>
            </div>
          </div>
        </div>
        <script>window.onload = function () { window.focus(); setTimeout(function () { window.print(); }, 300); };</script>
      </body>
    </html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
