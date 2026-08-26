import React, { useState } from 'react';
import { 
  Clock, 
  Search, 
  Filter, 
  Check, 
  X, 
  Eye, 
  RefreshCw, 
  CheckCircle2,
  UserCheck,
  Mail,
  Phone,
  GraduationCap,
  BookOpen,
  Layers
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
  const [searchTerm, setSearchTerm] = useState('');
  const [batchFilter, setBatchFilter] = useState<string>('All');
  const [sectionFilter, setSectionFilter] = useState<string>('All');
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filter ONLY pending students
  const pendingStudentsList = (students || []).filter((st) => {
    if (!st || st.approval !== 'pending') return false;

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

  const handleApproval = async (id: string, approval: ApprovalStatus) => {
    setUpdatingId(id);
    setActionNotice(null);
    try {
      const result = await onUpdateApproval(id, approval);
      if (result.success) {
        setActionNotice({
          type: 'success',
          message: result.message || `Student approval status set to '${approval}'.`,
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
      <div className="p-3 sm:p-4 bg-gradient-to-r from-amber-600 via-amber-600 to-amber-700 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="p-1.5 rounded-xl bg-white/20 backdrop-blur-md">
              <Clock className="w-4 h-4 text-amber-100" />
            </span>
            <h2 className="text-sm sm:text-base font-black tracking-tight">Pending Registrations Queue</h2>
          </div>
          <p className="text-[10px] sm:text-[11px] text-amber-100/90 font-medium max-w-xl">
            Review and authorize student registration requests. Approved students gain immediate access to section features.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <div className="px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-md border border-amber-300/30 text-center flex items-center gap-2">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-200 block">Queue</span>
            <span className="text-xs sm:text-sm font-black text-white">{pendingStudentsList.length} Pending</span>
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
      <div className="p-3 sm:p-4 bg-amber-50/40 backdrop-blur-md rounded-2xl border border-amber-200/80 shadow-2xs space-y-2.5 sm:space-y-3">
        {/* Search & Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-amber-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, roll, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-8.5 pl-8 pr-3 bg-white border border-amber-200 rounded-xl text-[11px] font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
            />
          </div>

          {/* Batch Filter */}
          <div>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full h-8.5 px-2.5 bg-white border border-amber-200 rounded-xl text-[11px] font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
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
              className="w-full h-8.5 px-2.5 bg-white border border-amber-200 rounded-xl text-[11px] font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs cursor-pointer"
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
          <div className="py-8 text-center text-[11px] font-bold text-amber-700 animate-pulse flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
            <span>Scanning student registration database...</span>
          </div>
        ) : pendingStudentsList.length > 0 ? (
          <div className="space-y-2">
            {pendingStudentsList.map((st, index) => (
              <div
                key={st.id ? `pending-${st.id}-${index}` : `pending-idx-${index}`}
                className="p-2.5 sm:p-3 bg-white rounded-xl border border-amber-200/90 hover:border-amber-300 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group"
              >
                {/* Left Info: Identity & Academic Placement */}
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-[11px] shadow-2xs shrink-0">
                    {st.rollNumber || (st.fullName ? st.fullName.charAt(0) : 'P')}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                      <span className="font-black text-slate-900 text-xs sm:text-[13px] group-hover:text-amber-800 transition-colors truncate">
                        {st.fullName}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-0.5 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-amber-600" />
                        <span>Pending</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
                      <span className="inline-flex items-center gap-1 text-slate-600 truncate max-w-[160px] sm:max-w-[200px]">
                        <Mail className="w-3 h-3 text-amber-600/70 shrink-0" />
                        <span className="truncate">{st.email}</span>
                      </span>
                      {st.phoneNumber && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <Phone className="w-3 h-3 text-amber-600/70 shrink-0" />
                          <span>{st.phoneNumber}</span>
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-slate-800 font-bold">
                        <GraduationCap className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>Batch {st.batch}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-900 font-bold">
                        <BookOpen className="w-3 h-3 text-amber-600 shrink-0" />
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
                <div className="flex items-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-100 justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedUserForProfile(st)}
                    className="h-7.5 sm:h-8 px-2 sm:px-2.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-extrabold text-[10px] sm:text-[11px] uppercase tracking-wider inline-flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                    title="Inspect Registration Dossier"
                  >
                    <Eye className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Dossier</span>
                  </button>

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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 sm:p-8 bg-white rounded-2xl border border-amber-200 text-center space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <h4 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">Queue Completely Empty</h4>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium max-w-sm mx-auto">
              There are currently no pending student registration requests matching your filter criteria. All applicants have been processed.
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
