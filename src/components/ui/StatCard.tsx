// src/components/ui/StatCard.tsx
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
 icon: LucideIcon;
 label: string;
 value: string | number;
 trend?: {
 value: number;
 isPositive: boolean;
 };
 variant?: 'default' | 'success' | 'warning' | 'danger';
 className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
 icon: Icon,
 label,
 value,
 trend,
 variant = 'default',
 className = '',
}) => {
 const variantClasses = {
 default: 'bg-white/8 border-white/10 backdrop-blur-sm',
 success: 'bg-green-500/10 border-green-500/20 backdrop-blur-sm',
 warning: 'bg-yellow-500/10 border-yellow-500/20 backdrop-blur-sm',
 danger: 'bg-red-500/10 border-red-500/20 backdrop-blur-sm',
 };

 const iconColors = {
 default: 'text-blue-500',
 success: 'text-green-500',
 warning: 'text-yellow-500',
 danger: 'text-red-500',
 };

 return (
 <div
 className={`
 border rounded-xl p-6 shadow-sm
 ${variantClasses[variant]}
 ${className}
 `}
 >
 <div className="flex items-start justify-between">
 <div className="flex-1">
 <p className="text-sm text-white/60 mb-1">{label}</p>
 <p className="text-3xl font-bold text-white">{value}</p>
 
 {trend && (
 <div className={`flex items-center gap-1 mt-2 text-sm ${
 trend.isPositive ? 'text-green-400' : 'text-red-400'
 }`}>
 <span>{trend.isPositive ? '↑' : '↓'}</span>
 <span>{Math.abs(trend.value)}%</span>
 </div>
 )}
 </div>
 
 <div className={`p-3 rounded-lg bg-opacity-10 ${iconColors[variant]}`}>
 <Icon className="w-8 h-8" />
 </div>
 </div>
 </div>
 );
};

// MiniStatCard variant
interface MiniStatCardProps {
 icon: LucideIcon;
 label: string;
 value: string | number;
 onClick?: () => void;
}

export const MiniStatCard: React.FC<MiniStatCardProps> = ({
 icon: Icon,
 label,
 value,
 onClick,
}) => {
 const baseClasses = 'bg-white/8 border border-white/10 rounded-lg p-4 transition-all duration-200 backdrop-blur-sm';
 const interactiveClasses = onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 active:scale-98' : '';

 return (
 <div
 onClick={onClick}
 className={`${baseClasses} ${interactiveClasses}`}
 >
 <div className="flex items-center gap-3">
 <div className="p-2 bg-blue-500/20 rounded-lg">
 <Icon className="w-5 h-5 text-blue-400" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-xs text-white/60 truncate">{label}</p>
 <p className="text-xl font-bold text-white">{value}</p>
 </div>
 </div>
 </div>
 );
};