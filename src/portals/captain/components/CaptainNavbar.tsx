import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  ShieldAlert, 
  ClipboardCheck, 
  Users, 
  FileText,
  UserCheck,
  CalendarCheck,
  Palmtree,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Sparkles
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
    { 
      path: '/captain', 
      label: 'Roll Call', 
      shortLabel: 'Roll Call',
      fullLabel: 'Roll-Call Ledger', 
      icon: ClipboardCheck, 
      exact: true 
    },
    { 
      path: '/captain/my-attendance', 
      label: 'My Attendance', 
      shortLabel: 'Attendance',
      fullLabel: 'My Attendance & Leaves', 
      icon: CalendarCheck 
    },
    { 
      path: '/captain/holidays', 
      label: 'Holidays', 
      shortLabel: 'Holidays',
      fullLabel: 'Section Academic Holidays', 
      icon: Palmtree 
    },
    { 
      path: '/captain/roster', 
      label: 'Class Students', 
      shortLabel: 'Students',
      fullLabel: 'Class Students & Approvals', 
      icon: Users 
    },
    { 
      path: '/captain/leaves', 
      label: 'Leaves', 
      shortLabel: 'Leaves',
      fullLabel: 'Section Leave Applications', 
      icon: FileText 
    },
    { 
      path: '/captain/profile', 
      label: 'Profile', 
      shortLabel: 'Profile',
      fullLabel: 'Captain Dossier Profile', 
      icon: UserCheck 
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path || location.pathname === '/captain/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 backdrop-blur-xl border-b border-sky-500/30 shadow-[0_4px_25px_rgba(2,132,199,0.22)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-6">
        <div className="flex items-center justify-between min-h-[3.5rem] sm:min-h-[4rem] py-1 sm:py-1.5 gap-1 sm:gap-2">
          {/* Captain Identity Branding */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 pr-1 sm:pr-2">
            <div className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 lg:w-9.5 lg:h-9.5 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-500 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-sky-500/30 ring-1 sm:ring-2 ring-sky-400/40 shrink-0">
              <ShieldAlert className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                <span className="text-xs sm:text-sm lg:text-base font-black text-white tracking-tight leading-none drop-shadow-xs">
                  ClassHQ
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-wider bg-sky-500/25 text-sky-200 border border-sky-400/50 shadow-xs shrink-0">
                  Captain HQ
                </span>
                <span className="hidden xl:inline-flex px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-500/20 text-cyan-200 border border-cyan-400/40 shrink-0">
                  Sec {currentSection} • {currentBatch}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-sky-200/90 truncate mt-0.5 leading-tight">
                <span className="text-white font-bold">{user?.fullName || 'Captain'}</span> • <span className="text-sky-300 font-extrabold">Sec {currentSection}</span> • <span className="font-mono text-cyan-300 font-bold">Roll {user?.rollNumber || 'N/A'}</span>
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation (Optimized for 768px+ screens) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-slate-900/90 p-0.5 sm:p-1 rounded-xl lg:rounded-2xl border border-sky-500/30 shadow-inner backdrop-blur-md shrink-0">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 lg:gap-1.5 px-1.5 md:px-2 lg:px-2.5 xl:px-3 py-1 lg:py-1.5 rounded-lg lg:rounded-xl text-[10px] lg:text-[11px] xl:text-xs font-black tracking-tight transition-all whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-600/35 ring-1 ring-sky-300/60'
                      : 'text-sky-200/70 hover:text-white hover:bg-sky-500/20'
                  }`}
                  title={item.fullLabel}
                >
                  <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
                  {/* Tablet md: short label; Desktop lg+: standard label */}
                  <span className="hidden lg:inline">{item.label}</span>
                  <span className="inline lg:hidden">{item.shortLabel}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Logout Button (Always Red & Sized for Tablet & Desktop) */}
            <button
              id="btn-captain-logout"
              type="button"
              onClick={logout}
              className="hidden sm:flex px-2 lg:px-2.5 xl:px-3 py-1 lg:py-1.5 rounded-lg lg:rounded-xl text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border border-rose-500 shadow-md shadow-rose-950/40 transition-all items-center gap-1 lg:gap-1.5 text-[10px] lg:text-xs font-black cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-white shrink-0" />
              <span>Logout</span>
            </button>

            {/* Mobile / Narrow Tablet Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-xl bg-slate-900/90 text-sky-200 border border-sky-500/40 hover:bg-sky-900/50 transition-all cursor-pointer shadow-xs"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5 text-sky-200" /> : <Menu className="w-4.5 h-4.5 text-sky-200" />}
            </button>
          </div>
        </div>

        {/* Mobile & Narrow Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t-2 border-sky-500/30 bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 rounded-b-3xl shadow-2xl space-y-2 animate-in slide-in-from-top-2 duration-200">
            {/* Section & Batch Pill */}
            <div className="px-3 py-1.5 rounded-xl bg-sky-900/50 border border-sky-500/30 flex items-center justify-between text-[11px] font-black text-sky-200">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Section {currentSection} HQ
              </span>
              <span className="font-mono text-cyan-300">{currentBatch}</span>
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
                        ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white border-sky-400 shadow-md'
                        : 'text-sky-100 bg-slate-900/70 hover:bg-sky-900/40 border-sky-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-cyan-400'}`} />
                      <span>{item.fullLabel}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${active ? 'text-sky-200' : 'text-sky-400/60'}`} />
                  </Link>
                );
              })}
            </div>

            {/* Mobile Sign Out */}
            <div className="pt-2 border-t border-sky-500/30 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border border-rose-500 text-xs font-black cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>Sign Out from Captain Portal</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
