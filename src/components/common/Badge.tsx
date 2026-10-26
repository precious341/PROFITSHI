import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'warning' | 'info' | 'success' | 'default' | 'neutral';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  let colorClasses = 'bg-slate-800 text-slate-300 border-slate-700';

  if (variant === 'critical') {
    colorClasses = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  } else if (variant === 'warning') {
    colorClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  } else if (variant === 'success') {
    colorClasses = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  } else if (variant === 'info') {
    colorClasses = 'bg-sky-500/15 text-sky-300 border-sky-500/30';
  }

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${sizeClasses} ${colorClasses}`}>
      {children}
    </span>
  );
};
