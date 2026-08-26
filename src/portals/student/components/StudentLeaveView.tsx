import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  PlusCircle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Send, 
  AlertCircle, 
  Info, 
  Calendar, 
  ShieldCheck, 
  Sparkles, 
  HelpCircle,
  Search,
  SlidersHorizontal,
  Stethoscope,
  AlertTriangle,
  Award,
  Coffee,
  Users,
  Eye,
  Check,
  History,
  Phone,
  Mail,
  FileCheck2,
  CalendarDays,
  UserCheck,
  ChevronRight,
  Sparkle,
  Pencil,
  Edit3
} from 'lucide-react';
import { LeaveRequest, LeaveType, LeaveStatus, SectionCaptainInfo } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { StudentEmptyState } from './StudentEmptyState';

interface StudentLeaveViewProps {
  leaves: LeaveRequest[];
  captains?: SectionCaptainInfo[];
  onSubmitLeave: (data: { 
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
  loading: boolean;
}

type TabType = 'history' | 'apply';
type SortOption = 'newest' | 'oldest' | 'date-asc' | 'date-desc';

const LEAVE_CATEGORIES: {
  type: LeaveType;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  badgeColor: string;
  borderColor: string;
  bgSelected: string;
}[] = [
  {
    type: 'Medical',
    label: 'Medical / Health Reason',
    shortDesc: 'Illness, fever, medical consult, or physician-prescribed rest',
    icon: Stethoscope,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    borderColor: 'border-rose-300',
    bgSelected: 'bg-rose-500/10 border-rose-500 text-rose-900',
  },
  {
    type: 'Emergency',
    label: 'Family Emergency / Urgent',
    shortDesc: 'Unforeseen domestic emergency or urgent family situation',
    icon: AlertTriangle,
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    borderColor: 'border-amber-300',
    bgSelected: 'bg-amber-500/10 border-amber-500 text-amber-900',
  },
  {
    type: 'Academic',
    label: 'Academic Competition / Olympiad',
    shortDesc: 'Science olympiad, math festival, or university test attendance',
    icon: Award,
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
    borderColor: 'border-sky-300',
    bgSelected: 'bg-sky-500/10 border-sky-500 text-sky-900',
  },
  {
    type: 'Casual',
    label: 'Casual Absence',
    shortDesc: 'Personal errand, pre-planned absence, or travel',
    icon: Coffee,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    borderColor: 'border-emerald-300',
    bgSelected: 'bg-emerald-500/10 border-emerald-500 text-emerald-900',
  },
  {
    type: 'Family',
    label: 'Family Function / Event',
    shortDesc: 'Sibling wedding, religious festival, or relative bereavement',
    icon: Users,
    badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    borderColor: 'border-indigo-300',
    bgSelected: 'bg-indigo-500/10 border-indigo-500 text-indigo-900',
  },
  {
    type: 'Others',
    label: 'Others / Unlisted Reason',
    shortDesc: 'Other personal circumstances or unlisted specific reason',
    icon: HelpCircle,
    badgeColor: 'bg-violet-50 text-violet-800 border-violet-200',
    borderColor: 'border-violet-300',
    bgSelected: 'bg-violet-500/10 border-violet-500 text-violet-900',
  },
];

export const StudentLeaveView: React.FC<StudentLeaveViewProps> = ({
  leaves = [],
  captains = [],
  onSubmitLeave,
  onUpdateLeave,
  loading,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('history');
  const [leaveType, setLeaveType] = useState<LeaveType>('Medical');
  const [editingLeave, setEditingLeave] = useState<LeaveRequest | null>(null);

  // Compute upcoming academic days excluding weekends (Friday and Saturday) - 4 Days window (Today + next 3 days)
  const availableDays = useMemo(() => {
    const list = [];
    const now = new Date();
    // Scan ahead up to 10 calendar days to gather exactly 4 valid academic days (excluding Fri=5, Sat=6)
    let added = 0;
    for (let i = 0; i <= 10 && added < 4; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
      // Skip Friday (5) and Saturday (6)
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        continue;
      }

      const isoDate = d.toISOString().slice(0, 10);
      const todayString = now.toISOString().slice(0, 10);
      const tomorrowObj = new Date(now);
      tomorrowObj.setDate(now.getDate() + 1);
      const tomorrowString = tomorrowObj.toISOString().slice(0, 10);

      const dayName = isoDate === todayString ? 'Today' : isoDate === tomorrowString ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const formatted = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fullWeekday = d.toLocaleDateString('en-US', { weekday: 'long' });
      const dayNumber = d.getDate();
      list.push({
        offset: i,
        isoDate,
        dayName,
        formatted,
        fullWeekday,
        dayNumber,
      });
      added++;
    }
    return list;
  }, []);

  const todayIso = availableDays[0]?.isoDate || new Date().toISOString().slice(0, 10);
  const maxIso = availableDays[availableDays.length - 1]?.isoDate || todayIso;

  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Search, Status Filter & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | LeaveStatus>('All');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  // Helper to normalize batch & section strings for similarity matching
  const normalize = (val?: string) => (val || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Designated reviewers matching by HSC Batch & Section similarity
  const designatedReviewers = useMemo(() => {
    if (!captains || captains.length === 0) return [];
    
    const userBatchNorm = normalize(user?.batch);
    const userSecNorm = normalize(user?.section);

    // Match captains having same/similar batch & section
    const exactMatches = captains.filter((cap) => {
      const capBatchNorm = normalize(cap.assignedBatch);
      const capSecNorm = normalize(cap.assignedSection);
      
      const batchSimilar = !userBatchNorm || !capBatchNorm || capBatchNorm.includes(userBatchNorm) || userBatchNorm.includes(capBatchNorm);
      const secSimilar = !userSecNorm || !capSecNorm || capSecNorm === userSecNorm;
      
      return batchSimilar && secSimilar;
    });

    if (exactMatches.length > 0) return exactMatches;

    // Fallback: match by section
    const sectionMatches = captains.filter((cap) => {
      const capSecNorm = normalize(cap.assignedSection);
      return !userSecNorm || !capSecNorm || capSecNorm === userSecNorm;
    });

    if (sectionMatches.length > 0) return sectionMatches;

    return captains;
  }, [captains, user?.batch, user?.section]);

  // Metrics calculation
  const stats = useMemo(() => {
    const total = leaves.length;
    const approved = leaves.filter((l) => l.status === 'Approved').length;
    const pending = leaves.filter((l) => l.status === 'Pending').length;
    const rejected = leaves.filter((l) => l.status === 'Rejected').length;
    const daysExcused = leaves
      .filter((l) => l.status === 'Approved')
      .reduce((sum, l) => sum + (l.daysCount || 1), 0);

    return { total, approved, pending, rejected, daysExcused };
  }, [leaves]);

  const selectedDayObj = availableDays.find((d) => d.isoDate === selectedDate) || {
    isoDate: selectedDate,
    dayName: 'Selected Day',
    formatted: selectedDate,
    fullWeekday: '',
    dayNumber: '',
  };

  const selectedCategoryMeta = LEAVE_CATEGORIES.find((c) => c.type === leaveType) || LEAVE_CATEGORIES[0];

  const handleDaySelect = (isoDate: string) => {
    setSelectedDate(isoDate);
  };

  const handleStartEdit = (lv: LeaveRequest) => {
    if (lv.status !== 'Pending') {
      setFeedback({
        type: 'error',
        message: `Cannot edit leave application with status '${lv.status}'. Only pending review applications can be edited.`,
      });
      return;
    }
    setEditingLeave(lv);
    setLeaveType(lv.leaveType);
    setSelectedDate(lv.startDate);
    setReason(lv.reason);
    setFeedback(null);
    setActiveTab('apply');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingLeave(null);
    setReason('');
    setFeedback(null);
    setActiveTab('history');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 8) {
      setFeedback({ 
        type: 'error', 
        message: 'Please provide a clear and detailed reason for your leave application (minimum 8 characters).' 
      });
      return;
    }

    // Weekend (Friday/Saturday) check
    const chosenDateObj = new Date(selectedDate);
    const chosenDay = chosenDateObj.getDay();
    if (chosenDay === 5 || chosenDay === 6) {
      setFeedback({
        type: 'error',
        message: 'Leave applications cannot be filed for weekends (Friday and Saturday). Please choose an academic weekday.',
      });
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      if (editingLeave && onUpdateLeave) {
        const res = await onUpdateLeave(editingLeave.id, {
          leaveType,
          date: selectedDate,
          startDate: selectedDate,
          reason: reason.trim(),
        });

        if (res.success) {
          setFeedback({ 
            type: 'success', 
            message: res.message || `Leave application for ${selectedDate} updated successfully! Your Section Captains will review the revised details.` 
          });
          setEditingLeave(null);
          setReason('');
          setActiveTab('history');
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to update leave request.' });
        }
      } else {
        const res = await onSubmitLeave({
          leaveType,
          date: selectedDate,
          startDate: selectedDate,
          endDate: selectedDate,
          reason: reason.trim(),
        });

        if (res.success) {
          setFeedback({ 
            type: 'success', 
            message: res.message || `Leave application for ${selectedDate} submitted successfully! Your Section Captains have been notified.` 
          });
          setReason('');
          setActiveTab('history');
        } else {
          setFeedback({ type: 'error', message: res.error || 'Failed to submit leave request.' });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error occurred while saving leave.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered & Sorted leaves
  const filteredLeaves = useMemo(() => {
    return leaves
      .filter((lv) => {
        if (statusFilter !== 'All' && lv.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchType = lv.leaveType.toLowerCase().includes(q);
          const matchDate = lv.startDate.toLowerCase().includes(q);
          const matchReason = lv.reason.toLowerCase().includes(q);
          const matchReviewer = lv.reviewedBy?.name.toLowerCase().includes(q);
          const matchNote = lv.reviewNote?.toLowerCase().includes(q);
          if (!matchType && !matchDate && !matchReason && !matchReviewer && !matchNote) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        }
        if (sortBy === 'date-asc') {
          return a.startDate.localeCompare(b.startDate);
        }
        if (sortBy === 'date-desc') {
          return b.startDate.localeCompare(a.startDate);
        }
        return 0;
      });
  }, [leaves, statusFilter, searchQuery, sortBy]);

  const getLeaveStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/90 inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Approved & Excused</span>
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl bg-amber-50 text-amber-800 border border-amber-200/90 inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 animate-spin-slow" />
            <span>Pending Review</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl bg-rose-50 text-rose-800 border border-rose-200/90 inline-flex items-center gap-1.5 shadow-2xs whitespace-nowrap">
            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Declined</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl bg-slate-50 text-slate-700 border border-slate-200 whitespace-nowrap">
            {status}
          </span>
        );
    }
  };

  const getRelativeDateInfo = (dateStr: string) => {
    const today = new Date().toISOString().slice(0, 10);
    if (dateStr === today) return { label: 'Today', color: 'bg-emerald-600 text-white' };
    const dDate = new Date(dateStr);
    const tDate = new Date(today);
    const diffDays = Math.ceil((dDate.getTime() - tDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-teal-600 text-white' };
    if (diffDays > 1) return { label: `In ${diffDays} days`, color: 'bg-sky-600 text-white' };
    return { label: 'Past Date', color: 'bg-slate-200 text-slate-700' };
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-full overflow-hidden">
      {/* KPI Performance Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Applications */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-md border border-emerald-100/90 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-800/70 truncate">
              Total Filed
            </p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-950 tracking-tight mt-0.5 sm:mt-1 font-mono">
              {stats.total}
            </h3>
            <p className="text-[10px] text-emerald-700/80 font-medium truncate mt-0.5">All time records</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 flex items-center justify-center font-black shrink-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Approved Leaves */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-md border border-emerald-100/90 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-emerald-800/70 truncate">
              Approved
            </p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-emerald-600 tracking-tight mt-0.5 sm:mt-1 font-mono">
              {stats.approved}
            </h3>
            <p className="text-[10px] text-emerald-700/80 font-medium truncate mt-0.5">Fine waived</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center font-black shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Pending Review */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-md border border-emerald-100/90 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-amber-800/70 truncate">
              Pending Review
            </p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-amber-600 tracking-tight mt-0.5 sm:mt-1 font-mono">
              {stats.pending}
            </h3>
            <p className="text-[10px] text-amber-700/80 font-medium truncate mt-0.5">With Captains</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center font-black shrink-0">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        {/* Excused Days Count */}
        <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/90 backdrop-blur-md border border-emerald-100/90 shadow-xs flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-teal-800/70 truncate">
              Excused Days
            </p>
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-teal-700 tracking-tight mt-0.5 sm:mt-1 font-mono">
              {stats.daysExcused}
            </h3>
            <p className="text-[10px] text-teal-700/80 font-medium truncate mt-0.5">Days excused</p>
          </div>
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-teal-50 border border-teal-200/80 text-teal-700 flex items-center justify-center font-black shrink-0">
            <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar (Clean Responsive Segmented Pill Switch - No Horizontal Scroll) */}
      <div className="w-full">
        <div className="grid grid-cols-2 p-1.5 bg-emerald-100/70 backdrop-blur-xs rounded-2xl border border-emerald-200/80 gap-1.5 w-full">
          <button
            id="tab-leave-history"
            type="button"
            onClick={() => setActiveTab('history')}
            className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-center ${
              activeTab === 'history'
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/25 ring-1 ring-emerald-700'
                : 'text-emerald-900 hover:bg-emerald-200/60 font-bold'
            }`}
          >
            <History className="w-4 h-4 shrink-0" />
            <span className="truncate">Vault ({leaves.length})</span>
          </button>

          <button
            id="tab-leave-apply"
            type="button"
            onClick={() => setActiveTab('apply')}
            className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 text-center ${
              activeTab === 'apply'
                ? 'bg-emerald-800 text-white shadow-md shadow-emerald-800/25 ring-1 ring-emerald-700'
                : 'text-emerald-900 hover:bg-emerald-200/60 font-bold'
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">Apply Leave</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl text-xs font-medium flex items-center gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900 shadow-xs'
              : 'bg-rose-50 border border-rose-200 text-rose-900 shadow-xs'
          }`}
        >
          {feedback.type === 'success' ? (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-200/80 text-emerald-800 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          ) : (
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-200/80 text-rose-800 flex items-center justify-center shrink-0">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="font-black text-xs">{feedback.type === 'success' ? 'Application Processed' : 'Action Failed'}</h4>
            <p className="mt-0.5 text-xs break-words">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-black uppercase text-emerald-700 hover:text-emerald-950 px-2 py-1 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: NEW LEAVE STUDIO (Responsive layout with mobile support) */}
      {activeTab === 'apply' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 animate-in fade-in duration-200">
          {/* Main Application Form (2 cols on desktop, full on mobile) */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 lg:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-emerald-200 shadow-lg shadow-emerald-900/5 space-y-5 sm:space-y-6"
            >
              {/* Editing Banner */}
              {editingLeave && (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-300 text-amber-950 flex items-center justify-between gap-3 flex-wrap animate-in fade-in duration-200">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      <Pencil className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-900 truncate">
                        Editing Pending Leave Request
                      </h4>
                      <p className="text-[11px] text-amber-800/90 font-medium truncate">
                        Original Application: <span className="font-mono font-bold text-amber-950">{editingLeave.startDate}</span> ({editingLeave.leaveType})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-50 transition-colors shrink-0 shadow-2xs"
                  >
                    Cancel Edit
                  </button>
                </div>
              )}

              {/* Header */}
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-emerald-100 gap-2">
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-base shrink-0 shadow-2xs">
                    {editingLeave ? <Pencil className="w-4 h-4 sm:w-5 sm:h-5" /> : <FileText className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight truncate">
                      {editingLeave ? 'Edit Pending Application' : 'Leave Application Studio'}
                    </h2>
                    <p className="text-[11px] sm:text-xs text-emerald-800/80 font-medium truncate">
                      {editingLeave ? 'Modify your reason or date before reviewer decision.' : 'Single date absence on upcoming 4 academic days (Sun – Thu).'}
                    </p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border shrink-0 whitespace-nowrap ${
                  editingLeave ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {editingLeave ? 'Revision Mode' : '1-Day Notice'}
                </span>
              </div>

              {/* STEP 1: Interactive Academic Day Date Grid (Excluding Fri & Sat - 4 Days Window) */}
              <div className="space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                    <span>Step 1: Choose Intended Date:</span>
                  </label>
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200/80">
                    {selectedDate} ({selectedDayObj.dayName})
                  </span>
                </div>

                {/* 4-Day Quick Buttons: Clean 4 columns grid on both mobile and desktop */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                  {availableDays.map((day) => {
                    const isSelected = selectedDate === day.isoDate;
                    return (
                      <button
                        key={day.isoDate}
                        type="button"
                        onClick={() => handleDaySelect(day.isoDate)}
                        className={`w-full p-2.5 sm:p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 relative ${
                          isSelected
                            ? 'bg-gradient-to-tr from-emerald-800 to-teal-700 text-white border-emerald-800 shadow-md shadow-emerald-800/25 scale-[1.02] ring-2 ring-emerald-400/40'
                            : 'bg-emerald-50/40 hover:bg-emerald-100/70 text-emerald-950 border-emerald-200/70'
                        }`}
                      >
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${isSelected ? 'text-emerald-200' : 'text-emerald-700'}`}>
                          {day.dayName}
                        </span>
                        <span className="text-base sm:text-xl font-black tracking-tight font-mono">
                          {day.dayNumber}
                        </span>
                        <span className={`text-[10px] sm:text-xs font-bold ${isSelected ? 'text-emerald-100' : 'text-emerald-900/70'}`}>
                          {day.formatted.split(' ')[0]}
                        </span>
                        {isSelected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white absolute bottom-1 sm:bottom-1.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Date Picker helper */}
                <div className="flex items-center gap-2 pt-1 text-xs flex-wrap">
                  <span className="text-emerald-800/70 font-semibold text-[11px] sm:text-xs">Or calendar date:</span>
                  <input
                    type="date"
                    min={todayIso}
                    max={maxIso}
                    value={selectedDate}
                    onChange={(e) => {
                      const d = new Date(e.target.value);
                      const day = d.getDay();
                      if (day === 5 || day === 6) {
                        setFeedback({
                          type: 'error',
                          message: 'Friday and Saturday are non-academic weekend days. Please select an academic day (Sunday – Thursday).',
                        });
                        return;
                      }
                      setSelectedDate(e.target.value);
                    }}
                    required
                    className="px-2.5 py-1.5 text-xs font-bold bg-emerald-50/60 border border-emerald-200 text-emerald-950 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                  />
                  <span className="text-[10px] sm:text-[11px] text-emerald-700/60 font-medium">
                    (Academic days only: Sun – Thu)
                  </span>
                </div>
              </div>

              {/* STEP 2: Category Selector */}
              <div className="space-y-2.5 sm:space-y-3 pt-1">
                <label className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                  <span>Step 2: Select Leave Category:</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
                  {LEAVE_CATEGORIES.map((cat) => {
                    const isSelected = leaveType === cat.type;
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.type}
                        type="button"
                        onClick={() => setLeaveType(cat.type)}
                        className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 sm:gap-2 min-h-[72px] sm:min-h-[84px] ${
                          isSelected
                            ? `${cat.bgSelected} ring-2 ring-emerald-500 shadow-xs`
                            : 'bg-emerald-50/30 hover:bg-emerald-50/70 border-emerald-100 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white border border-emerald-200/60 flex items-center justify-center text-emerald-800 shadow-2xs shrink-0">
                            <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </div>
                          {isSelected && (
                            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black shrink-0">
                              <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                          )}
                        </div>
                        <div>
                          <h4 className="text-xs font-black tracking-tight text-emerald-950">{cat.label}</h4>
                          <p className="text-[10px] text-emerald-800/70 font-medium mt-0.5 line-clamp-2">
                            {cat.shortDesc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP 3: Detailed Reason */}
              <div className="space-y-2.5 sm:space-y-3 pt-1">
                <label className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
                  <span>Step 3: Reason for Absence:</span>
                </label>

                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide precise details (e.g. Diagnosed with acute illness by doctor; Special academic competition or test; Personal/Family circumstances)..."
                  required
                  className="w-full p-3.5 sm:p-4 text-sm sm:text-xs font-medium bg-emerald-50/40 border border-emerald-200 text-emerald-950 placeholder:text-emerald-700/40 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-hidden leading-relaxed shadow-2xs"
                />
              </div>

              {/* Submit CTA */}
              <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-3 sm:pt-4 border-t border-emerald-100">
                <button
                  type="button"
                  onClick={editingLeave ? handleCancelEdit : () => setActiveTab('history')}
                  className="w-full sm:w-auto min-h-[44px] px-4 sm:px-5 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-800 hover:text-emerald-950 bg-emerald-50 border border-emerald-200/80 rounded-xl transition-colors text-center"
                >
                  {editingLeave ? 'Cancel Edit' : 'Cancel'}
                </button>

                <button
                  id="btn-submit-leave-studio"
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="w-full sm:w-auto min-h-[46px] px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 ring-1 ring-teal-400/30"
                >
                  {editingLeave ? (
                    <>
                      <Check className="w-4 h-4 shrink-0" />
                      <span className="truncate">{submitting ? 'Saving Revised Application...' : `Save & Update Leave (${selectedDate})`}</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 shrink-0" />
                      <span className="truncate">{submitting ? 'Submitting Leave Notice...' : `Submit Application (${selectedDate})`}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Sidebar: Live Preview & Multiple Designated Reviewers */}
          <div className="space-y-4 sm:space-y-6">
            {/* Live Application Preview Card */}
            <div className="p-4 sm:p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-emerald-200 shadow-xs space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-emerald-100">
                <div className="flex items-center gap-2 text-emerald-900">
                  <Eye className="w-4 h-4 text-emerald-600 shrink-0" />
                  <h3 className="text-xs font-black uppercase tracking-wider">Live Preview Card</h3>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
                  Captain View
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2.5 sm:space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${selectedCategoryMeta.badgeColor}`}>
                    {selectedCategoryMeta.label.split(' / ')[0]}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                    Pending Review
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-black text-emerald-950">{user?.fullName}</h4>
                  <p className="text-xs text-emerald-800/80 font-semibold mt-0.5">
                    Roll: <span className="font-mono font-bold text-emerald-700">{user?.rollNumber}</span> • Sec {user?.section} • {user?.batch}
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-emerald-100 text-xs text-slate-800 font-medium leading-relaxed">
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-800/70 block mb-0.5">
                    Absence Reason Preview:
                  </span>
                  {reason.trim() ? (
                    `"${reason.trim()}"`
                  ) : (
                    <span className="text-slate-400 italic">Type your justification in Step 3 to preview here...</span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-800/70 pt-1">
                  <span>Target Date: <strong className="text-emerald-950 font-mono">{selectedDate}</strong></span>
                  <span>Days: 1 Day</span>
                </div>
              </div>
            </div>

            {/* Designated Section Captain Reviewers Card (Supports Multiple Captains) */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-950 to-teal-950 text-white shadow-md space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-emerald-300 truncate">
                    {designatedReviewers.length > 1 ? `Designated Reviewers (${designatedReviewers.length})` : 'Designated Reviewer'}
                  </h4>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 shrink-0 whitespace-nowrap">
                  Sec {user?.section} • {user?.batch}
                </span>
              </div>

              {designatedReviewers.length > 0 ? (
                <div className="space-y-3">
                  {designatedReviewers.map((cap) => (
                    <div
                      key={cap.id}
                      className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                          {cap.fullName.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-sm font-black text-white truncate">{cap.fullName}</h4>
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                              Captain
                            </span>
                          </div>
                          <p className="text-[11px] text-emerald-200/90 font-semibold truncate mt-0.5">
                            Roll: <span className="font-mono text-white font-bold">{cap.rollNumber}</span> • Sec {cap.assignedSection} • {cap.assignedBatch}
                          </p>
                        </div>
                      </div>

                      {/* Contact Quick Buttons - Balanced 2-Column Equal Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-white/10 text-xs">
                        {cap.email ? (
                          <a
                            href={`mailto:${cap.email}`}
                            className="min-h-[38px] w-full px-2.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-emerald-100 font-semibold flex items-center justify-center gap-1.5 transition-colors text-center text-[11px] min-w-0"
                            title={cap.email}
                          >
                            <Mail className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                            <span className="truncate">{cap.email.split('@')[0]}@...</span>
                          </a>
                        ) : (
                          <div className="min-h-[38px] w-full px-2.5 py-2 rounded-xl bg-white/5 text-white/40 font-medium flex items-center justify-center gap-1.5 text-[11px]">
                            <Mail className="w-3.5 h-3.5 opacity-40 shrink-0" />
                            <span>No Email</span>
                          </div>
                        )}
                        {cap.phoneNumber ? (
                          <a
                            href={`tel:${cap.phoneNumber}`}
                            className="min-h-[38px] w-full px-2.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:bg-white/30 text-emerald-100 font-semibold flex items-center justify-center gap-1.5 transition-colors text-center text-[11px] min-w-0"
                            title={cap.phoneNumber}
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                            <span className="truncate">{cap.phoneNumber}</span>
                          </a>
                        ) : (
                          <div className="min-h-[38px] w-full px-2.5 py-2 rounded-xl bg-white/5 text-white/40 font-medium flex items-center justify-center gap-1.5 text-[11px]">
                            <Phone className="w-3.5 h-3.5 opacity-40 shrink-0" />
                            <span>No Phone</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-white/10 border border-white/10 flex items-center gap-2.5">
                  <UserCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                  <p className="text-xs text-emerald-200/80 leading-relaxed">
                    Class Captains for Section {user?.section} ({user?.batch}) will review and certify your application.
                  </p>
                </div>
              )}

              <p className="text-[11px] text-emerald-300/80 font-medium leading-relaxed">
                Any assigned Section Captain can review, approve, and excuse your attendance to waive absence penalties.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICATIONS VAULT & HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200">
          {/* Search, Status Tabs & Controls Hub */}
          <div className="p-4 sm:p-6 bg-white/90 backdrop-blur-md rounded-3xl border border-emerald-100/90 shadow-xs space-y-3 sm:space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-emerald-700/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="input-search-leaves"
                  type="text"
                  placeholder="Search leaves by reason, date, or category..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[42px] pl-9 pr-8 py-2 text-sm sm:text-xs font-semibold bg-emerald-50/50 border border-emerald-200 text-emerald-950 placeholder:text-emerald-700/40 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-hidden transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 hover:text-slate-700 p-1"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Sort Selection */}
              <div className="flex items-center gap-2 shrink-0">
                <SlidersHorizontal className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="text-xs font-bold text-emerald-900 shrink-0">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="min-h-[40px] px-3 py-1.5 text-xs font-bold bg-emerald-50/50 border border-emerald-200 text-emerald-950 rounded-xl focus:border-emerald-500 focus:bg-white focus:outline-hidden"
                >
                  <option value="newest">Newest Submitted</option>
                  <option value="oldest">Oldest Submitted</option>
                  <option value="date-asc">Absence Date (Upcoming)</option>
                  <option value="date-desc">Absence Date (Latest)</option>
                </select>
              </div>
            </div>

            {/* Status Filter Chips (Responsive 2x2 on Mobile / Row on Desktop - No Horizontal Scroll) */}
            <div className="pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800/70 shrink-0">
                  Filter Applications:
                </span>
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((st) => {
                    const count = st === 'All' ? leaves.length : leaves.filter((l) => l.status === st).length;
                    const isSelected = statusFilter === st;
                    return (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setStatusFilter(st)}
                        className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto ${
                          isSelected
                            ? 'bg-emerald-800 text-white shadow-xs'
                            : 'bg-emerald-50/70 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/60'
                        }`}
                      >
                        <span className="truncate">{st === 'All' ? 'All' : st}</span>
                        <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono shrink-0 ${
                          isSelected ? 'bg-emerald-950 text-emerald-200' : 'bg-white text-emerald-800'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Records List */}
          {loading ? (
            <div className="py-16 text-center text-xs font-bold text-emerald-600 animate-pulse bg-white/60 rounded-3xl border border-emerald-100">
              Loading verified student leave records from database...
            </div>
          ) : filteredLeaves.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {filteredLeaves.map((lv) => {
                const relInfo = getRelativeDateInfo(lv.startDate);
                const categoryMeta = LEAVE_CATEGORIES.find((c) => c.type === lv.leaveType) || LEAVE_CATEGORIES[0];
                const IconComp = categoryMeta.icon;

                return (
                  <div
                    key={lv.id}
                    className="p-4 sm:p-6 rounded-3xl bg-white/95 backdrop-blur-md border border-emerald-100/90 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all space-y-3 sm:space-y-4"
                  >
                    {/* Top Row: Category, Date, Relative Day & Status Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-emerald-100/70">
                      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center font-black shrink-0">
                          <IconComp className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className={`px-2 sm:px-2.5 py-0.5 rounded-lg text-[11px] sm:text-xs font-black uppercase tracking-wider ${categoryMeta.badgeColor}`}>
                              {lv.leaveType}
                            </span>
                            <span className={`px-2 sm:px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${relInfo.color}`}>
                              {relInfo.label}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-emerald-950 mt-1">
                            Date of Absence:{' '}
                            <span className="font-mono text-emerald-700 font-black">{lv.startDate}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0">
                        {lv.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(lv)}
                            className="min-h-[32px] px-2.5 sm:px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                            title="Edit pending leave request"
                          >
                            <Pencil className="w-3.5 h-3.5 shrink-0" />
                            <span>Edit</span>
                          </button>
                        )}
                        <div>{getLeaveStatusBadge(lv.status)}</div>
                      </div>
                    </div>

                    {/* Middle: Student's Detailed Justification Box */}
                    <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50/30 border border-emerald-100 text-xs sm:text-xs text-slate-800 font-medium leading-relaxed break-words">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800/80 block mb-1">
                        Reason For Absence:
                      </span>
                      "{lv.reason}"
                    </div>

                    {/* Bottom: Captain Review Certificate Box or Pending Status */}
                    {lv.reviewedBy || lv.status === 'Approved' || lv.status === 'Rejected' || lv.captainsNote || lv.reviewNote ? (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/80 flex items-start gap-2.5 sm:gap-3 text-xs text-emerald-950">
                        <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="font-black text-emerald-950 truncate">
                              Reviewed & Certified by {
                                typeof lv.reviewedBy === 'object' && lv.reviewedBy?.name
                                  ? `${lv.reviewedBy.name} (${lv.reviewedBy.role || 'captain'})`
                                  : typeof lv.reviewedBy === 'string'
                                  ? lv.reviewedBy
                                  : 'Section Captain'
                              }
                            </span>
                            {lv.reviewedAt && (
                              <span className="text-[10px] font-mono text-emerald-700 font-bold shrink-0">
                                {new Date(lv.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 font-medium break-words">
                            <strong className="text-emerald-900">Captain's Note:</strong>{' '}
                            "{lv.reviewNote || lv.captainsNote || (lv as any).reviewerNote || 'Approved and certified for official attendance excuse.'}"
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-950">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span className="truncate">
                            Awaiting review by Section Captains
                            {designatedReviewers.length > 0 && ` (${designatedReviewers.map(c => c.fullName).join(', ')})`}.
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(lv)}
                            className="min-h-[32px] px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                            title="Edit this application before approval/disapproval"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            <span>Edit Application</span>
                          </button>
                          <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-amber-800 bg-white px-2 py-1 rounded-md border border-amber-200 w-max shrink-0">
                            In Queue
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Metadata Footer */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] font-bold text-emerald-800/60 pt-1 border-t border-emerald-50">
                      <span>Application ID: <strong className="font-mono text-emerald-900">{lv.id.slice(0, 8)}...</strong></span>
                      <span>Filed: {new Date(lv.submittedAt).toLocaleString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <StudentEmptyState
              icon={FileText}
              title={leaves.length === 0 ? "No Leave Applications Filed" : "No Leaves Match Search or Filters"}
              description={
                leaves.length === 0
                  ? "You haven't submitted any leave requests yet. You can apply for leave of absence for any upcoming single date within the next 7 days."
                  : "Try resetting your search query or status filter to view all leave records."
              }
              actionLabel={leaves.length === 0 ? "Open Leave Studio" : "Reset Filter to All"}
              onAction={() => {
                if (leaves.length === 0) {
                  setActiveTab('apply');
                } else {
                  setStatusFilter('All');
                  setSearchQuery('');
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
