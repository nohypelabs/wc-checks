// src/components/layout/PageLayout.tsx
import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface PageLayoutProps {
  title: string;
  subtitle?: string;
  headerRight?: ReactNode;
  maxWidth?: string;
  children: ReactNode;
  [key: string]: unknown;
}

export const PageLayout = ({
  title,
  subtitle,
  headerRight,
  maxWidth = 'max-w-5xl',
  children,
  ...rest
}: PageLayoutProps) => {
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Sidebar />

      <main className="flex-1 min-h-screen overflow-x-hidden">
        <div className={`${maxWidth} mx-auto px-4 py-6`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              {subtitle && (
                <p className="text-sm text-white/60 mt-0.5">{subtitle}</p>
              )}
            </div>
            {headerRight && <div>{headerRight}</div>}
          </div>

          {/* Content */}
          <div className="space-y-4" {...rest}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};
