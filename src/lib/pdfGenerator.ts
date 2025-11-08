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

  // Page 2: Score Table (LANDSCAPE for better fit)
  pdf.addPage('a4', 'landscape');
  const landscapeConfig: PDFConfig = {
    pageWidth: 297, // A4 landscape width
    pageHeight: 210, // A4 landscape height
    marginTop: 15,
    marginRight: 15,
    marginBottom: 15,
    marginLeft: 15,
    contentWidth: 267, // 297 - 30
  };
  await addScoreTablePage(pdf, reportData, landscapeConfig);

  // Page 3: Photo Documentation
  pdf.addPage('a4', 'portrait');
  await addPhotoDocumentationPage(pdf, reportData, config);

  // Page 4: Cleaner Stats
  pdf.addPage('a4', 'portrait');
  await addCleanerStatsPage(pdf, reportData, config);

  // Page 5: Signature Section
  pdf.addPage('a4', 'portrait');
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

  // Split into two tables: 1-15 and 16-end
  let startY = marginTop + 12;

  // TABLE 1: Days 1-15
  const headers1 = ['Lokasi', 'Gedung', 'Lantai'];
  for (let day = 1; day <= Math.min(15, daysInMonth); day++) {
    headers1.push(day.toString());
  }

  const tableBody1 = scoreTable.map((row) => {
    const rowData = [row.location, row.building, row.floor];
    for (let day = 1; day <= Math.min(15, daysInMonth); day++) {
      const score = row.scores[day];
      rowData.push(score !== null && score !== undefined ? score.toString() : '-');
    }
    return rowData;
  });

  // Render first table
  autoTable(pdf, {
    head: [headers1],
    body: tableBody1,
    startY: startY,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      halign: 'center',
      valign: 'middle',
      minCellWidth: 9, // Wider for 3-digit scores
    },
    headStyles: {
      fillColor: [59, 130, 246], // Blue
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    columnStyles: {
      0: { halign: 'left', cellWidth: 45 }, // Location
      1: { halign: 'left', cellWidth: 35 }, // Building
      2: { halign: 'center', cellWidth: 20 }, // Floor
    },
    didParseCell: function (data) {
      // Color code score cells (starting from column 3 = index 3)
      if (data.section === 'body' && data.column.index >= 3) {
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

  // If more than 15 days, create second table
  if (daysInMonth > 15) {
    const finalY1 = (pdf as any).lastAutoTable.finalY;

    // TABLE 2: Days 16-31
    const headers2 = ['Lokasi', 'Gedung', 'Lantai'];
    for (let day = 16; day <= daysInMonth; day++) {
      headers2.push(day.toString());
    }

    const tableBody2 = scoreTable.map((row) => {
      const rowData = [row.location, row.building, row.floor];
      for (let day = 16; day <= daysInMonth; day++) {
        const score = row.scores[day];
        rowData.push(score !== null && score !== undefined ? score.toString() : '-');
      }
      return rowData;
    });

    // Render second table
    autoTable(pdf, {
      head: [headers2],
      body: tableBody2,
      startY: finalY1 + 8, // 8mm gap between tables
      theme: 'grid',
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
        halign: 'center',
        valign: 'middle',
        minCellWidth: 9,
      },
      headStyles: {
        fillColor: [59, 130, 246], // Blue
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 45 }, // Location
        1: { halign: 'left', cellWidth: 35 }, // Building
        2: { halign: 'center', cellWidth: 20 }, // Floor
      },
      didParseCell: function (data) {
        // Color code score cells
        if (data.section === 'body' && data.column.index >= 3) {
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
  }

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
  const boxHeight = 70; // Increased height for 4 lines

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
  pdf.line(marginLeft + 5, yPos + 30, marginLeft + boxWidth - 5, yPos + 30);

  pdf.text('Nama: _______________', marginLeft + 5, yPos + 38);
  pdf.text('Jabatan: Office Operation', marginLeft + 5, yPos + 48);
  pdf.text('Tanggal: _______________', marginLeft + 5, yPos + 58);

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
  pdf.line(rightX + 5, yPos + 30, rightX + boxWidth - 5, yPos + 30);

  pdf.text('Nama: _______________', rightX + 5, yPos + 38);
  pdf.text('Jabatan: Direktur', rightX + 5, yPos + 48);
  pdf.text('Tanggal: _______________', rightX + 5, yPos + 58);

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
  // Temporary structure to collect all scores per location per day
  const locationScores = new Map<string, {
    location: string;
    building: string;
    floor: string;
    dailyScores: Map<number, number[]>; // day => array of scores
  }>();

  // Collect all scores
  data.dateInspections.forEach((dateInsp) => {
    dateInsp.inspections.forEach((inspection) => {
      const day = parseInt(dateInsp.date.split('-')[2], 10);
      const locationKey = `${inspection.location.name}|${inspection.location.building}|${inspection.location.floor}`;

      if (!locationScores.has(locationKey)) {
        locationScores.set(locationKey, {
          location: inspection.location.name,
          building: inspection.location.building?.trim() || '-',
          floor: inspection.location.floor?.trim() || '-',
          dailyScores: new Map<number, number[]>(),
        });
      }

      const locData = locationScores.get(locationKey)!;

      // Calculate score from responses
      const score = calculateInspectionScore(inspection);

      // Collect score for this day
      if (!locData.dailyScores.has(day)) {
        locData.dailyScores.set(day, []);
      }
      locData.dailyScores.get(day)!.push(score);
    });
  });

  // Calculate averages and create final table structure
  const scoreTable: PDFScoreTableRow[] = [];

  locationScores.forEach((locData) => {
    const scores: { [date: string]: number | null | undefined } = {};

    // Calculate average for each day
    locData.dailyScores.forEach((scoresArray, day) => {
      const totalScore = scoresArray.reduce((sum, s) => sum + s, 0);
      scores[day] = Math.round(totalScore / scoresArray.length);
    });

    scoreTable.push({
      location: locData.location,
      building: locData.building,
      floor: locData.floor,
      scores,
    });
  });

  return scoreTable.sort((a, b) => a.location.localeCompare(b.location));
}

/**
 * Helper: Calculate inspection score from responses
 * (Uses same logic as API to ensure consistency)
 */
function calculateInspectionScore(inspection: InspectionReport): number {
  try {
    const responses = inspection.responses;

    if (!responses || typeof responses !== 'object') return 0;

    // Check for direct score field first (new format)
    if (typeof responses.score === 'number') {
      return responses.score;
    }

    // Calculate from ratings array (new format with weights)
    if (Array.isArray(responses.ratings) && responses.ratings.length > 0) {
      const totalWeight = responses.ratings.reduce((sum: number, r: any) => sum + (r.weight || 1), 0);
      const weightedSum = responses.ratings.reduce((sum: number, r: any) => {
        const score = r.score || 0;
        const weight = r.weight || 1;
        return sum + (score * weight);
      }, 0);
      return Math.round(weightedSum / totalWeight);
    }

    // Fallback: Old format - count good responses
    const values = Object.values(responses).filter(v =>
      typeof v === 'string' || typeof v === 'boolean'
    );

    if (values.length === 0) return 0;

    const goodCount = values.filter(v =>
      v === true ||
      v === 'good' ||
      v === 'excellent' ||
      v === 'baik' ||
      v === 'bersih'
    ).length;

    return Math.round((goodCount / values.length) * 100);
  } catch (error) {
    console.warn('[PDF] Error calculating score:', error);
    return 0;
  }
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
