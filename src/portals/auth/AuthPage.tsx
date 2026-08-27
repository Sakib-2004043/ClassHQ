import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  GraduationCap,
  Lock,
  Hash,
  AlertCircle,
  Clock,
  CheckCircle,
  ArrowRight,
  School,
  UserCheck,
  RefreshCw,
  X,
  Mail,
  Users,
  Sparkles,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  BookOpen,
  Eye,
  EyeOff,
  BadgeCheck,
  Flame,
  Award,
  KeyRound,
  Compass,
  Zap,
  Check
} from 'lucide-react';
import { HSCBatch, Section, AcademicGroup, Gender } from '../../types';

export const AuthPage: React.FC<{ initialTab?: 'login' | 'register' }> = ({ initialTab = 'login' }) => {
  const { login, registerStudent, pendingNotice, clearPendingNotice, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);

  // Register form state
  const [formData, setFormData] = useState({
    fullName: '',
    rollNumber: '',
    email: '',
    phoneNumber: '',
    gender: 'Male' as Gender,
    batch: 'HSC 2026' as HSCBatch,
    group: 'Science' as AcademicGroup,
    section: 'A' as Section,
    address: '',
    password: '',
    confirmPassword: '',
  });
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);
  const [registerSubmitting, setRegisterSubmitting] = useState(false);

  const batches: HSCBatch[] = [
    'HSC 2024',
    'HSC 2025',
    'HSC 2026',
    'HSC 2027',
    'HSC 2028',
    'HSC 2029',
    'HSC 2030',
  ];
  const sections: Section[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  const groups: AcademicGroup[] = ['Science', 'Arts', 'Commerce'];

  // Redirect if logged in
  React.useEffect(() => {
    if (user) {
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'captain') navigate('/captain');
      else if (user.role === 'admin') navigate('/admin');
    }
  }, [user, navigate]);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoginError(null);
    setLoginSubmitting(true);

    if (!loginEmail || !loginPassword) {
      setLoginError('Please enter both your registered email address and password.');
      setLoginSubmitting(false);
      return;
    }

    const res = await login(loginEmail, loginPassword);
    setLoginSubmitting(false);
    if (!res.success) {
      if (res.isPending) {
        setLoginError(null);
      } else {
        setLoginError(res.error || 'Login failed. Please check your credentials.');
      }
    }
  };

  const handleRecheckStatus = async () => {
    if (!loginEmail || !loginPassword) {
      setActiveTab('login');
      return;
    }
    setIsRechecking(true);
    await handleLogin();
    setIsRechecking(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterSuccess(null);

    if (
      !formData.fullName ||
      !formData.rollNumber ||
      !formData.email ||
      !formData.phoneNumber ||
      !formData.address ||
      !formData.password
    ) {
      setRegisterError('All fields are mandatory. Please fill in every detail.');
      return;
    }

    if (formData.password.length < 6) {
      setRegisterError('Password must be at least 6 characters in length.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setRegisterError('Passwords do not match.');
      return;
    }

    const sanitizedRoll = formData.rollNumber.replace(/\D/g, '').slice(0, 3).replace(/^0+/, '') || '0';

    setRegisterSubmitting(true);
    const res = await registerStudent({
      fullName: formData.fullName,
      rollNumber: sanitizedRoll,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      gender: formData.gender,
      batch: formData.batch,
      group: formData.group,
      section: formData.section,
      address: formData.address,
      password: formData.password,
    });

    setRegisterSubmitting(false);

    if (res.success) {
      setLoginEmail(formData.email);
      setLoginPassword(formData.password);
      setActiveTab('login');
      setRegisterSuccess(
        'Registration submitted successfully! Your account is awaiting Class Captain or Dean verification.'
      );
      setFormData({
        fullName: '',
        rollNumber: '',
        email: '',
        phoneNumber: '',
        gender: 'Male',
        batch: 'HSC 2026',
        group: 'Science',
        section: 'A',
        address: '',
        password: '',
        confirmPassword: '',
      });
    } else {
      setRegisterError(res.error || 'Failed to submit registration.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col justify-center py-3 px-2 sm:px-6 lg:px-8 relative overflow-x-hidden select-none">
      {/* Dynamic Background Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/35 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-purple-600/35 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[15%] w-80 h-80 bg-rose-600/25 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] left-[20%] w-72 h-72 bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="w-full max-w-xl mx-auto relative z-10 space-y-3">
        {/* Aesthetic Header Banner with Element-wise Color Cards */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border border-indigo-400/30 backdrop-blur-md shadow-md">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center shadow-xs">
              <School className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-indigo-200">
              Bangladesh Navy College, Chittagong
            </span>
          </div>

          <div className="space-y-0.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-200 via-purple-200 to-rose-200 drop-shadow-xs">
              ClassHQ Portal
            </h1>
            <p className="text-[11px] sm:text-xs font-semibold text-slate-300 max-w-md mx-auto flex items-center justify-center gap-1.5 flex-wrap px-1">
              <span className="text-indigo-300">Attendance & Academic Operations</span>
              <span className="px-2 py-0.2 rounded-full text-[9px] bg-gradient-to-r from-rose-500 to-pink-500 text-white font-extrabold shadow-xs">
                2026 Edition ⚡
              </span>
            </p>
          </div>
        </div>

        {/* Pending Approval Notice Banner */}
        {pendingNotice && (
          <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-amber-600/15 to-orange-600/20 border border-amber-400/40 backdrop-blur-xl shadow-lg space-y-2 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-amber-400 text-amber-950 shadow-xs">
                  <Clock className="w-3 h-3 text-amber-950 animate-spin" />
                  Approval In Progress
                </span>
              </div>
              <button
                type="button"
                onClick={clearPendingNotice}
                className="p-1 rounded-full text-amber-300 hover:text-white hover:bg-amber-500/30 transition-colors cursor-pointer"
                title="Dismiss Notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div>
              <h3 className="text-xs font-bold text-amber-100 flex items-center gap-1.5">
                <span>Student Account Awaiting Verification</span>
              </h3>
              <p className="text-[10px] font-medium text-amber-200/90 mt-0.5 leading-snug">
                {pendingNotice.message ||
                  'Your student profile registration has been submitted and is currently awaiting verification by your assigned Class Captain or Academic Administrator.'}
              </p>
            </div>

            {pendingNotice.user && (
              <div className="p-2.5 rounded-xl bg-slate-900/90 border border-amber-400/30 text-[11px] text-slate-200 space-y-1.5 shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                      {pendingNotice.user.fullName ? pendingNotice.user.fullName.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1 text-[11px]">
                        <span>{pendingNotice.user.fullName || 'Student'}</span>
                      </div>
                      {pendingNotice.user.email && (
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5 text-amber-400" />
                          <span>{pendingNotice.user.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 font-mono font-bold text-[10px] border border-amber-400/30">
                      Roll: {pendingNotice.user.rollNumber || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 pt-0.5">
                  <span className="flex items-center gap-1 text-slate-400">
                    <Users className="w-3 h-3 text-amber-400" />
                    Cohort:
                  </span>
                  <span className="font-extrabold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded border border-indigo-400/30">
                    {pendingNotice.user.batch || 'Batch'} • Sec {pendingNotice.user.section || 'A'}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="text-[10px] font-medium text-amber-200/80 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Captain or Admin approval required</span>
              </div>
              <button
                type="button"
                onClick={handleRecheckStatus}
                disabled={isRechecking || loginSubmitting}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 text-[10px] font-extrabold transition-all shadow-xs active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${isRechecking || loginSubmitting ? 'animate-spin' : ''}`} />
                <span>{isRechecking || loginSubmitting ? 'Checking...' : 'Re-check'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Aesthetic Card with Radical Element-wise Background Coloring */}
        <div className="bg-slate-900/90 backdrop-blur-2xl rounded-2xl border border-indigo-500/30 shadow-xl overflow-hidden">
          {/* Aesthetic Segmented Tab Switcher with Vibrant Dual Themes */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/80 border-b border-indigo-500/20 gap-1">
            <button
              id="tab-btn-signin"
              type="button"
              onClick={() => {
                setActiveTab('login');
                setLoginError(null);
              }}
              className={`py-2 text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-bold'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-300" />
              <span>Sign In</span>
            </button>
            <button
              id="tab-btn-register"
              type="button"
              onClick={() => {
                setActiveTab('register');
                setRegisterError(null);
              }}
              className={`py-2 text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60 font-bold'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-300" />
              <span>Register</span>
            </button>
          </div>

          <div className="p-3.5 sm:p-5">
            {activeTab === 'login' ? (
              <div className="space-y-3">
                {/* Login Header Tag */}
                <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-slate-900 border border-indigo-500/30 flex items-center gap-2.5 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1">
                      <span>Welcome Back!</span>
                      <span>👋</span>
                    </h3>
                    <p className="text-[10px] font-medium text-indigo-200/80">
                      Sign in with your registered Email Address
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLogin} className="space-y-2.5">
                  {loginError && (
                    <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-[11px] font-bold flex items-center gap-2 animate-shake shadow-sm">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  {/* Registered Email Field - Indigo Themed Container */}
                  <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-950/70 border border-indigo-500/40 space-y-1 transition-all focus-within:bg-indigo-900/60 focus-within:border-indigo-400 shadow-xs">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-indigo-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-indigo-400" />
                        <span>Email Address</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[8px] font-bold border border-indigo-400/30">
                        Required
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <div className="w-5 h-5 rounded bg-indigo-600/30 text-indigo-300 flex items-center justify-center border border-indigo-500/30">
                          <Mail className="w-3 h-3" />
                        </div>
                      </div>
                      <input
                        id="input-login-email"
                        type="email"
                        placeholder="e.g. student@college.edu or captain@college.edu"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                        className="w-full pl-9 pr-3 py-1.5 text-[11px] font-bold text-white bg-slate-900/90 border border-indigo-500/30 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-400 transition-all placeholder:text-slate-500 shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Password Field - Purple Themed Container */}
                  <div className="p-2 sm:p-2.5 rounded-xl bg-purple-950/70 border border-purple-500/40 space-y-1 transition-all focus-within:bg-purple-900/60 focus-within:border-purple-400 shadow-xs">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-purple-300 flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-purple-400" />
                        <span>Account Password</span>
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[8px] font-bold border border-purple-400/30">
                        Encrypted
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <div className="w-5 h-5 rounded bg-purple-600/30 text-purple-300 flex items-center justify-center border border-purple-500/30">
                          <Lock className="w-3 h-3" />
                        </div>
                      </div>
                      <input
                        id="input-login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        placeholder="Enter account password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                        className="w-full pl-9 pr-9 py-1.5 text-[11px] font-bold text-white bg-slate-900/90 border border-purple-500/30 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-purple-400 transition-all placeholder:text-slate-500 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-purple-400 hover:text-purple-200 cursor-pointer transition-colors"
                      >
                        {showLoginPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Radiant Sign In Button */}
                  <button
                    id="btn-submit-login"
                    type="submit"
                    disabled={loginSubmitting}
                    className="w-full py-2.5 bg-gradient-to-r from-indigo-500 via-purple-600 to-indigo-600 hover:from-indigo-600 hover:to-purple-700 text-white text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-indigo-600/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    <span>{loginSubmitting ? 'Authenticating...' : 'Sign In to Portal'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Student Registration Onboarding Banner */}
                <div className="pt-2 border-t border-slate-800">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/30 flex items-center justify-between gap-2 shadow-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <GraduationCap className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-bold text-white flex items-center gap-1">
                          <span>New Student?</span>
                        </h4>
                        <p className="text-[9px] font-medium text-emerald-200/80">
                          Register profile for Captain approval
                        </p>
                      </div>
                    </div>
                    <button
                      id="btn-switch-to-register"
                      type="button"
                      onClick={() => setActiveTab('register')}
                      className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-950 bg-emerald-400 px-2.5 py-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-300 transition-all shrink-0 shadow-xs cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <span>Register</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Student Onboarding Registration Form with Element-wise Colors */
              <form onSubmit={handleRegister} className="space-y-2.5">
                {/* Registration Header Tag */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 via-teal-950/40 to-slate-900 border border-emerald-500/30 flex items-center gap-2.5 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1">
                      <span>Student Onboarding Registration</span>
                    </h3>
                    <p className="text-[10px] font-medium text-emerald-200/80">
                      Fill in exact institutional details for Captain approval
                    </p>
                  </div>
                </div>

                {registerError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-[11px] font-bold flex items-center gap-2 animate-shake shadow-sm">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{registerError}</span>
                  </div>
                )}

                {registerSuccess && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-[11px] font-bold flex items-center gap-2 shadow-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{registerSuccess}</span>
                  </div>
                )}

                {/* Name & Roll Number - Dual Distinct Color Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Full Legal Name - Blue Theme */}
                  <div className="p-2 rounded-xl bg-sky-950/60 border border-sky-500/40 space-y-1 transition-all focus-within:bg-sky-900/60 focus-within:border-sky-400 shadow-xs">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-sky-300 flex items-center gap-1">
                      <User className="w-3 h-3 text-sky-400" />
                      <span>Full Name:</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. Shakib Al Hasan"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                        className="w-full px-2.5 py-1.5 text-[11px] font-bold text-white bg-slate-900/90 border border-sky-500/30 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-sky-400 placeholder:text-slate-500 shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Roll Number - Violet Theme */}
                  <div className="p-2 rounded-xl bg-violet-950/60 border border-violet-500/40 space-y-1 transition-all focus-within:bg-violet-900/60 focus-within:border-violet-400 shadow-xs">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-violet-300 flex items-center gap-1">
                      <Hash className="w-3 h-3 text-violet-400" />
                      <span>Roll Number (Max 3 Digits):</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="e.g. 997 or 14"
                        value={formData.rollNumber}
                        maxLength={3}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                          setFormData({ ...formData, rollNumber: val });
                        }}
                        required
                        className="w-full px-2.5 py-1.5 text-[11px] font-mono font-bold text-white bg-slate-900/90 border border-violet-500/30 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-violet-400 placeholder:text-slate-500 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* Email & Phone - Cyan & Emerald Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Institutional Email - Cyan Theme */}
                  <div className="p-2 rounded-xl bg-cyan-950/60 border border-cyan-500/40 space-y-1 transition-all focus-within:bg-cyan-900/60 focus-within:border-cyan-400 shadow-xs">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-cyan-400" />
                      <span>Email:</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        placeholder="student@college.edu"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        className="w-full px-2.5 py-1.5 text-[11px] font-bold text-white bg-slate-900/90 border border-cyan-500/30 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-cyan-400 placeholder:text-slate-500 shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Contact Phone - Mint Theme */}
                  <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 space-y-1 transition-all focus-within:bg-emerald-900/60 focus-within:border-emerald-400 shadow-xs">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>Contact Phone:</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="+880 1700-000000"
                        value={formData.phoneNumber}
                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                        required
                        className="w-full px-2.5 py-1.5 text-[11px] font-bold text-white bg-slate-900/90 border border-emerald-500/30 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-400 placeholder:text-slate-500 shadow-inner"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Selectors Grid with Individual Distinct Background Colors */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {/* Gender Selector - Amber Container */}
                  <div className="p-1.5 rounded-xl bg-amber-950/60 border border-amber-500/40 space-y-0.5">
                    <label className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-0.5">
                      <span>Gender</span>
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                      className="w-full px-1.5 py-1 text-[11px] font-bold text-white bg-slate-900/90 border border-amber-500/30 rounded-lg focus:outline-hidden cursor-pointer"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>

                  {/* HSC Batch Selector - Rose Container */}
                  <div className="p-1.5 rounded-xl bg-rose-950/60 border border-rose-500/40 space-y-0.5">
                    <label className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-rose-300 flex items-center gap-0.5">
                      <span>Batch</span>
                    </label>
                    <select
                      value={formData.batch}
                      onChange={(e) => setFormData({ ...formData, batch: e.target.value as HSCBatch })}
                      className="w-full px-1.5 py-1 text-[11px] font-bold text-white bg-slate-900/90 border border-rose-500/30 rounded-lg focus:outline-hidden cursor-pointer"
                    >
                      {batches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Academic Group Selector - Fuchsia Container */}
                  <div className="p-1.5 rounded-xl bg-fuchsia-950/60 border border-fuchsia-500/40 space-y-0.5">
                    <label className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-0.5">
                      <span>Group</span>
                    </label>
                    <select
                      value={formData.group}
                      onChange={(e) => setFormData({ ...formData, group: e.target.value as AcademicGroup })}
                      className="w-full px-1.5 py-1 text-[11px] font-bold text-white bg-slate-900/90 border border-fuchsia-500/30 rounded-lg focus:outline-hidden cursor-pointer"
                    >
                      {groups.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Section Selector - Teal Container */}
                  <div className="p-1.5 rounded-xl bg-teal-950/60 border border-teal-500/40 space-y-0.5">
                    <label className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-teal-300 flex items-center gap-0.5">
                      <span>Section</span>
                    </label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value as Section })}
                      className="w-full px-1.5 py-1 text-[11px] font-bold text-white bg-slate-900/90 border border-teal-500/30 rounded-lg focus:outline-hidden cursor-pointer"
                    >
                      {sections.map((s) => (
                        <option key={s} value={s}>
                          Sec {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Address Field - Orange Container */}
                <div className="p-2 rounded-xl bg-orange-950/60 border border-orange-500/40 space-y-1 transition-all focus-within:bg-orange-900/60 focus-within:border-orange-400 shadow-xs">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-orange-300 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-orange-400" />
                    <span>Detailed Address:</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. House 12, Road 4, Dhanmondi, Dhaka"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      className="w-full px-2.5 py-1.5 text-[11px] font-bold text-white bg-slate-900/90 border border-orange-500/30 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-orange-400 placeholder:text-slate-500 shadow-inner"
                    />
                  </div>
                </div>

                {/* Password & Confirm Password - Pink & Purple Boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Create Password - Pink Theme */}
                  <div className="p-2 rounded-xl bg-pink-950/60 border border-pink-500/40 space-y-1 transition-all focus-within:bg-pink-900/60 focus-within:border-pink-400 shadow-xs">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-pink-300 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-pink-400" />
                      <span>Password:</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        placeholder="Min 6 chars"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        className="w-full pl-2.5 pr-8 py-1.5 text-[11px] font-bold text-white bg-slate-900/90 border border-pink-500/30 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-pink-400 placeholder:text-slate-500 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-pink-400 hover:text-pink-200 cursor-pointer"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password - Purple Theme */}
                  <div className="p-2 rounded-xl bg-fuchsia-950/60 border border-fuchsia-500/40 space-y-1 transition-all focus-within:bg-fuchsia-900/60 focus-within:border-fuchsia-400 shadow-xs">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-fuchsia-400" />
                      <span>Confirm Password:</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        placeholder="Repeat password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        className="w-full pl-2.5 pr-8 py-1.5 text-[11px] font-bold text-white bg-slate-900/90 border border-fuchsia-500/30 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-fuchsia-400 placeholder:text-slate-500 shadow-inner"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-fuchsia-400 hover:text-fuchsia-200 cursor-pointer"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Submit Registration Button */}
                <button
                  id="btn-submit-registration"
                  type="submit"
                  disabled={registerSubmitting}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 text-[11px] font-extrabold uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-600/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>{registerSubmitting ? 'Submitting...' : 'Submit for Academic Approval 🚀'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

