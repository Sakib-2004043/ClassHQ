import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  ClipboardCheck, 
  Users, 
  FileText,
  UserCheck,
  CalendarCheck,
  LogOut,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface CaptainNavbarProps {
  assignedBatch?: string;
  assignedSection?: string;
  todayMarked?: boolean;
}

export const CaptainNavbar: React.FC<CaptainNavbarProps> = ({
  assignedBatch,
  assignedSection,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const currentBatch = assignedBatch || user?.assignedBatch || user?.batch || 'HSC 2026';
  const currentSection = assignedSection || user?.assignedSection || user?.section || 'A';

  const navItems = [
    { path: '/captain', label: 'Roll-Call Ledger', shortLabel: 'Roll-Call', icon: ClipboardCheck, exact: true },
    { path: '/captain/my-attendance', label: 'My Attendance', shortLabel: 'My Attendance', icon: CalendarCheck },
    { path: '/captain/roster', label: 'Class Students & Approvals', shortLabel: 'Roster', icon: Users },
    { path: '/captain/leaves', label: 'Section Leaves', shortLabel: 'Leaves', icon: FileText },
    { path: '/captain/profile', label: 'My Profile', shortLabel: 'Profile', icon: UserCheck },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path || location.pathname === '/captain/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b-2 border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-5 lg:px-8">
        <div className="flex items-center justify-between h-15 sm:h-16 md:h-17">
          {/* Captain Branding */}
          <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                <span className="text-sm sm:text-base md:text-lg font-black text-slate-900 tracking-tight">ClassHQ</span>
                <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                  Captain HQ
                </span>
                <span className="hidden sm:inline-flex px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                  Sec {currentSection} ({currentBatch})
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-slate-500 truncate">
                Captain {user?.fullName || 'User'} • Roll: <span className="font-mono text-sky-700 font-bold">{user?.rollNumber || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Nav Items */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 bg-sky-50/90 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-sky-200/80">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 lg:px-3.5 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[11px] lg:text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-sm scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden xl:inline">{item.label}</span>
                  <span className="inline xl:hidden">{item.shortLabel}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Logout & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Logout Button */}
            <button
              id="btn-captain-logout"
              type="button"
              onClick={logout}
              className="hidden sm:flex px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>

            {/* 3-Line Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100 transition-all cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Slide-out on 3-line button click) */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t-2 border-sky-100 bg-white/95 rounded-b-3xl shadow-lg space-y-2 animate-in slide-in-from-top-2 duration-200">
            {/* Nav Links List */}
            <div className="grid grid-cols-1 gap-1">
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
                        ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md'
                        : 'text-slate-700 bg-sky-50/50 hover:bg-sky-100'
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

            {/* Mobile Logout */}
            <div className="pt-2 border-t border-sky-100 flex items-center justify-stretch">
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
