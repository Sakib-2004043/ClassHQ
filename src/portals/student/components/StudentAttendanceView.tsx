import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download,
  Calendar,
  ShieldCheck,
  MessageSquare,
  Filter,
  Sparkles,
  Layers,
  TrendingUp,
  RotateCcw,
  FileText,
  ChevronDown,
  CalendarDays,
  Send,
  AlertCircle,
  Check,
  Info,
  Coffee,
  Stethoscope,
  AlertTriangle,
  Award,
  Users,
  HelpCircle,
  Edit3,
  Lock
} from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, LeaveRequest, LeaveType, SectionCaptainInfo } from '../../../types';
import { StudentEmptyState } from './StudentEmptyState';
import { useAuth } from '../../../context/AuthContext';
import { generateMonthlyAttendancePDF } from '../../../lib/pdfReport';
import { api } from '../../../lib/api';

interface StudentAttendanceViewProps {
  records: AttendanceRecord[];
  leaves?: LeaveRequest[];
  captains?: SectionCaptainInfo[];
  onSubmitLeave?: (data: { 
    leaveType: LeaveType; 
    date: string;
    startDate: string; 
    endDate: string; 
    reason: string; 
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  onUpdateLeave?: (id: string, data: {
    leaveType?: LeaveType;
    date?: string;
    startDate?: string;
    reason?: string;
  }) => Promise<{ success: boolean; message?: string; error?: string }>;
  onRefreshData?: () => void;
  loading: boolean;
}

const getCategoryStyle = (leaveType?: string) => {
  const cat = String(leaveType || '').toLowerCase().trim();
  if (cat.includes('med') || cat.includes('health') || cat.includes('sick')) return 'bg-rose-100 text-rose-800 border-rose-300';
  if (cat.includes('emerg') || cat.includes('urg')) return 'bg-amber-100 text-amber-800 border-amber-300';
  if (cat.includes('acad') || cat.includes('exam') || cat.includes('olymp')) return 'bg-sky-100 text-sky-800 border-sky-300';
  if (cat.includes('casu') || cat.includes('person') || cat.includes('travel')) return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  if (cat.includes('fam') || cat.includes('wed') || cat.includes('event')) return 'bg-indigo-100 text-indigo-800 border-indigo-300';
  return 'bg-violet-100 text-violet-800 border-violet-300';
};

const LEAVE_CATEGORIES: {
  type: LeaveType;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
}[] = [
  {
    type: 'Medical',
    label: 'Medical / Health',
    shortDesc: 'Illness or physician-prescribed rest',
    icon: Stethoscope,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    type: 'Emergency',
    label: 'Family Emergency',
    shortDesc: 'Unforeseen domestic emergency',
    icon: AlertTriangle,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    type: 'Academic',
    label: 'Academic Competition',
    shortDesc: 'Olympiad, math festival, or contest',
    icon: Award,
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
  },
  {
    type: 'Casual',
    label: 'Casual Absence',
    shortDesc: 'Personal errand or pre-planned travel',
    icon: Coffee,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  {
    type: 'Family',
    label: 'Family Function',
    shortDesc: 'Wedding or family event',
    icon: Users,
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  },
  {
    type: 'Others',
    label: 'Others',
    shortDesc: 'Other unlisted specific circumstance',
    icon: HelpCircle,
    badgeColor: 'bg-violet-50 text-violet-800 border-violet-200',
  },
];

export const StudentAttendanceView: React.FC<StudentAttendanceViewProps> = ({
  records = [],
  leaves = [],
  captains = [],
  onSubmitLeave,
  onUpdateLeave,
  onRefreshData,
  loading,
}) => {
  const { user } = useAuth();

  // Mandatory Month Selection PDF Modal States
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfMonth, setPdfMonth] = useState<string>('');
  const [pdfValidationError, setPdfValidationError] = useState<string | null>(null);

  // Filters for Attendance Ledger
  const [searchDate, setSearchDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | AttendanceStatus>('All');
  const [monthFilter, setMonthFilter] = useState<'All' | string>('All');

  // ----------------------------------------------------
  // Time & Date calculations for Next-Day Hub
  // ----------------------------------------------------
  const [now, setNow] = useState(new Date());
  const [settings, setSettings] = useState<{ startTime: string; endTime: string }>({ startTime: '3:00 PM', endTime: '12:00 AM' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.getSystemSettings();
        if (res && res.startTime && res.endTime) {
          setSettings({ startTime: res.startTime, endTime: res.endTime });
        }
      } catch (err) {
        console.error('Failed to load system settings', err);
      }
    };
    fetchSettings();

    const timer = setInterval(() => {
      setNow(new Date());
      fetchSettings();
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  function parseTime(timeStr: string): { hours: number; minutes: number } {
    if (!timeStr) return { hours: 15, minutes: 0 };
    const match = String(timeStr).trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return { hours: 15, minutes: 0 };
    let [_, h, m, p] = match;
    let hours = parseInt(h, 10);
    const minutes = parseInt(m, 10);
    if (p) {
      const period = p.toUpperCase();
      if (period === 'PM' && hours < 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
    }
    return { hours, minutes };
  }

  const isTimeWindowOpen = useMemo(() => {
    const start = parseTime(settings.startTime);
    const end = parseTime(settings.endTime);

    const nowMins = now.getHours() * 60 + now.getMinutes();
    const startMins = start.hours * 60 + start.minutes;
    const endMins = end.hours * 60 + end.minutes;

    if (startMins < endMins) {
      // Same day window (e.g. 9:00 AM to 11:59 PM)
      return nowMins >= startMins && nowMins <= endMins;
    } else {
      // Overnight window (e.g. 3:00 PM to 12:00 AM or 3:00 PM to 2:00 AM)
      return nowMins >= startMins || (endMins > 0 && nowMins < endMins);
    }
  }, [now, settings]);

  // Target date = Next Academic Working Day (excluding Friday & Saturday)
  // If current date is x, student gives present for x+1 dates excluding Friday & Saturday.
  const targetAcademicDay = useMemo(() => {
    const target = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    let daysAhead = 1;
    // Skip Friday (5) and Saturday (6)
    while (target.getDay() === 5 || target.getDay() === 6) {
      target.setDate(target.getDate() + 1);
      daysAhead++;
    }

    const y = target.getFullYear();
    const m = String(target.getMonth() + 1).padStart(2, '0');
    const d = String(target.getDate()).padStart(2, '0');
    const iso = `${y}-${m}-${d}`; // YYYY-MM-DD in local time
    const formatted = target.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const fullWeekday = target.toLocaleDateString('en-US', { weekday: 'long' });
    const dayLabel = daysAhead === 1 ? 'Tomorrow' : `Next Academic Day (${fullWeekday})`;

    return {
      targetDate: target,
      daysAhead,
      iso,
      formatted,
      fullWeekday,
      dayLabel,
    };
  }, [now]);

  const targetDayIso = targetAcademicDay.iso;
  const targetDayFormatted = targetAcademicDay.formatted;
  const targetDayLabel = targetAcademicDay.dayLabel;

  // Check if student already submitted for targetDayIso
  const existingAttendance = useMemo(() => {
    return records.find((r) => r.date === targetDayIso);
  }, [records, targetDayIso]);

  const existingLeave = useMemo(() => {
    return leaves.find(
      (l) => l.startDate === targetDayIso || (l as any).date === targetDayIso
    );
  }, [leaves, targetDayIso]);

  const isLeaveApprovedForDay = useMemo(() => {
    if (existingLeave && existingLeave.status === 'Approved') return true;
    if (existingAttendance && String(existingAttendance.status).toLowerCase() === 'leave') {
      if ((existingAttendance as any).leaveStatus === 'Approved' || existingAttendance.reviewedBy || existingAttendance.captainsNote) {
        return true;
      }
    }
    return false;
  }, [existingLeave, existingAttendance]);

  // Next Day Hub Submission State
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [actionChoice, setActionChoice] = useState<'present' | 'absent' | 'leave'>('present');
  const [leaveCategory, setLeaveCategory] = useState<LeaveType>('Medical');
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Direct 1-Click Status Switch (e.g. Present -> Absent or Absent -> Present)
  const handleDirectStatusSwitch = async (newStatus: 'present' | 'absent', optionalReason?: string) => {
    setActionFeedback(null);

    if (isLeaveApprovedForDay) {
      setActionFeedback({
        type: 'error',
        message: `Attendance for ${targetDayIso} is locked because your leave application has been officially approved by section captain.`,
      });
      return;
    }

    if (!isTimeWindowOpen) {
      setActionFeedback({
        type: 'error',
        message: `Attendance marking for ${targetDayLabel.toLowerCase()} is closed. Window is strictly active between ${settings.startTime} and ${settings.endTime}.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitStudentSelfAttendance({
        status: newStatus,
        remarks: optionalReason || '',
        date: targetDayIso,
      });
      if (res.success) {
        setActionFeedback({
          type: 'success',
          message: res.message || `Your status for ${targetDayIso} has been updated to ${newStatus.toUpperCase()}.`,
        });
        setActionReason('');
        setIsEditingMode(false);
        if (onRefreshData) onRefreshData();
      } else {
        setActionFeedback({ type: 'error', message: 'Failed to update attendance status.' });
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'An unexpected error occurred while updating status.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextDaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionFeedback(null);

    if (isLeaveApprovedForDay) {
      setActionFeedback({
        type: 'error',
        message: `Attendance for ${targetDayIso} is locked because your leave application has been officially approved by section captain.`,
      });
      return;
    }

    if (!isTimeWindowOpen) {
      setActionFeedback({
        type: 'error',
        message: `Attendance & Leave marking for ${targetDayLabel.toLowerCase()} opens strictly at ${settings.startTime} (Active: ${settings.startTime} – ${settings.endTime}).`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (actionChoice === 'present' || actionChoice === 'absent') {
        const res = await api.submitStudentSelfAttendance({
          status: actionChoice,
          remarks: actionReason,
          date: targetDayIso,
        });
        if (res.success) {
          setActionFeedback({ type: 'success', message: res.message });
          setActionReason('');
          setIsEditingMode(false);
          if (onRefreshData) onRefreshData();
        } else {
          setActionFeedback({ type: 'error', message: 'Failed to record attendance status.' });
        }
      } else if (actionChoice === 'leave') {
        if (!actionReason || actionReason.trim().length < 5) {
          setActionFeedback({
            type: 'error',
            message: 'Please provide a detailed reason for absence (minimum 5 characters).',
          });
          setIsSubmitting(false);
          return;
        }

        if (onSubmitLeave) {
          const res = await onSubmitLeave({
            leaveType: leaveCategory,
            date: targetDayIso,
            startDate: targetDayIso,
            endDate: targetDayIso,
            reason: actionReason,
          });
          if (res.success) {
            setActionFeedback({
              type: 'success',
              message: res.message || `Leave request for ${targetDayIso} submitted successfully!`,
            });
            setActionReason('');
            setIsEditingMode(false);
            if (onRefreshData) onRefreshData();
          } else {
            setActionFeedback({
              type: 'error',
              message: res.error || 'Failed to submit leave request.',
            });
          }
        }
      }
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        message: err.message || 'An unexpected error occurred during submission.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ----------------------------------------------------
  // Ledger Filters and Calculations
  // ----------------------------------------------------
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    (records || []).forEach((r) => {
      if (r.date && r.date.length >= 7) {
        months.add(r.date.substring(0, 7)); // e.g. "2026-08"
      }
    });

    const currNow = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(currNow.getFullYear(), currNow.getMonth() - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months.add(mStr);
    }

    return Array.from(months).sort().reverse();
  }, [records]);

  const formatMonthTitle = (monthStr: string) => {
    if (!monthStr || monthStr === 'All') return 'Full History (All Months)';
    try {
      const [year, month] = monthStr.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } catch {
      return monthStr;
    }
  };

  const filteredRecords = useMemo(() => {
    return (records || []).filter((rec) => {
      const matchSearch = searchDate ? rec.date.includes(searchDate) : true;
      const st = String(rec.status || '').toLowerCase();
      let matchStatus = true;
      if (statusFilter !== 'All') {
        const filterTarget = String(statusFilter).toLowerCase();
        if (filterTarget === 'leave') {
          matchStatus = ['leave', 'excused', 'late'].includes(st);
        } else {
          matchStatus = st === filterTarget;
        }
      }
      const matchMonth = monthFilter === 'All' ? true : rec.date.startsWith(monthFilter);
      return matchSearch && matchStatus && matchMonth;
    });
  }, [records, searchDate, statusFilter, monthFilter]);

  const stats = useMemo(() => {
    const list = records || [];
    const total = list.length;
    const present = list.filter((r) => String(r.status).toLowerCase() === 'present').length;
    const absent = list.filter((r) => String(r.status).toLowerCase() === 'absent').length;
    const leave = list.filter((r) => ['leave', 'excused', 'late'].includes(String(r.status).toLowerCase())).length;
    const fraud = list.filter((r) => String(r.status).toLowerCase() === 'fraud').length;
    const rate = total > 0 ? Math.round(((present + leave) / total) * 100) : 0;
    return { total, present, absent, leave, fraud, rate };
  }, [records]);

  const handleDownloadPDF = () => {
    // Default to current monthFilter if it's a specific month, else first available month
    const initialMonth = monthFilter !== 'All' ? monthFilter : (availableMonths[0] || '');
    setPdfMonth(initialMonth);
    setPdfValidationError(null);
    setIsPdfModalOpen(true);
  };

  const handleExecutePdfDownload = () => {
    if (!pdfMonth || pdfMonth.trim() === '' || pdfMonth === 'All') {
      setPdfValidationError('Month selection is mandatory to generate your PDF report.');
      return;
    }

    try {
      generateMonthlyAttendancePDF({
        user,
        selectedMonth: pdfMonth,
        records: records || [],
        leaves: leaves || [],
      });
      setIsPdfModalOpen(false);
      setPdfValidationError(null);
    } catch (err: any) {
      setPdfValidationError(err.message || 'Failed to generate PDF report.');
    }
  };

  const formatDateDetails = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { day: dateStr, month: '', weekday: '', formatted: dateStr };
      return {
        day: d.getDate(),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        fullWeekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
        year: d.getFullYear(),
        formatted: d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      };
    } catch {
      return { day: dateStr, month: '', weekday: '', formatted: dateStr };
    }
  };

  const getBlockCardStyle = (statusStr: string) => {
    const s = String(statusStr || '').toLowerCase();
    if (s === 'present') {
      return {
        card: 'p-2.5 sm:p-3 rounded-xl bg-emerald-50/80 backdrop-blur-md border border-emerald-200/90 shadow-2xs space-y-2',
        topBorder: 'border-b border-emerald-200/80',
        certifiedBg: 'bg-emerald-100/60 border border-emerald-200/80 text-emerald-950',
        dateBoxBg: 'bg-emerald-100/90 border border-emerald-300/80',
      };
    }
    if (s === 'absent') {
      return {
        card: 'p-2.5 sm:p-3 rounded-xl bg-rose-50/80 backdrop-blur-md border border-rose-200/90 shadow-2xs space-y-2',
        topBorder: 'border-b border-rose-200/80',
        certifiedBg: 'bg-rose-100/60 border border-rose-200/80 text-rose-950',
        dateBoxBg: 'bg-rose-100/90 border border-rose-300/80',
      };
    }
    if (['leave granted', 'approved', 'excused'].includes(s)) {
      return {
        card: 'p-2.5 sm:p-3 rounded-xl bg-cyan-50/80 backdrop-blur-md border border-cyan-200/90 shadow-2xs space-y-2',
        topBorder: 'border-b border-cyan-200/80',
        certifiedBg: 'bg-cyan-100/60 border border-cyan-200/80 text-cyan-950',
        dateBoxBg: 'bg-cyan-100/90 border border-cyan-300/80',
      };
    }
    if (['leave', 'leave pending', 'pending', 'late'].includes(s)) {
      return {
        card: 'p-2.5 sm:p-3 rounded-xl bg-amber-50/80 backdrop-blur-md border border-amber-200/90 shadow-2xs space-y-2',
        topBorder: 'border-b border-amber-200/80',
        certifiedBg: 'bg-amber-100/60 border border-amber-200/80 text-amber-950',
        dateBoxBg: 'bg-amber-100/90 border border-amber-300/80',
      };
    }
    if (s === 'fraud') {
      return {
        card: 'p-2.5 sm:p-3 rounded-xl bg-purple-50/90 backdrop-blur-md border border-purple-300/90 shadow-2xs space-y-2',
        topBorder: 'border-b border-purple-200',
        certifiedBg: 'bg-purple-100/60 border border-purple-200 text-purple-950',
        dateBoxBg: 'bg-purple-100/90 border border-purple-300/80',
      };
    }
    return {
      card: 'p-2.5 sm:p-3 rounded-xl bg-indigo-50/80 backdrop-blur-md border border-indigo-200/90 shadow-2xs space-y-2',
      topBorder: 'border-b border-indigo-200/80',
      certifiedBg: 'bg-indigo-100/60 border border-indigo-200/80 text-indigo-950',
      dateBoxBg: 'bg-indigo-100/90 border border-indigo-300/80',
    };
  };

  const getTableRowStyle = (statusStr: string) => {
    const s = String(statusStr || '').toLowerCase();
    if (s === 'present') return 'bg-emerald-50/30 hover:bg-emerald-50/70 border-l-4 border-l-emerald-500 transition-colors';
    if (s === 'absent') return 'bg-rose-50/30 hover:bg-rose-50/70 border-l-4 border-l-rose-500 transition-colors';
    if (['leave granted', 'approved', 'excused'].includes(s)) return 'bg-cyan-50/30 hover:bg-cyan-50/70 border-l-4 border-l-cyan-500 transition-colors';
    if (['leave', 'leave pending', 'pending', 'late'].includes(s)) return 'bg-amber-50/30 hover:bg-amber-50/70 border-l-4 border-l-amber-500 transition-colors';
    if (s === 'fraud') return 'bg-purple-50/40 hover:bg-purple-50/80 border-l-4 border-l-purple-600 transition-colors';
    return 'hover:bg-indigo-50/30 transition-colors';
  };

  const getStatusBadge = (status: string) => {
    const s = String(status || '').toLowerCase();
    if (s === 'present') {
      return (
        <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          Present
        </span>
      );
    }
    if (s === 'absent') {
      return (
        <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-xl bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1.5 shadow-2xs">
          <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          Absent
        </span>
      );
    }
    if (s === 'leave granted' || s === 'approved' || s === 'granted') {
      return (
        <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-xl bg-cyan-100 text-cyan-900 border border-cyan-300 inline-flex items-center gap-1.5 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
          Leave Granted
        </span>
      );
    }
    if (s === 'leave pending' || s === 'leave' || s === 'excused' || s === 'late') {
      return (
        <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-xl bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          Leave Pending
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-xl bg-indigo-100 text-indigo-900 border border-indigo-300 inline-flex items-center gap-1.5 shadow-2xs">
          <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
          Pending
        </span>
      );
    }
    if (s === 'fraud') {
      return (
        <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-xl bg-purple-100 text-purple-900 border border-purple-300 inline-flex items-center gap-1.5 shadow-2xs">
          <AlertTriangle className="w-3.5 h-3.5 text-purple-600 shrink-0" />
          Fraud
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-black uppercase tracking-wider rounded-xl bg-indigo-50 text-indigo-800 border border-indigo-200 inline-flex items-center gap-1.5 shadow-2xs">
        <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ---------------------------------------------------- */}
      {/* 1. UNIFIED NEXT-DAY ATTENDANCE & LEAVE ACTION HUB */}
      {/* ---------------------------------------------------- */}
      <div className="p-3.5 sm:p-5 rounded-2xl bg-slate-900 text-white shadow-md border border-slate-800 relative overflow-hidden">
        {/* Glow ambient accent */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pb-3 border-b border-slate-800/80">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <CalendarCheck className="w-3 h-3 text-emerald-400" />
                  Attendance Portal
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-semibold">
                  Window: {settings.startTime} – {settings.endTime}
                </span>
              </div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-1.5 flex-wrap">
                <span>{targetDayLabel}'s Status:</span> <span className="text-emerald-400 font-mono">{targetDayFormatted}</span>
              </h2>
              <p className="text-[11px] text-slate-300/90 font-normal leading-tight">
                Submit attendance choice [Present/Absent] or leave request for roll call.
              </p>
              <div className="pt-0.5 flex items-center gap-1.5 text-[10px] font-medium text-amber-300/90 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 max-w-fit leading-tight">
                <AlertCircle className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Mark Present or Leave before {settings.endTime}, or status defaults to <strong>ABSENT</strong> for {targetDayIso}.</span>
              </div>
            </div>

            {/* Window Status Badge */}
            <div className="shrink-0 flex items-center gap-2 self-start md:self-center">
              {isTimeWindowOpen ? (
                <div className="px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 shadow-xs animate-pulse">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Window Active ({settings.startTime} – {settings.endTime})</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-[11px] font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Opens Today at {settings.startTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Feedback message banner if any */}
          {actionFeedback && (
            <div
              className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              }`}
            >
              {actionFeedback.type === 'success' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>{actionFeedback.message}</span>
            </div>
          )}

          {/* Action Submission Form or Confirmed Status Summary Card */}
          {!isTimeWindowOpen ? (
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 text-[11px] font-medium space-y-1.5 leading-snug">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Window Opens Daily at {settings.startTime}</span>
              </div>
              <p>
                Submit choices between <strong>{settings.startTime} and {settings.endTime}</strong> for upcoming session ({targetDayFormatted}). Check back after {settings.startTime}.
              </p>
              {!existingAttendance && !existingLeave && (
                <p className="text-[10px] text-rose-300 font-semibold pt-0.5">
                  Note: Defaults to <strong>ABSENT</strong> if no choice recorded before cutoff.
                </p>
              )}
            </div>
          ) : (existingAttendance || existingLeave) && !isEditingMode ? (
            /* Confirmed Status View with Smart Edit Option */
            <div className="space-y-2.5">
              {existingLeave ? (
                /* Leave Application Summary Card - Distinct colors for Approved vs Pending */
                <div className={`p-3.5 rounded-2xl border-2 text-white space-y-2.5 shadow-md ${
                  existingLeave.status === 'Approved'
                    ? 'bg-cyan-950/80 border-cyan-400/80 shadow-cyan-950/40'
                    : 'bg-amber-950/80 border-amber-500/80 shadow-amber-950/40'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold shadow-xs ${
                        existingLeave.status === 'Approved'
                          ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50'
                          : 'bg-amber-500/25 text-amber-300 border border-amber-400/50'
                      }`}>
                        {existingLeave.status === 'Approved' ? (
                          <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-300" />
                        )}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] font-black uppercase tracking-wider ${
                            existingLeave.status === 'Approved' ? 'text-cyan-300' : 'text-amber-300'
                          }`}>
                            {existingLeave.status === 'Approved' ? 'Leave Granted' : 'Leave Pending'}
                          </span>
                          <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                            existingLeave.status === 'Approved'
                              ? 'bg-cyan-500/30 text-cyan-100 border-cyan-300/60'
                              : 'bg-amber-500/30 text-amber-100 border-amber-300/60'
                          }`}>
                            {existingLeave.leaveType} • {existingLeave.status === 'Approved' ? 'GRANTED' : 'PENDING APPROVAL'}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          Leave for {targetDayLabel} ({targetDayIso})
                        </h3>
                        <p className="text-[11px] text-slate-200 italic leading-snug">
                          "{existingLeave.reason}"
                        </p>

                        {/* Captain's Review & Note Section */}
                        {(existingLeave.reviewedBy || existingLeave.captainsNote || existingLeave.reviewNote || (existingLeave as any).reviewerNote || existingLeave.status === 'Approved') && (
                          <div className={`mt-1.5 p-2 rounded-xl border text-[11px] space-y-0.5 ${
                            existingLeave.status === 'Approved'
                              ? 'bg-cyan-900/50 border-cyan-400/40 text-cyan-100'
                              : 'bg-amber-900/50 border-amber-500/40 text-amber-100'
                          }`}>
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className={`font-bold flex items-center gap-1 text-[11px] ${
                                existingLeave.status === 'Approved' ? 'text-cyan-200' : 'text-amber-200'
                              }`}>
                                <ShieldCheck className={`w-3.5 h-3.5 ${existingLeave.status === 'Approved' ? 'text-cyan-300' : 'text-amber-300'}`} />
                                Certified by {
                                  typeof existingLeave.reviewedBy === 'object' && existingLeave.reviewedBy?.name
                                    ? `${existingLeave.reviewedBy.name} (${existingLeave.reviewedBy.role || 'captain'})`
                                    : typeof existingLeave.reviewedBy === 'string'
                                    ? existingLeave.reviewedBy
                                    : 'Section Captain'
                                }
                              </span>
                              {existingLeave.reviewedAt && (
                                <span className={`text-[9px] font-mono font-bold ${
                                  existingLeave.status === 'Approved' ? 'text-cyan-300/80' : 'text-amber-300/80'
                                }`}>
                                  {new Date(existingLeave.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            <p className="text-white font-medium break-words leading-tight">
                              <strong className={existingLeave.status === 'Approved' ? 'text-cyan-200' : 'text-amber-200'}>Captain's Note:</strong>{' '}
                              "{existingLeave.captainsNote || existingLeave.reviewNote || (existingLeave as any).reviewerNote || 'Approved and certified for official attendance excuse.'}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {existingLeave.status === 'Approved' ? (
                      <div className="px-3 py-1.5 rounded-xl bg-cyan-900/80 border border-cyan-400/60 text-cyan-200 text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs shrink-0 self-start sm:self-center">
                        <Lock className="w-3.5 h-3.5 text-cyan-300" />
                        <span>Locked (Approved Leave)</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setActionChoice('present');
                          setIsEditingMode(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 border border-amber-300 text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0 self-start sm:self-center cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-950" />
                        <span>Edit Choice</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : existingAttendance?.status.toLowerCase() === 'fraud' ? (
                /* Fraud Flagged Summary Card */
                <div className="p-3.5 rounded-2xl bg-purple-950/80 border-2 border-purple-500/80 text-white space-y-2.5 shadow-md shadow-purple-950/40">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-500/25 text-purple-300 border border-purple-400/50 flex items-center justify-center shrink-0 font-bold shadow-xs">
                        <AlertTriangle className="w-4 h-4 text-purple-300" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                            Disciplinary Flag
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-100 border border-purple-300/60">
                            FRAUD FLAGGED
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          Record Flagged for {targetDayLabel} ({targetDayFormatted})
                        </h3>
                        {existingAttendance.captainsNote && (
                          <div className="p-2 rounded-xl bg-purple-900/50 border border-purple-500/40 text-[11px] text-purple-100">
                            <strong className="text-purple-300 font-bold">Captain's Note:</strong> "{existingAttendance.captainsNote}"
                          </div>
                        )}
                        {existingAttendance.studentsNote && (
                          <p className="text-[11px] text-slate-300 italic">
                            <strong className="text-slate-200 not-italic">Your Note:</strong> "{existingAttendance.studentsNote}"
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setActionChoice('present');
                        setIsEditingMode(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-white border border-purple-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shrink-0 self-start sm:self-center cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-white" />
                      <span>Re-submit</span>
                    </button>
                  </div>
                </div>
              ) : existingAttendance?.status.toLowerCase() === 'present' ? (
                /* Present Confirmed Summary Card */
                <div className="p-3.5 rounded-2xl bg-emerald-950/80 border-2 border-emerald-500/80 text-white space-y-2.5 shadow-md shadow-emerald-950/40">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 flex items-center justify-center shrink-0 font-bold shadow-xs">
                        <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                            Confirmed Status
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-100 border border-emerald-300/60">
                            PRESENT
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          Marked PRESENT for {targetDayLabel} ({targetDayFormatted})
                        </h3>
                        {existingAttendance.studentsNote && (
                          <p className="text-[11px] text-emerald-200 italic">
                            <strong className="text-emerald-300 font-semibold not-italic">Note:</strong> "{existingAttendance.studentsNote}"
                          </p>
                        )}
                        <p className="text-[11px] text-teal-200">
                          <strong className="text-teal-300 font-semibold">Captain's Note:</strong>{' '}
                          {existingAttendance.captainsNote ? (
                            `"${existingAttendance.captainsNote}"`
                          ) : (
                            <span className="text-slate-400 italic">Pending Captain Certification...</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons allowing student to update to Confirm Absent or Apply for Leave */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center pt-1 lg:pt-0">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDirectStatusSwitch('absent')}
                        className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white border border-rose-400/60 text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs shrink-0 disabled:opacity-50 cursor-pointer"
                        title="Update to Confirm Absent"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-100" />
                        <span>Confirm Absent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActionChoice('absent');
                          setIsEditingMode(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Edit / Leave</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Absent Summary Card */
                <div className="p-3.5 rounded-2xl bg-rose-950/80 border-2 border-rose-500/80 text-white space-y-2.5 shadow-md shadow-rose-950/40">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-rose-500/25 text-rose-300 border border-rose-400/50 flex items-center justify-center shrink-0 font-bold shadow-xs">
                        <XCircle className="w-4 h-4 text-rose-300" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black uppercase tracking-wider text-rose-300">
                            Reported Status
                          </span>
                          <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-rose-500/30 text-rose-100 border border-rose-300/60">
                            ABSENT
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-white leading-tight">
                          Marked ABSENT for {targetDayLabel} ({targetDayFormatted})
                        </h3>
                        {existingAttendance.studentsNote && (
                          <p className="text-[11px] text-rose-200 italic">
                            <strong className="text-rose-300 font-semibold not-italic">Note:</strong> "{existingAttendance.studentsNote}"
                          </p>
                        )}
                        <p className="text-[11px] text-amber-200">
                          <strong className="text-amber-300 font-semibold">Captain's Note:</strong>{' '}
                          {existingAttendance.captainsNote ? (
                            `"${existingAttendance.captainsNote}"`
                          ) : (
                            <span className="text-slate-400 italic">Pending Captain Certification...</span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons allowing student to update to Confirm Present or Apply for Leave */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center pt-1 lg:pt-0">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleDirectStatusSwitch('present')}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white border border-emerald-400/60 text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs shrink-0 disabled:opacity-50 cursor-pointer"
                        title="Update to Confirm Present"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-100" />
                        <span>Confirm Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setActionChoice('leave');
                          setIsEditingMode(true);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-xs shrink-0 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit / Leave</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Submission / Edit Form */
            <form onSubmit={handleNextDaySubmit} className="space-y-3">
              {/* Context Banner */}
              {existingAttendance || existingLeave ? (
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>
                      Updating Status for {targetDayLabel} ({targetDayIso})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingMode(false)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold border border-slate-700 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 text-[11px] flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <div>
                      <span className="font-bold text-white">Initial Default Status: ABSENT</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Choice Selection Tabs */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Select Status for {targetDayLabel} ({targetDayIso}):
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Option 1: Present */}
                  <button
                    type="button"
                    onClick={() => setActionChoice('present')}
                    className={`p-2.5 rounded-xl border transition-all text-left flex items-center gap-2 ${
                      actionChoice === 'present'
                        ? 'bg-emerald-500/20 border-emerald-500 text-white ring-1 ring-emerald-500/50'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-emerald-300">
                        Present
                      </div>
                    </div>
                  </button>

                  {/* Option 2: Absent */}
                  <button
                    type="button"
                    onClick={() => setActionChoice('absent')}
                    className={`p-2.5 rounded-xl border transition-all text-left flex items-center gap-2 ${
                      actionChoice === 'absent'
                        ? 'bg-rose-500/20 border-rose-500 text-white ring-1 ring-rose-500/50'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 font-bold">
                      <XCircle className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-rose-300">
                        Absent
                      </div>
                    </div>
                  </button>

                  {/* Option 3: Apply for Leave */}
                  <button
                    type="button"
                    onClick={() => setActionChoice('leave')}
                    className={`p-2.5 rounded-xl border transition-all text-left flex items-center gap-2 ${
                      actionChoice === 'leave'
                        ? 'bg-amber-500/20 border-amber-500 text-white ring-1 ring-amber-500/50'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 font-bold">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase text-amber-300">
                        Leave
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Leave Category Selector if Leave chosen */}
              {actionChoice === 'leave' && (
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                    Category:
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {LEAVE_CATEGORIES.map((cat) => {
                      const IconComp = cat.icon;
                      const isSel = leaveCategory === cat.type;
                      return (
                        <button
                          key={cat.type}
                          type="button"
                          onClick={() => setLeaveCategory(cat.type)}
                          className={`p-2 rounded-xl border text-center flex items-center justify-center gap-1 transition-all ${
                            isSel
                              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-bold ring-1 ring-amber-400/40'
                              : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <IconComp className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-[10px] truncate">{cat.type}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Reason / Remarks Text Area */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {actionChoice === 'leave' ? 'Reason for Absence (Min 5 chars):' : 'Optional Remarks:'}
                </label>
                <textarea
                  rows={2}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder={
                    actionChoice === 'leave'
                      ? 'e.g. Fever rest prescribed by doctor...'
                      : `e.g. Self-reported attendance...`
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-hidden focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider text-white shadow-md transition-all flex items-center gap-1.5 ${
                    actionChoice === 'present'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : actionChoice === 'absent'
                      ? 'bg-rose-600 hover:bg-rose-500'
                      : 'bg-amber-600 hover:bg-amber-500'
                  } disabled:opacity-50 cursor-pointer`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmitting
                      ? 'Saving...'
                      : actionChoice === 'present'
                      ? `Confirm Present`
                      : actionChoice === 'absent'
                      ? `Confirm Absent`
                      : `Submit Leave`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* 2. ATTENDANCE LEDGER SECTION */}
      {/* ---------------------------------------------------- */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 border-b border-emerald-100/80 pb-1.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CalendarCheck className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Attendance Ledger</h3>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {records.length} Logs
              </span>
            </div>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>PDF Report</span>
          </button>
        </div>

        {/* ATTENDANCE LEDGER CONTENT */}
        <div className="space-y-2">
          {/* Stats Summary Panel - Compact 5-col row */}
          <div className="grid grid-cols-5 gap-1 sm:gap-1.5">
            <div className="p-1.5 sm:p-2 rounded-lg bg-white/90 backdrop-blur-md border border-emerald-100 shadow-2xs text-center space-y-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-500 block truncate">Total</span>
              <div className="text-sm sm:text-base font-extrabold text-slate-800 font-mono leading-none">{stats.total}</div>
            </div>

            <div className="p-1.5 sm:p-2 rounded-lg bg-white/90 backdrop-blur-md border border-emerald-100 shadow-2xs text-center space-y-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-600 block truncate">Present</span>
              <div className="text-sm sm:text-base font-extrabold text-emerald-700 font-mono leading-none">{stats.present}</div>
            </div>

            <div className="p-1.5 sm:p-2 rounded-lg bg-white/90 backdrop-blur-md border border-emerald-100 shadow-2xs text-center space-y-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-rose-600 block truncate">Absent</span>
              <div className="text-sm sm:text-base font-extrabold text-rose-700 font-mono leading-none">{stats.absent}</div>
            </div>

            <div className="p-1.5 sm:p-2 rounded-lg bg-white/90 backdrop-blur-md border border-emerald-100 shadow-2xs text-center space-y-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-amber-600 block truncate">Leaves</span>
              <div className="text-sm sm:text-base font-extrabold text-amber-700 font-mono leading-none">{stats.leave}</div>
            </div>

            {stats.fraud > 0 ? (
              <div className="p-1.5 sm:p-2 rounded-lg bg-purple-50/90 backdrop-blur-md border border-purple-200 shadow-2xs text-center space-y-0.5">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-purple-700 block truncate">Fraud</span>
                <div className="text-sm sm:text-base font-extrabold text-purple-900 font-mono leading-none">{stats.fraud}</div>
              </div>
            ) : (
              <div className="p-1.5 sm:p-2 rounded-lg bg-indigo-50/80 backdrop-blur-md border border-indigo-100 shadow-2xs text-center space-y-0.5">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-indigo-600 block truncate">Rate</span>
                <div className="text-sm sm:text-base font-extrabold text-indigo-800 font-mono leading-none">
                  {stats.total > 0 ? `${Math.round((stats.present / stats.total) * 100)}%` : '100%'}
                </div>
              </div>
            )}
          </div>

          {/* Filter controls - Ultra Compact Single Row */}
          <div className="p-1.5 rounded-lg bg-white/90 backdrop-blur-md border border-emerald-100/80 shadow-2xs flex items-center gap-1.5">
            {/* Search by date */}
            <div className="relative flex-1 min-w-[100px]">
              <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="YYYY-MM..."
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="w-full pl-6 pr-1.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-1.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-medium focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Fraud">Fraud</option>
            </select>

            {/* Month Filter */}
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-1.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] font-medium focus:outline-hidden focus:border-emerald-500 cursor-pointer"
            >
              <option value="All">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthTitle(m)}
                </option>
              ))}
            </select>
          </div>

          {/* Attendance History List / Table (Stacked Cards on Mobile/Android, Table on Desktop) */}
          {filteredRecords.length === 0 ? (
            <StudentEmptyState
              title="No Attendance Records Found"
              description="There are no attendance records matching your current filter criteria."
            />
          ) : (
            <div>
              {/* Mobile / Android Stacked Block Cards View (< md) */}
              <div className="block md:hidden space-y-2">
                {filteredRecords.map((rec) => {
                  const dt = formatDateDetails(rec.date);
                  const blockStyle = getBlockCardStyle(rec.status);
                  return (
                    <div
                      key={rec.id}
                      className={blockStyle.card}
                    >
                      {/* Top Bar: Date badge & Status badge */}
                      <div className={`flex items-center justify-between gap-2 pb-1.5 ${blockStyle.topBorder}`}>
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center shrink-0 ${blockStyle.dateBoxBg}`}>
                            <span className="text-[8px] font-extrabold uppercase text-emerald-800 leading-none">
                              {dt.month}
                            </span>
                            <span className="text-xs font-bold text-slate-800 leading-none mt-0.5 font-mono">
                              {dt.day}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 tracking-tight text-[11px]">{dt.fullWeekday}</div>
                            <div className="text-[9px] text-slate-500 font-mono">{rec.date}</div>
                          </div>
                        </div>

                        <div className="shrink-0">{getStatusBadge(rec.status)}</div>
                      </div>

                      {/* Middle Bar: Certified By */}
                      <div className={`flex items-center justify-between text-[10px] p-1.5 rounded-lg ${blockStyle.certifiedBg}`}>
                        <span className="font-extrabold uppercase tracking-wider opacity-70 text-[9px]">Certified By:</span>
                        <div className="text-right">
                          <span className="font-bold">{rec.markedBy?.name || 'Class Captain'}</span>
                          <span className="text-[9px] opacity-75 block">{rec.markedBy?.role || 'Captain'}</span>
                        </div>
                      </div>

                      {/* Bottom Bar: Remarks / Notes */}
                      <div className="space-y-1 pt-0.5">
                        {String(rec.status).toLowerCase() === 'fraud' && (
                          <div className="text-[10px] text-purple-950 bg-purple-100/90 p-1.5 rounded-lg border border-purple-200 shadow-2xs">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[8px] font-black uppercase tracking-wider text-purple-900 bg-purple-200 px-1 py-0.2 rounded">
                                Disciplinary Flag
                              </span>
                            </div>
                            <p className="font-semibold text-purple-950 leading-snug">
                              {rec.captainsNote || rec.remarks || 'Flagged for roll call discrepancy'}
                            </p>
                          </div>
                        )}

                        {rec.studentsNote && (
                          <div className="text-[10px] text-slate-800 bg-white/80 p-1.5 rounded-lg border border-slate-200/80">
                            <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                              <span className="text-[8px] font-black uppercase tracking-wider text-emerald-900 bg-emerald-100 px-1 py-0.2 rounded">
                                Student Note
                              </span>
                              {(rec.leaveReason || rec.leaveType) && (
                                <span className={`text-[8px] font-black uppercase tracking-wider px-1 py-0.2 rounded border ${getCategoryStyle(rec.leaveReason || rec.leaveType)}`}>
                                  Category: {rec.leaveReason || rec.leaveType}
                                </span>
                              )}
                            </div>
                            <p className="italic text-slate-800 font-medium">"{rec.studentsNote}"</p>
                          </div>
                        )}

                        {rec.captainsNote && String(rec.status).toLowerCase() !== 'fraud' && (
                          <div className="text-[10px] text-slate-800 bg-amber-100/60 p-1.5 rounded-lg border border-amber-200/80">
                            <div className="flex items-center gap-1 mb-0.5">
                              <span className="text-[8px] font-black uppercase tracking-wider text-amber-900 bg-amber-200/80 px-1 py-0.2 rounded">
                                Captain Note
                              </span>
                            </div>
                            <p className="text-slate-800 font-medium">{rec.captainsNote}</p>
                          </div>
                        )}

                        {!rec.studentsNote && !rec.captainsNote && rec.remarks && String(rec.status).toLowerCase() !== 'fraud' && (
                          <span className="text-[11px] font-medium text-slate-700 block px-1">
                            {rec.remarks}
                          </span>
                        )}

                        {!rec.studentsNote && !rec.captainsNote && !rec.remarks && String(rec.status).toLowerCase() !== 'fraud' && (
                          <span className="text-slate-400 italic text-[10px] block px-0.5">No notes recorded</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View (>= md) */}
              <div className="hidden md:block bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-100/80 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-emerald-950/5 text-slate-600 text-[10px] font-black uppercase tracking-wider border-b border-emerald-100/80">
                        <th className="py-3.5 px-4 sm:px-6">Date</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">Certified By</th>
                        <th className="py-3.5 px-4">Remarks / Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-50 text-xs">
                      {filteredRecords.map((rec) => {
                        const dt = formatDateDetails(rec.date);
                        const rowStyle = getTableRowStyle(rec.status);
                        return (
                          <tr key={rec.id} className={rowStyle}>
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-xl bg-white/80 border border-slate-200/80 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                                  <span className="text-[10px] font-black uppercase text-emerald-700 leading-none">
                                    {dt.month}
                                  </span>
                                  <span className="text-sm font-black text-slate-800 leading-none mt-0.5 font-mono">
                                    {dt.day}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-black text-slate-800 tracking-tight">{dt.fullWeekday}</div>
                                  <div className="text-[10px] text-slate-400 font-mono">{rec.date}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4">{getStatusBadge(rec.status)}</td>

                            <td className="py-3.5 px-4">
                              <div className="text-xs font-bold text-slate-700">
                                {rec.markedBy?.name || 'Class Captain'}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                {rec.markedBy?.role || 'Captain'}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 max-w-sm text-slate-600">
                              <div className="space-y-1.5">
                                {String(rec.status).toLowerCase() === 'fraud' && (
                                  <div className="text-[11px] text-purple-950 bg-purple-50 p-2 rounded-xl border border-purple-200 shadow-2xs">
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-purple-900 bg-purple-200/80 px-1.5 py-0.5 rounded">
                                        Disciplinary Flag
                                      </span>
                                    </div>
                                    <p className="font-semibold text-purple-950 leading-snug">
                                      {rec.captainsNote || rec.remarks || 'Flagged for roll call discrepancy'}
                                    </p>
                                  </div>
                                )}

                                {rec.studentsNote && (
                                  <div className="text-[11px] text-slate-700 bg-emerald-50/70 p-2 rounded-xl border border-emerald-100/80">
                                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-200/70 px-1.5 py-0.5 rounded">
                                        Student's Note
                                      </span>
                                      {(rec.leaveReason || rec.leaveType) && (
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${getCategoryStyle(rec.leaveReason || rec.leaveType)}`}>
                                          Category: {rec.leaveReason || rec.leaveType}
                                        </span>
                                      )}
                                    </div>
                                    <p className="italic text-slate-700 font-medium">"{rec.studentsNote}"</p>
                                  </div>
                                )}

                                {rec.captainsNote && String(rec.status).toLowerCase() !== 'fraud' && (
                                  <div className="text-[11px] text-slate-700 bg-amber-50/70 p-2 rounded-xl border border-amber-100/80">
                                    <div className="flex items-center gap-1 mb-0.5">
                                      <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/70 px-1.5 py-0.5 rounded">
                                        Captain's Note
                                      </span>
                                    </div>
                                    <p className="text-slate-700 font-medium">{rec.captainsNote}</p>
                                  </div>
                                )}

                                {!rec.studentsNote && !rec.captainsNote && rec.remarks && String(rec.status).toLowerCase() !== 'fraud' && (
                                  <span className="text-xs font-medium text-slate-600">
                                    {rec.remarks}
                                  </span>
                                )}

                                {!rec.studentsNote && !rec.captainsNote && !rec.remarks && String(rec.status).toLowerCase() !== 'fraud' && (
                                  <span className="text-slate-300 italic text-[11px]">No notes recorded</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MANDATORY MONTH SELECTION PDF REPORT MODAL */}
      {/* ---------------------------------------------------- */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 text-slate-800">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 flex items-center justify-center shrink-0 shadow-xs">
                  <Download className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-800 tracking-tight">Download PDF Report</h3>
                  <p className="text-xs font-semibold text-slate-500">Official Monthly Attendance Audit Ledger</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsPdfModalOpen(false);
                  setPdfValidationError(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="font-medium leading-relaxed">
                <strong className="font-bold">Month selection is mandatory</strong> to generate an official monthly audit ledger. Reports cannot be generated without specifying a month.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Select Academic Month <span className="text-rose-500">*</span>
              </label>
              <select
                value={pdfMonth}
                onChange={(e) => {
                  setPdfMonth(e.target.value);
                  setPdfValidationError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-slate-800 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              >
                <option value="">-- Choose Academic Month (Mandatory) --</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthTitle(m)} ({records.filter((r) => r.date && r.date.startsWith(m)).length} roll calls)
                  </option>
                ))}
              </select>
              {pdfValidationError && (
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {pdfValidationError}
                </p>
              )}
            </div>

            {pdfMonth && pdfMonth !== 'All' && (
              <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-1 text-xs">
                <div className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Selected Period:</span>
                  <span className="text-emerald-700 font-mono font-black">{formatMonthTitle(pdfMonth)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-500 text-[11px]">
                  <span>Logs to include:</span>
                  <span className="font-semibold text-slate-700 font-mono">
                    {records.filter((r) => r.date && r.date.startsWith(pdfMonth)).length} Roll Calls • {leaves.filter((l) => (l.startDate && l.startDate.startsWith(pdfMonth)) || (l.endDate && l.endDate.startsWith(pdfMonth))).length} Leaves
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsPdfModalOpen(false);
                  setPdfValidationError(null);
                }}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecutePdfDownload}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Generate & Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
