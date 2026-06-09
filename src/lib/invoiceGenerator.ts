import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  paidDate: string | null;
  billFrom: {
    name: string;
    address: string;
  };
  billTo: {
    name: string;
    address: string;
  };
  planName: string;
  price: number;
  features: string[];
  terms: string[];
}

const formatRupiah = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
] as const;

function getMonthIndex(name: string): number {
  const lower = name.toLowerCase().trim();
  return MONTHS_ID.findIndex((m) => m.toLowerCase() === lower);
}

function parseInvoiceDate(dateStr: string): { day: number; month: number; year: number } | null {
  const parts = dateStr.trim().split(/\s+/);
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = getMonthIndex(parts[1]);
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || month === -1 || isNaN(year)) return null;
  return { day, month, year };
}

/**
 * Returns the correct invoiceDate and dueDate for a billing period.
 * - No argument (or first call): special first invoice on 6 Juni 2026, due 1 Juni 2026
 * - For July 2026 and onwards: both invoice date and due date are on the 1st of the month
 *   (e.g. pass '6 Juli 2026' or '15 Juli 2026' → invoice: '1 Juli 2026', due: '1 Juli 2026')
 */
function getBillingDates(input?: string): { invoiceDate: string; dueDate: string } {
  const parsed = input ? parseInvoiceDate(input) : null;

  // Special first invoice: 6 Juni 2026 (invoice date), due 1 Juni 2026
  // This applies when no date passed, OR when explicitly asking for Juni 2026
  const isFirstInvoicePeriod =
    !parsed || (parsed.month === 5 && parsed.year === 2026); // month 5 = Juni (0-indexed)

  if (isFirstInvoicePeriod) {
    return {
      invoiceDate: '6 Juni 2026',
      dueDate: '1 Juni 2026',
    };
  }

  // July 2026 and onwards: both invoice date and jatuh tempo on the 1st of the month
  const { month, year } = parsed!;
  const firstOfMonth = `1 ${MONTHS_ID[month]} ${year}`;
  return {
    invoiceDate: firstOfMonth,
    dueDate: firstOfMonth,
  };
}

const generateInvoiceNumber = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `INV-${y}${m}-${seq}`;
};

