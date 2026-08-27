import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Check, 
  X, 
  Eye, 
  RefreshCw, 
  CheckCircle2,
  XCircle,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { User, ApprovalStatus, AdminOverviewStats } from '../../../types';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminUserProfileModal } from './AdminUserProfileModal';

interface AdminPendingStudentsViewProps {
  students: User[];
  stats?: AdminOverviewStats | null;
  onUpdateApproval: (id: string, approval: ApprovalStatus) => Promise<{ success: boolean; message?: string }>;
  onUpdateRole: (id: string, role: 'student' | 'captain', assignedBatch?: string, assignedSection?: string) => Promise<{ success: boolean; message?: string }>;
  onRefresh: () => void;
  loading: boolean;
}

export const AdminPendingStudentsView: React.FC<AdminPendingStudentsViewProps> = ({
  students,
  onUpdateApproval,
  onUpdateRole,
  onRefresh,
  loading,
}) => {
  const [activeQueueTab, setActiveQueueTab] = useState<'pending' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('All');
  const [sectionFilter, setSectionFilter] = useState<string>('All');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter students based on active queue tab (pending or rejected)
  const allFilteredStudents = (students || []).filter((st) => {
    if (!st) return false;

    const term = (searchTerm || '').trim().toLowerCase();
    const matchSearch =
      !term ||
      (st.fullName ? st.fullName.toLowerCase().includes(term) : false) ||
      (st.rollNumber ? st.rollNumber.toLowerCase().includes(term) : false) ||
      (st.email ? st.email.toLowerCase().includes(term) : false) ||
      (st.phoneNumber ? st.phoneNumber.toLowerCase().includes(term) : false);

    const matchBatch =
      batchFilter === 'All'
        ? true
        : st.batch === batchFilter ||
          String(st.batch || '').replace(/\D+/g, '') === String(batchFilter || '').replace(/\D+/g, '');
    const matchSection =
      sectionFilter === 'All'
        ? true
        : String(st.section || '').trim().toUpperCase() === String(sectionFilter || '').trim().toUpperCase();

    return matchSearch && matchBatch && matchSection;
  });

  const pendingStudentsList = allFilteredStudents.filter((st) => st.approval === 'pending');
  const rejectedStudentsList = allFilteredStudents.filter((st) => st.approval === 'rejected');

  const displayedList = activeQueueTab === 'pending' ? pendingStudentsList : rejectedStudentsList;

  const handleApproval = async (id: string, approval: ApprovalStatus) => {
    setUpdatingId(id);
    setActionNotice(null);
    try {
      const result = await onUpdateApproval(id, approval);
      if (result.success) {
        setActionNotice({
          type: 'success',
          message: result.message || (approval === 'approved' ? 'Student registration approved successfully!' : 'Registration request set to rejected.'),
        });
        onRefresh();
      } else {
        setActionNotice({
          type: 'error',
          message: result.message || 'Failed to update approval status.',
        });
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: err.message || 'An error occurred while processing approval.',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-2.5 sm:space-y-3.5">
      {/* Header Banner */}
      <div className={`p-3 sm:p-4 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 transition-all ${
        activeQueueTab === 'pending'
          ? 'bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700'
          : 'bg-gradient-to-r from-rose-700 via-red-600 to-rose-700'
      }`}>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md">
              {activeQueueTab === 'pending' ? (
                <Clock className="w-4 h-4 text-amber-100" />
              ) : (
                <XCircle className="w-4 h-4 text-rose-100" />
              )}
            </span>
            <h2 className="text-sm sm:text-base font-black tracking-tight">
              {activeQueueTab === 'pending' ? 'Pending Registrations Queue' : 'Rejected Registrations Archive'}
            </h2>
          </div>
          <p className="text-[10px] sm:text-[11px] text-white/90 font-medium max-w-xl">
            {activeQueueTab === 'pending'
              ? 'Review and authorize pending student registration requests. Approved students gain immediate access.'
              : 'Review previously rejected student registration requests. You can re-approve any rejected request at any time.'}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <div className="px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 text-center flex items-center gap-2">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/80 block">Count</span>
            <span className="text-xs sm:text-sm font-black text-white">
              {activeQueueTab === 'pending' ? `${pendingStudentsList.length} Pending` : `${rejectedStudentsList.length} Rejected`}
            </span>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Refresh Registration Queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div
          className={`p-2.5 rounded-xl text-[11px] font-bold border shadow-2xs animate-in fade-in flex items-center gap-1.5 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          )}
          <span>{actionNotice.message}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="p-3 sm:p-4 bg-slate-50/70 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5 sm:space-y-3">
        {/* Queue Switcher Tabs & Search Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-2.5">
          {/* Queue Selector Buttons */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveQueueTab('pending')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeQueueTab === 'pending'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-300/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending Requests</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                activeQueueTab === 'pending' ? 'bg-amber-800 text-amber-100' : 'bg-slate-300 text-slate-800'
              }`}>
                {pendingStudentsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveQueueTab('rejected')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeQueueTab === 'rejected'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-300/60'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Rejected Requests</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                activeQueueTab === 'rejected' ? 'bg-rose-800 text-rose-100' : 'bg-slate-300 text-slate-800'
              }`}>
                {rejectedStudentsList.length}
              </span>
            </button>
          </div>

          <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider self-end sm:self-center">
            Showing {activeQueueTab === 'pending' ? 'Pending' : 'Rejected'} Applicants
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, roll, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8.5 pl-8 pr-3 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-rose-500 shadow-2xs"
            />
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full h-8.5 px-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 focus:outline-none focus:border-rose-500 shadow-2xs cursor-pointer"
            >
              <option value="All">All Batches</option>
              <option value="HSC 2024">HSC 2024</option>
              <option value="HSC 2025">HSC 2025</option>
              <option value="HSC 2026">HSC 2026</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value)}
              className="w-full h-8.5 px-2.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 focus:outline-none focus:border-rose-500 shadow-2xs cursor-pointer"
            >
              <option value="All">All Sections (A, B, C, D)</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
              <option value="D">Section D</option>
            </select>
          </div>
        </div>

        {/* Directory Cards */}
        {loading ? (
          <div className="py-8 text-center text-[11px] font-bold text-slate-600 animate-pulse flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
            <span>Scanning registration database...</span>
          </div>
        ) : displayedList.length > 0 ? (
          <div className="space-y-2">
            {displayedList.map((st, index) => (
              <div
                key={st.id ? `${activeQueueTab}-${st.id}-${index}` : `queue-idx-${index}`}
                className="p-2.5 sm:p-3 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
              >
                {/* Left Info: Identity & Academic Placement */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-white flex items-center justify-center font-black text-[11px] shadow-2xs shrink-0 ${
                    activeQueueTab === 'pending' ? 'bg-amber-500' : 'bg-rose-600'
                  }`}>
                    {st.rollNumber || (st.fullName ? st.fullName.charAt(0) : 'U')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="font-black text-slate-900 text-xs sm:text-[13px] group-hover:text-rose-800 transition-colors truncate">
                        {st.fullName}
                      </span>
                      {st.approval === 'pending' ? (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-0.5 shrink-0">
                          <Clock className="w-2.5 h-2.5 text-amber-600" />
                          <span>Pending</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-900 border border-rose-300 inline-flex items-center gap-0.5 shrink-0">
                          <XCircle className="w-2.5 h-2.5 text-rose-600" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                      <span className="inline-flex items-center gap-1 text-slate-600 truncate max-w-[160px] sm:max-w-[200px]">
                        <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{st.email}</span>
                      </span>
                      {st.phoneNumber && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{st.phoneNumber}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-slate-800 font-bold">
                        <GraduationCap className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>Batch {st.batch}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-900 font-bold">
                        <BookOpen className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>Sec {st.section}</span>
                      </span>
                      {st.group && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Layers className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{st.group}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForProfile(st)}
                    className="h-7.5 sm:h-8 px-2 sm:px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                    title="Inspect Registration Dossier"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                    <span>Dossier</span>
                  </button>

                  {st.approval === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleApproval(st.id, 'approved')}
                        disabled={updatingId === st.id}
                        className="h-7.5 sm:h-8 px-2.5 sm:px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-2xs inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        title="Approve Registration"
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Approve</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproval(st.id, 'rejected')}
                        disabled={updatingId === st.id}
                        className="h-7.5 sm:h-8 px-2 sm:px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-2xs inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                        title="Reject Registration"
                      >
                        <X className="w-3.5 h-3.5 shrink-0" />
                        <span>Reject</span>
                      </button>
                    </>
                  ) : (
                    /* REJECTED STUDENT: Admin can approve again! */
                    <button
                      type="button"
                      onClick={() => handleApproval(st.id, 'approved')}
                      disabled={updatingId === st.id}
                      className="h-7.5 sm:h-8 px-2.5 sm:px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider rounded-lg transition-all shadow-md shadow-emerald-600/20 inline-flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      title="Re-Approve Rejected Student"
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>Approve Again</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto shadow-2xs ${
              activeQueueTab === 'pending' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
              {activeQueueTab === 'pending' ? 'Pending Queue Empty' : 'No Rejected Requests'}
            </h4>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium max-w-sm mx-auto">
              {activeQueueTab === 'pending'
                ? 'There are currently no pending student registration requests matching your filter criteria.'
                : 'There are currently no rejected student registration requests matching your filter criteria.'}
            </p>
          </div>
        )}
      </div>

      {/* Profile Details Modal */}
      {selectedUserForProfile && (
        <AdminUserProfileModal
          user={selectedUserForProfile}
          onClose={() => setSelectedUserForProfile(null)}
          onUpdateApproval={onUpdateApproval}
          onUpdateRole={onUpdateRole}
          onUserModified={onRefresh}
        />
      )}
    </div>
  );
};
