// PDF Report Type Definitions
import { InspectionReport } from '../hooks/useReports';

export interface PDFReportData {
  month: string; // 'YYYY-MM' format
  year: string;
  monthName: string; // e.g., 'Oktober'
  organizationName: string;
  siteName: string;
  dateInspections: DateInspections[];
}

export interface DateInspections {
  date: string; // 'YYYY-MM-DD' format
  inspections: InspectionReport[];
  averageScore: number;
  count: number;
}

export interface PDFScoreTableRow {
  location: string;
  building: string;
  floor: string;
  scores: { [date: string]: number | null | undefined }; // date (1-31) => score
}

export interface PDFPhotoItem {
  url: string;
  location: string;
  date: string;
  time: string;
}

export interface PDFCleanerStats {
  email: string;
  fullName: string;
  inspectionCount: number;
}

export interface PDFConfig {
  pageWidth: number;
  pageHeight: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  contentWidth: number;
}

// Color coding for scores
export const SCORE_COLORS = {
  excellent: [34, 197, 94], // Green for 95-100
  good: [250, 204, 21], // Yellow for 90-94
  poor: [239, 68, 68], // Red for <90
  none: [229, 231, 235], // Gray for no data
} as const;

export function getScoreColor(score: number | null | undefined): number[] {
  if (score === null || score === undefined) return SCORE_COLORS.none as unknown as number[];
  if (score >= 95) return SCORE_COLORS.excellent as unknown as number[];
  if (score >= 90) return SCORE_COLORS.good as unknown as number[];
  return SCORE_COLORS.poor as unknown as number[];
}

export function getScoreColorString(score: number | null | undefined): string {
  if (score === null || score === undefined) return '#E5E7EB';
  if (score >= 95) return '#22C55E'; // Green
  if (score >= 90) return '#FACC15'; // Yellow
  return '#EF4444'; // Red
}
