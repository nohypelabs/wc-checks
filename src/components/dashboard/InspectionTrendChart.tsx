// src/components/dashboard/InspectionTrendChart.tsx — Crypto portfolio-style area chart
import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface DailyTrend {
  date: string;
  count: number;
}

interface InspectionTrendChartProps {
  data: DailyTrend[];
  totalInspections?: number;
  inspectionGrowth: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const count = payload[0].value;
  const dateStr = (() => {
    try {
      return format(parseISO(label), 'EEEE, d MMM yyyy', { locale: idLocale });
    } catch {
      return label;
    }
  })();

  return (
    <div className="bg-slate-800/95 backdrop-blur-xl px-3 py-2 rounded-lg border border-white/15 shadow-xl">
      <p className="text-white text-sm font-bold">{count} inspeksi</p>
      <p className="text-white/60 text-xs">{dateStr}</p>
    </div>
  );
};

export const InspectionTrendChart = ({
  data,
  inspectionGrowth,
}: InspectionTrendChartProps) => {
  const isPositive = inspectionGrowth >= 0;
  const isNeutral = inspectionGrowth === 0;

  // Determine color scheme based on trend
  const colors = useMemo(() => {
    if (isNeutral) return {
      stroke: '#60a5fa',
      fill: '#3b82f6',
      gradientFrom: 'rgba(59, 130, 246, 0.3)',
      gradientTo: 'rgba(59, 130, 246, 0.0)',
    };
    if (isPositive) return {
      stroke: '#34d399',
      fill: '#10b981',
      gradientFrom: 'rgba(16, 185, 129, 0.3)',
      gradientTo: 'rgba(16, 185, 129, 0.0)',
    };
    return {
      stroke: '#f87171',
      fill: '#ef4444',
      gradientFrom: 'rgba(239, 68, 68, 0.3)',
      gradientTo: 'rgba(239, 68, 68, 0.0)',
    };
  }, [isPositive, isNeutral]);

  // Format x-axis ticks (show only a few dates)
  const formatXAxis = (date: string) => {
    try {
      return format(parseISO(date), 'd/M');
    } catch {
      return '';
    }
  };

  // Calculate total inspections in the 30-day window
  const trendTotal = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

  return (
    <div className="bg-white/8 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg shadow-blue-500/5 ring-1 ring-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50 font-medium">30 Hari Terakhir</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-white">{trendTotal}</span>
            <span className="text-xs text-white/40">inspeksi</span>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
          isNeutral
            ? 'bg-blue-500/15 text-blue-300 border border-blue-400/20'
            : isPositive
              ? 'bg-green-500/15 text-green-300 border border-green-400/20'
              : 'bg-red-500/15 text-red-300 border border-red-400/20'
        }`}>
          {isNeutral ? (
            <Minus className="w-3.5 h-3.5" />
          ) : isPositive ? (
            <TrendingUp className="w-3.5 h-3.5" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5" />
          )}
          <span>{Math.abs(inspectionGrowth)}%</span>
        </div>
      </div>

      {/* Chart */}
      <div className="px-1 pb-1 -mt-1">
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.gradientFrom} />
                <stop offset="100%" stopColor={colors.gradientTo} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)' }}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis hide domain={[0, 'auto']} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)' }} />
            <Area
              type="monotone"
              dataKey="count"
              stroke={colors.stroke}
              strokeWidth={2}
              fill="url(#trendGradient)"
              dot={false}
              activeDot={{
                r: 4,
                fill: colors.fill,
                stroke: colors.stroke,
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
