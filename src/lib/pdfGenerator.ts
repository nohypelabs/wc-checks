// PDF Report Generator for WC Check Monthly Reports
import jsPDF from 'jspdf';
import autoTable, { type UserOptions } from 'jspdf-autotable';
import { format, getDaysInMonth } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import type {
  PDFReportData,
  PDFScoreTableRow,
  PDFPhotoItem,
  PDFCleanerStats,
  PDFConfig,
  DateInspections,
} from '../types/pdf.types';
import { getScoreColorString } from '../types/pdf.types';
import { InspectionReport } from '../hooks/useReports';

/**
 * Generate monthly PDF report
 */
export async function generateMonthlyReport(
  dateInspections: DateInspections[],
  currentDate: Date,
  organizationName: string = 'PT Prenacons Internusa',
  siteName: string = 'Lokasi WC'
): Promise<void> {
  const month = format(currentDate, 'yyyy-MM');
  const year = format(currentDate, 'yyyy');
  const monthName = format(currentDate, 'MMMM', { locale: idLocale });

  const reportData: PDFReportData = {
    month,
    year,
    monthName,
    organizationName,
    siteName,
    dateInspections,
  };

  // Create PDF
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const config: PDFConfig = {
    pageWidth: 210,
    pageHeight: 297,
    marginTop: 15,
    marginRight: 15,
    marginBottom: 15,
    marginLeft: 15,
    contentWidth: 180, // 210 - 30
  };

  // Page 1: Cover Page
  await addCoverPage(pdf, reportData, config);

  // Page 2: Score Table
  pdf.addPage();
  await addScoreTablePage(pdf, reportData, config);

  // Page 3: Photo Documentation
  pdf.addPage();
  await addPhotoDocumentationPage(pdf, reportData, config);

  // Page 4: Cleaner Stats
  pdf.addPage();
  await addCleanerStatsPage(pdf, reportData, config);

  // Page 5: Signature Section
  pdf.addPage();
  addSignaturePage(pdf, reportData, config);

  // Download PDF
  const filename = `Laporan_Kebersihan_${monthName}_${year}.pdf`;
  pdf.save(filename);
}

/**
 * Page 1: Cover Page
 */
async function addCoverPage(
  pdf: jsPDF,
  data: PDFReportData,
  config: PDFConfig
): Promise<void> {
  const { marginLeft, contentWidth } = config;
  let yPos = 40;

  // Try to load logo
  try {
    const logoData = await loadImageAsBase64('/logo.png');
    if (logoData) {
      // Add logo centered at top
      const logoWidth = 40;
      const logoHeight = 40;
      const logoX = (config.pageWidth - logoWidth) / 2;
      pdf.addImage(logoData, 'PNG', logoX, 20, logoWidth, logoHeight);
      yPos = 70;
    }
  } catch (error) {
    console.warn('Failed to load logo:', error);
  }

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const title = 'LAPORAN KEGIATAN\nKEBERSIHAN BULANAN';
  const titleLines = title.split('\n');
  titleLines.forEach((line) => {
    pdf.text(line, config.pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;
  });

  yPos += 20;

  // Organization Details
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');

  const details = [
    ['Organisasi', data.organizationName],
    ['Lokasi', data.siteName],
    ['Periode', `${data.monthName} ${data.year}`],
    ['Tanggal Cetak', format(new Date(), 'dd MMMM yyyy', { locale: idLocale })],
  ];

  details.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${label}:`, marginLeft + 20, yPos);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, marginLeft + 60, yPos);
    yPos += 8;
  });
}

/**
 * Page 2: Score Table (Dashboard Skor)
 */
async function addScoreTablePage(
  pdf: jsPDF,
  data: PDFReportData,
  config: PDFConfig
): Promise<void> {
  const { marginLeft, marginTop } = config;

  // Page Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DASHBOARD SKOR KEBERSIHAN', marginLeft, marginTop);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Periode: ${data.monthName} ${data.year}`,
    marginLeft,
    marginTop + 7
  );

  // Prepare score table data
  const scoreTable = prepareScoreTable(data);

  if (scoreTable.length === 0) {
    pdf.setFontSize(10);
    pdf.text('Tidak ada data inspeksi untuk bulan ini.', marginLeft, marginTop + 20);
    return;
  }

  // Get number of days in month
  const daysInMonth = getDaysInMonth(new Date(data.month + '-01'));

  // Create table headers (dates 1-31)
  const headers = ['Lokasi', 'Gedung'];
  for (let day = 1; day <= daysInMonth; day++) {
    headers.push(day.toString());
  }

  // Create table body
  const tableBody = scoreTable.map((row) => {
    const rowData = [row.location, row.building];
    for (let day = 1; day <= daysInMonth; day++) {
      const score = row.scores[day];
      rowData.push(score !== null ? score.toString() : '-');
    }
    return rowData;
  });

  // Use autoTable for table generation
  autoTable(pdf, {
    head: [headers],
    body: tableBody,
    startY: marginTop + 12,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 30 }, // Location
      1: { halign: 'left', cellWidth: 25 }, // Building
    },
    didParseCell: function (data) {
      // Color code score cells
      if (data.section === 'body' && data.column.index >= 2) {
        const cellValue = data.cell.raw;
        if (cellValue && cellValue !== '-') {
          const score = parseInt(cellValue as string, 10);
          const color = getScoreColorString(score);
          data.cell.styles.fillColor = hexToRgb(color);

          // Set text color based on background
          if (score >= 90) {
            data.cell.styles.textColor = [0, 0, 0]; // Black text on green/yellow
          } else {
            data.cell.styles.textColor = [255, 255, 255]; // White text on red
          }
        }
      }
    },
    margin: { left: marginLeft, right: config.marginRight },
  });

  // Add legend
  const legendY = (pdf as any).lastAutoTable.finalY + 5;
  addScoreLegend(pdf, marginLeft, legendY);
}

