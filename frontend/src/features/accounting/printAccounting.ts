type PrintColumn<T> = {
  label: string;
  render: (row: T, index: number) => string | number | null | undefined;
  align?: "right" | "center" | "left";
};

type PrintSignature = {
  label: string;
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
}: PrintAccountingDocumentOptions<T>) {
  const printWindow = window.open("", "_blank", "width=1100,height=800");

  if (!printWindow) {
    alert("تعذر فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.");
    return;
  }

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
        <div class="signature-box">
          <div class="signature-line"></div>
          <div class="signature-label">${escapeHtml(signature.label)}</div>
        </div>
      `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8" />
        <title>${escapeHtml(title)}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 32px;
            direction: rtl;
            font-family: "Segoe UI", Tahoma, Arial, sans-serif;
            color: #111827;
            background: #ffffff;
          }

          .print-page {
            max-width: 1100px;
            margin: 0 auto;
          }

          .report-header {
            text-align: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 18px;
            margin-bottom: 22px;
          }

          .system-name {
            font-size: 22px;
            font-weight: 800;
            margin-bottom: 6px;
          }

          .report-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 6px;
          }

          .report-subtitle {
            font-size: 13px;
            color: #4b5563;
          }

          .meta-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin: 16px 0 20px;
            font-size: 13px;
            color: #374151;
          }

          .summary {
            margin: 14px 0 18px;
            padding: 12px 14px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            border-radius: 10px;
            font-size: 13px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 12px;
          }

          th {
            background: #f3f4f6;
            color: #374151;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid #d1d5db;
            padding: 9px 8px;
          }

          td {
            border: 1px solid #e5e7eb;
            padding: 8px;
            font-size: 12px;
            vertical-align: top;
          }

          tr:nth-child(even) td {
            background: #fafafa;
          }

          .text-right {
            text-align: right;
          }

          .text-center {
            text-align: center;
          }

          .text-left {
            text-align: left;
          }

          .empty-cell {
            text-align: center;
            padding: 24px;
            color: #6b7280;
          }

          .signatures {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            margin-top: 58px;
          }

          .signature-box {
            flex: 1;
            text-align: center;
          }

          .signature-line {
            border-top: 1px solid #111827;
            height: 1px;
            margin-bottom: 10px;
          }

          .signature-label {
            font-size: 13px;
            color: #374151;
          }

          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
          }

          @media print {
            body {
              padding: 18px;
            }

            .print-page {
              max-width: none;
            }

            .no-print {
              display: none !important;
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }

            thead {
              display: table-header-group;
            }
          }
        </style>
      </head>

      <body>
        <div class="print-page">
          <header class="report-header">
            <div class="system-name">نظام رفقاء القرآن</div>
            <div class="report-title">${escapeHtml(title)}</div>
            ${subtitle ? `<div class="report-subtitle">${escapeHtml(subtitle)}</div>` : ""}
          </header>

          <section class="meta-row">
            <div>تاريخ الطباعة: ${escapeHtml(formatArabicDate(new Date()))}</div>
            <div>تاريخ التقرير: ${escapeHtml(reportDate || formatArabicDate(new Date()))}</div>
          </section>

          ${summaryHtml ? `<section class="summary">${summaryHtml}</section>` : ""}

          <table>
            <thead>
              <tr>${tableHead}</tr>
            </thead>
            <tbody>${tableRows}</tbody>
          </table>

          <section class="signatures">
            ${signaturesHtml}
          </section>

          <footer class="footer">
            ${escapeHtml(footerNote)}
          </footer>
        </div>

        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

export function printVoucherReceipt(voucher: any, ar: boolean) {
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) return;

  const title = voucher.voucherType === "RECEIPT" ? (ar ? "سند قبض" : "Receipt Voucher") : (ar ? "سند صرف" : "Disbursement Voucher");
  const amountWords = ar ? "فقط لا غير" : "Only"; // Simulating amount in words for premium feel

  const getAccountingStatus = (v: any, isAr: boolean) => {
    if (v.status !== "POSTED") return isAr ? "غير مرحل" : "Not Posted";
    if (v.voucherType === "RECEIPT") {
      if (v.sourceType === "PAYMENT") return isAr ? "القيد مسجل عبر الدفعة" : "Entry registered via payment";
      return isAr ? "تم إنشاء قيد محاسبي" : "Accounting entry created";
    }
    if (v.voucherType === "DISBURSEMENT") return isAr ? "القيد المحاسبي مؤجل" : "Accounting entry deferred";
    return isAr ? "مكتمل" : "Completed";
  };

  const html = `
    <!DOCTYPE html>
    <html dir="${ar ? "rtl" : "ltr"}" lang="${ar ? "ar" : "en"}">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 40px; color: #333; }
          .voucher { border: 2px solid #111827; padding: 30px; position: relative; border-radius: 8px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 20px; }
          .system-info { font-weight: bold; font-size: 1.2rem; }
          .voucher-title { font-size: 1.5rem; text-decoration: underline; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px; }
          .field { border-bottom: 1px dotted #999; padding: 5px 0; }
          .label { font-weight: bold; margin-${ar ? "left" : "right"}: 10px; }
          .amount-box { border: 2px solid #111827; padding: 10px 20px; font-size: 1.3rem; font-weight: bold; display: inline-block; margin-bottom: 20px; border-radius: 4px; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; }
          .sig { text-align: center; flex: 1; }
          .sig-line { border-top: 1px solid #333; width: 150px; margin: 10px auto; }
          @media print { body { padding: 0; } .voucher { border: 2px solid #000; } }
        </style>
      </head>
      <body>
        <div class="voucher">
          <div class="header">
            <div class="system-info">${ar ? "نظام رفقاء القرآن" : "Rafiq Al-Quran System"}</div>
            <div class="voucher-title">${title}</div>
            <div class="system-info">No: ${voucher.voucherNo}</div>
          </div>
          
          <div class="meta">
            <div class="field"><span class="label">${ar ? "تاريخ السند:" : "Date:"}</span> ${new Date(voucher.voucherDate || voucher.createdAt).toLocaleDateString(ar ? "ar-YE-u-nu-latn" : "en-US")}</div>
            <div class="field"><span class="label">${ar ? "طريقة الدفع:" : "Method:"}</span> ${voucher.paymentMethod || "-"}</div>
            <div class="field"><span class="label">${ar ? "المركز:" : "Center:"}</span> ${voucher.center?.name || (ar ? "المركز الرئيسي" : "Main Center")}</div>
            <div class="field"><span class="label">${ar ? "الفئة المحاسبية:" : "Account Category:"}</span> ${voucher.accountingCategory || "-"}</div>
            <div class="field" style="grid-column: span 2;"><span class="label">${ar ? "حالة القيد:" : "Accounting Status:"}</span> <strong>${getAccountingStatus(voucher, ar)}</strong></div>
          </div>

          <div class="amount-box">
            ${ar ? "المبلغ:" : "Amount:"} ${formatYemeniCurrency(voucher.amount)} (${amountWords})
          </div>

          ${(() => {
            // FA-UX-4B: when the voucher was originated in a foreign currency, expose
            // the original amount, currency and exchange rate alongside the YER base.
            const code = (voucher.originalCurrencyCode || "YER").toString().toUpperCase();
            if (code === "YER") return "";
            const orig = Number(voucher.originalAmount ?? 0);
            const rate = Number(voucher.exchangeRateToBase ?? 0);
            const base = Number(voucher.amount ?? 0);
            if (!Number.isFinite(orig) || !Number.isFinite(rate) || orig <= 0 || rate <= 0) return "";
            const fmt = (n: number) =>
              new Intl.NumberFormat(ar ? "ar-YE-u-nu-latn" : "en-US", { maximumFractionDigits: 2 }).format(n);
            return `
              <div class="meta" style="margin-bottom: 20px;">
                <div class="field"><span class="label">${ar ? "المبلغ الأصلي:" : "Original Amount:"}</span> ${fmt(orig)} ${escapeHtml(code)}</div>
                <div class="field"><span class="label">${ar ? "العملة:" : "Currency:"}</span> ${escapeHtml(code)}</div>
                <div class="field"><span class="label">${ar ? "سعر الصرف:" : "Exchange Rate:"}</span> ${fmt(rate)}</div>
                <div class="field"><span class="label">${ar ? "المبلغ المعادل:" : "Equivalent (YER):"}</span> ${formatYemeniCurrency(base)}</div>
              </div>
            `;
          })()}

          <div class="field" style="margin-bottom: 20px;">
            <span class="label">${ar ? "يصرف لـ/يستلم من:" : "Pay to / Receive from:"}</span> ${voucher.beneficiary || "__________________________________________________"}
          </div>

          <div class="field" style="margin-bottom: 20px;">
            <span class="label">${ar ? "وذلك مقابل:" : "Being for:"}</span> ${voucher.description || "__________________________________________________"}
          </div>

          ${voucher.notes ? `
          <div class="field" style="margin-bottom: 20px; font-size: 0.9rem; color: #666;">
            <span class="label">${ar ? "ملاحظات:" : "Notes:"}</span> ${voucher.notes}
          </div>
          ` : ""}

          <div class="footer">
            <div class="sig">
              <div class="sig-label">${ar ? "المحاسب" : "Accountant"}</div>
              <div class="sig-line"></div>
            </div>
            <div class="sig">
              <div class="sig-label">${ar ? "المستلم" : "Recipient"}</div>
              <div class="sig-line"></div>
            </div>
            <div class="sig">
              <div class="sig-label">${ar ? "المدير" : "Manager"}</div>
              <div class="sig-line"></div>
            </div>
          </div>
        </div>
        <script>window.onload = () => { window.print(); window.close(); };</script>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
