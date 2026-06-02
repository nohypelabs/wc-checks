// src/components/admin/AdminCard.tsx - Navigation Card for Admin Dashboard
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LucideIcon } from 'lucide-react';

interface AdminCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  path: string;
  color?: string;
  count?: number;
  badge?: string;
}

export const AdminCard = ({ 
  icon: Icon, 
  title, 
  description, 
  path, 
  color = 'blue',
  count,
  badge
}: AdminCardProps) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    purple: 'bg-purple-100 text-purple-600',
    green: 'bg-green-100 text-green-600',
    orange: 'bg-orange-100 text-orange-600',
    red: 'bg-red-100 text-red-600',
    cyan: 'bg-cyan-100 text-cyan-600',
  };

  return (
    <button
      onClick={() => navigate(path)}
      className="
        relative w-full p-3.5 lg:p-3 bg-white rounded-2xl lg:rounded-xl shadow-sm border border-gray-100
        hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
        transition-all duration-200
        text-left group
      "
    >
      {/* Badge */}
      {badge && (
        <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
          {badge}
        </div>
      )}

      {/* Icon */}
      <div className={`
        w-10 h-10 lg:w-8 lg:h-8 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}
        rounded-xl lg:rounded-lg flex items-center justify-center mb-2 lg:mb-1.5
        group-hover:scale-110 transition-transform
      `}>
        <Icon className="w-5 h-5 lg:w-4 lg:h-4" />
      </div>

      {/* Content */}
      <div className="mb-1.5 lg:mb-1">
        <h3 className="text-sm lg:text-xs font-bold text-gray-900 leading-tight">{title}</h3>
        <p className="text-[11px] lg:text-[10px] text-gray-500 mt-0.5 hidden lg:block">{description}</p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        {count !== undefined && (
          <div className="text-lg lg:text-base font-bold text-gray-900">{count}</div>
        )}
        <div className={`
          ml-auto flex items-center gap-0.5 text-[11px] font-medium
          ${colorClasses[color as keyof typeof colorClasses]?.split(' ')[1] || 'text-blue-600'}
          group-hover:gap-1.5 transition-all
        `}>
          <span className="hidden lg:inline">Manage</span>
          <span className="lg:hidden text-xs">Manage</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </button>
  );
};

// Compact version for grid layouts
export const AdminCardCompact = ({ 
  icon: Icon, 
  title, 
  path, 
  color = 'blue' 
}: Pick<AdminCardProps, 'icon' | 'title' | 'path' | 'color'>) => {
  const navigate = useNavigate();

  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500',
    cyan: 'bg-cyan-500',
  };

  return (
    <button
      onClick={() => navigate(path)}
      className="
        w-full p-4 bg-white rounded-xl shadow-sm border border-gray-100
        hover:shadow-md hover:scale-105 active:scale-95
        transition-all duration-200
        flex items-center gap-3
      "
    >
      <div className={`
        w-12 h-12 ${colorClasses[color as keyof typeof colorClasses] || colorClasses.blue}
        rounded-xl flex items-center justify-center text-white flex-shrink-0
      `}>
        <Icon className="w-6 h-6" />
      </div>
      <span className="font-medium text-gray-900 text-left">{title}</span>
      <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
    </button>
  );
};