/**
 * Page 3: Photo Documentation
 */
async function addPhotoDocumentationPage(
  pdf: jsPDF,
  data: PDFReportData,
  config: PDFConfig
): Promise<void> {
  const { marginLeft, marginTop, contentWidth } = config;

  // Page Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DOKUMENTASI FOTO', marginLeft, marginTop);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Periode: ${data.monthName} ${data.year}`,
    marginLeft,
    marginTop + 7
  );

  // Collect photos
  const photos = collectPhotos(data);

  if (photos.length === 0) {
    pdf.text('Tidak ada foto dokumentasi untuk bulan ini.', marginLeft, marginTop + 20);
    return;
  }

  // Display photos in grid (3 per row)
  const photosPerRow = 3;
  const photoWidth = (contentWidth - 10) / photosPerRow; // 10mm for spacing
  const photoHeight = photoWidth * 0.75; // 4:3 aspect ratio
  const spacing = 5;

  let xPos = marginLeft;
  let yPos = marginTop + 15;
  let photoCount = 0;

  // Limit to first 12 photos to avoid too many pages
  const maxPhotos = 12;
  const photosToShow = photos.slice(0, maxPhotos);

  for (const photo of photosToShow) {
    // Check if we need a new row
    if (photoCount > 0 && photoCount % photosPerRow === 0) {
      xPos = marginLeft;
      yPos += photoHeight + spacing + 10; // 10mm for caption
    }

    // Check if we need a new page
    if (yPos + photoHeight > config.pageHeight - config.marginBottom) {
      pdf.addPage();
      yPos = marginTop;
      xPos = marginLeft;
    }

    try {
      // Load and add photo
      const imageData = await loadImageAsBase64(photo.url);
      if (imageData) {
        pdf.addImage(imageData, 'JPEG', xPos, yPos, photoWidth, photoHeight);

        // Add caption
        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        const caption = `${photo.location}\n${photo.date}`;
        pdf.text(caption, xPos + photoWidth / 2, yPos + photoHeight + 3, {
          align: 'center',
        });
      }
    } catch (error) {
      console.warn(`Failed to load image: ${photo.url}`, error);
      // Draw placeholder rectangle
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(240, 240, 240);
      pdf.rect(xPos, yPos, photoWidth, photoHeight, 'FD');

      pdf.setFontSize(8);
      pdf.text('Foto tidak tersedia', xPos + photoWidth / 2, yPos + photoHeight / 2, {
        align: 'center',
      });
    }

    xPos += photoWidth + spacing;
    photoCount++;
  }

  if (photos.length > maxPhotos) {
    const remainingCount = photos.length - maxPhotos;
    yPos += photoHeight + spacing + 15;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'italic');
    pdf.text(
      `... dan ${remainingCount} foto lainnya`,
      marginLeft,
      yPos
    );
  }
}

