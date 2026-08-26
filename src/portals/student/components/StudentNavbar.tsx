import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  GraduationCap, 
  LayoutDashboard, 
  CalendarCheck, 
  FileText, 
  User as UserIcon, 
  LogOut,
  Menu,
  X,
  ChevronRight
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
    { path: '/student', label: 'Overview', icon: LayoutDashboard, exact: true },
    { path: '/student/attendance', label: 'Attendance & Leaves', icon: CalendarCheck },
    { path: '/student/profile', label: 'Profile', icon: UserIcon },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path || location.pathname === '/student/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-emerald-100 shadow-xs shadow-emerald-900/5">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          {/* Student Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20 ring-1 ring-emerald-400/30 shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-black text-emerald-950 tracking-tight truncate">ClassHQ</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200/80 shrink-0">
                  Student
                </span>
              </div>
              <p className="text-[11px] font-semibold text-emerald-800/80 truncate">
                {user?.fullName} • Roll: <span className="font-mono font-black text-emerald-700">{user?.rollNumber || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-emerald-50/70 p-1.5 rounded-2xl border border-emerald-200/60 backdrop-blur-md">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    active
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs shadow-emerald-700/20 scale-[1.02]'
                      : 'text-emerald-800/70 hover:text-emerald-950 hover:bg-emerald-100/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions: Logout & 3-Line Menu Button */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-student-logout"
              type="button"
              onClick={logout}
              className="hidden sm:flex p-2 sm:px-3 sm:py-2 rounded-xl text-slate-700 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>

            {/* 3-Line Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navbar Menu (Slide-out on 3-line button click) */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-emerald-100 bg-white rounded-b-3xl shadow-lg space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-1 gap-1.5">
              {navItems.map((item) => {
                const active = isActive(item.path, item.exact);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black tracking-wide transition-all ${
                      active
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                        : 'text-slate-700 bg-emerald-50/50 hover:bg-emerald-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-70" />
                  </Link>
                );
              })}
            </div>

            <div className="pt-2 border-t border-emerald-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2.5 rounded-2xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-black cursor-pointer flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
