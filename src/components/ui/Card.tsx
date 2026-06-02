// src/components/ui/Card.tsx - FIXED EXPORTS
import { ReactNode, HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
 children: ReactNode;
 variant?: 'default' | 'flat' | 'bordered' | 'glass';
 hoverable?: boolean;
 padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = ({ 
 children, 
 variant = 'default',
 hoverable = true,
 padding = 'md',
 className,
 ...props 
}: CardProps) => {
 const baseStyles = 'rounded-2xl transition-all';
 
 const variants = {
 default: 'shadow-sm border border-white/10',
 flat: 'border border-white/15',
 bordered: 'border-2 border-white/20',
 glass: 'glass',
 };

 const paddings = {
 none: '',
 sm: 'p-3',
 md: 'p-4',
 lg: 'p-6',
 };

 const hoverStyles = hoverable ? 'hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99]' : '';

 return (
 <div
 className={clsx(
 baseStyles,
 variants[variant],
 paddings[padding],
 hoverStyles,
 className
 )}
 {...props}
 >
 {children}
 </div>
 );
};

// Card Header Component
interface CardHeaderProps {
 title: string;
 subtitle?: string;
 action?: ReactNode;
 icon?: ReactNode;
}

export const CardHeader = ({ title, subtitle, action, icon }: CardHeaderProps) => {
 return (
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-3">
 {icon && (
 <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-xl">
 {icon}
 </div>
 )}
 <div>
 <h3 className="font-semibold text-white">{title}</h3>
 {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
 </div>
 </div>
 {action && <div>{action}</div>}
 </div>
 );
};

// Card Content Component
export const CardContent = ({ children, className }: { children: ReactNode; className?: string }) => {
 return <div className={clsx('text-white/80', className)}>{children}</div>;
};

// Card Footer Component
export const CardFooter = ({ children, className }: { children: ReactNode; className?: string }) => {
 return (
 <div className={clsx('mt-4 pt-4 border-t border-white/10', className)}>
 {children}
 </div>
 );
};