/**
 * Page 4: Cleaner Statistics (Rekap Cleaner)
 */
async function addCleanerStatsPage(
  pdf: jsPDF,
  data: PDFReportData,
  config: PDFConfig
): Promise<void> {
  const { marginLeft, marginTop } = config;

  // Page Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('REKAP AKTIVITAS PETUGAS KEBERSIHAN', marginLeft, marginTop);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(
    `Periode: ${data.monthName} ${data.year}`,
    marginLeft,
    marginTop + 7
  );

  // Calculate cleaner stats
  const cleanerStats = calculateCleanerStats(data);

  if (cleanerStats.length === 0) {
    pdf.text('Tidak ada data petugas untuk bulan ini.', marginLeft, marginTop + 20);
    return;
  }

  // Create table
  const headers = ['No', 'Nama Petugas', 'Email', 'Jumlah Inspeksi'];
  const tableBody = cleanerStats.map((stat, index) => [
    (index + 1).toString(),
    stat.fullName || '-',
    stat.email,
    stat.inspectionCount.toString(),
  ]);

  autoTable(pdf, {
    head: [headers],
    body: tableBody,
    startY: marginTop + 12,
    theme: 'striped',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 15 },
      1: { halign: 'left', cellWidth: 60 },
      2: { halign: 'left', cellWidth: 70 },
      3: { halign: 'center', cellWidth: 35 },
    },
    margin: { left: marginLeft, right: config.marginRight },
  });

  // Add summary
  const totalInspections = cleanerStats.reduce(
    (sum, stat) => sum + stat.inspectionCount,
    0
  );
  const summaryY = (pdf as any).lastAutoTable.finalY + 8;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`Total Inspeksi: ${totalInspections}`, marginLeft, summaryY);
  pdf.text(
    `Total Petugas: ${cleanerStats.length}`,
    marginLeft,
    summaryY + 6
  );
}

/**
 * Page 5: Signature Section
 */
function addSignaturePage(
  pdf: jsPDF,
  data: PDFReportData,
  config: PDFConfig
): void {
  const { marginLeft, marginTop, contentWidth } = config;

  // Page Title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PENGESAHAN LAPORAN', marginLeft, marginTop);

  let yPos = marginTop + 20;

  // Signature boxes
  const boxWidth = contentWidth / 2 - 10;
  const boxHeight = 60;

  // Left box: "Disusun oleh"
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Disusun oleh:', marginLeft, yPos);

  yPos += 5;
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(marginLeft, yPos, boxWidth, boxHeight);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Tanda Tangan:', marginLeft + 5, yPos + 5);

  // Placeholder for signature
  pdf.setDrawColor(150, 150, 150);
  pdf.line(marginLeft + 5, yPos + 40, marginLeft + boxWidth - 5, yPos + 40);

  pdf.text('Nama:', marginLeft + 5, yPos + 45);
  pdf.text('Tanggal:', marginLeft + 5, yPos + 52);

  // Right box: "Disetujui oleh"
  const rightX = marginLeft + boxWidth + 20;
  yPos = marginTop + 20;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Disetujui oleh:', rightX, yPos);

  yPos += 5;
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(rightX, yPos, boxWidth, boxHeight);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Tanda Tangan:', rightX + 5, yPos + 5);

  // Placeholder for signature
  pdf.setDrawColor(150, 150, 150);
  pdf.line(rightX + 5, yPos + 40, rightX + boxWidth - 5, yPos + 40);

  pdf.text('Nama:', rightX + 5, yPos + 45);
  pdf.text('Tanggal:', rightX + 5, yPos + 52);

  // Footer
  yPos = config.pageHeight - config.marginBottom - 10;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.text(
    `Dokumen ini digenerate otomatis oleh WC Check System pada ${format(
      new Date(),
      'dd MMMM yyyy HH:mm',
      { locale: idLocale }
    )}`,
    config.pageWidth / 2,
    yPos,
    { align: 'center' }
  );
}

/**
 * Helper: Prepare score table data
 */
