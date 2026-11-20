import React from 'react';
import { ArrowUpRight, ArrowDownRight, AlertTriangle } from 'lucide-react';

export default function StatCard({
  label,
  value,
  change,
  period = 'vs previous period',
  icon: Icon,
  variant = 'blue', // 'blue' | 'emerald' | 'purple' | 'amber'
  isWarning = false
}) {
  const isPositive = typeof change === 'number' ? change >= 0 : true;

  const variantStyles = {
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };

  return (
    <div className="bg-white border-gray-200 rounded-xl p-5 cursor-pointer shadow-sm hover:scale-105 active:scale-100 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${variantStyles[variant] || variantStyles.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="text-2xl font-bold tracking-tight text-gray-500 mb-2 font-mono tabular-nums">
        {value}
      </div>

      <div className="flex items-center gap-2 text-xs">
        {isWarning ? (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            {change}
          </span>
        ) : typeof change === 'number' ? (
          <span className={`inline-flex items-center gap-0.5 font-semibold font-mono tabular-nums ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {isPositive ? `+${change}%` : `${change}%`}
          </span>
        ) : typeof change === 'string' ? (
          <span className="font-semibold text-red-300 font-mono">
            {change}
          </span>
        ) : null}
        <span className="text-slate-400">{period}</span>
      </div>
    </div>
  );
}
