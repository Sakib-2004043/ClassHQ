import React, { useState, useMemo } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock,
  UserCheck,
  UserX,
  MessageSquare,
  ShieldCheck,
  Layers,
  Search,
  ArrowUpDown,
  X,
  Calendar,
  RotateCcw
} from 'lucide-react';
import { LeaveRequest, LeaveStatus } from '../../../types';
import { api } from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { CaptainEmptyState } from './CaptainEmptyState';

interface CaptainLeavesViewProps {
  assignedBatch: string;
  assignedSection: string;
  leaves: LeaveRequest[];
  loading: boolean;
  onRefresh: () => void;
}

type SortOption = 
  | 'submitted-desc' 
  | 'submitted-asc' 
  | 'roll-asc' 
  | 'roll-desc' 
  | 'name-asc' 
  | 'name-desc' 
  | 'start-desc' 
  | 'start-asc' 
  | 'days-desc' 
  | 'days-asc';

const getCategoryBadgeStyle = (leaveType?: string) => {
  const cat = String(leaveType || '').toLowerCase().trim();
  if (cat.includes('med') || cat.includes('health') || cat.includes('sick')) return 'bg-rose-100 text-rose-800 border-rose-200';
  if (cat.includes('emerg') || cat.includes('urg')) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (cat.includes('acad') || cat.includes('exam') || cat.includes('olymp')) return 'bg-sky-100 text-sky-800 border-sky-200';
  if (cat.includes('casu') || cat.includes('person') || cat.includes('travel')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (cat.includes('fam') || cat.includes('wed') || cat.includes('event')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
  return 'bg-violet-100 text-violet-800 border-violet-200';
};

export const CaptainLeavesView: React.FC<CaptainLeavesViewProps> = ({
  assignedBatch,
  assignedSection,
  leaves = [],
  loading,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'All' | LeaveStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('submitted-desc');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Filter out the logged-in captain's own leave applications from section review list
  const sectionLeavesList = useMemo(() => {
    return (leaves || []).filter((lv) => {
      if (user) {
        const isOwn =
          (user.userId && lv.studentId === user.userId) ||
          (user.id && lv.studentId === user.id) ||
          (user.email && lv.studentEmail && lv.studentEmail.toLowerCase() === user.email.toLowerCase()) ||
          (user.rollNumber && lv.studentRoll && lv.studentRoll.toString() === user.rollNumber.toString());
        if (isOwn) return false;
      }
      return true;
    });
  }, [leaves, user]);

  const filteredLeaves = useMemo(() => {
    return sectionLeavesList
      .filter((lv) => {
        // Status filter
        if (filter !== 'All' && lv.status !== filter) return false;

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchRoll = (lv.studentRoll || '').toLowerCase().includes(q);
          const matchName = (lv.studentName || '').toLowerCase().includes(q);
          const matchEmail = (lv.studentEmail || '').toLowerCase().includes(q);
          const matchReason = (lv.reason || '').toLowerCase().includes(q);
          const matchType = (lv.leaveType || '').toLowerCase().includes(q);
          const matchDates = (lv.startDate || '').includes(q) || (lv.endDate || '').includes(q);
          const matchReviewer =
            (lv.reviewedBy?.name || '').toLowerCase().includes(q) ||
            (lv.captainsNote || lv.reviewNote || (lv as any).reviewerNote || '').toLowerCase().includes(q);
          if (!matchRoll && !matchName && !matchEmail && !matchReason && !matchType && !matchDates && !matchReviewer) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'submitted-desc':
            return new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime();
          case 'submitted-asc':
            return new Date(a.submittedAt || 0).getTime() - new Date(b.submittedAt || 0).getTime();
          case 'roll-asc':
            return (a.studentRoll || '').localeCompare(b.studentRoll || '', undefined, { numeric: true });
          case 'roll-desc':
            return (b.studentRoll || '').localeCompare(a.studentRoll || '', undefined, { numeric: true });
          case 'name-asc':
            return (a.studentName || '').localeCompare(b.studentName || '');
          case 'name-desc':
            return (b.studentName || '').localeCompare(a.studentName || '');
          case 'start-desc':
            return (b.startDate || '').localeCompare(a.startDate || '');
          case 'start-asc':
            return (a.startDate || '').localeCompare(b.startDate || '');
          case 'days-desc':
            return (b.daysCount || 0) - (a.daysCount || 0);
          case 'days-asc':
            return (a.daysCount || 0) - (b.daysCount || 0);
          default:
            return 0;
        }
      });
  }, [leaves, filter, searchQuery, sortBy]);

  const handleReviewLeave = async (id: string, status: LeaveStatus) => {
    setSubmittingId(id);
    setNotice(null);
    try {
      const res = await api.reviewLeaveRequest(id, status, reviewNote || undefined);
      if (res.success) {
        setNotice(`Leave application for student successfully marked as ${status}.`);
        setReviewingId(null);
        setReviewNote('');
        onRefresh();
        setTimeout(() => setNotice(null), 4000);
      }
    } catch (err: any) {
      setNotice(err.message || 'Failed to review leave application.');
    } finally {
      setSubmittingId(null);
    }
  };

  const getLeaveStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-0.5">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-0.5">
            <Clock className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
            Pending Review
          </span>
        );
      case 'Rejected':
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-0.5">
            <XCircle className="w-2.5 h-2.5 text-rose-600" />
            Declined
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-sky-100 text-sky-800 border border-sky-200">
            {status}
          </span>
        );
    }
  };

  const isFiltered = filter !== 'All' || searchQuery.trim() !== '' || sortBy !== 'submitted-desc';

  const handleResetFilters = () => {
    setFilter('All');
    setSearchQuery('');
    setSortBy('submitted-desc');
  };

  return (
    <div className="space-y-2.5 sm:space-y-4">
      {/* Header and Filter - Light Sky Blue Theme */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-sky-200/80 shadow-xs">
        <div>
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">Section Leave Applications</h2>
          <p className="text-[10px] font-medium text-slate-500 mt-0.5">
            Review absence excuses filed by students in Section {assignedSection} ({assignedBatch}).
          </p>
        </div>

        {/* Filter buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1 p-1 sm:p-0.5 bg-sky-50/90 rounded-xl border border-sky-200/90 w-full sm:w-auto shrink-0 shadow-2xs">
          {[
            { key: 'All' as const, label: 'All', icon: Layers },
            { key: 'Pending' as const, label: 'Pending', icon: Clock },
            { key: 'Approved' as const, label: 'Approved', icon: CheckCircle2 },
            { key: 'Rejected' as const, label: 'Rejected', icon: XCircle },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`flex items-center justify-center gap-1 px-2 py-1 sm:py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                filter === key
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/70'
              }`}
            >
              <Icon className={`w-3 h-3 shrink-0 ${filter === key ? 'text-white' : 'text-slate-400'}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search and Sort Controls Bar */}
      <div className="p-2.5 sm:p-3.5 bg-white/90 backdrop-blur-md rounded-2xl border border-sky-200/80 shadow-xs space-y-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-sky-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by student name, roll, reason, leave type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-sky-50/50 border border-sky-200 text-[11px] font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-sky-500 focus:bg-white transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-sky-100 transition-all cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="relative flex-1 sm:flex-none">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-50/50 border border-sky-200 shadow-2xs">
                <ArrowUpDown className="w-3 h-3 text-sky-600 shrink-0" />
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="bg-transparent text-[11px] font-bold text-slate-800 focus:outline-hidden cursor-pointer pr-1"
                >
                  <option value="submitted-desc">Newest Submitted</option>
                  <option value="submitted-asc">Oldest Submitted</option>
                  <option value="roll-asc">Roll Number (Low → High)</option>
                  <option value="roll-desc">Roll Number (High → Low)</option>
                  <option value="name-asc">Student Name (A → Z)</option>
                  <option value="name-desc">Student Name (Z → A)</option>
                  <option value="start-desc">Leave Date (Latest First)</option>
                  <option value="start-asc">Leave Date (Earliest First)</option>
                  <option value="days-desc">Duration (Longest First)</option>
                  <option value="days-asc">Duration (Shortest First)</option>
                </select>
              </div>
            </div>

            {isFiltered && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 hover:border-rose-200 text-[10px] font-bold transition-all shadow-2xs shrink-0 cursor-pointer"
                title="Reset search, sort & filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Results summary chip */}
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-1 border-t border-sky-100/60">
          <span>
            Showing <strong className="text-sky-700 font-extrabold">{filteredLeaves.length}</strong> of {sectionLeavesList.length} applications
            {filter !== 'All' && <span className="text-slate-400"> ({filter})</span>}
            {searchQuery && <span className="text-slate-400"> ("{searchQuery}")</span>}
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main List */}
      <div className="p-2.5 sm:p-4 bg-white/90 backdrop-blur-md rounded-2xl border border-sky-200/80 shadow-xs space-y-2.5">
        {loading ? (
          <div className="py-10 text-center text-[11px] font-bold text-sky-600 animate-pulse">
            Loading section leave notices...
          </div>
        ) : filteredLeaves.length > 0 ? (
          <div className="space-y-2.5">
            {filteredLeaves.map((lv) => (
              <div
                key={lv.id}
                className="p-3 rounded-xl bg-sky-50/40 border border-sky-200/80 space-y-2 hover:border-sky-300 transition-all shadow-2xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-sky-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs shrink-0">
                      {lv.studentRoll}
                    </div>
                    <div>
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 block">{lv.studentName}</span>
                        {lv.studentRole === 'captain' && (
                          <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider bg-amber-500 text-white inline-flex items-center gap-0.5 shadow-2xs">
                            <ShieldCheck className="w-2.5 h-2.5" />
                            Co-Captain
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{lv.studentEmail}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${getCategoryBadgeStyle(lv.leaveType || lv.leaveReason)}`}>
                      {lv.leaveType || lv.leaveReason || 'Casual'}
                    </span>
                    {getLeaveStatusBadge(lv.status)}
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white border border-sky-200/80 text-[11px] text-slate-800 font-medium">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-700 block mb-0.5">
                    Student Reason:
                  </span>
                  "{lv.reason}"
                </div>

                {(lv.reviewedBy || lv.captainsNote || lv.reviewNote || (lv as any).reviewerNote || lv.status === 'Approved' || lv.status === 'Rejected') && (
                  <div className="p-2 rounded-lg bg-sky-50/90 border border-sky-200 text-[10px] text-sky-900 space-y-0.5">
                    <div className="flex items-center justify-between gap-1.5 flex-wrap">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-sky-800">
                        Reviewed by: <strong className="text-slate-900">{
                          typeof lv.reviewedBy === 'object' && lv.reviewedBy?.name
                            ? `${lv.reviewedBy.name} (${lv.reviewedBy.role || 'captain'})`
                            : typeof lv.reviewedBy === 'string'
                            ? lv.reviewedBy
                            : 'Section Captain'
                        }</strong>
                      </span>
                      {lv.reviewedAt && (
                        <span className="text-[9px] font-mono text-slate-500 font-semibold">
                          {new Date(lv.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-slate-800 italic text-[10px]">
                      <strong className="text-sky-900 not-italic">Note:</strong> "{lv.captainsNote || lv.reviewNote || (lv as any).reviewerNote || 'Approved and certified.'}"
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 pt-0.5 border-t border-sky-100">
                  <span>
                    Leave Date: <strong className="text-slate-900">{lv.startDate || lv.endDate}</strong>
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400">
                    Submitted: {new Date(lv.submittedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Captain Action Controls */}
                <div className="pt-1 flex items-center justify-end gap-1.5">
                  {reviewingId === lv.id ? (
                    <div className="w-full space-y-1.5 bg-sky-50 p-2 rounded-lg border border-sky-200">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700">
                        <MessageSquare className="w-3 h-3 text-sky-600" />
                        <span>Add Captain Review Comment (Optional):</span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. Verified with parent / Excused for medical grounds..."
                        value={reviewNote}
                        onChange={(e) => setReviewNote(e.target.value)}
                        className="w-full p-1.5 bg-white border border-sky-200 text-[11px] rounded-md focus:outline-hidden focus:border-sky-500 text-slate-800"
                      />
                      <div className="flex items-center justify-end gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingId(null);
                            setReviewNote('');
                          }}
                          className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={submittingId === lv.id}
                          onClick={() => handleReviewLeave(lv.id, 'Approved')}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={submittingId === lv.id}
                          onClick={() => handleReviewLeave(lv.id, 'Rejected')}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <UserX className="w-3 h-3" />
                          Decline
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {lv.status === 'Pending' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingId(lv.id);
                            setReviewNote('');
                          }}
                          className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Review Leave</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setReviewingId(lv.id);
                            setReviewNote(lv.captainsNote || lv.reviewNote || (lv as any).reviewerNote || '');
                          }}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
                        >
                          Modify Status
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CaptainEmptyState
            icon={FileText}
            title={sectionLeavesList.length === 0 ? "No Student Leave Notices Submitted" : "No Leaves Match Search or Filter"}
            description={
              sectionLeavesList.length === 0
                ? `No students in Section ${assignedSection} have filed leave applications yet.`
                : "Try resetting your search query or status filter to view all leave applications."
            }
            actionLabel={sectionLeavesList.length > 0 ? "Reset Search & Filters" : undefined}
            onAction={handleResetFilters}
          />
        )}
      </div>
    </div>
  );
};
