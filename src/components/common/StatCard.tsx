import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'positive' | 'negative' | 'warning' | 'neutral';
  tooltip?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  trend,
  icon: Icon,
  tone = 'neutral',
  tooltip
}) => {
  let toneBorder = 'border-slate-800';
  let valueColor = 'text-white';

  if (tone === 'positive') {
    valueColor = 'text-emerald-400';
  } else if (tone === 'negative') {
    valueColor = 'text-rose-400';
  } else if (tone === 'warning') {
    valueColor = 'text-amber-400';
  }

  return (
    <div className={`p-4 rounded-xl bg-slate-900 border ${toneBorder} shadow-sm relative overflow-hidden`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400 tracking-wide uppercase" title={tooltip}>
          {label}
        </span>
        {Icon && (
          <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2 flex items-baseline space-x-2">
        <span className={`text-2xl font-bold tracking-tight ${valueColor}`}>
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-semibold ${
              trend.isNeutral
                ? 'text-slate-400'
                : trend.isPositive
                ? 'text-emerald-400'
                : 'text-rose-400'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-400 leading-relaxed">
          {subtext}
        </p>
      )}
    </div>
  );
};
