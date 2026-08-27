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
    { path: '/captain', label: 'Roll Call', fullLabel: 'Roll-Call Ledger', icon: ClipboardCheck, exact: true },
    { path: '/captain/my-attendance', label: 'My Attendance', fullLabel: 'My Attendance', icon: CalendarCheck },
    { path: '/captain/roster', label: 'Class Students', fullLabel: 'Class Students & Approvals', icon: Users },
    { path: '/captain/leaves', label: 'Leaves', fullLabel: 'Section Leaves', icon: FileText },
    { path: '/captain/profile', label: 'Profile', fullLabel: 'My Profile', icon: UserCheck },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path || location.pathname === '/captain/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b-2 border-sky-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between min-h-[4rem] py-2 gap-2 sm:gap-3">
          {/* Captain Branding */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-sky-600 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-sm shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none">ClassHQ</span>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200 shrink-0">
                  Captain HQ
                </span>
                <span className="hidden xl:inline-flex px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200 shrink-0">
                  Sec {currentSection} ({currentBatch})
                </span>
              </div>
              <p className="text-[11px] font-semibold text-slate-500 truncate mt-0.5 max-w-[200px] sm:max-w-[240px] md:max-w-[180px] lg:max-w-[240px]">
                {user?.fullName || 'Captain'} • <span className="text-slate-400">Sec {currentSection}</span> • Roll: <span className="font-mono text-sky-700 font-bold">{user?.rollNumber || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-sky-50/90 p-1 rounded-xl border border-sky-200/80 shrink-0">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-sky-100/80'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Logout & Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Logout Button */}
            <button
              id="btn-captain-logout"
              type="button"
              onClick={logout}
              className="hidden sm:flex px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Logout</span>
            </button>

            {/* 3-Line Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl bg-sky-50 text-sky-900 border border-sky-200 hover:bg-sky-100 transition-all cursor-pointer"
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
