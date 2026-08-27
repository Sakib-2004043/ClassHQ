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
  UserX,
  RotateCcw
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-xl max-h-[90vh] sm:max-h-[82vh] bg-white border border-rose-200 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android Native Grab Handle */}
        <div className="sm:hidden pt-2 pb-0.5 flex justify-center bg-rose-50/50 shrink-0">
          <div className="w-8 h-1 bg-rose-300 rounded-full" />
        </div>

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-rose-100 bg-rose-50/50 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200 shrink-0">
              Profile
            </span>
            <span className="font-mono text-[10px] font-bold text-rose-600 truncate">
              ID: {currentUser.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-rose-100/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Header & Identity Card */}
        <div className="p-3 bg-rose-50/30 border-b border-rose-100 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              {/* Role Initial Avatar */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shadow-xs shrink-0 ${
                currentUser.role === 'captain'
                  ? 'bg-blue-600 text-white ring-1 ring-blue-300'
                  : currentUser.role === 'admin'
                  ? 'bg-rose-600 text-white ring-1 ring-rose-300'
                  : 'bg-emerald-600 text-white ring-1 ring-emerald-300'
              }`}>
                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <h3 className="text-sm font-bold text-slate-900 leading-tight">{currentUser.fullName || 'Unnamed User'}</h3>
                  
                  {/* Role Badge */}
                  {currentUser.role === 'captain' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                      <ShieldAlert className="w-2.5 h-2.5 text-blue-600" />
                      Captain
                    </span>
                  )}
                  {currentUser.role === 'student' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                      <GraduationCap className="w-2.5 h-2.5 text-emerald-600" />
                      Student
                    </span>
                  )}
                  {currentUser.role === 'admin' && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5 text-rose-600" />
                      Admin
                    </span>
                  )}

                  {/* Approval Status */}
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                    currentUser.approval === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : currentUser.approval === 'pending'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {currentUser.approval === 'approved' ? 'Active' : currentUser.approval === 'pending' ? 'Pending' : 'Rejected'}
                  </span>
                </div>

                <p className="text-[11px] font-medium text-slate-600 mt-0.5">
                  {currentUser.rollNumber && (
                    <>
                      Roll: <span className="font-mono text-rose-700 font-bold">{currentUser.rollNumber}</span> •{' '}
                    </>
                  )}
                  {currentUser.batch || 'HSC'} • Sec {currentUser.section || 'A'} {currentUser.group ? `• ${currentUser.group}` : ''}
                </p>
              </div>
            </div>

            {/* Quick Action Role Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
              {currentUser.role === 'student' && currentUser.approval === 'approved' && (
                <div>
                  {!promoteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setPromoteConfirm(true)}
                      disabled={actionLoading}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      Promote
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 p-0.5 bg-blue-950/90 rounded-lg border border-blue-700">
                      <span className="text-[9px] font-medium text-blue-200 px-1">Promote?</span>
                      <button
                        type="button"
                        onClick={() => handleRoleChange('captain')}
                        disabled={actionLoading}
                        className="px-1.5 py-0.5 bg-emerald-600 text-white rounded text-[9px] font-bold uppercase"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setPromoteConfirm(false)}
                        className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-medium"
                      >
                        No
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
                      className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-200 hover:text-white rounded-lg text-[10px] font-bold uppercase transition-all border border-rose-800/60 shadow-2xs flex items-center gap-1"
                    >
                      <GraduationCap className="w-3 h-3 text-rose-400" />
                      Demote
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 p-0.5 bg-rose-950/90 rounded-lg border border-rose-700">
                      <span className="text-[9px] font-medium text-rose-200 px-1">Demote?</span>
                      <button
                        type="button"
                        onClick={() => handleRoleChange('student')}
                        disabled={actionLoading}
                        className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold uppercase"
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setDemoteConfirm(false)}
                        className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[9px] font-medium"
                      >
                        No
                      </button>
                    </div>
                  )}
                </div>
              )}

              {currentUser.approval === 'pending' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApprovalChange('approved')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovalChange('rejected')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Reject
                  </button>
                </div>
              )}

              {currentUser.approval === 'rejected' && (
                <button
                  type="button"
                  onClick={() => handleApprovalChange('approved')}
                  disabled={actionLoading}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Re-Approve Rejected Student"
                >
                  <RotateCcw className="w-3 h-3" />
                  Approve Again
                </button>
              )}

              {currentUser.approval === 'approved' && currentUser.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => handleApprovalChange('rejected')}
                  disabled={actionLoading}
                  className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-800/60 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Revoke Approval & Reject Account"
                >
                  <UserX className="w-3 h-3 text-rose-400" />
                  Revoke
                </button>
              )}
            </div>
          </div>

          {/* Action Notice */}
          {notice && (
            <div className={`mt-2 p-2 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
              notice.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-800 text-rose-200'
            }`}>
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 px-3 pt-1 border-b border-rose-200/80 bg-rose-50/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1 whitespace-nowrap text-center ${
              activeTab === 'profile'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3 h-3 shrink-0" />
            <span>Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1 whitespace-nowrap text-center ${
              activeTab === 'attendance'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span>Attendance ({attendanceRecords.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaves')}
            className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1 whitespace-nowrap text-center ${
              activeTab === 'leaves'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span>Leaves ({leaveRequests.length})</span>
          </button>
        </div>

        {/* Modal Body with Tab Contents (Single Scrollable Region) */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1 min-h-0 text-slate-800">
          {loading ? (
            <div className="py-8 text-center text-xs font-bold text-rose-600 animate-pulse flex flex-col items-center justify-center gap-1.5">
              <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
              <span>Loading profile...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: Profile */}
              {activeTab === 'profile' && (
                <div className="space-y-3">
                  {/* Academic Details */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-1.5">
                      Academic Info
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block">Batch</span>
                        <span className="text-xs font-bold text-slate-900">{currentUser.batch}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block">Section</span>
                        <span className="text-xs font-bold text-slate-900">Sec {currentUser.section}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block">Group</span>
                        <span className="text-xs font-bold text-slate-900">{currentUser.group}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80">
                        <span className="text-[9px] font-bold uppercase text-slate-500 block">Gender</span>
                        <span className="text-xs font-bold text-slate-900">{currentUser.gender}</span>
                      </div>
                    </div>
                  </div>

                  {/* Captain Oversight Info if Captain */}
                  {currentUser.role === 'captain' && (
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2">
                      <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <p className="text-[11px] text-blue-900 font-medium leading-tight">
                        Captain of <strong>Sec {currentUser.assignedSection || currentUser.section} ({currentUser.assignedBatch || currentUser.batch})</strong> with roll-call authority.
                      </p>
                    </div>
                  )}

                  {/* Contact Details */}
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-1.5">
                      Contact
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80 flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block leading-none">Email</span>
                          <span className="text-[11px] font-bold text-slate-900 truncate block">{currentUser.email}</span>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80 flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block leading-none">Phone</span>
                          <span className="text-[11px] font-bold text-slate-900 truncate block">{currentUser.phoneNumber || '—'}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 p-2 rounded-lg bg-rose-50/50 border border-rose-200/80 flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block leading-none">Address</span>
                          <span className="text-[11px] font-bold text-slate-900 truncate block">{currentUser.address || 'Dhaka, Bangladesh'}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 p-2 rounded-lg bg-rose-50/50 border border-rose-200/80 flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-bold uppercase text-slate-500 block leading-none">Registered</span>
                          <span className="text-[11px] font-mono font-medium text-slate-900 truncate block">
                            {currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Attendance */}
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  {/* Attendance Statistics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80">
                      <span className="text-[9px] font-bold uppercase text-slate-500 block">Rate</span>
                      <span className={`text-base font-bold ${
                        (attendanceStats?.attendancePercentage ?? 100) >= 75 ? 'text-emerald-600' : 'text-rose-600'
                      }`}>
                        {attendanceStats ? `${attendanceStats.attendancePercentage}%` : '100%'}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80">
                      <span className="text-[9px] font-bold uppercase text-slate-500 block">Total</span>
                      <span className="text-base font-bold text-slate-900">{attendanceStats?.totalDays ?? 0}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80">
                      <span className="text-[9px] font-bold uppercase text-emerald-700 block">Present</span>
                      <span className="text-base font-bold text-emerald-600">{attendanceStats?.daysPresent ?? 0}</span>
                    </div>

                    <div className="p-2 rounded-lg bg-rose-50/50 border border-rose-200/80">
                      <span className="text-[9px] font-bold uppercase text-rose-700 block">Absent</span>
                      <span className="text-base font-bold text-rose-600">{attendanceStats?.daysAbsent ?? 0}</span>
                    </div>
                  </div>

                  {/* Attendance Log List */}
                  <div className="p-2.5 rounded-xl bg-white border border-rose-200/80 space-y-2 shadow-2xs">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                      Attendance Logs
                    </h4>

                    {attendanceRecords.length > 0 ? (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                        {attendanceRecords.map((rec, index) => (
                          <div
                            key={rec.id ? `rec-${rec.id}-${index}` : `rec-idx-${index}`}
                            className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-rose-200 transition-all flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <span className="font-mono font-bold text-[11px] text-slate-900 inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
                                <span>{rec.date}</span>
                              </span>
                              <div className="text-[10px] text-slate-500 truncate">
                                By: {rec.markedBy?.name || 'Captain'} {rec.remarks ? `• "${rec.remarks}"` : ''}
                              </div>
                            </div>

                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 inline-flex items-center gap-1 ${
                              rec.status === 'Present'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : rec.status === 'Absent'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : rec.status === 'Late'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {rec.status === 'Present' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0" />}
                              {rec.status === 'Absent' && <XCircle className="w-2.5 h-2.5 text-rose-600 shrink-0" />}
                              {rec.status === 'Late' && <Clock className="w-2.5 h-2.5 text-amber-600 shrink-0" />}
                              <span>{rec.status}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center text-[11px] font-medium text-slate-500">
                        No records yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Leaves */}
              {activeTab === 'leaves' && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-700 mb-1">
                    Leave History
                  </h4>

                  {leaveRequests.length > 0 ? (
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
                      {leaveRequests.map((lv, index) => (
                        <div key={lv.id ? `lv-${lv.id}-${index}` : `lv-idx-${index}`} className="p-2 rounded-lg bg-white border border-rose-200/80 space-y-1 shadow-2xs">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-rose-100 text-rose-800 border border-rose-200 rounded">
                                {lv.leaveType}
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-900">
                                {lv.startDate}
                              </span>
                            </div>

                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              lv.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : lv.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {lv.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-700 font-medium truncate">
                            <strong className="text-slate-900">Reason:</strong> {lv.reason}
                          </p>

                          {(lv.reviewedBy || lv.reviewNote || lv.captainsNote) && (
                            <div className="pt-1 border-t border-rose-100 text-[10px] text-slate-500 flex items-center justify-between flex-wrap gap-1">
                              {lv.reviewedBy && (
                                <span>
                                  By: <strong>{typeof lv.reviewedBy === 'object' && lv.reviewedBy?.name ? lv.reviewedBy.name : typeof lv.reviewedBy === 'string' ? lv.reviewedBy : 'Captain'}</strong>
                                </span>
                              )}
                              {(lv.reviewNote || lv.captainsNote) && <span className="italic truncate text-slate-700">"{lv.reviewNote || lv.captainsNote}"</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-[11px] font-medium text-slate-500 p-3 rounded-lg bg-rose-50/50 border border-rose-200/60">
                      No leave applications yet.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-3 py-2 border-t border-rose-100 bg-rose-50/50 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-medium text-slate-500">
            ClassHQ
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold uppercase transition-all shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
