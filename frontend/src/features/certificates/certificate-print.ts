import type { CertificateTemplateData } from "./types";
import { CERTIFICATE_ASSETS } from "./constants";

const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const formatDate = (value?: string | null): string => {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return escapeHtml(value);
  }

  return new Intl.DateTimeFormat("ar-SA-u-nu-latn", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(parsed);
};

const logoMarkup = (src: string | null, label: string) => {
  if (!src) {
    return `<div class="logo-holder"><span>${escapeHtml(label)}</span></div>`;
  }

  return `<div class="logo-holder"><img src="${escapeHtml(src)}" alt="${escapeHtml(label)}" /></div>`;
};

const certificateBody = (data: CertificateTemplateData): string => {
  if (data.kind === "FULL_QURAN_COMPLETION") {
    return `
      <div class="merged-line">
        تشهد ${escapeHtml(data.associationName)} ومركز ${escapeHtml(data.centerName)} بأن الطالبــ / ـة:
        <span class="student-name-inline">${escapeHtml(data.studentName)}</span>
      </div>
      <div class="merged-line">
        قد أتم حفظ كتاب الله تعالى كاملًا برواية ${escapeHtml(data.riwaya)} عن ظهر قلب وبإتقان وحصل على تقدير: 
        <span class="grade-inline">${escapeHtml(data.gradeLabel)}</span>
      </div>
      <p class="congrats-text">وبناءً عليه مُنحت له هذه الشهادة تقديرًا لجهوده المباركة، سائلين المولى عز وجل أن يبارك فيه وينفع به، وأن يجعله من أهل القرآن وخاصته.</p>
    `;
  }

  return `
    <div class="merged-line">
      تشهد ${escapeHtml(data.associationName)} ومركز ${escapeHtml(data.centerName)} بأن الطالبــ / ـة:
      <span class="student-name-inline">${escapeHtml(data.studentName)}</span>
    </div>
    <div class="merged-line">
      قد اجتاز ${escapeHtml(data.examTitle ?? data.examCategory ?? "الاختبار")} في المقرر من ${escapeHtml(data.rangeLabel ?? "المقرر المعتمد")} وحصل على تقدير: 
      <span class="grade-inline">${escapeHtml(data.gradeLabel)}</span>
    </div>
    <p class="congrats-text">وبناءً عليه مُنحت له هذه الشهادة تقديرًا لتميّزه واجتهاده، سائلين الله تعالى له دوام التوفيق والقبول.</p>
  `;
};

const detailLine = (data: CertificateTemplateData): string => {
  if (data.kind === "FULL_QURAN_COMPLETION") {
    return `تاريخ الختم/الاعتماد: ${formatDate(data.completionDate)} | الحلقة: ${escapeHtml(data.circleName ?? "-")} | الرواية: ${escapeHtml(data.riwaya ?? "-")}`;
  }

  return `تاريخ الاختبار: ${formatDate(data.examDate)} | الحلقة: ${escapeHtml(data.circleName ?? "-")} | ${escapeHtml(data.examCategory ?? "اختبار")}`;
};

const getTitleImageUrl = (kind: string) => {
  if (kind === "FULL_QURAN_COMPLETION") {
    return CERTIFICATE_ASSETS.QURAN_COMPLETION;
  }
  return CERTIFICATE_ASSETS.APPRECIATION;
};

