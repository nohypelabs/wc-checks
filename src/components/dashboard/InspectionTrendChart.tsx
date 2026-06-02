// src/components/dashboard/InspectionTrendChart.tsx — Crypto portfolio-style area chart
import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { useInspectionTrend } from '../../hooks/useInspectionTrend';

interface InspectionTrendChartProps {
  inspectionGrowth: number;
}

type Period = 7 | 30 | 90;

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: '7D' },
  { value: 30, label: '30D' },
  { value: 90, label: '90D' },
];

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
  inspectionGrowth,
}: InspectionTrendChartProps) => {
  const [period, setPeriod] = useState<Period>(30);
  const { data: trendData = [], isLoading } = useInspectionTrend(period);

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

  const formatXAxis = (date: string) => {
    try {
      return format(parseISO(date), 'd/M');
    } catch {
      return '';
    }
  };

  const trendTotal = useMemo(() => trendData.reduce((sum, d) => sum + d.count, 0), [trendData]);

  // Dynamic chart height based on period
  const chartHeight = period === 7 ? 120 : period === 30 ? 140 : 160;

  return (
    <div className="bg-white/8 backdrop-blur-xl rounded-2xl border border-white/10 shadow-lg shadow-blue-500/5 ring-1 ring-white/5 overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-3 pb-1 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/50 font-medium">
            {period === 7 ? '7 Hari Terakhir' : period === 30 ? '30 Hari Terakhir' : '90 Hari Terakhir'}
          </p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-2xl font-bold text-white">{trendTotal}</span>
            <span className="text-xs text-white/40">inspeksi</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Trend badge */}
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

          {/* Period selector */}
          <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-2 py-1 text-[10px] font-semibold rounded-md transition-all duration-200 ${
                  period === p.value
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-1 pb-1 -mt-1">
        {isLoading ? (
          <div className="flex items-center justify-center" style={{ height: chartHeight }}>
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white/30" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={trendData} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
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
        )}
      </div>
    </div>
  );
};
