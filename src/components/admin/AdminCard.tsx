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

 // Desktop icon bg + text colors
 const desktopIcon: Record<string, string> = {
 blue: '',
 purple: '',
 green: '',
 orange: '',
 red: '',
 cyan: '',
 };

 const desktopIconText: Record<string, string> = {
 blue: '',
 purple: '',
 green: '',
 orange: '',
 red: '',
 cyan: '',
 };

 const desktopManage: Record<string, string> = {
 blue: '',
 purple: '',
 green: '',
 orange: '',
 red: '',
 cyan: '',
 };

 return (
 <button
 onClick={() => navigate(path)}
 className="
 relative w-full p-2.5 lg:p-4 bg-white/8 backdrop-blur-md border border-white/10 shadow-lg shadow-blue-500/5 ring-1 ring-white/5
 rounded-xl hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]
 transition-all duration-200
 text-left group
 "
 >
 {/* Badge */}
 {badge && (
 <div className="absolute top-1.5 right-1.5 px-1 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
 {badge}
 </div>
 )}

 {/* Icon — glass on mobile, colored on desktop */}
 <div className={`
 w-8 h-8 lg:w-10 lg:h-10 bg-white/10 rounded-lg flex items-center justify-center mb-1.5 lg:mb-2
 ${desktopIcon[color] || desktopIcon.blue}
 group-hover:scale-110 transition-transform
 `}>
 <Icon className={`w-4 h-4 lg:w-5 lg:h-5 text-white ${desktopIconText[color] || desktopIconText.blue}`} />
 </div>

 {/* Content */}
 <div className="mb-1 lg:mb-1.5">
 <h3 className="text-xs lg:text-sm font-bold text-white leading-tight">{title}</h3>
 <p className="text-[10px] lg:text-xs text-white/40 mt-0.5 hidden lg:block">{description}</p>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-between">
 {count !== undefined && (
 <div className="text-base lg:text-lg font-bold text-white">{count}</div>
 )}
 <div className={`
 ml-auto flex items-center gap-0.5 text-[10px] lg:text-xs font-medium
 text-white/60 ${desktopManage[color] || desktopManage.blue}
 group-hover:gap-1.5 transition-all
 `}>
 <span>Manage</span>
 <ChevronRight className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white/40" />
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
