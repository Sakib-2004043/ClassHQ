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

interface CaptainUserProfileModalProps {
  user: User | null;
  onClose: () => void;
  onUpdateApproval: (id: string, approval: ApprovalStatus) => Promise<{ success: boolean; message?: string }>;
  onUserModified?: () => void;
}

export const CaptainUserProfileModal: React.FC<CaptainUserProfileModalProps> = ({
  user,
  onClose,
  onUpdateApproval,
  onUserModified,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'attendance' | 'leaves'>('profile');
  const [profileData, setProfileData] = useState<UserProfileDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-hidden bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl h-[92vh] sm:h-auto sm:max-h-[88vh] bg-white border border-sky-200 rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Android Native Grab Handle */}
        <div className="sm:hidden pt-2 pb-1 flex justify-center bg-sky-50/50 shrink-0">
          <div className="w-10 h-1 bg-sky-300/80 rounded-full" />
        </div>

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-sky-100 bg-sky-50/50 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
              Profile Dossier
            </span>
            <span className="font-mono text-[10px] font-bold text-sky-600 truncate">
              ID: {currentUser.id}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-sky-100/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Header & Identity Card */}
        <div className="p-3 sm:p-4 bg-sky-50/30 border-b border-sky-100 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
            <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
              {/* Role Initial Avatar */}
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-base sm:text-lg font-black shadow-2xs shrink-0 ${
                currentUser.role === 'captain'
                  ? 'bg-blue-600 text-white ring-1 ring-blue-300'
                  : currentUser.role === 'admin'
                  ? 'bg-sky-600 text-white ring-1 ring-sky-300'
                  : 'bg-emerald-600 text-white ring-1 ring-emerald-300'
              }`}>
                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">{currentUser.fullName || 'Unnamed User'}</h3>
                  
                  {/* Role Badge */}
                  {currentUser.role === 'captain' && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-0.5">
                      <ShieldAlert className="w-2.5 h-2.5 text-blue-600" />
                      Captain
                    </span>
                  )}
                  {currentUser.role === 'student' && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200 inline-flex items-center gap-0.5">
                      <GraduationCap className="w-2.5 h-2.5 text-emerald-600" />
                      Student
                    </span>
                  )}
                  {currentUser.role === 'admin' && (
                    <span className="px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 inline-flex items-center gap-0.5">
                      <Building2 className="w-2.5 h-2.5 text-sky-600" />
                      Admin
                    </span>
                  )}

                  {/* Approval Status */}
                  <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase tracking-wider ${
                    currentUser.approval === 'approved'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : currentUser.approval === 'pending'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}>
                    {currentUser.approval === 'approved' ? '✓ Verified' : currentUser.approval === 'pending' ? '⏳ Pending' : '✗ Declined'}
                  </span>
                </div>

                <p className="text-[10px] font-bold text-slate-600 mt-0.5">
                  {currentUser.rollNumber && (
                    <>
                      Roll No: <span className="font-mono text-sky-700 font-extrabold text-xs">{currentUser.rollNumber}</span> •{' '}
                    </>
                  )}
                  {currentUser.batch || 'HSC'} • Section {currentUser.section || 'General'} {currentUser.group ? `(${currentUser.group})` : ''}
                </p>
              </div>
            </div>

            {/* Quick Action Role Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {currentUser.approval === 'pending' && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleApprovalChange('approved')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovalChange('rejected')}
                    disabled={actionLoading}
                    className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                    Decline
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Action Notice */}
          {notice && (
            <div className={`mt-2.5 p-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 ${
              notice.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}>
              {notice.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
              )}
              <span>{notice.text}</span>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 px-2 sm:px-4 pt-1.5 border-b border-sky-200/80 bg-sky-50/50 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1 whitespace-nowrap text-center cursor-pointer ${
              activeTab === 'profile'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Profile & Enrollment</span>
            <span className="sm:hidden truncate">Profile</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('attendance')}
            className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1 whitespace-nowrap text-center cursor-pointer ${
              activeTab === 'attendance'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Ledger ({attendanceRecords.length})</span>
            <span className="sm:hidden truncate">Ledger ({attendanceRecords.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaves')}
            className={`py-1.5 px-1 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider border-b-2 transition-all flex items-center justify-center gap-1 whitespace-nowrap text-center cursor-pointer ${
              activeTab === 'leaves'
                ? 'border-sky-600 text-sky-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span className="hidden sm:inline">Leaves ({leaveRequests.length})</span>
            <span className="sm:hidden truncate">Leaves ({leaveRequests.length})</span>
          </button>
        </div>

        {/* Modal Body with Tab Contents (Single Scrollable Region) */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-3 sm:space-y-4 flex-1 min-h-0 text-slate-800">
          {loading ? (
            <div className="py-10 text-center text-[11px] font-bold text-sky-600 animate-pulse flex flex-col items-center justify-center gap-1.5">
              <RefreshCw className="w-5 h-5 animate-spin text-sky-500" />
              <span>Fetching profile & ledgers...</span>
            </div>
          ) : (
            <>
              {/* TAB 1: Profile & Enrollment */}
              {activeTab === 'profile' && (
                <div className="space-y-3 sm:space-y-4">
                  {/* Academic Details Section */}
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 mb-2">
                      Academic Enrollment Credentials
                    </h4>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-0.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">HSC Batch</span>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">{currentUser.batch}</span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-0.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Section</span>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">Section {currentUser.section}</span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-0.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Group</span>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">{currentUser.group}</span>
                      </div>
                      <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-0.5">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Gender</span>
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900">{currentUser.gender}</span>
                      </div>
                    </div>
                  </div>

                  {/* Captain Oversight Info if Captain */}
                  {currentUser.role === 'captain' && (
                    <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50 border border-blue-200 space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-800">
                        <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800">
                          Class Captain Assigned Command
                        </h4>
                      </div>
                      <p className="text-[11px] text-blue-900 font-medium">
                        This student is commissioned as the official Class Captain for{' '}
                        <strong className="text-blue-950">Section {currentUser.assignedSection || currentUser.section} ({currentUser.assignedBatch || currentUser.batch})</strong> with daily roll-call authority.
                      </p>
                    </div>
                  )}

                  {/* Contact Details Section */}
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 mb-2">
                      Contact & Institutional Verification
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 flex items-start gap-2">
                        <Mail className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Institutional Email</span>
                          <span className="text-[11px] font-bold text-slate-900 truncate block">{currentUser.email}</span>
                        </div>
                      </div>

                      <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 flex items-start gap-2">
                        <Phone className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Contact Phone</span>
                          <span className="text-[11px] font-bold text-slate-900 truncate block">{currentUser.phoneNumber || '—'}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Permanent Address</span>
                          <span className="text-[11px] font-bold text-slate-900">{currentUser.address || 'Dhaka, Bangladesh'}</span>
                        </div>
                      </div>

                      <div className="sm:col-span-2 p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 flex items-start gap-2">
                        <Calendar className="w-3.5 h-3.5 text-sky-600 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Registered Timestamp</span>
                          <span className="text-[11px] font-mono font-bold text-slate-900">
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
                <div className="space-y-3 sm:space-y-4">
                  {/* Attendance Statistics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Compliance</span>
                      <span className={`text-lg sm:text-xl font-black ${
                        (attendanceStats?.attendancePercentage ?? 100) >= 75 ? 'text-emerald-600' : 'text-sky-600'
                      }`}>
                        {attendanceStats ? `${attendanceStats.attendancePercentage}%` : '100%'}
                      </span>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-500 block">Total Days</span>
                      <span className="text-lg sm:text-xl font-black text-slate-900">{attendanceStats?.totalDays ?? 0}</span>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700 block">Present</span>
                      <span className="text-lg sm:text-xl font-black text-emerald-600">{attendanceStats?.daysPresent ?? 0}</span>
                    </div>

                    <div className="p-2.5 sm:p-3 rounded-xl bg-sky-50/50 border border-sky-200/80 space-y-0.5">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-rose-700 block">Absent</span>
                      <span className="text-lg sm:text-xl font-black text-rose-600">{attendanceStats?.daysAbsent ?? 0}</span>
                    </div>
                  </div>

                  {/* Attendance Log Table */}
                  <div className="p-3 sm:p-4 rounded-xl bg-white border border-sky-200/80 space-y-2 shadow-2xs">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                      Chronological Roll Call Ledger
                    </h4>

                    {attendanceRecords.length > 0 ? (
                      <div className="space-y-1.5">
                        {attendanceRecords.map((rec, index) => (
                          <div
                            key={rec.id ? `rec-${rec.id}-${index}` : `rec-idx-${index}`}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 hover:border-sky-200 transition-all space-y-1"
                          >
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-mono font-bold text-[11px] text-slate-900 inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-sky-500 shrink-0" />
                                <span>{rec.date}</span>
                              </span>
                              <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase inline-flex items-center gap-0.5 ${
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
                            <div className="text-[10px] text-slate-600 flex flex-col gap-0.2">
                              <span className="inline-flex items-center gap-1">
                                <UserCheck className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                <strong className="text-slate-700">By:</strong> {rec.markedBy?.name || 'Class Captain'}
                              </span>
                              {rec.remarks && <span className="text-slate-500 italic pl-3.5">"{rec.remarks}"</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-[11px] font-bold text-slate-500">
                        No roll call attendance records exist for this student yet.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: Leave Requests */}
              {activeTab === 'leaves' && (
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700 mb-2">
                    Institutional Leave Applications
                  </h4>

                  {leaveRequests.length > 0 ? (
                    <div className="space-y-2">
                      {leaveRequests.map((lv, index) => (
                        <div key={lv.id ? `lv-${lv.id}-${index}` : `lv-idx-${index}`} className="p-2.5 sm:p-3 rounded-xl bg-white border border-sky-200/80 space-y-1.5 shadow-2xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.2 rounded-md text-[9px] font-extrabold uppercase bg-sky-100 text-sky-800 border border-sky-200">
                                {lv.leaveType} Leave
                              </span>
                              <span className="font-mono text-[11px] font-bold text-slate-900">
                                {lv.startDate}
                              </span>
                            </div>

                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-extrabold uppercase ${
                              lv.status === 'Approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : lv.status === 'Pending'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {lv.status}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-700 font-medium">
                            <strong className="text-slate-900">Reason:</strong> "{lv.reason}"
                          </p>

                          {(lv.reviewedBy || lv.reviewNote || lv.captainsNote) && (
                            <div className="pt-1.5 border-t border-sky-100 text-[10px] text-slate-500 flex items-center justify-between flex-wrap gap-1">
                              {lv.reviewedBy && (
                                <span>
                                  Reviewed by: <strong>{typeof lv.reviewedBy === 'object' && lv.reviewedBy?.name ? lv.reviewedBy.name : typeof lv.reviewedBy === 'string' ? lv.reviewedBy : 'Section Captain'}</strong>
                                </span>
                              )}
                              {(lv.reviewNote || lv.captainsNote) && <span className="italic font-medium text-slate-700">"{lv.reviewNote || lv.captainsNote}"</span>}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-[11px] font-bold text-slate-500 p-4 rounded-xl bg-sky-50/50 border border-sky-200/60">
                      No leave applications submitted by this student yet.
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-3 sm:px-4 py-2 sm:py-2.5 border-t border-sky-100 bg-sky-50/50 flex items-center justify-between shrink-0">
          <span className="text-[10px] font-bold text-slate-500">
            ClassHQ Institutional Records
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
          >
            Close Dossier
          </button>
        </div>
      </div>
    </div>
  );
};