export const renderCertificateHtml = (data: CertificateTemplateData): string => {
  const signatures = data.signatures
    .map(
      (slot) => `
        <div>
          <div class="signature-title">${escapeHtml(slot.role)}</div>
          <div class="signature-line">${escapeHtml(slot.name || "الاسم والتوقيع")}</div>
        </div>
      `
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(data.certificateTitle)}</title>
  <style>
    :root {
      --primary: #0f766e;
      --primary-dark: #0b5a54;
      --gold: #b98a2f;
      --ink: #1f2937;
      --muted: #6b7280;
      --danger: #8f2d2d;
      --paper: #fffdf8;
      --border: #d9c8a0;
      --line: rgba(185, 138, 47, 0.40);
    }

    * { box-sizing: border-box; }

    html,
    body {
      margin: 0;
      min-height: 100%;
      font-family: "Tahoma", "Arial", sans-serif;
      background: #eef1f4;
      color: var(--ink);
    }

    body {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 18px;
    }

    .certificate {
      width: 29.7cm;
      height: 21cm;
      background:
      radial-gradient(circle at 50% 42%, rgba(185, 138, 47, 0.05), transparent 36%),
      var(--paper);
      position: relative;
      overflow: hidden;
      box-shadow: 0 12px 36px rgba(15, 23, 42, 0.12);
    }

    .certificate::before {
      content: "";
      position: absolute;
      inset: 0.45cm;
      border: 2px solid var(--border);
      pointer-events: none;
    }

    .certificate::after {
      content: "";
      position: absolute;
      inset: 0.75cm;
      border: 1px solid var(--line);
      pointer-events: none;
    }

    .corner {
      position: absolute;
      width: 3.2cm;
      height: 3.2cm;
      z-index: 1;
      pointer-events: none;
    }

    .corner::before,
    .corner::after {
      content: "";
      position: absolute;
      border-color: var(--primary-dark);
      opacity: 0.78;
    }

    .corner::before {
      width: 2.55cm;
      height: 0.12cm;
      background: var(--primary-dark);
    }

    .corner::after {
      width: 0.12cm;
      height: 2.55cm;
      background: var(--gold);
    }

    .corner--tr { top: 0.92cm; right: 0.92cm; }
    .corner--tr::before { right: 0; top: 0; border-top-right-radius: 99px; }
    .corner--tr::after { right: 0; top: 0; border-top-right-radius: 99px; }
    .corner--tl { top: 0.92cm; left: 0.92cm; transform: scaleX(-1); }
    .corner--br { bottom: 0.92cm; right: 0.92cm; transform: scaleY(-1); }
    .corner--bl { bottom: 0.92cm; left: 0.92cm; transform: scale(-1); }

    .content {
      position: relative;
      z-index: 2;
      width: 100%;
      height: 100%;
      padding: 1.5cm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }

    .header {
      display: grid;
      grid-template-columns: 3.4cm 1fr 3.4cm;
      gap: 0.7cm;
      align-items: start;
      text-align: center;
    }

    .logo-holder {
      width: 3.5cm;
      height: 3.5cm;
      margin: 0 auto 0.15cm;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-size: 11px;
      color: var(--muted);
    }

    .logo-holder img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .logo-name {
      display: none;
    }

    .basmala {
      font-size: 14px;
      color: #4b5563;
      font-weight: 700;
      margin-bottom: 0.18cm;
    }

    .main-title-img {
      width: 14cm;
      height: auto;
      margin: 0.1cm auto;
      display: block;
    }

    .sub-title {
      font-size: 14px;
      color: var(--gold);
      font-weight: 700;
      margin-top: 0.08cm;
    }

    .title-divider {
      width: 8cm;
      height: 3px;
      margin: 0.25cm auto 0;
      background: linear-gradient(90deg, transparent, var(--gold), transparent);
      border-radius: 999px;
    }

    .body {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }

    .certificate-text {
      text-align: center;
      font-size: 18px;
      line-height: 1.95;
      max-width: 23.5cm;
      margin: 0 auto;
    }

    .certificate-text p {
      margin: 0;
    }

    .merged-line {
      text-align: center;
      font-size: 20px;
      line-height: 2.2;
      margin: 0.1cm 0;
    }

    .student-name-inline {
      font-size: 26px;
      font-weight: 800;
      color: var(--danger);
      margin: 0 0.15cm;
    }

    .grade-inline {
      font-weight: 800;
      color: var(--gold);
      margin: 0 0.1cm;
    }

    .congrats-text {
      margin-top: 0.5cm !important;
      font-size: 16px;
      color: var(--muted);
      max-width: 20cm;
      margin-left: auto;
      margin-right: auto;
    }

    .mini-details {
      margin-top: 0.36cm;
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      color: var(--primary-dark);
      line-height: 1.8;
    }

    .footer {
      margin-top: 0.3cm;
      border-top: 1px solid var(--line);
      padding-top: 0.32cm;
    }

    .approval-line {
      text-align: center;
      color: var(--muted);
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 0.26cm;
    }

    .signatures {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1cm;
      text-align: center;
      align-items: end;
    }

    .signature-title {
      font-size: 16px;
      font-weight: 800;
      color: var(--danger);
      margin-bottom: 0.72cm;
    }

    .signature-line {
      border-top: 1px dashed #7c7c7c;
      padding-top: 0.12cm;
      font-size: 13px;
      color: var(--muted);
      min-height: 0.45cm;
    }

    .certificate-code {
      text-align: center;
      font-size: 12px;
      color: var(--muted);
      margin-top: 0.22cm;
    }

    @media print {
      body {
        background: #fff;
        padding: 0;
      }

      .certificate {
        box-shadow: none;
      }

      @page {
        size: A4 landscape;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  <section class="certificate">
    <div class="corner corner--tr"></div>
    <div class="corner corner--tl"></div>
    <div class="corner corner--br"></div>
    <div class="corner corner--bl"></div>
    <div class="content">
      <div class="header">
        <div>
          ${logoMarkup(data.associationLogoUrl, "شعار الجمعية")}
        </div>

        <div>
          <div class="basmala">بسم الله الرحمن الرحيم</div>
          <img src="${getTitleImageUrl(data.kind)}" class="main-title-img" alt="${escapeHtml(data.certificateTitle)}" />
          <div class="sub-title">${escapeHtml(data.certificateSubtitle)}</div>
          <div class="title-divider"></div>
        </div>

        <div>
          ${logoMarkup(data.centerLogoUrl, "شعار المركز")}
        </div>
      </div>

      <div class="body">
        <div class="certificate-text">${certificateBody(data)}</div>
        <div class="mini-details">${detailLine(data)}</div>
      </div>

      <div class="footer">
        <div class="approval-line">هذه الشهادة صادرة عن النظام ومعتمدة من الجهة المختصة</div>
        <div class="signatures">${signatures}</div>
        <div class="certificate-code">رقم الشهادة: ${escapeHtml(data.certificateSerial)}</div>
      </div>
    </div>
  </section>
</body>
</html>`;
};

export const printCertificate = (data: CertificateTemplateData) => {
  const printWindow = openCertificatePrintWindow();
  writeCertificateToWindow(printWindow, data);
};

export const openCertificatePrintWindow = () => {
  const printWindow = window.open("about:blank", "_blank", "width=1200,height=900");
  if (!printWindow) {
    throw new Error("تعذر فتح نافذة الطباعة");
  }

  printWindow.document.write(`
    <html lang="ar" dir="rtl">
      <head><title>تجهيز الشهادة</title></head>
      <body style="font-family: Tahoma, Arial, sans-serif; padding: 32px; text-align: center;">
        جار تجهيز الشهادة...
      </body>
    </html>
  `);
  printWindow.document.close();
  return printWindow;
};

export const writeCertificateToWindow = (printWindow: Window, data: CertificateTemplateData) => {
  printWindow.document.open();
  printWindow.document.write(renderCertificateHtml(data));
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
};
