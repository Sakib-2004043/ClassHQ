import React, { useState, useEffect, useMemo } from 'react';
import { 
  Palmtree, 
  Calendar, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Search, 
  ShieldCheck, 
  Info,
  CalendarRange,
  Sparkles,
  CalendarDays,
  X,
  ChevronRight,
  Sun,
  History,
  Tag,
  FileText,
  Layers,
  Hourglass,
  Flame,
  Check
} from 'lucide-react';
import { Holiday, HSCBatch, Section } from '../../../types';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';

interface CaptainHolidaysViewProps {
  assignedBatch?: string;
  assignedSection?: string;
  onRefreshData?: () => void;
}

export const CaptainHolidaysView: React.FC<CaptainHolidaysViewProps> = ({
  assignedBatch,
  assignedSection,
  onRefreshData,
}) => {
  const { user } = useAuth();
  const currentBatch = assignedBatch || user?.assignedBatch || user?.batch || 'HSC 2026';
  const currentSection = assignedSection || user?.assignedSection || user?.section || 'A';

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [tabFilter, setTabFilter] = useState<'all' | 'active' | 'upcoming' | 'past'>('all');

  // Deletion confirm state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [holidayToDelete, setHolidayToDelete] = useState<Holiday | null>(null);

  const fetchHolidays = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCaptainHolidays(currentBatch, currentSection);
      if (res && Array.isArray(res.holidays)) {
        setHolidays(res.holidays);
      }
    } catch (err: any) {
      console.error('Error fetching section holidays:', err);
      setError(err?.message || 'Failed to load section holidays.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, [currentBatch, currentSection]);

  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getHolidayDaysCount = (start: string, end: string) => {
    try {
      const d1 = new Date(start + 'T00:00:00');
      const d2 = new Date(end + 'T00:00:00');
      const diffTime = d2.getTime() - d1.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  };

  const getHolidayStatus = (start: string, end: string) => {
    if (start <= todayStr && todayStr <= end) {
      return { 
        label: 'Active Today', 
        badgeBg: 'bg-emerald-500 text-white shadow-emerald-200 shadow-xs border-emerald-400',
        cardBg: 'bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white',
        borderBg: 'border-emerald-300 ring-2 ring-emerald-400/30',
        icon: Sun,
        iconBg: 'bg-emerald-500 text-white shadow-xs',
        dateBoxBg: 'bg-emerald-100/70 border-emerald-200/90 text-emerald-950',
        active: true 
      };
    }
    if (start > todayStr) {
      return { 
        label: 'Upcoming Break', 
        badgeBg: 'bg-indigo-600 text-white shadow-indigo-200 shadow-xs border-indigo-500',
        cardBg: 'bg-gradient-to-br from-sky-50/90 via-indigo-50/40 to-white',
        borderBg: 'border-indigo-200 hover:border-indigo-300',
        icon: Hourglass,
        iconBg: 'bg-indigo-600 text-white shadow-xs',
        dateBoxBg: 'bg-indigo-50/80 border-indigo-200 text-indigo-950',
        active: false 
      };
    }
    return { 
      label: 'Past Holiday', 
      badgeBg: 'bg-slate-600 text-white shadow-xs border-slate-500',
      cardBg: 'bg-gradient-to-br from-slate-50/90 via-stone-50/40 to-white',
      borderBg: 'border-slate-200 hover:border-slate-300',
      icon: History,
      iconBg: 'bg-slate-600 text-white shadow-xs',
      dateBoxBg: 'bg-slate-100/80 border-slate-200 text-slate-900',
      active: false 
    };
  };

  const handleOpenModal = () => {
    setFormError(null);
    setTitle('');
    setStartDate(todayStr);
    setEndDate(todayStr);
    setDescription('');
    setIsModalOpen(true);
  };

  const handleSetQuickDays = (days: number) => {
    const start = startDate ? new Date(startDate + 'T00:00:00') : new Date();
    const end = new Date(start);
    end.setDate(start.getDate() + (days - 1));
    const y = end.getFullYear();
    const m = String(end.getMonth() + 1).padStart(2, '0');
    const d = String(end.getDate()).padStart(2, '0');
    setEndDate(`${y}-${m}-${d}`);
  };

  const handleCreateHoliday = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Please provide a holiday name or occasion title.');
      return;
    }
    if (!startDate || !endDate) {
      setFormError('Please select both From date and To date.');
      return;
    }
    if (endDate < startDate) {
      setFormError('To Date cannot be before From Date.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.createCaptainHoliday({
        title: title.trim(),
        startDate,
        endDate,
        description: description.trim(),
        batch: currentBatch,
        section: currentSection,
      });

      if (res.success) {
        setSuccessMsg(res.message || 'Holiday scheduled successfully.');
        setIsModalOpen(false);
        fetchHolidays();
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (err: any) {
      setFormError(err?.message || 'Error creating holiday schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await api.deleteCaptainHoliday(id);
      if (res.success) {
        setSuccessMsg('Holiday schedule removed.');
        fetchHolidays();
        if (onRefreshData) onRefreshData();
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to remove holiday schedule.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = h.title.toLowerCase().includes(q);
        const matchesDesc = (h.description || '').toLowerCase().includes(q);
        const matchesDate = h.startDate.includes(q) || h.endDate.includes(q);
        if (!matchesTitle && !matchesDesc && !matchesDate) return false;
      }

      // Tab filter
      if (tabFilter === 'active') {
        return h.startDate <= todayStr && todayStr <= h.endDate;
      }
      if (tabFilter === 'upcoming') {
        return h.startDate > todayStr;
      }
      if (tabFilter === 'past') {
        return h.endDate < todayStr;
      }
      return true; // 'all'
    });
  }, [holidays, searchQuery, tabFilter, todayStr]);

  const activeHolidayCount = useMemo(() => {
    return holidays.filter((h) => h.startDate <= todayStr && todayStr <= h.endDate).length;
  }, [holidays, todayStr]);

  const upcomingCount = useMemo(() => {
    return holidays.filter((h) => h.startDate > todayStr).length;
  }, [holidays, todayStr]);

  const pastCount = useMemo(() => {
    return holidays.filter((h) => h.endDate < todayStr).length;
  }, [holidays, todayStr]);

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {/* Top Banner / Header with compact styling */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 text-white shadow-md border border-sky-600/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 bg-gradient-to-bl from-amber-400/15 via-sky-400/10 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 border border-amber-300 shadow-2xs flex items-center gap-1">
                <Palmtree className="w-3 h-3 text-amber-950 shrink-0" />
                Holiday Manager
              </span>
              <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-sky-800/80 text-sky-200 border border-sky-600/60 flex items-center gap-1">
                <Layers className="w-3 h-3 text-sky-400 shrink-0" />
                Sec {currentSection} ({currentBatch})
              </span>
              {activeHolidayCount > 0 && (
                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-gradient-to-r from-emerald-500 to-teal-500 text-white border border-emerald-300 shadow-xs flex items-center gap-1 animate-pulse">
                  <Sun className="w-3 h-3 text-amber-200 shrink-0 animate-spin" />
                  Active Today ({activeHolidayCount})
                </span>
              )}
            </div>

            <h1 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
              <span>Academic Holidays & Section Breaks</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 hidden sm:inline" />
            </h1>
            <p className="text-[10px] sm:text-[11px] text-sky-100/85 max-w-xl leading-tight">
              Mark breaks for <strong>Section {currentSection}</strong>. Self-reporting attendance is closed on holiday dates.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenModal}
            className="w-full sm:w-auto px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500 hover:from-amber-300 hover:to-orange-400 active:scale-95 text-amber-950 text-[11px] sm:text-xs font-black uppercase tracking-wider shadow-md shadow-amber-950/30 border border-amber-300 transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer min-h-[38px]"
          >
            <Plus className="w-4 h-4 text-amber-950 shrink-0 stroke-[3]" />
            <span>Mark Holiday</span>
          </button>
        </div>
      </div>

      {/* 4-Stat Metric Filter Cards (Compact Android-Optimized Grid) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2">
        {/* Card 1: Total Holidays (All) */}
        <button
          type="button"
          onClick={() => setTabFilter('all')}
          className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer border relative overflow-hidden active:scale-98 ${
            tabFilter === 'all'
              ? 'bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 text-white border-sky-400 ring-2 ring-sky-400/60 shadow-md'
              : 'bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-white border-sky-200/80 hover:border-sky-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-xs shrink-0 ${
              tabFilter === 'all'
                ? 'bg-white text-sky-700'
                : 'bg-gradient-to-br from-sky-500 to-blue-600 text-white'
            }`}>
              <Palmtree className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className={`text-[9px] font-black uppercase tracking-tight block truncate ${
                tabFilter === 'all' ? 'text-sky-100' : 'text-sky-800'
              }`}>
                Total
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-base sm:text-lg font-black leading-none ${
                  tabFilter === 'all' ? 'text-white' : 'text-sky-950'
                }`}>
                  {holidays.length}
                </span>
                <span className={`text-[9px] font-bold ${
                  tabFilter === 'all' ? 'text-sky-200' : 'text-sky-600'
                }`}>
                  all
                </span>
              </div>
            </div>
          </div>
          {tabFilter === 'all' && (
            <div className="mt-1 pt-1 border-t border-white/20 flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-sky-100">
              <span>Filter Active</span>
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </button>

        {/* Card 2: Active Today */}
        <button
          type="button"
          onClick={() => setTabFilter(tabFilter === 'active' ? 'all' : 'active')}
          className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer border relative overflow-hidden active:scale-98 ${
            tabFilter === 'active'
              ? 'bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 text-white border-emerald-400 ring-2 ring-emerald-400/60 shadow-md'
              : 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border-emerald-300/80 hover:border-emerald-400 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-xs shrink-0 ${
              tabFilter === 'active'
                ? 'bg-white text-emerald-700'
                : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
            }`}>
              <Sun className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeHolidayCount > 0 ? 'animate-spin' : ''}`} />
            </div>
            <div className="min-w-0">
              <span className={`text-[9px] font-black uppercase tracking-tight block truncate ${
                tabFilter === 'active' ? 'text-emerald-100' : 'text-emerald-800'
              }`}>
                Active Today
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-base sm:text-lg font-black leading-none ${
                  tabFilter === 'active' ? 'text-white' : 'text-emerald-950'
                }`}>
                  {activeHolidayCount}
                </span>
                <span className={`text-[9px] font-bold ${
                  tabFilter === 'active' ? 'text-emerald-200' : 'text-emerald-600'
                }`}>
                  today
                </span>
              </div>
            </div>
          </div>
          {tabFilter === 'active' && (
            <div className="mt-1 pt-1 border-t border-white/20 flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-emerald-100">
              <span>Filter Active</span>
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </button>

        {/* Card 3: Upcoming Breaks */}
        <button
          type="button"
          onClick={() => setTabFilter(tabFilter === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer border relative overflow-hidden active:scale-98 ${
            tabFilter === 'upcoming'
              ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 text-white border-indigo-400 ring-2 ring-indigo-400/60 shadow-md'
              : 'bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white border-indigo-200/80 hover:border-indigo-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-xs shrink-0 ${
              tabFilter === 'upcoming'
                ? 'bg-white text-indigo-700'
                : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            }`}>
              <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className={`text-[9px] font-black uppercase tracking-tight block truncate ${
                tabFilter === 'upcoming' ? 'text-indigo-100' : 'text-indigo-800'
              }`}>
                Upcoming
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-base sm:text-lg font-black leading-none ${
                  tabFilter === 'upcoming' ? 'text-white' : 'text-indigo-950'
                }`}>
                  {upcomingCount}
                </span>
                <span className={`text-[9px] font-bold ${
                  tabFilter === 'upcoming' ? 'text-indigo-200' : 'text-indigo-600'
                }`}>
                  breaks
                </span>
              </div>
            </div>
          </div>
          {tabFilter === 'upcoming' && (
            <div className="mt-1 pt-1 border-t border-white/20 flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-indigo-100">
              <span>Filter Active</span>
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </button>

        {/* Card 4: Past Breaks */}
        <button
          type="button"
          onClick={() => setTabFilter(tabFilter === 'past' ? 'all' : 'past')}
          className={`p-2 sm:p-2.5 rounded-xl text-left transition-all cursor-pointer border relative overflow-hidden active:scale-98 ${
            tabFilter === 'past'
              ? 'bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-white border-amber-400 ring-2 ring-amber-400/60 shadow-md'
              : 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white border-amber-200/80 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shadow-xs shrink-0 ${
              tabFilter === 'past'
                ? 'bg-white text-amber-700'
                : 'bg-gradient-to-br from-amber-500 to-orange-600 text-white'
            }`}>
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="min-w-0">
              <span className={`text-[9px] font-black uppercase tracking-tight block truncate ${
                tabFilter === 'past' ? 'text-amber-100' : 'text-amber-800'
              }`}>
                Past
              </span>
              <div className="flex items-baseline gap-1">
                <span className={`text-base sm:text-lg font-black leading-none ${
                  tabFilter === 'past' ? 'text-white' : 'text-amber-950'
                }`}>
                  {pastCount}
                </span>
                <span className={`text-[9px] font-bold ${
                  tabFilter === 'past' ? 'text-amber-200' : 'text-amber-600'
                }`}>
                  done
                </span>
              </div>
            </div>
          </div>
          {tabFilter === 'past' && (
            <div className="mt-1 pt-1 border-t border-white/20 flex items-center justify-between text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-amber-100">
              <span>Filter Active</span>
              <Check className="w-2.5 h-2.5 text-white" />
            </div>
          )}
        </button>
      </div>

      {/* Notifications / Alerts with compact badges */}
      {successMsg && (
        <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400 text-emerald-950 text-[11px] font-bold flex items-center gap-2 shadow-2xs animate-in fade-in">
          <div className="w-5 h-5 rounded-md bg-emerald-500 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <span className="leading-tight flex-1">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-2 sm:p-2.5 rounded-xl bg-rose-500/15 border border-rose-400 text-rose-950 text-[11px] font-bold flex items-center gap-2 shadow-2xs animate-in fade-in">
          <div className="w-5 h-5 rounded-md bg-rose-500 text-white flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <span className="leading-tight flex-1">{error}</span>
        </div>
      )}

      {/* Search Bar & Active Filter Ribbon */}
      <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-sky-50/70 via-indigo-50/40 to-white border border-sky-200/80 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-tight text-slate-700 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>Showing:</span>
          </span>
          <span className="px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold uppercase bg-white border border-sky-300 text-sky-950 shadow-2xs">
            {tabFilter === 'all' && `All (${holidays.length})`}
            {tabFilter === 'active' && `Active (${activeHolidayCount})`}
            {tabFilter === 'upcoming' && `Upcoming (${upcomingCount})`}
            {tabFilter === 'past' && `Past (${pastCount})`}
          </span>
          {tabFilter !== 'all' && (
            <button
              type="button"
              onClick={() => setTabFilter('all')}
              className="px-2 py-0.5 rounded-lg text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-slate-200/70 hover:bg-slate-200 cursor-pointer transition-all flex items-center gap-1"
            >
              <X className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Search input with compact height */}
        <div className="relative w-full sm:w-64">
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center pointer-events-none">
            <Search className="w-3 h-3" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search holiday..."
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-white border border-sky-200 text-[11px] sm:text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 min-h-[34px] shadow-2xs"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Holidays List Grid with Compact Spacing */}
      {loading ? (
        <div className="p-6 sm:p-8 text-center bg-gradient-to-br from-sky-50/50 via-white to-sky-50/30 rounded-2xl border border-sky-200">
          <div className="w-8 h-8 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mx-auto mb-2 shadow-2xs">
            <Clock className="w-4 h-4 animate-spin" />
          </div>
          <p className="text-xs font-extrabold text-sky-950">Loading holidays...</p>
        </div>
      ) : filteredHolidays.length === 0 ? (
        <div className="p-6 sm:p-8 text-center bg-gradient-to-br from-sky-50/60 via-white to-indigo-50/40 rounded-2xl border border-dashed border-sky-300 shadow-2xs space-y-2.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white border border-white flex items-center justify-center mx-auto shadow-md shadow-sky-500/20">
            <Palmtree className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm sm:text-base font-black text-slate-900">
              No Holidays Found
            </h3>
            <p className="text-[11px] text-slate-600 leading-tight">
              {searchQuery
                ? 'No holidays match your search query.'
                : `No academic holidays scheduled yet for Section ${currentSection} (${currentBatch}).`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 active:scale-95 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-sm cursor-pointer min-h-[36px]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Mark Holiday</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
          {filteredHolidays.map((holiday) => {
            const statusInfo = getHolidayStatus(holiday.startDate, holiday.endDate);
            const daysCount = getHolidayDaysCount(holiday.startDate, holiday.endDate);
            const isDeleting = deletingId === holiday.id;
            const StatusIcon = statusInfo.icon;

            return (
              <div
                key={holiday.id}
                className={`p-2.5 sm:p-3 rounded-2xl border transition-all shadow-2xs hover:shadow-sm space-y-2 relative overflow-hidden ${statusInfo.cardBg} ${statusInfo.borderBg}`}
              >
                {/* Visual accent badge in top right corner */}
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-current/10 to-transparent pointer-events-none rounded-bl-full" />

                {/* Header line with status badge, duration badge, section tag, and delete action */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* Status badge with icon */}
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider border flex items-center gap-1 ${statusInfo.badgeBg}`}>
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        <span>{statusInfo.label}</span>
                      </span>

                      {/* Duration chip */}
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-gradient-to-r from-sky-100 to-blue-100 text-sky-900 border border-sky-300 shadow-2xs flex items-center gap-1">
                        <CalendarDays className="w-2.5 h-2.5 text-sky-700 shrink-0" />
                        <span>{daysCount} {daysCount === 1 ? 'Day' : 'Days'}</span>
                      </span>

                      {/* Section tag */}
                      <span className="px-2 py-0.5 rounded-lg text-[9px] font-extrabold bg-gradient-to-r from-purple-100 to-indigo-100 text-indigo-950 border border-indigo-300 shadow-2xs flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5 text-indigo-700 shrink-0" />
                        <span>Sec {holiday.section}</span>
                      </span>
                    </div>

                    {/* Holiday Title with leading icon */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${statusInfo.iconBg}`}>
                        <Palmtree className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs sm:text-sm font-black text-slate-950 leading-snug break-words">
                        {holiday.title}
                      </h3>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setHolidayToDelete(holiday)}
                    className="p-1.5 rounded-xl text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 active:scale-95 transition-all cursor-pointer disabled:opacity-50 shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center shadow-2xs"
                    title="Remove Holiday"
                    aria-label="Remove Holiday"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Date range box with compact highlights */}
                <div className={`p-2 rounded-xl border flex items-start gap-2 text-[11px] ${statusInfo.dateBoxBg}`}>
                  <div className="w-6 h-6 rounded-lg bg-white/90 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                    <CalendarRange className="w-3.5 h-3.5 text-sky-700" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1 flex-wrap font-black text-[11px] sm:text-xs">
                      <span className="px-1.5 py-0.2 rounded-md bg-sky-200/80 text-sky-950 border border-sky-300/80 font-mono">
                        {holiday.startDate}
                      </span>
                      <span className="text-slate-500 font-bold text-[10px]">→</span>
                      <span className="px-1.5 py-0.2 rounded-md bg-indigo-200/80 text-indigo-950 border border-indigo-300/80 font-mono">
                        {holiday.endDate}
                      </span>
                    </div>
                    <div className="text-[10px] font-semibold text-slate-600 truncate">
                      {formatDateDisplay(holiday.startDate)} – {formatDateDisplay(holiday.endDate)}
                    </div>
                  </div>
                </div>

                {/* Description if present */}
                {holiday.description && (
                  <div className="p-2 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50/80 border border-amber-200/90 flex items-start gap-1.5 text-[10px] sm:text-[11px] text-amber-950 shadow-2xs">
                    <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <p className="italic leading-snug break-words font-medium">
                      "{holiday.description}"
                    </p>
                  </div>
                )}

                {/* Footer metadata chip */}
                <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-600">
                  <div className="flex items-center gap-1 min-w-0 truncate">
                    <span className="w-4 h-4 rounded-md bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-2.5 h-2.5" />
                    </span>
                    <span className="truncate font-semibold">
                      By: <strong className="text-slate-900">{holiday.createdBy?.name || 'Class Captain'}</strong>
                      {holiday.createdBy?.rollNumber && ` (Roll ${holiday.createdBy.rollNumber})`}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-800 font-mono text-[9px] font-bold shrink-0">
                    {holiday.batch}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Dialog to Create New Holiday - Android optimized compact */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-3 bg-slate-950/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-md my-auto bg-white rounded-2xl border border-sky-300 shadow-xl overflow-hidden flex flex-col max-h-[94vh]">
            {/* Modal Header */}
            <div className="p-3 sm:p-3.5 bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 border border-amber-300 flex items-center justify-center text-amber-950 shadow-xs shrink-0">
                  <Palmtree className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-black text-white truncate flex items-center gap-1">
                    <span>Mark Holiday</span>
                    <Sparkles className="w-3 h-3 text-amber-300" />
                  </h2>
                  <p className="text-[10px] text-sky-200 font-semibold truncate">
                    Sec {currentSection} • {currentBatch}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 -mr-1 rounded-lg text-sky-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateHoliday} className="p-3 sm:p-4 space-y-2.5 overflow-y-auto flex-1 overscroll-contain bg-slate-50/50">
              {formError && (
                <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-400 text-rose-950 text-[11px] font-bold flex items-start gap-2">
                  <div className="w-4 h-4 rounded-md bg-rose-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <AlertCircle className="w-3 h-3" />
                  </div>
                  <span className="leading-tight">{formError}</span>
                </div>
              )}

              {/* Holiday Title / Name */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-black text-slate-800 uppercase tracking-tight">
                  <Tag className="w-3 h-3 text-sky-600" />
                  <span>Holiday Name</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Eid Vacation, Puja Break, Sports Day"
                  className="w-full px-2.5 py-2 rounded-xl bg-white border border-sky-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 min-h-[38px] shadow-2xs"
                />
              </div>

              {/* Date Pickers: From Date & To Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-black text-slate-800 uppercase tracking-tight">
                    <Calendar className="w-3 h-3 text-sky-600" />
                    <span>From Date</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!endDate || endDate < e.target.value) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="w-full px-2 py-1.5 rounded-xl bg-white border border-sky-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 min-h-[38px] shadow-2xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-1 text-[10px] font-black text-slate-800 uppercase tracking-tight">
                    <CalendarRange className="w-3 h-3 text-indigo-600" />
                    <span>To Date</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    min={startDate}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-xl bg-white border border-indigo-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 min-h-[38px] shadow-2xs"
                  />
                </div>
              </div>

              {/* Quick Duration Buttons (Color-Coded Chips) */}
              <div className="p-2 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200/80 space-y-1.5">
                <div className="flex items-center gap-1 text-[9px] font-black text-sky-900 uppercase tracking-tight">
                  <Flame className="w-3 h-3 text-amber-500" />
                  <span>Quick Duration:</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { days: 1, color: 'bg-cyan-100 text-cyan-900 border-cyan-300 hover:bg-cyan-200' },
                    { days: 2, color: 'bg-sky-100 text-sky-900 border-sky-300 hover:bg-sky-200' },
                    { days: 3, color: 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200' },
                    { days: 5, color: 'bg-indigo-100 text-indigo-900 border-indigo-300 hover:bg-indigo-200' },
                    { days: 7, color: 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200' },
                    { days: 10, color: 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200' },
                    { days: 14, color: 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200' },
                  ].map(({ days, color }) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleSetQuickDays(days)}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-black transition-all cursor-pointer min-h-[28px] shadow-2xs active:scale-95 ${color}`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>

              {/* Optional Description / Reason */}
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-[10px] font-black text-slate-800 uppercase tracking-tight">
                  <FileText className="w-3 h-3 text-slate-600" />
                  <span>Notice Note</span>
                  <span className="text-slate-400 font-normal text-[9px]">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Official break description or note..."
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-[11px] font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-200 resize-none shadow-2xs"
                />
              </div>

              {/* Notice Box explaining automatic attendance disabling */}
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-100/80 to-amber-50 border border-amber-300 text-amber-950 text-[10px] space-y-0.5 shadow-2xs">
                <div className="flex items-center gap-1.5 font-black text-amber-950">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Notice for Students</span>
                </div>
                <p className="leading-tight text-amber-900 font-medium pl-5">
                  Present-giving is closed on these dates. Students will see: "<strong>{title.trim() || 'Holiday'}</strong> ({startDate || '...'} to {endDate || '...'})".
                </p>
              </div>

              {/* Modal Actions */}
              <div className="pt-1 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer text-center min-h-[38px] flex items-center justify-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 active:scale-[0.98] text-amber-950 text-xs font-black uppercase tracking-wider shadow-md shadow-amber-950/20 border border-amber-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[38px]"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="w-3.5 h-3.5 animate-spin text-amber-950" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-950 stroke-[3]" />
                      <span>Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove / Delete Holiday Confirmation Modal with Compact Android Layout */}
      {holidayToDelete && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-3 overflow-y-auto animate-in fade-in"
          onClick={() => {
            if (!deletingId) setHolidayToDelete(null);
          }}
        >
          <div
            className="bg-white rounded-2xl p-3.5 sm:p-4 max-w-sm w-full shadow-xl border border-rose-300 space-y-2.5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-black text-slate-950">Delete Holiday</h3>
                  <p className="text-[9px] font-black text-rose-600 uppercase tracking-tight">
                    Sec {holidayToDelete.section} • {holidayToDelete.batch}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setHolidayToDelete(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-50 via-rose-50/60 to-red-50/40 border border-rose-200/90 space-y-1 text-xs text-slate-800 shadow-2xs">
              <div className="font-black text-slate-950 text-xs flex items-center gap-1">
                <Palmtree className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>{holidayToDelete.title}</span>
              </div>
              <div className="flex items-center gap-1 text-rose-900 font-mono text-[10px] font-bold">
                <CalendarRange className="w-3 h-3 text-rose-600 shrink-0" />
                <span>{holidayToDelete.startDate} → {holidayToDelete.endDate}</span>
              </div>
              {holidayToDelete.description && (
                <p className="text-slate-700 italic text-[10px] bg-white/90 p-2 rounded-lg border border-rose-200 font-medium">
                  "{holidayToDelete.description}"
                </p>
              )}
            </div>

            <p className="text-[11px] text-slate-600 leading-snug font-medium">
              Remove this holiday? Attendance self-reporting will be immediately re-opened for Section {holidayToDelete.section}.
            </p>

            <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={() => setHolidayToDelete(null)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer text-center min-h-[36px] flex items-center justify-center"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={Boolean(deletingId)}
                onClick={async () => {
                  const id = holidayToDelete.id;
                  await handleDeleteHoliday(id);
                  setHolidayToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 active:scale-[0.98] text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 min-h-[36px]"
              >
                {deletingId ? (
                  <>
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

