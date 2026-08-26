import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ShieldAlert, 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  Check, 
  RefreshCw,
  Award,
  UserCheck,
  UserX
} from 'lucide-react';
import { User, ApprovalStatus, UserProfileDetail } from '../../../types';
import { api } from '../../../lib/api';

interface AdminUserProfileModalProps {
  user: User | null;
  onClose: () => void;
  onUpdateApproval: (id: string, approval: ApprovalStatus) => Promise<{ success: boolean; message?: string }>;
  onUpdateRole: (id: string, role: 'student' | 'captain', assignedBatch?: string, assignedSection?: string) => Promise<{ success: boolean; message?: string }>;
  onUserModified?: () => void;
}

export const AdminUserProfileModal: React.FC<AdminUserProfileModalProps> = ({
  user,
  onClose,
  onUpdateApproval,
  onUpdateRole,
  onUserModified,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'leaves'>('profile');
  const [profileData, setProfileData] = useState<UserProfileDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [promoteConfirm, setPromoteConfirm] = useState(false);
  const [demoteConfirm, setDemoteConfirm] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.getUserProfile(user.id);
      if (res?.success) {
        setProfileData(res);
      }
    } catch (err: any) {
      console.error('Failed to fetch user profile:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      document.body.style.overflow = 'hidden';
      fetchProfile();
      setActiveTab('profile');
      setNotice(null);
      setPromoteConfirm(false);
      setDemoteConfirm(false);
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [user, fetchProfile]);

  if (!user) return null;

  const currentUser = profileData?.user || user;
  const attendanceStats = profileData?.attendanceStats;
  const attendanceRecords = profileData?.attendanceRecords || [];
  const leaveRequests = profileData?.leaveRequests || [];

  const handleRoleChange = async (targetRole: 'student' | 'captain') => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await onUpdateRole(currentUser.id, targetRole, currentUser.batch, currentUser.section);
      if (res.success) {
        setNotice({
          type: 'success',
          text: res.message || `Role updated successfully to ${targetRole === 'captain' ? 'Class Captain' : 'Student'}.`,
        });
        setPromoteConfirm(false);
        setDemoteConfirm(false);
        await fetchProfile();
        onUserModified?.();
      } else {
        setNotice({ type: 'error', text: 'Failed to update user role.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Error occurred while updating role.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprovalChange = async (newApproval: ApprovalStatus) => {
    setActionLoading(true);
    setNotice(null);
    try {
      const res = await onUpdateApproval(currentUser.id, newApproval);
      if (res.success) {
        setNotice({
          type: 'success',
          text: res.message || `Approval status updated to ${newApproval}.`,
        });
        await fetchProfile();
        onUserModified?.();
      } else {
        setNotice({ type: 'error', text: 'Failed to update approval status.' });
      }
    } catch (err: any) {
      setNotice({ type: 'error', text: err.message || 'Error occurred while updating approval.' });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-hidden bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl h-[94vh] sm:h-auto sm:max-h-[88vh] bg-white border border-rose-200 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android Native Grab Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-rose-50/50 shrink-0">
          <div className="w-12 h-1 bg-rose-300/80 rounded-full" />
        </div>

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-rose-100 bg-rose-50/50 shrink-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
              Institutional Profile Dossier
            </span>
            <span className="font-mono text-xs font-black text-rose-600 truncate">
              ID: {currentUser.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-rose-100/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Header & Identity Card */}
        <div className="p-4 sm:p-6 bg-rose-50/30 border-b border-rose-100 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
              {/* Role Initial Avatar */}
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-xl sm:text-2xl font-black shadow-md shrink-0 ${
                currentUser.role === 'captain'
                  ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                  : currentUser.role === 'admin'
                  ? 'bg-rose-600 text-white ring-2 ring-rose-300'
                  : 'bg-emerald-600 text-white ring-2 ring-emerald-300'
              }`}>
                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{currentUser.fullName || 'Unnamed User'}</h3>
                  
                  {/* Role Badge */}
                  {currentUser.role === 'captain' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                      <ShieldAlert className="w-3 h-3 text-blue-600" />
                      Class Captain
                    </span>
                  )}
                  {currentUser.role === 'student' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-emerald-600" />
                      Student
                    </span>
                  )}
                  {currentUser.role === 'admin' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-rose-600" />
                      Chief Admin
                    </span>
                  )}

                  {/* Approval Status */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    currentUser.approval === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : currentUser.approval === 'pending'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {currentUser.approval === 'approved' ? '✓ Active & Verified' : currentUser.approval === 'pending' ? '⏳ Pending Approval' : '✗ Rejected'}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-600 mt-1">
                  {currentUser.rollNumber && (
                    <>
                      Roll No: <span className="font-mono text-rose-700 font-black text-sm">{currentUser.rollNumber}</span> •{' '}
                    </>
                  )}
                  {currentUser.batch || 'HSC'} • Section {currentUser.section || 'General'} {currentUser.group ? `(${currentUser.group})` : ''}
                </p>
              </div>
            </div>

            {/* Quick Action Role Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {currentUser.role === 'student' && currentUser.approval === 'approved' && (
                <div>
                  {!promoteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setPromoteConfirm(true)}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-950/50 flex items-center gap-1.5 ring-1 ring-blue-400/40"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Promote to Captain
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 p-1 bg-blue-950/90 rounded-xl border border-blue-700">
                      <span className="text-[10px] font-bold text-blue-200 px-1">Confirm Promotion?</span>
                      <button
                        type="button"
                        onClick={() => handleRoleChange('captain')}
                        disabled={actionLoading}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase"
                      >
                        Yes, Promote
                      </button>
                      <button
                        type="button"
                        onClick={() => setPromoteConfirm(false)}
                        className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentUser.role === 'captain' && (
                <div>
                  {!demoteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setDemoteConfirm(true)}
                      disabled={actionLoading}
                      className="px-3.5 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all border border-rose-800/60 shadow-md flex items-center gap-1.5"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-rose-400" />
                      Demote to Student
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 p-1 bg-rose-950/90 rounded-xl border border-rose-700">
                      <span className="text-[10px] font-bold text-rose-200 px-1">Revert to Student?</span>
                      <button
                        type="button"
                        onClick={() => handleRoleChange('student')}
                        disabled={actionLoading}
                        className="px-2 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-black uppercase"
                      >
                        Yes, Demote
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoteConfirm(false)}
                        className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentUser.approval === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleApprovalChange('approved')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-md"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovalChange('rejected')}
                    disabled={actionLoading}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 shadow-md"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Notice */}
          {notice && (
            <div className={`mt-4 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              notice.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-800 text-rose-200'
            }`}>
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 px-2 sm:px-6 pt-2 border-b border-rose-200/80 bg-rose-50/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-center ${
              activeTab === 'profile'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Profile & Enrollment</span>
            <span className="sm:hidden truncate">Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-center ${
              activeTab === 'attendance'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Attendance Ledger ({attendanceRecords.length})</span>
            <span className="sm:hidden truncate">Ledger ({attendanceRecords.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaves')}
            className={`py-2 px-1 text-[11px] sm:text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-center ${
              activeTab === 'leaves'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Leave History ({leaveRequests.length})</span>
            <span className="sm:hidden truncate">Leaves ({leaveRequests.length})</span>
          </button>
        </div>

        {/* Modal Body with Tab Contents (Single Scrollable Region) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 sm:space-y-6 flex-1 min-h-0 text-slate-800">
          {loading ? (
            <div className="py-16 text-center text-xs font-bold text-rose-600 animate-pulse flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-rose-500" />
              <span>Fetching full institutional profile & compliance ledgers...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: Profile & Enrollment */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {/* Academic Details Section */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-rose-700 mb-3">
                      Academic Enrollment Credentials
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">HSC Batch</span>
                        <span className="text-sm font-black text-slate-900">{currentUser.batch}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Enrolled Section</span>
                        <span className="text-sm font-black text-slate-900">Section {currentUser.section}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Academic Group</span>
                        <span className="text-sm font-black text-slate-900">{currentUser.group}</span>
                      </div>
                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Gender</span>
                        <span className="text-sm font-black text-slate-900">{currentUser.gender}</span>
                      </div>
                    </div>
                  </div>

                  {/* Captain Oversight Info if Captain */}
                  {currentUser.role === 'captain' && (
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
                      <div className="flex items-center gap-2 text-blue-800">
                        <ShieldAlert className="w-4 h-4 text-blue-600" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-blue-800">
                          Class Captain Assigned Command
                        </h4>
                      </div>
                      <p className="text-xs text-blue-900 font-medium">
                        This student is commissioned as the official Class Captain for{' '}
                        <strong className="text-blue-950">Section {currentUser.assignedSection || currentUser.section} ({currentUser.assignedBatch || currentUser.batch})</strong> with daily roll-call authority.
                      </p>
                    </div>
                  )}

                  {/* Contact Details Section */}
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-rose-700 mb-3">
                      Contact & Institutional Verification
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex items-start gap-3">
                        <Mail className="w-4 h-4 text-rose-600 mt-1 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Institutional Email</span>
                          <span className="text-xs font-bold text-slate-900">{currentUser.email}</span>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex items-start gap-3">
                        <Phone className="w-4 h-4 text-rose-600 mt-1 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Contact Phone</span>
                          <span className="text-xs font-bold text-slate-900">{currentUser.phoneNumber || '—'}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-rose-600 mt-1 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Permanent Address</span>
                          <span className="text-xs font-bold text-slate-900">{currentUser.address || 'Dhaka, Bangladesh'}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-rose-600 mt-1 shrink-0" />
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Registered Timestamp</span>
                          <span className="text-xs font-mono font-bold text-slate-900">
                            {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Attendance Ledger */}
              {activeTab === 'attendance' && (
                <div className="space-y-6">
                  {/* Attendance Statistics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Compliance Rate</span>
                      <span className={`text-2xl font-black ${
                        (attendanceStats?.attendancePercentage ?? 100) >= 75 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {attendanceStats ? `${attendanceStats.attendancePercentage}%` : '100%'}
                      </span>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Total Classes</span>
                      <span className="text-2xl font-black text-slate-900">{attendanceStats?.totalDays ?? 0}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 block">Present</span>
                      <span className="text-2xl font-black text-emerald-600">{attendanceStats?.daysPresent ?? 0}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/80 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-700 block">Absent</span>
                      <span className="text-2xl font-black text-rose-600">{attendanceStats?.daysAbsent ?? 0}</span>
                    </div>
                  </div>

                  {/* Attendance Log Table */}
                  <div className="p-4 rounded-2xl bg-white border border-rose-200/80 space-y-3 shadow-2xs">
                    <h4 className="text-xs font-black uppercase tracking-widest text-rose-700">
                      Chronological Roll Call Ledger
                    </h4>

                    {attendanceRecords.length > 0 ? (
                      <div className="space-y-2.5">
                        {attendanceRecords.map((rec, index) => (
                          <div
                            key={rec.id ? `rec-${rec.id}-${index}` : `rec-idx-${index}`}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-rose-200 transition-all space-y-1.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900 inline-flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                <span>{rec.date}</span>
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                                rec.status === 'Present'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : rec.status === 'Absent'
                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                  : rec.status === 'Late'
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                              }`}>
                                {rec.status === 'Present' && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                                {rec.status === 'Absent' && <XCircle className="w-3 h-3 text-rose-600 shrink-0" />}
                                {rec.status === 'Late' && <Clock className="w-3 h-3 text-amber-600 shrink-0" />}
                                <span>{rec.status}</span>
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1">
                                <UserCheck className="w-3 h-3 text-slate-400 shrink-0" />
                                <strong className="text-slate-700">By:</strong> {rec.markedBy?.name || 'Class Captain'} ({rec.markedBy?.role || 'captain'})
                              </span>
                              {rec.remarks && <span className="text-slate-500 italic pl-4">"{rec.remarks}"</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs font-bold text-slate-500">
                        No roll call attendance records exist for this student yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Leave Requests */}
              {activeTab === 'leaves' && (
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-rose-700 mb-3">
                    Institutional Leave Applications
                  </h4>

                  {leaveRequests.length > 0 ? (
                    <div className="space-y-3">
                      {leaveRequests.map((lv, index) => (
                        <div key={lv.id ? `lv-${lv.id}-${index}` : `lv-idx-${index}`} className="p-4 rounded-2xl bg-white border border-rose-200/80 space-y-2 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 text-rose-800 border border-rose-200">
                                {lv.leaveType} Leave
                              </span>
                              <span className="font-mono text-xs font-bold text-slate-900">
                                {lv.startDate}
                              </span>
                            </div>

                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              lv.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : lv.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {lv.status}
                            </span>
                          </div>

                          <p className="text-xs text-slate-700 font-medium">
                            <strong className="text-slate-900">Reason:</strong> {lv.reason}
                          </p>

                          {(lv.reviewedBy || lv.reviewNote || lv.captainsNote) && (
                            <div className="pt-2 border-t border-rose-100 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-1">
                              {lv.reviewedBy && (
                                <span>
                                  Reviewed by: <strong>{typeof lv.reviewedBy === 'object' && lv.reviewedBy?.name ? lv.reviewedBy.name : typeof lv.reviewedBy === 'string' ? lv.reviewedBy : 'Section Captain'}</strong>{' '}
                                  ({typeof lv.reviewedBy === 'object' && lv.reviewedBy?.role ? lv.reviewedBy.role : 'captain'})
                                </span>
                              )}
                              {(lv.reviewNote || lv.captainsNote) && <span className="italic font-medium text-slate-700">"{lv.reviewNote || lv.captainsNote}"</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-xs font-bold text-slate-500 p-6 rounded-2xl bg-rose-50/50 border border-rose-200/60">
                      No leave applications submitted by this student yet.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-rose-100 bg-rose-50/50 flex items-center justify-between shrink-0">
          <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
            ClassHQ Institutional Records • Dean Oversight Active
          </span>
          <span className="text-[10px] font-bold text-slate-500 sm:hidden">
            ClassHQ Records
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-xs"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
