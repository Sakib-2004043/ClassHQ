import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Building2, 
  Users, 
  Clock,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  Settings,
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

  const navItems = [
    { path: '/admin/students', label: 'Approved Students', mobileLabel: 'Students', icon: Users, exact: true },
    { path: '/admin/pending-students', label: 'Pending Approvals', mobileLabel: 'Pending', icon: Clock, badge: pendingStudentsCount },
    { path: '/admin/profile', label: 'My Profile & Security', mobileLabel: 'Profile', icon: ShieldCheck },
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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-rose-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Admin Identity - Responsive Branding */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-red-500 to-rose-400 text-white flex items-center justify-center font-black shadow-md shadow-rose-200/60 ring-1 ring-rose-300 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-black text-slate-900 tracking-tight leading-none">ClassHQ</span>
                <span className="hidden xs:inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                  Admin
                </span>
              </div>
              <p className="text-[11px] font-bold text-slate-500 truncate mt-0.5">
                <span className="text-slate-700">{user?.fullName || 'Chief Governor'}</span>
                <span className="hidden sm:inline text-rose-600 font-black"> • CHIEF GOVERNOR</span>
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden xl:flex items-center gap-1 bg-rose-50/80 p-1 rounded-2xl border border-rose-200/60 backdrop-blur-md">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                    active
                      ? 'bg-rose-600 text-white shadow-sm shadow-rose-200 ring-1 ring-rose-500'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-rose-100/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black ${
                      active ? 'bg-white text-rose-700' : 'bg-rose-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              to="/admin/settings"
              className={`h-9 px-2.5 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-black active:scale-95 border ${
                isActive('/admin/settings')
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'text-slate-700 bg-slate-100/90 hover:bg-rose-50 hover:text-rose-700 border-slate-200/80 hover:border-rose-200'
              }`}
              title="System Settings"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Settings</span>
            </Link>

            <Link
              to="/admin/profile"
              className={`h-9 px-2.5 sm:px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-black active:scale-95 border ${
                isActive('/admin/profile')
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'text-slate-700 bg-slate-100/90 hover:bg-rose-50 hover:text-rose-700 border-slate-200/80 hover:border-rose-200'
              }`}
              title="Admin Profile & Security"
            >
              <UserIcon className="w-4 h-4 shrink-0" />
              <span className="hidden md:inline">Profile</span>
            </Link>

            <button
              id="btn-admin-logout"
              type="button"
              onClick={logout}
              className="h-9 px-2.5 sm:px-3 rounded-xl text-slate-600 hover:text-rose-700 bg-slate-100/90 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 transition-all flex items-center justify-center gap-1.5 text-xs font-black active:scale-95"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Full-Width Segmented Tab Control (xl:hidden) */}
        <div className="pb-2.5 pt-0.5 xl:hidden">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 shadow-inner">
            {navItems.map((item) => {
              const active = isActive(item.path, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center justify-center gap-1.5 py-2 px-1.5 rounded-xl text-xs uppercase tracking-wider transition-all text-center min-w-0 ${
                    active
                      ? 'bg-white text-rose-700 font-black shadow-xs border border-rose-200/80'
                      : 'text-slate-600 font-bold hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-rose-600' : 'text-slate-500'}`} />
                  <span className="truncate">{item.mobileLabel}</span>
                  {Boolean(item.badge && item.badge > 0) && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black shrink-0 ${
                      active ? 'bg-rose-600 text-white' : 'bg-rose-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};

