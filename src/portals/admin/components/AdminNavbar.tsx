import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Clock,
  LogOut,
  User as UserIcon,
  Settings,
  Key,
  ShieldAlert,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

interface AdminNavbarProps {
  pendingStudentsCount?: number;
}

export const AdminNavbar: React.FC<AdminNavbarProps> = ({
  pendingStudentsCount = 0,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { 
      path: '/admin/students', 
      label: 'Students', 
      fullLabel: 'Approved Students',
      icon: Users, 
      exact: true 
    },
    { 
      path: '/admin/pending-students', 
      label: 'Pending', 
      fullLabel: 'Pending Approvals',
      icon: Clock, 
      badge: pendingStudentsCount 
    },
    { 
      path: '/admin/overrides', 
      label: 'Grants', 
      fullLabel: 'Roll-Call Grants',
      icon: Key 
    },
    { 
      path: '/admin/settings', 
      label: 'Attendance Settings', 
      fullLabel: 'Attendance Settings',
      icon: Clock 
    },
    { 
      path: '/admin/profile', 
      label: 'Profile', 
      fullLabel: 'Admin Profile',
      icon: UserIcon 
    },
  ];

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      if (path === '/admin/students') {
        return location.pathname === '/admin/students' || location.pathname === '/admin' || location.pathname === '/admin/' || location.pathname === '/admin/overview';
      }
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-r from-slate-950 via-rose-950 to-slate-900 backdrop-blur-xl border-b border-rose-500/30 shadow-[0_4px_25px_rgba(225,29,72,0.22)]">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 lg:px-6">
        <div className="flex items-center justify-between min-h-[3.5rem] sm:min-h-[4rem] py-1 sm:py-1.5 gap-1 sm:gap-2">
          {/* Admin Identity Branding */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1 pr-1 sm:pr-2">
            <div className="w-7.5 h-7.5 sm:w-8.5 sm:h-8.5 lg:w-9.5 lg:h-9.5 rounded-xl bg-gradient-to-tr from-rose-500 via-red-600 to-rose-700 text-white flex items-center justify-center font-black shadow-md shadow-rose-600/30 ring-1 sm:ring-2 ring-rose-400/40 shrink-0">
              <Building2 className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5 whitespace-nowrap">
                <span className="text-xs sm:text-sm lg:text-base font-black text-white tracking-tight leading-none drop-shadow-xs">
                  ClassHQ
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-wider bg-rose-500/25 text-rose-200 border border-rose-400/50 shadow-xs shrink-0">
                  Admin HQ
                </span>
                <span className="hidden xl:inline-flex px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase tracking-wider bg-red-500/20 text-rose-200 border border-red-400/30 shrink-0">
                  Governor
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-medium text-rose-200/90 truncate mt-0.5 leading-tight">
                <span className="text-white font-bold">{user?.fullName || 'Chief Governor'}</span> • <span className="text-rose-400 font-extrabold">GOVERNOR</span>
              </p>
            </div>
          </div>

          {/* Desktop & Tablet Navigation (Optimized Responsive Pill Bar) */}
          <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 bg-slate-900/90 p-0.5 sm:p-1 rounded-xl lg:rounded-2xl border border-rose-500/30 shadow-inner backdrop-blur-md shrink-0">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 lg:gap-1.5 px-1.5 md:px-2 lg:px-2.5 xl:px-3 py-1 lg:py-1.5 rounded-lg lg:rounded-xl text-[10px] lg:text-[11px] xl:text-xs font-black tracking-tight transition-all whitespace-nowrap ${
                    active
                      ? 'bg-gradient-to-r from-rose-500 via-red-600 to-rose-600 text-white shadow-md shadow-rose-600/35 ring-1 ring-rose-300/60'
                      : 'text-rose-200/70 hover:text-white hover:bg-rose-500/20'
                  }`}
                  title={item.fullLabel}
                >
                  <Icon className="w-3 h-3 lg:w-3.5 lg:h-3.5 shrink-0" />
                  <span className="hidden xl:inline">{item.fullLabel}</span>
                  <span className="inline xl:hidden">{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[8px] sm:text-[9px] font-black shrink-0 ${
                      active ? 'bg-white text-rose-700' : 'bg-rose-500 text-white shadow-xs'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Logout Button (Solid Red on Tablet & Desktop) */}
            <button
              id="btn-admin-logout"
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
              className="md:hidden p-1.5 sm:p-2 rounded-xl bg-slate-900/90 text-rose-200 border border-rose-500/40 hover:bg-rose-900/50 transition-all cursor-pointer shadow-xs"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-4.5 h-4.5 text-rose-200" /> : <Menu className="w-4.5 h-4.5 text-rose-200" />}
            </button>
          </div>
        </div>

        {/* Mobile & Narrow Drawer Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 px-2 border-t border-rose-500/30 bg-gradient-to-b from-slate-950 via-rose-950 to-slate-900 rounded-b-3xl shadow-2xl space-y-2 animate-in slide-in-from-top-2 duration-200">
            {/* Quick Status Pill */}
            <div className="px-3 py-1.5 rounded-xl bg-rose-900/50 border border-rose-500/30 flex items-center justify-between text-[11px] font-black text-rose-200">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Administrative Governor Control
              </span>
              {pendingStudentsCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-md bg-rose-600 text-white font-mono text-[10px]">
                  {pendingStudentsCount} Pending
                </span>
              ) : (
                <span className="text-rose-300 font-mono text-[10px]">All Clear</span>
              )}
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
                        ? 'bg-gradient-to-r from-rose-500 via-red-600 to-rose-600 text-white border-rose-400 shadow-md'
                        : 'text-rose-100 bg-slate-900/70 hover:bg-rose-900/40 border-rose-500/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-rose-400'}`} />
                      <span>{item.fullLabel}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {Boolean(item.badge && item.badge > 0) && (
                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-500 text-white">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className={`w-4 h-4 ${active ? 'text-rose-200' : 'text-rose-400/60'}`} />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Sign Out Button */}
            <div className="pt-2 border-t border-rose-500/30 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 border border-rose-500 text-xs font-black cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>Sign Out from Admin HQ</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};