function buildInvoice(data: InvoiceData): jsPDF {
  const isPaid = data.paidDate !== null;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = 20;

  // ── Header background ──
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageW, 45, 'F');

  // Company name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('NoHype Labs', margin, 20);

  // Tagline
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('Software Solution & System Integration', margin, 27);

  // INVOICE label (right)
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  if (isPaid) {
    doc.setTextColor(34, 197, 94); // green-500
  } else {
    doc.setTextColor(59, 130, 246); // blue-500
  }
  doc.text(isPaid ? 'INVOICE — LUNAS' : 'INVOICE', pageW - margin, 28, { align: 'right' });

  // Invoice number (right)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text(data.invoiceNumber, pageW - margin, 36, { align: 'right' });

  y = 55;

  // ── Bill From / Bill To ──
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DARI', margin, y);
  doc.text('KEPADA', margin + 85, y);

  y += 6;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(data.billFrom.name, margin, y);
  doc.text(data.billTo.name, margin + 85, y);

  y += 5;
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(data.billFrom.address, margin, y);
  doc.text(data.billTo.address, margin + 85, y);

  // ── Date row ──
  y += 14;
  const dateBoxY = y;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, dateBoxY, contentW, 16, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('TANGGAL INVOICE', margin + 6, dateBoxY + 6);
  doc.text(isPaid ? 'TGL BAYAR' : 'JATUH TEMPO', margin + 70, dateBoxY + 6);
  doc.text('STATUS', margin + 134, dateBoxY + 6);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(data.invoiceDate, margin + 6, dateBoxY + 12);
  doc.text(isPaid ? data.paidDate! : data.dueDate, margin + 70, dateBoxY + 12);

  // Status badge
  if (isPaid) {
    doc.setFillColor(220, 252, 231); // green-100
    doc.roundedRect(margin + 130, dateBoxY + 8, 40, 6, 1, 1, 'F');
    doc.setTextColor(21, 128, 61); // green-700
    doc.setFontSize(8);
    doc.text('Lunas', margin + 150, dateBoxY + 12, { align: 'center' });
  } else {
    doc.setFillColor(254, 243, 199); // amber-100
    doc.roundedRect(margin + 130, dateBoxY + 8, 40, 6, 1, 1, 'F');
    doc.setTextColor(180, 83, 9); // amber-700
    doc.setFontSize(8);
    doc.text('Menunggu Bayar', margin + 150, dateBoxY + 12, { align: 'center' });
  }

  // ── Item Table ──
  y = dateBoxY + 24;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Detail Layanan', margin, y);

  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Deskripsi', 'Qty', 'Harga Satuan', 'Total']],
    body: [
      [
        `Subscription System Monitoring Toilet\nPaket: ${data.planName} — Bulanan\nPembayaran ke-1 dari 12 bulan`,
        '1',
        formatRupiah(data.price),
        formatRupiah(data.price),
      ],
    ],
    columnStyles: {
      0: { cellWidth: 85 },
      1: { cellWidth: 15, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' },
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 4,
      textColor: [15, 23, 42],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    theme: 'plain',
    didParseCell: (hookData) => {
      if (hookData.section === 'head') {
        hookData.cell.styles.lineWidth = 0;
      }
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // ── Total section ──
  const totalBoxX = pageW - margin - 70;

  if (isPaid) {
    doc.setFillColor(22, 101, 52); // green-800
  } else {
    doc.setFillColor(15, 23, 42);
  }
  doc.roundedRect(totalBoxX, finalY, 70, 20, 2, 2, 'F');

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(isPaid ? 'DIBAYAR' : 'TOTAL', totalBoxX + 6, finalY + 8);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatRupiah(data.price), totalBoxX + 64, finalY + 8, { align: 'right' });

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('/bulan', totalBoxX + 64, finalY + 15, { align: 'right' });

  // ── Payment Info (Rekening) ──
  const payInfoY = finalY + 26;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, payInfoY, contentW, 18, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('INFORMASI PEMBAYARAN', margin + 6, payInfoY + 6);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('BNI  1988595892  a.n. Abdul Gofur', margin + 6, payInfoY + 13);

  // ── Paid stamp watermark ──
  if (isPaid) {
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 197, 94); // green-500
    doc.setFontSize(60);
    const stampX = pageW / 2;
    const stampY = finalY - 15;
    doc.text('LUNAS', stampX, stampY, { align: 'center', angle: 25, renderingMode: 'stroke' });
    doc.setLineWidth(1.5);
    doc.setDrawColor(34, 197, 94);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.text('LUNAS', stampX, stampY, { align: 'center', angle: 25, renderingMode: 'stroke' });
  }

  // ── Features section ──
  let featY = payInfoY + 24;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Fitur yang Termasuk', margin, featY);

  featY += 6;

  const colW = contentW / 2;
  data.features.forEach((feature, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const fx = margin + col * colW;
    const fy = featY + row * 5;

    if (fy > 270) {
      doc.addPage();
      featY = 20;
      return;
    }

    doc.setFillColor(59, 130, 246);
    doc.circle(fx + 1.5, fy - 1, 1, 'F');

    doc.setTextColor(51, 65, 85);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(feature, fx + 5, fy);
  });

  // ── Terms ──
  const lastFeatureRow = Math.ceil(data.features.length / 2);
  let termY = featY + lastFeatureRow * 5 + 10;

  if (termY > 255) {
    doc.addPage();
    termY = 20;
  }

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, termY, pageW - margin, termY);

  termY += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Ketentuan', margin, termY);

  termY += 5;
  data.terms.forEach((term, i) => {
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${i + 1}. ${term}`, margin + 2, termY);
    termY += 4.5;
  });

  // ── Footer ──
  const footerY = 280;
  doc.setFillColor(15, 23, 42);
  doc.rect(0, footerY - 5, pageW, 22, 'F');

  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('NoHype Labs — Software Solution & System Integration', pageW / 2, footerY, { align: 'center' });
  doc.text('Kota Bandung, Jawa Barat, Indonesia', pageW / 2, footerY + 4, { align: 'center' });
  doc.text('Terima kasih atas kepercayaan Anda.', pageW / 2, footerY + 8, { align: 'center' });

  return doc;
}

// ── Shared data ──
const INVOICE_DEFAULTS = {
  // Dates are dynamically provided by getBillingDates() for each period
  // (special 6 Juni for first invoice, 1st of month for July+)
  billFrom: {
    name: 'NoHype Labs',
    address: 'Kota Bandung, Jawa Barat, Indonesia',
  },
  billTo: {
    name: 'PT Prenacons Indonesia',
    address: 'Jl. Ade Lili No. 8 Bumi Adipura, Kota Bandung',
  },
  planName: 'Basic',
  price: 700000,
  features: [
    'Maintenance rutin',
    'Penambahan fitur baru',
    'Penanganan bug realtime / fast response',
    'Unlimited lokasi toilet',
    'Max 100 building',
    'Max 5 Organization / perusahaan',
    'QR Scanning System Integrated with Camera',
    'Auto Generated QR all location',
    'Akun admin tanpa batas',
    'Dashboard realtime',
    'Chart based on progress',
    'Analitik',
    'PWA (Progressive Web App)',
  ],
  terms: [
    'Jatuh tempo setiap tanggal 1 setiap bulan.',
    'Invoice ini adalah pembayaran pertama dari 12 bulan subscription.',
    'Pembayaran dilakukan sebelum atau pada tanggal jatuh tempo.',
    'Setiap bulan, tanggal invoice dan jatuh tempo akan diperbarui otomatis.',
    'Layanan aktif setelah pembayaran dikonfirmasi.',
    'Dukungan teknis tersedia Senin - Sabtu, 08:00 - 17:00 WIB.',
    'Pembaruan dan pemeliharaan sistem dilakukan secara berkala tanpa downtime.',
  ],
};

/** Generate unpaid invoice — used on PaymentMethodPage.
 * - No arg → first invoice (6 Juni 2026 invoice date, 1 Juni due)
 * - Pass date for July+ (e.g. '6 Juli 2026') → both invoice and due date become 1 Juli 2026
 */
export function generateInvoice(invoiceDate?: string): void {
  const billing = getBillingDates(invoiceDate);
  const data: InvoiceData = {
    ...INVOICE_DEFAULTS,
    invoiceDate: billing.invoiceDate,
    dueDate: billing.dueDate,
    invoiceNumber: generateInvoiceNumber(),
    paidDate: null,
  };
  const doc = buildInvoice(data);
  doc.save(`${data.invoiceNumber}.pdf`);
}

/** Generate paid/lunas invoice — ready to enable when payment confirmed.
 * - No arg → first invoice (6 Juni 2026 invoice date, 1 Juni due)
 * - Pass date for July+ → invoice + due date set to the 1st of that month
 */
export function generatePaidInvoice(paidDate: string, invoiceDate?: string): void {
  const billing = getBillingDates(invoiceDate);
  const data: InvoiceData = {
    ...INVOICE_DEFAULTS,
    invoiceDate: billing.invoiceDate,
    dueDate: billing.dueDate,
    invoiceNumber: generateInvoiceNumber(),
    paidDate,
  };
  const doc = buildInvoice(data);
  doc.save(`${data.invoiceNumber}-LUNAS.pdf`);
}
