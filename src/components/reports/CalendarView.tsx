// src/components/reports/CalendarView.tsx - FIXED: Remove unused imports
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

interface CalendarViewProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  dateInspections: DateInspections[];
  onDateClick: (date: string) => void;
}

const getScoreColor = (score: number) => {
  if (score >= 85) return 'bg-green-500';
  if (score >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};

const getScoreStyle = (score: number) => {
  if (score >= 85) {
    return {
      bg: 'bg-gradient-to-br from-green-100 to-emerald-100',
      text: 'text-green-700',
      border: 'border-green-400',
      ring: 'ring-green-200'
    };
  }
  if (score >= 70) {
    return {
      bg: 'bg-gradient-to-br from-yellow-100 to-amber-100',
      text: 'text-yellow-700',
      border: 'border-yellow-400',
      ring: 'ring-yellow-200'
    };
  }
  return {
    bg: 'bg-gradient-to-br from-red-100 to-rose-100',
    text: 'text-red-700',
    border: 'border-red-400',
    ring: 'ring-red-200'
  };
};

export const CalendarView = ({
  currentDate,
  onDateChange,
  dateInspections,
  onDateClick,
}: CalendarViewProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week (0 = Sunday, 1 = Monday, etc)
  const firstDayOfMonth = monthStart.getDay();

  // Fill empty cells at the start
  const emptyDays = Array(firstDayOfMonth).fill(null);

  const handlePrevMonth = () => {
    onDateChange(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    onDateChange(addMonths(currentDate, 1));
  };

  const getDateData = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return dateInspections.find(d => d.date === dateStr);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>

          <h2 className="text-lg font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 mt-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2">
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for days before month starts */}
          {emptyDays.map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Actual days */}
          {daysInMonth.map((day) => {
            const dateData = getDateData(day);
            const hasInspections = dateData && dateData.count > 0;
            const dayIsToday = isToday(day);
            const dateStr = format(day, 'yyyy-MM-dd');
            const scoreStyle = hasInspections ? getScoreStyle(dateData.averageScore) : null;

            return (
              <button
                key={day.toISOString()}
                onClick={() => hasInspections && onDateClick(dateStr)}
                disabled={!hasInspections}
                className={`
                  aspect-square p-1 rounded-xl transition-all relative flex items-center justify-center
                  ${dayIsToday && hasInspections ? `ring-2 ${scoreStyle?.ring}` : ''}
                  ${dayIsToday && !hasInspections ? 'ring-2 ring-blue-500' : ''}
                  ${hasInspections
                    ? `${scoreStyle?.bg} border-2 ${scoreStyle?.border} hover:shadow-lg cursor-pointer active:scale-95 transform`
                    : 'cursor-default opacity-40'
                  }
                `}
              >
                {/* Date number - BOLD & COLORED for inspections */}
                <div className="flex flex-col items-center justify-center h-full">
                  <div className={`
                    ${hasInspections ? 'text-lg font-extrabold' : 'text-sm font-medium'}
                    ${hasInspections ? scoreStyle?.text : dayIsToday ? 'text-blue-600 font-bold' : 'text-gray-700'}
                  `}>
                    {format(day, 'd')}
                  </div>

                  {/* Count badge for multiple inspections */}
                  {hasInspections && dateData.count > 1 && (
                    <div className={`
                      text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-0.5
                      ${scoreStyle?.text} ${scoreStyle?.bg}
                      border ${scoreStyle?.border}
                    `}>
                      {dateData.count}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-center space-x-4 text-xs text-gray-600">
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span>Good (85+)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span>Fair (70-84)</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <span>Poor (&lt;70)</span>
        </div>
      </div>
    </div>
  );
};