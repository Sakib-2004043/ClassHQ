import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin,
  ShieldCheck,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  UserCheck,
  TrendingUp,
  FileText,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { SectionCaptainInfo, StudentDashboardStats } from '../../../types';
import { api } from '../../../lib/api';

interface StudentProfileViewProps {
  stats?: StudentDashboardStats | null;
  captains?: SectionCaptainInfo[];
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  stats,
  captains = [],
}) => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  if (!user) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setChangePasswordLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(res.message || 'Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError('Failed to change password. Please check your credentials.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error changing password.');
    } finally {
      setChangePasswordLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      {/* Student Identity Header Card */}
      <div className="p-3 sm:p-5 bg-white/90 backdrop-blur-md rounded-2xl border border-emerald-100/80 shadow-xs space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-emerald-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-lg sm:text-xl font-extrabold shadow-md shadow-emerald-600/20 ring-1 ring-emerald-400/30 shrink-0">
              {user.fullName.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-emerald-950 tracking-tight truncate">{user.fullName}</h2>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/80 inline-flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                  Active
                </span>
                <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0">
                  {user.group} Group
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-800/80 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>Roll: <strong className="font-mono text-emerald-700 text-xs font-bold">{user.rollNumber}</strong></span>
                <span>•</span>
                <span>Batch: <strong className="text-emerald-950 font-bold">{user.batch}</strong></span>
                <span>•</span>
                <span>Section: <strong className="text-emerald-950 font-bold">{user.section}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 self-stretch sm:self-auto">
            <div className="flex-1 sm:flex-none p-1.5 sm:p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-center min-w-[80px] sm:min-w-[100px]">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Attendance</span>
              <span className="text-sm sm:text-lg font-extrabold text-emerald-950">{stats ? `${stats.attendancePercentage}%` : '100%'}</span>
            </div>
            <div className="flex-1 sm:flex-none p-1.5 sm:p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-center min-w-[80px] sm:min-w-[100px]">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-rose-700/80 block">Absence Fine</span>
              <span className="text-sm sm:text-lg font-extrabold text-rose-700 font-mono">৳{stats ? stats.daysAbsent * 100 : 0}</span>
            </div>
          </div>
        </div>

        {/* Academic Details Grid */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Layers className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Academic Enrollment Profile
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">HSC Batch</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-950">{user.batch}</span>
              <span className="text-[8px] sm:text-[9px] text-emerald-700/60 font-medium block truncate">Higher Secondary</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Section</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-950">Section {user.section}</span>
              <span className="text-[8px] sm:text-[9px] text-emerald-700/60 font-medium block truncate">Regular Class</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Group</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-950">{user.group}</span>
              <span className="text-[8px] sm:text-[9px] text-emerald-700/60 font-medium block truncate">Curriculum</span>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-0.5">
              <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Roll No</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 font-mono">{user.rollNumber}</span>
              <span className="text-[8px] sm:text-[9px] text-emerald-700/60 font-medium block truncate">Institutional Key</span>
            </div>
          </div>
        </div>

        {/* Section Captain Information Block */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white space-y-2.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  Section Captain & Leadership
                </h3>
                <p className="text-[10px] text-emerald-300/80">
                  Designated Captain for {user.batch} • Section {user.section}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Verified
            </span>
          </div>

          {captains && captains.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-2.5">
              {captains.map((cap) => (
                <div
                  key={cap.id}
                  className="p-2.5 sm:p-3 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 space-y-2"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-xs shrink-0">
                      {cap.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{cap.fullName}</h4>
                      <p className="text-[10px] text-emerald-200 font-medium truncate">
                        Roll: <span className="font-mono font-bold text-white">{cap.rollNumber}</span> • Section {cap.assignedSection} • {cap.assignedBatch}
                      </p>
                      <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider bg-emerald-400/20 text-emerald-300">
                        Section Captain
                      </span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-white/10 space-y-1 text-[10px] text-emerald-100">
                    {cap.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3 h-3 text-emerald-300 shrink-0" />
                        <a href={`mailto:${cap.email}`} className="hover:underline font-medium truncate">
                          {cap.email}
                        </a>
                      </div>
                    )}
                    {cap.phoneNumber && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3 h-3 text-emerald-300 shrink-0" />
                        <a href={`tel:${cap.phoneNumber}`} className="hover:underline font-medium">
                          {cap.phoneNumber}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 flex items-center gap-2.5">
              <UserCheck className="w-4 h-4 text-emerald-300 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-white">Central Academic Administration</h4>
                <p className="text-[10px] text-emerald-200/80 mt-0.5">
                  Section {user.section} for {user.batch} is supervised centrally. Roll-calls & leave approvals managed by admin.
                </p>
              </div>
            </div>
          )}

          <p className="text-[10px] text-emerald-300/80 pt-1.5 border-t border-white/10">
            * Class Captain conducts daily verification & reviews leave requests before final administrative recording.
          </p>
        </div>

        {/* Contact & Residential Details */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              Personal & Contact Information
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2.5">
              <Mail className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Institutional Email</span>
                <span className="text-xs font-bold text-emerald-950 truncate block">{user.email}</span>
              </div>
            </div>

            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Phone Number</span>
                <span className="text-xs font-bold text-emerald-950 truncate block">{user.phoneNumber || '+880 1700-000000'}</span>
              </div>
            </div>

            <div className="sm:col-span-2 p-2 sm:p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 flex items-center gap-2.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Permanent Residence / Address</span>
                <span className="text-xs font-bold text-emerald-950">{user.address || 'Dhaka, Bangladesh'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Record Summary */}
        {stats && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Attendance Ledger Snapshot
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2.5">
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/30 border border-emerald-100 space-y-0.5">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Total Sessions</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-950">{stats.totalDays} Classes</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/30 border border-emerald-100 space-y-0.5">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Days Present</span>
                <span className="text-xs sm:text-sm font-extrabold text-emerald-600">{stats.daysPresent}</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/30 border border-emerald-100 space-y-0.5">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Days Absent</span>
                <span className="text-xs sm:text-sm font-extrabold text-rose-600">{stats.daysAbsent}</span>
              </div>
              <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50/30 border border-emerald-100 space-y-0.5">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-emerald-700/80 block">Official Leaves</span>
                <span className="text-xs sm:text-sm font-extrabold text-teal-600">{stats.approvedLeaves} Approved</span>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Security Card */}
        <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-emerald-900/95 via-teal-900 to-slate-900 text-white shadow-md border border-emerald-700/50 space-y-3">
          <div className="flex items-center justify-between gap-2 border-b border-emerald-800/80 pb-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center shrink-0">
                <KeyRound className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight">Security & Change Password</h3>
                <p className="text-[10px] text-emerald-200/80">Update your student portal account access password</p>
              </div>
            </div>
            <span className="px-2 py-0.2 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              Security
            </span>
          </div>

          {passwordError && (
            <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[11px] font-medium flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-medium flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{passwordSuccess}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3">
              {/* Current Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full h-8.5 px-2.5 pr-8 rounded-lg bg-slate-950/60 border border-emerald-700/50 text-white placeholder:text-slate-500 text-[11px] font-medium focus:outline-hidden focus:border-emerald-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                  <KeyRound className="w-3 h-3 text-emerald-400" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full h-8.5 px-2.5 pr-8 rounded-lg bg-slate-950/60 border border-emerald-700/50 text-white placeholder:text-slate-500 text-[11px] font-medium focus:outline-hidden focus:border-emerald-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full h-8.5 px-2.5 pr-8 rounded-lg bg-slate-950/60 border border-emerald-700/50 text-white placeholder:text-slate-500 text-[11px] font-medium focus:outline-hidden focus:border-emerald-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-300 transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-1">
              <button
                type="submit"
                disabled={changePasswordLoading}
                className="h-8.5 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {changePasswordLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <KeyRound className="w-3.5 h-3.5 text-slate-950" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

