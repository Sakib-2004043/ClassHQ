import React from 'react';
import { LucideIcon, Building2 } from 'lucide-react';

interface AdminEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  badge?: string;
}

export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
  icon: Icon = Building2,
  title,
  description,
  actionLabel,
  onAction,
  badge,
}) => {
  return (
    <div className="p-8 sm:p-12 text-center rounded-3xl bg-white border border-rose-200/80 shadow-sm max-w-lg mx-auto my-6">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
        <Icon className="w-7 h-7" />
      </div>
      {badge && (
        <span className="inline-block px-2.5 py-0.5 mb-2 text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-800 border border-rose-200 rounded-full">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-black text-slate-900 tracking-tight">{title}</h3>
      <p className="text-xs text-slate-500 font-medium mt-1.5 leading-relaxed max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-xs"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