function prepareScoreTable(data: PDFReportData): PDFScoreTableRow[] {
  const locationMap = new Map<string, PDFScoreTableRow>();

  data.dateInspections.forEach((dateInsp) => {
    const day = parseInt(dateInsp.date.split('-')[2], 10);

    dateInsp.inspections.forEach((inspection) => {
      const locationKey = `${inspection.location.name}|${inspection.location.building}`;

      if (!locationMap.has(locationKey)) {
        locationMap.set(locationKey, {
          location: inspection.location.name,
          building: inspection.location.building || '-',
          scores: {},
        });
      }

      const row = locationMap.get(locationKey)!;

      // Calculate score from responses
      const score = calculateInspectionScore(inspection);

      // Average if multiple inspections for same location on same day
      if (row.scores[day]) {
        row.scores[day] = Math.round((row.scores[day]! + score) / 2);
      } else {
        row.scores[day] = score;
      }
    });
  });

  return Array.from(locationMap.values()).sort((a, b) =>
    a.location.localeCompare(b.location)
  );
}

/**
 * Helper: Calculate inspection score from responses
 */
function calculateInspectionScore(inspection: InspectionReport): number {
  // If overall_status exists and contains a score, try to extract it
  // Otherwise, calculate from responses
  const responses = inspection.responses || {};

  // Simple scoring: count good/normal/bad responses
  const scoreMap: { [key: string]: number } = {
    good: 100,
    normal: 60,
    bad: 20,
    other: 40,
  };

  const values = Object.values(responses);
  if (values.length === 0) return 0;

  const totalScore = values.reduce((sum, value: any) => {
    // Check for null and valid choice property
    if (value?.choice && scoreMap[value.choice] !== undefined) {
      return sum + scoreMap[value.choice];
    }
    return sum;
  }, 0);

  // Count only valid responses for average
  const validResponses = values.filter((v: any) => v?.choice && scoreMap[v.choice] !== undefined);
  if (validResponses.length === 0) return 0;

  return Math.round(totalScore / validResponses.length);
}

/**
 * Helper: Collect photos from inspections
 */
function collectPhotos(data: PDFReportData): PDFPhotoItem[] {
  const photos: PDFPhotoItem[] = [];

  data.dateInspections.forEach((dateInsp) => {
    dateInsp.inspections.forEach((inspection) => {
      if (inspection.photo_urls && inspection.photo_urls.length > 0) {
        inspection.photo_urls.forEach((url) => {
          photos.push({
            url,
            location: inspection.location.name,
            date: format(new Date(inspection.inspection_date), 'dd MMM yyyy', {
              locale: idLocale,
            }),
            time: inspection.inspection_time || '',
          });
        });
      }
    });
  });

  return photos;
}

/**
 * Helper: Calculate cleaner statistics
 */
function calculateCleanerStats(data: PDFReportData): PDFCleanerStats[] {
  const cleanerMap = new Map<string, PDFCleanerStats>();

  data.dateInspections.forEach((dateInsp) => {
    dateInsp.inspections.forEach((inspection) => {
      const email = inspection.user.email;

      if (!cleanerMap.has(email)) {
        cleanerMap.set(email, {
          email,
          fullName: inspection.user.full_name || '',
          inspectionCount: 0,
        });
      }

      const cleaner = cleanerMap.get(email)!;
      cleaner.inspectionCount++;
    });
  });

  // Sort by inspection count (descending)
  return Array.from(cleanerMap.values()).sort(
    (a, b) => b.inspectionCount - a.inspectionCount
  );
}

/**
 * Helper: Add score legend
 */
function addScoreLegend(pdf: jsPDF, x: number, y: number): void {
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Keterangan:', x, y);

  const legendItems = [
    { label: 'Hijau (95-100): Sangat Baik', color: '#22C55E' },
    { label: 'Kuning (90-94): Baik', color: '#FACC15' },
    { label: 'Merah (<90): Perlu Perbaikan', color: '#EF4444' },
  ];

  let yPos = y + 5;
  legendItems.forEach((item) => {
    const rgb = hexToRgb(item.color);
    pdf.setFillColor(rgb[0], rgb[1], rgb[2]);
    pdf.rect(x, yPos - 2, 4, 4, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.text(item.label, x + 6, yPos + 1);
    yPos += 5;
  });
}

/**
 * Helper: Convert hex color to RGB array
 */
function hexToRgb(hex: string): number[] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [0, 0, 0];
}

/**
 * Helper: Load image as base64
 */
async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    // If it's a relative path, make it absolute
    const imageUrl = url.startsWith('http') ? url : url;

    const response = await fetch(imageUrl);
    const blob = await response.blob();

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to load image:', error);
    return null;
  }
}
