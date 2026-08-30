import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  LayoutDashboard, 
  CalendarCheck, 
  User as UserIcon, 
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface StudentNavbarProps {
  attendancePercentage?: number;
}

export const StudentNavbar: React.FC<StudentNavbarProps> = ({ attendancePercentage }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { 
      path: '/student', 
      label: 'Overview', 
      shortLabel: 'Overview',
      fullLabel: 'Student Dashboard',
      icon: LayoutDashboard, 
      exact: true 
    },
    { 
      path: '/student/attendance', 
      label: 'Attendance & Leaves', 
      shortLabel: 'Attendance',
      fullLabel: 'My Attendance & Leaves',
      icon: CalendarCheck 
    },
    { 
      path: '/student/profile', 
      label: 'My Profile', 
      shortLabel: 'Profile',
      fullLabel: 'Student Dossier & Info',
      icon: UserIcon 
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path || location.pathname === '/student/';
    }
    return location.pathname.startsWith(path);
  };

  const studentSection = user?.section || 'A';
  const studentBatch = user?.batch || 'HSC 2026';

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 backdrop-blur-xl border-b border-emerald-500/30 shadow-[0_4px_25px_rgba(16,185,129,0.18)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between min-h-[3.5rem] sm:min-h-[4rem] py-1 sm:py-1.5 gap-1.5 sm:gap-3">
          {/* Student Identity Branding */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1 pr-1 sm:pr-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 lg:w-9.5 lg:h-9.5 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-green-600 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/30 ring-1 sm:ring-2 ring-emerald-400/40 shrink-0">
              <GraduationCap className="w-4.5 h-4.5 lg:w-5 lg:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                <span className="text-xs sm:text-sm lg:text-base font-black text-white tracking-tight leading-none drop-shadow-xs">
                  ClassHQ
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-wider bg-emerald-500/25 text-emerald-200 border border-emerald-400/40 shadow-xs shrink-0">
                  Student Portal
                </span>
                <span className="hidden xl:inline-flex px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/20 text-teal-200 border border-teal-400/30 shrink-0">
                  Sec {studentSection} • {studentBatch}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-emerald-200/90 truncate mt-0.5 leading-tight">
                <span className="text-white font-bold">{user?.fullName || 'Student'}</span> • <span className="text-emerald-300 font-extrabold">Sec {studentSection}</span> • <span className="font-mono text-teal-300 font-bold">Roll {user?.rollNumber || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation (Aesthetic Emerald Deep Pill Bar) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl lg:rounded-2xl border border-emerald-500/30 shadow-inner backdrop-blur-md shrink-0">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-2.5 md:px-3 lg:px-3.5 py-1.5 rounded-lg lg:rounded-xl text-[11px] lg:text-xs font-black tracking-tight lg:tracking-wide transition-all whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-green-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-300/60'
                      : 'text-emerald-200/70 hover:text-white hover:bg-emerald-500/20'
                  }`}
                  title={item.fullLabel}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="inline lg:hidden">{item.shortLabel}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Items: Authenticated Badge & Logout */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Authenticated Pill Badge */}
            <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-[11px] font-black">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>Authenticated</span>
            </div>

            {/* Logout Button (Always Red & Distinctive) */}
            <button
              id="btn-student-logout"
              type="button"
              onClick={logout}
              className="hidden sm:flex px-2.5 lg:px-3 py-1 lg:py-1.5 rounded-lg lg:rounded-xl text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border border-rose-500 shadow-md shadow-rose-950/40 transition-all items-center gap-1 lg:gap-1.5 text-[10px] lg:text-xs font-black cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Logout</span>
            </button>

            {/* Mobile / Narrow Tablet Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl bg-slate-900/90 text-emerald-200 border border-emerald-500/40 hover:bg-emerald-900/50 transition-all cursor-pointer shadow-xs"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5 text-emerald-200" /> : <Menu className="w-4.5 h-4.5 text-emerald-200" />}
            </button>
          </div>
        </div>

        {/* Mobile & Narrow Drawer Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-emerald-500/30 bg-gradient-to-b from-slate-950 via-emerald-950 to-slate-900 rounded-b-3xl shadow-2xl space-y-2 animate-in slide-in-from-top-2 duration-200">
            {/* Student Section & Batch Pill */}
            <div className="px-3 py-1.5 rounded-xl bg-emerald-900/50 border border-emerald-500/30 flex items-center justify-between text-[11px] font-black text-emerald-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Section {studentSection} • {studentBatch}
              </span>
              <span className="flex items-center gap-1 font-bold text-emerald-300 text-[10px] sm:text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                <span>Authenticated</span>
              </span>
            </div>

            {/* Nav Links Grid */}
            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => {
                const active = isActive(item.path, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all border ${
                      active
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-green-600 text-white border-emerald-400 shadow-md'
                        : 'text-emerald-100 bg-slate-900/70 hover:bg-emerald-900/40 border-emerald-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-teal-400'}`} />
                      <span>{item.fullLabel}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${active ? 'text-emerald-200' : 'text-emerald-400/60'}`} />
                  </Link>
                );
              })}
            </div>

            {/* Mobile Sign Out Button */}
            <div className="pt-2 border-t border-emerald-500/30 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border border-rose-500 text-xs font-black cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>Sign Out from Student Portal</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

