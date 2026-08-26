import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface StudentEmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  badge?: string;
}

export const StudentEmptyState: React.FC<StudentEmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  badge,
}) => {
  return (
    <div className="p-8 sm:p-12 text-center rounded-3xl bg-white/80 border border-emerald-100 shadow-xs max-w-lg mx-auto my-6 backdrop-blur-sm">
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center shadow-xs">
        <Icon className="w-7 h-7" />
      </div>
      {badge && (
        <span className="inline-block px-2.5 py-0.5 mb-2 text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full">
          {badge}
        </span>
      )}
      <h3 className="text-lg font-black text-emerald-950 tracking-tight">{title}</h3>
      <p className="text-xs text-emerald-800/80 font-medium mt-1.5 leading-relaxed max-w-md mx-auto">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
