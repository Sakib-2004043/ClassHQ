import React, { useState } from 'react';
import { 
  Building2, 
  ShieldAlert, 
  Mail, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Shield, 
  UserCheck, 
  Key, 
  Activity, 
  Globe 
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { api } from '../../../lib/api';

export const AdminProfileView: React.FC = () => {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
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

    setLoading(true);
    try {
      const res = await api.changePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess(res.message || 'Administrative password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordError('Failed to change password. Please verify your current credentials.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error updating administrative password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-2.5 sm:space-y-3.5">
      {/* Top Admin Profile Banner Card */}
      <div className="p-3 sm:p-4 lg:p-4.5 bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 text-white rounded-2xl border border-rose-800/60 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 text-white flex items-center justify-center font-black text-base sm:text-xl shadow-md ring-1 ring-rose-400/40 shrink-0">
              <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                  {user.fullName || 'Chief Governor'}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 inline-flex items-center gap-0.5 shrink-0">
                  <ShieldAlert className="w-2.5 h-2.5 text-rose-400" />
                  Super Admin
                </span>
                <span className="px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 inline-flex items-center gap-0.5 shrink-0">
                  <UserCheck className="w-2.5 h-2.5 text-emerald-400" />
                  Active
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-semibold text-rose-200/80 flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>Role: <strong className="text-white font-bold">Chief Governor</strong></span>
                <span>•</span>
                <span>Scope: <strong className="text-white font-bold">All Batches & Sections</strong></span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Administrative System Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
        <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-rose-200/80 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-rose-700">
            <Mail className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Admin Email Account</span>
          </div>
          <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">{user.email || 'N/A'}</p>
          <span className="text-[9px] text-slate-500 font-medium block">Institutional primary identity</span>
        </div>

        <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-rose-200/80 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-rose-700">
            <Key className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Privilege & Rights</span>
          </div>
          <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">Root Governance / Approval</p>
          <span className="text-[9px] text-slate-500 font-medium block">Full database & role control</span>
        </div>

        <div className="p-2.5 sm:p-3 bg-white rounded-xl border border-rose-200/80 shadow-2xs space-y-1">
          <div className="flex items-center gap-1.5 text-rose-700">
            <Activity className="w-3.5 h-3.5 shrink-0 text-rose-600" />
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Security Enforcement</span>
          </div>
          <p className="text-[11px] sm:text-xs font-bold text-slate-900 truncate">High-Level Auth Tokens</p>
          <span className="text-[9px] text-slate-500 font-medium block">Encrypted session credentials</span>
        </div>
      </div>

      {/* Admin Portal Change Password Security Card */}
      <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-rose-950 to-slate-900 text-white shadow-md border border-rose-800/80 space-y-2.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-36 h-36 bg-rose-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-2 border-b border-rose-800/80 pb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-400/30 flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-white tracking-tight">System Security & Change Password</h3>
              <p className="text-[10px] text-rose-200/80">Update Chief Administrator portal authentication credentials</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30">
            Governor Security
          </span>
        </div>

        {passwordError && (
          <div className="relative z-10 p-2 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[11px] font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span>{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="relative z-10 p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-[11px] font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>{passwordSuccess}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="relative z-10 space-y-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
            {/* Current Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-rose-200 flex items-center gap-1">
                <Lock className="w-3 h-3 text-rose-400" />
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full h-8.5 px-2.5 pr-8 rounded-lg bg-slate-950/70 border border-rose-700/60 text-white placeholder:text-slate-500 text-[11px] font-medium focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-rose-200 flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-rose-400" />
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full h-8.5 px-2.5 pr-8 rounded-lg bg-slate-950/70 border border-rose-700/60 text-white placeholder:text-slate-500 text-[11px] font-medium focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-rose-200 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-rose-400" />
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full h-8.5 px-2.5 pr-8 rounded-lg bg-slate-950/70 border border-rose-700/60 text-white placeholder:text-slate-500 text-[11px] font-medium focus:outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-1">
            <button
              type="submit"
              disabled={loading}
              className="h-8.5 px-4 rounded-lg bg-gradient-to-r from-rose-600 via-red-600 to-rose-500 hover:from-rose-500 hover:to-red-500 text-white text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Updating Admin Password...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 text-white" />
                  <span>Update Admin Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
