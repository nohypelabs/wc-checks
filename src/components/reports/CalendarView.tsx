// src/components/reports/CalendarView.tsx - Polished UI
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
 format,
 startOfMonth,
 endOfMonth,
 eachDayOfInterval,
 isToday,
 addMonths,
 subMonths
} from 'date-fns';
import { DateInspections } from '../../hooks/useReports';
import { TAP_TRANSITION } from '../../lib/animations';
import { useHaptic } from '../../hooks/useHaptic';

interface CalendarViewProps {
 currentDate: Date;
 onDateChange: (date: Date) => void;
 dateInspections: DateInspections[];
 onDateClick: (date: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getScoreColor = (score: number) => {
 if (score >= 85) return 'bg-green-500';
 if (score >= 70) return 'bg-yellow-500';
 return 'bg-red-500';
};

const getScoreStyle = (score: number) => {
 if (score >= 85) {
 return {
 bg: 'bg-gradient-to-br from-green-400/20 to-emerald-400/20 lg:from-green-100 lg:to-emerald-100',
 text: 'text-green-100 lg:text-green-300',
 border: 'border-green-400/40 lg:border-green-300',
 ring: 'ring-green-400/30 lg:ring-green-200',
 glow: 'shadow-green-500/20 lg:shadow-green-200/50',
 };
 }
 if (score >= 70) {
 return {
 bg: 'bg-gradient-to-br from-yellow-400/20 to-amber-400/20 lg:from-yellow-100 lg:to-amber-100',
 text: 'text-yellow-100 lg:text-yellow-700',
 border: 'border-yellow-400/40 lg:border-yellow-300',
 ring: 'ring-yellow-400/30 lg:ring-yellow-200',
 glow: 'shadow-yellow-500/20 lg:shadow-yellow-200/50',
 };
 }
 return {
 bg: 'bg-gradient-to-br from-red-400/20 to-rose-400/20 lg:from-red-100 lg:to-rose-100',
 text: 'text-red-100 lg:text-red-700',
 border: 'border-red-400/40 lg:border-red-300',
 ring: 'ring-red-400/30 lg:ring-red-200',
 glow: 'shadow-red-500/20 lg:shadow-red-200/50',
 };
};

export const CalendarView = ({
 currentDate,
 onDateChange,
 dateInspections,
 onDateClick,
}: CalendarViewProps) => {
 const haptic = useHaptic();
 const monthStart = startOfMonth(currentDate);
 const monthEnd = endOfMonth(currentDate);
 const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

 const firstDayOfMonth = monthStart.getDay();
 const emptyDays = Array(firstDayOfMonth).fill(null);

 const handlePrevMonth = () => {
 haptic.light();
 onDateChange(subMonths(currentDate, 1));
 };

 const handleNextMonth = () => {
 haptic.light();
 onDateChange(addMonths(currentDate, 1));
 };

 const getDateData = (date: Date) => {
 const dateStr = format(date, 'yyyy-MM-dd');
 return dateInspections.find(d => d.date === dateStr);
 };

 return (
 <div className="bg-white/8 backdrop-blur-sm rounded-2xl border border-white/15 overflow-hidden">
 {/* Header */}
 <div className="p-3 lg:p-4 border-b border-white/10">
 <div className="flex items-center justify-between">
 <motion.button
 onClick={handlePrevMonth}
 className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
 whileHover={{ scale: 1.05, x: -2 }}
 whileTap={{ scale: 0.95 }}
 transition={TAP_TRANSITION}
 >
 <ChevronLeft className="w-5 h-5 text-white/80" />
 </motion.button>

 <motion.h2
 key={format(currentDate, 'yyyy-MM')}
 initial={{ opacity: 0, y: -8 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
 className="text-base lg:text-lg font-bold text-white"
 >
 {format(currentDate, 'MMMM yyyy')}
 </motion.h2>

 <motion.button
 onClick={handleNextMonth}
 className="p-2 hover:bg-white/10 rounded-xl transition-colors duration-200"
 whileHover={{ scale: 1.05, x: 2 }}
 whileTap={{ scale: 0.95 }}
 transition={TAP_TRANSITION}
 >
 <ChevronRight className="w-5 h-5 text-white/80" />
 </motion.button>
 </div>

 {/* Weekday headers */}
 <div className="grid grid-cols-7 gap-1 mt-3">
 {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((day) => (
 <div key={day} className="text-center text-[10px] lg:text-xs font-semibold text-white/50 py-1">
 {day}
 </div>
 ))}
 </div>
 </div>

 {/* Calendar Grid */}
 <div className="p-2 lg:p-3">
 <div className="grid grid-cols-7 gap-1 lg:gap-1.5">
 {emptyDays.map((_, index) => (
 <div key={`empty-${index}`} className="aspect-square" />
 ))}

 {daysInMonth.map((day, _idx) => {
 const dateData = getDateData(day);
 const hasInspections = dateData && dateData.count > 0;
 const dayIsToday = isToday(day);
 const dateStr = format(day, 'yyyy-MM-dd');
 const scoreStyle = hasInspections ? getScoreStyle(dateData.averageScore) : null;

 return (
 <motion.button
 key={day.toISOString()}
 initial={{ opacity: 0, scale: 0.8 }}
 animate={{ opacity: 1, scale: 1 }}
 onClick={() => {
 if (hasInspections) {
 haptic.medium();
 onDateClick(dateStr);
 }
 }}
 disabled={!hasInspections}
 className={`
 aspect-square p-1 rounded-xl transition-all duration-200 relative flex items-center justify-center group
 ${dayIsToday && hasInspections ? `ring-2 ${scoreStyle?.ring}` : ''}
 ${dayIsToday && !hasInspections ? 'ring-2 ring-blue-400/50 lg:ring-blue-500' : ''}
 ${hasInspections
 ? `${scoreStyle?.bg} border ${scoreStyle?.border} hover:shadow-lg cursor-pointer shadow-md ${scoreStyle?.glow}`
 : 'cursor-default'
 }
 ${!hasInspections && !dayIsToday ? 'opacity-40' : ''}
 ${!hasInspections && dayIsToday ? 'opacity-80' : ''}
 `}
 whileHover={hasInspections ? { scale: 1.1 } : {}}
 whileTap={hasInspections ? { scale: 0.95 } : {}}
 transition={hasInspections ? TAP_TRANSITION : undefined}
 >
 <div className="flex flex-col items-center justify-center h-full">
 <div className={`
 ${hasInspections ? 'text-lg lg:text-base font-extrabold' : 'text-sm lg:text-xs font-medium'}
 ${hasInspections ? scoreStyle?.text : dayIsToday ? 'text-blue-300 font-bold' : 'text-white/80'}
 `}>
 {format(day, 'd')}
 </div>

 {hasInspections && dateData.count > 1 && (
 <div className={`
 text-[8px] lg:text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5
 ${scoreStyle?.text} ${scoreStyle?.bg}
 border ${scoreStyle?.border}
 `}>
 {dateData.count}
 </div>
 )}
 </div>

 {/* Today dot indicator */}
 {dayIsToday && !hasInspections && (
 <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-400 lg:bg-blue-500" />
 )}
 </motion.button>
 );
 })}
 </div>
 </div>

 {/* Legend */}
 <div className="p-2.5 lg:p-3 border-t border-white/10 flex items-center justify-center gap-4 text-[10px] lg:text-xs">
 <div className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full bg-green-400 lg:bg-green-500 shadow-sm shadow-green-500/30" />
 <span className="text-white/60 font-medium">Baik (85+)</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full bg-yellow-400 lg:bg-yellow-500 shadow-sm shadow-yellow-500/30" />
 <span className="text-white/60 font-medium">Cukup (70-84)</span>
 </div>
 <div className="flex items-center gap-1.5">
 <div className="w-2 h-2 rounded-full bg-red-400 lg:bg-red-500 shadow-sm shadow-red-500/30" />
 <span className="text-white/60 font-medium">Perbaikan (&lt;70)</span>
 </div>
 </div>
 </div>
 );
};
