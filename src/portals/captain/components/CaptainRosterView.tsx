import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, 
  Search, 
  Phone, 
  Mail, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  UserCheck, 
  UserX,
  ExternalLink,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Layers,
  Check,
  User as UserIcon,
  BookOpen,
  Filter,
  RefreshCw
} from 'lucide-react';
import { User, ApprovalStatus } from '../../../types';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';
import { CaptainEmptyState } from './CaptainEmptyState';

interface CaptainRosterViewProps {
  assignedBatch: string;
  assignedSection: string;
  onSelectStudentForModal: (student: User) => void;
}

export const CaptainRosterView: React.FC<CaptainRosterViewProps> = ({
  assignedBatch,
  assignedSection,
  onSelectStudentForModal,
}) => {
  const { user } = useAuth();
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'approved' | 'pending' | 'rejected'>('ALL');
  const [groupFilter, setGroupFilter] = useState<string>('ALL');
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSectionStudents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.getCaptainStudents({
        approval: statusFilter,
        search: searchTerm,
      }).catch(async () => {
        return await api.getAdminStudents({
          batch: assignedBatch,
          section: assignedSection,
          approval: statusFilter,
          search: searchTerm,
        });
      });
      if (res?.students) {
        setStudents(res.students);
      }
    } catch (err: any) {
      console.error('Error fetching section students:', err);
    } finally {
      setLoading(false);
    }
  }, [assignedBatch, assignedSection, statusFilter, searchTerm]);

  useEffect(() => {
    fetchSectionStudents();
  }, [fetchSectionStudents]);

  const handleApprovalAction = async (studentId: string, approval: ApprovalStatus) => {
    setUpdatingId(studentId);
    setActionNotice(null);
    try {
      const res = await api.updateStudentApproval(studentId, approval);
      if (res.success) {
        setActionNotice({
          type: 'success',
          text: res.message || `Student approval status set to '${approval}'.`
        });
        await fetchSectionStudents();
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        text: err.message || 'Failed to update student approval.'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  // Compute stat counts
  const stats = useMemo(() => {
    const total = students.length;
    const approved = students.filter((s) => s.approval === 'approved').length;
    const pending = students.filter((s) => s.approval === 'pending').length;
    const rejected = students.filter((s) => s.approval === 'rejected').length;
    return { total, approved, pending, rejected };
  }, [students]);

  // Available groups
  const availableGroups = useMemo(() => {
    const set = new Set<string>();
    students.forEach((s) => {
      if (s.group) set.add(s.group.toUpperCase());
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered students by search, status, and group
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      if (groupFilter !== 'ALL' && s.group?.toUpperCase() !== groupFilter) {
        return false;
      }
      return true;
    });
  }, [students, groupFilter]);

  const getApprovalBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-300 inline-flex items-center gap-1 shadow-2xs">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1 shadow-2xs">
            <Clock className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
            Pending Approval
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded-md bg-rose-50 text-rose-700 border border-rose-300 inline-flex items-center gap-1 shadow-2xs">
            <XCircle className="w-2.5 h-2.5 text-rose-600" />
            Declined
          </span>
        );
      default:
        return null;
    }
  };

  const getGroupBadgeColor = (group?: string) => {
    const g = (group || '').toUpperCase();
    if (g.includes('SCI')) {
      return 'bg-blue-100/80 text-blue-800 border-blue-200';
    }
    if (g.includes('COMM') || g.includes('BUS')) {
      return 'bg-cyan-100/80 text-cyan-800 border-cyan-200';
    }
    if (g.includes('HUM') || g.includes('ART')) {
      return 'bg-indigo-100/80 text-indigo-800 border-indigo-200';
    }
    return 'bg-sky-100/80 text-sky-800 border-sky-200';
  };

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* 1. Header Hero Card - Light Aesthetic Blue with Element-Wise Background Cards */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-sky-50 via-blue-50/70 to-indigo-50/50 border-2 border-sky-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-600 to-blue-700 text-white flex items-center justify-center shadow-2xs ring-2 ring-sky-200 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                  Section Student Directory & Approvals
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-sky-200/90 border border-sky-300 text-sky-900 text-[10px] font-black uppercase tracking-wider shadow-2xs">
                  Sec {assignedSection} • {assignedBatch}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 font-medium leading-tight mt-0.5">
                Official student directory, contact details, and account onboarding controls.
              </p>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <button
            type="button"
            onClick={() => fetchSectionStudents()}
            className="self-end sm:self-auto px-2.5 py-1 rounded-xl bg-white/90 hover:bg-sky-100 border border-sky-200 text-sky-700 text-[10px] font-extrabold uppercase tracking-wider transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Element-wise Clickable Interactive Stats Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
          {/* Total Students (ALL) */}
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
              statusFilter === 'ALL'
                ? 'bg-sky-200/90 border-sky-500 shadow-xs ring-2 ring-sky-400/40'
                : 'bg-sky-100/70 hover:bg-sky-200/60 border-sky-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-sky-700 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-sky-900">Total</span>
            </div>
            <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded-md border ${
              statusFilter === 'ALL'
                ? 'bg-sky-700 text-white border-sky-800 shadow-2xs'
                : 'bg-white/80 text-sky-950 border-sky-200'
            }`}>
              {stats.total}
            </span>
          </button>

          {/* Approved */}
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
              statusFilter === 'approved'
                ? 'bg-emerald-100 border-emerald-500 shadow-xs ring-2 ring-emerald-400/40'
                : 'bg-emerald-50/80 hover:bg-emerald-100/70 border-emerald-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-900">Approved</span>
            </div>
            <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded-md border ${
              statusFilter === 'approved'
                ? 'bg-emerald-700 text-white border-emerald-800 shadow-2xs'
                : 'bg-white/80 text-emerald-950 border-emerald-200'
            }`}>
              {stats.approved}
            </span>
          </button>

          {/* Pending */}
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
              statusFilter === 'pending'
                ? 'bg-amber-100 border-amber-500 shadow-xs ring-2 ring-amber-400/40'
                : 'bg-amber-50/80 hover:bg-amber-100/70 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">Pending</span>
            </div>
            <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded-md border ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                : 'bg-white/80 text-amber-950 border-amber-200'
            }`}>
              {stats.pending}
            </span>
          </button>

          {/* Rejected / Declined */}
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`p-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer text-left ${
              statusFilter === 'rejected'
                ? 'bg-rose-100 border-rose-500 shadow-xs ring-2 ring-rose-400/40'
                : 'bg-rose-50/80 hover:bg-rose-100/70 border-rose-200'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-700 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-wider text-rose-900">Declined</span>
            </div>
            <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded-md border ${
              statusFilter === 'rejected'
                ? 'bg-rose-700 text-white border-rose-800 shadow-2xs'
                : 'bg-white/80 text-rose-950 border-rose-200'
            }`}>
              {stats.rejected}
            </span>
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionNotice && (
        <div
          className={`p-2.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 shadow-2xs animate-in fade-in ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {actionNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{actionNotice.text}</span>
        </div>
      )}

      {/* 2. Controls Toolbar: Search & Group Filters */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-sky-200 shadow-2xs space-y-2">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-sky-600">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              placeholder="Search by student name, roll number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-[11px] font-medium bg-sky-50/50 border border-sky-200 text-slate-800 placeholder:text-slate-400 rounded-xl focus:outline-hidden focus:border-sky-500 focus:bg-white transition-all shadow-inner"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Group Filter Tags if groups exist */}
        {availableGroups.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-sky-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-800 flex items-center gap-1">
              <Filter className="w-2.5 h-2.5" /> Group:
            </span>
            <button
              type="button"
              onClick={() => setGroupFilter('ALL')}
              className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                groupFilter === 'ALL'
                  ? 'bg-sky-700 text-white border-sky-700 shadow-2xs'
                  : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
              }`}
            >
              All Groups
            </button>
            {availableGroups.map((grp) => (
              <button
                key={grp}
                type="button"
                onClick={() => setGroupFilter(grp)}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border transition-all cursor-pointer ${
                  groupFilter === grp
                    ? 'bg-sky-700 text-white border-sky-700 shadow-2xs'
                    : 'bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100'
                }`}
              >
                {grp}
              </button>
            ))}
            <span className="ml-auto text-[10px] font-bold text-slate-500">
              Showing <strong className="text-sky-950 font-black">{filteredStudents.length}</strong> of {stats.total}
            </span>
          </div>
        )}
      </div>

      {/* 3. Students Directory Grid - Compact Cards with Element-Wise Coloring */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-white/95 backdrop-blur-md border border-sky-200 shadow-2xs">
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-sky-700 flex flex-col items-center justify-center gap-2 animate-pulse">
            <RefreshCw className="w-5 h-5 text-sky-600 animate-spin" />
            <span>Loading section student records...</span>
          </div>
        ) : filteredStudents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredStudents.map((st) => {
              const isSelf = user && (st.id === user.userId || st.email === user.email || (st.rollNumber && st.rollNumber === user.rollNumber));
              return (
                <div
                  key={st.id}
                  className={`p-2.5 sm:p-3 rounded-xl border space-y-2 transition-all shadow-2xs hover:shadow-xs relative ${
                    isSelf
                      ? 'bg-gradient-to-br from-sky-100/90 via-blue-50/80 to-sky-50 border-sky-400 ring-1 ring-sky-400/40'
                      : st.approval === 'pending'
                      ? 'bg-gradient-to-br from-amber-50/60 via-amber-50/30 to-sky-50/40 border-amber-200/90 hover:border-amber-300'
                      : 'bg-gradient-to-br from-sky-50/60 via-white to-blue-50/30 border-sky-200 hover:border-sky-300'
                  }`}
                >
                  {/* Top Row: Roll Number + Name + Badges */}
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Element-wise Glowing Roll Badge */}
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-600 to-blue-700 text-white font-mono font-black text-xs flex items-center justify-center shadow-xs ring-2 ring-sky-200 shrink-0">
                        {st.rollNumber}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1 flex-wrap">
                          <h3 className="text-xs sm:text-[13px] font-black text-slate-900 leading-tight truncate">
                            {st.fullName}
                          </h3>
                          {isSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-sky-600 text-white shadow-2xs">
                              You
                            </span>
                          )}
                          {st.role === 'captain' && !isSelf && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-amber-500 text-white inline-flex items-center gap-0.5 shadow-2xs">
                              <ShieldCheck className="w-2.5 h-2.5" />
                              Co-Captain
                            </span>
                          )}
                        </div>

                        {/* Group Pill with Element Background */}
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider border ${getGroupBadgeColor(st.group)}`}>
                            {st.group || 'GENERAL'} Group
                          </span>
                          {st.bloodGroup && (
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-extrabold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                              🩸 {st.bloodGroup}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {getApprovalBadge(st.approval)}
                    </div>
                  </div>

                  {/* Contact Info Pills with Element-Wise Background */}
                  <div className="grid grid-cols-1 gap-1 pt-1 border-t border-sky-100">
                    {/* Email Pill */}
                    <div className="px-2 py-1 rounded-lg bg-sky-100/60 border border-sky-200/80 flex items-center gap-1.5 text-[10px] text-sky-950 font-medium min-w-0">
                      <Mail className="w-3 h-3 text-sky-700 shrink-0" />
                      <span className="truncate font-mono">{st.email}</span>
                    </div>

                    {/* Phone Pill */}
                    <div className="px-2 py-1 rounded-lg bg-sky-100/60 border border-sky-200/80 flex items-center gap-1.5 text-[10px] text-sky-950 font-medium">
                      <Phone className="w-3 h-3 text-sky-700 shrink-0" />
                      <span className="font-mono">{st.phoneNumber || 'No phone recorded'}</span>
                    </div>
                  </div>

                  {/* Actions Footer - Approve / Reject / View Dossier */}
                  <div className="pt-1.5 border-t border-sky-100 flex items-center justify-between gap-1.5">
                    {st.approval === 'pending' ? (
                      <div className="flex items-center gap-1 w-full">
                        <button
                          type="button"
                          onClick={() => handleApprovalAction(st.id, 'approved')}
                          disabled={updatingId === st.id}
                          className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-98"
                        >
                          <UserCheck className="w-3 h-3" />
                          <span>Approve</span>
                        </button>
                        {st.role !== 'captain' && (
                          <button
                            type="button"
                            onClick={() => handleApprovalAction(st.id, 'rejected')}
                            disabled={updatingId === st.id}
                            className="py-1 px-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-2xs cursor-pointer active:scale-98"
                            title="Decline Student Account"
                          >
                            <UserX className="w-3 h-3" />
                            <span>Decline</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        {st.role === 'captain' ? (
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[9px] font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-slate-400" />
                            Protected
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              handleApprovalAction(st.id, st.approval === 'approved' ? 'rejected' : 'approved')
                            }
                            disabled={updatingId === st.id}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                              st.approval === 'approved'
                                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {st.approval === 'approved' ? 'Revoke Approval' : 'Re-Approve'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* View Dossier Button */}
                    <button
                      type="button"
                      onClick={() => onSelectStudentForModal(st)}
                      className="px-2 py-1 bg-sky-100 hover:bg-sky-200 text-sky-800 rounded-lg text-[10px] font-extrabold transition-colors shrink-0 cursor-pointer flex items-center gap-1 border border-sky-200 shadow-2xs"
                      title="View Full Profile Dossier"
                    >
                      <span>Profile</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <CaptainEmptyState
            icon={Users}
            title={statusFilter === 'ALL' ? 'No Students Registered' : `No ${statusFilter} Students`}
            description={
              statusFilter === 'ALL'
                ? `There are no student accounts registered in Section ${assignedSection} (${assignedBatch}).`
                : `No students match the selected filter in Section ${assignedSection}.`
            }
          />
        )}
      </div>
    </div>
  );
};
