import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import {
  LayoutDashboard,
  User,
  BookOpen,
  FileText,
  CalendarCheck,
  Calendar,
  GraduationCap,
  Award,
  FolderDown,
  Megaphone,
  Inbox,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Briefcase,
  ExternalLink,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'My Profile', path: '/profile', icon: User },
  { name: 'My Courses', path: '/courses', icon: BookOpen },
  { name: 'Assignments', path: '/assignments', icon: FileText },
  { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
  { name: 'Timetable', path: '/timetable', icon: Calendar },
  { name: 'Examinations', path: '/examinations', icon: GraduationCap },
  { name: 'Results', path: '/results', icon: Award },
  { name: 'Study Materials', path: '/materials', icon: FolderDown },
  { name: 'Announcements', path: '/announcements', icon: Megaphone },
  { name: 'My Requests', path: '/requests', icon: Inbox },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Layout = ({ children, title = 'Student Portal' }) => {
  const { user, logout } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    // Fetch unread notifications count
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        const unread = res.data.filter((n) => !n.is_read).length;
        setUnreadCount(unread);
      } catch {
        // Silent fail
      }
    };
    if (user) {
      fetchUnread();
    }
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    success('You have been logged out securely.');
    navigate('/login');
  };

  // Determine current active page name for breadcrumb
  const currentNav = navItems.find((item) => item.path === location.pathname);
  const currentPageTitle = currentNav ? currentNav.name : title;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-brand-950 text-slate-100 flex flex-col border-r border-brand-900 shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-20 flex items-center justify-between px-6 bg-brand-900/50 border-b border-brand-800/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-sky-400 flex items-center justify-center shadow-lg shadow-brand-500/20 text-white font-bold text-xl">
              U
            </div>
            <div>
              <h1 className="font-bold text-base tracking-wide text-white">AITAM University</h1>
              <p className="text-xs text-brand-300 font-medium">Academic Portal 2026</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-lg text-brand-300 hover:text-white hover:bg-brand-800/50 focus:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Profile Badge */}
        <div className="px-6 py-4 mx-4 my-3 rounded-xl bg-brand-900/40 border border-brand-800/40 flex items-center space-x-3">
          <div className="w-11 h-11 rounded-full bg-brand-700 border-2 border-brand-400/40 flex items-center justify-center text-white font-semibold text-sm overflow-hidden flex-shrink-0">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name || 'Student'}</p>
            <p className="text-xs text-brand-300 truncate font-mono">
              {user?.roll_number || user?.email}
            </p>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider uppercase rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/20">
            {user?.role}
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
          <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-brand-400/80">
            Student Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isNotifications = item.path === '/notifications';

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-brand-900/50'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-5 h-5 flex-shrink-0 opacity-90" />
                  <span>{item.name}</span>
                </div>
                {isNotifications && unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500 text-slate-950">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Special Admin/Faculty shortcuts if authorized */}
          {user?.role === 'admin' && (
            <div className="pt-4 border-t border-brand-900/80">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-rose-400">
                Administration
              </div>
              <NavLink
                to="/admin"
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-200 hover:bg-rose-950/40 hover:text-rose-100 transition-colors"
              >
                <Shield className="w-5 h-5" />
                <span>Admin Console</span>
              </NavLink>
            </div>
          )}

          {user?.role === 'faculty' && (
            <div className="pt-4 border-t border-brand-900/80">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                Faculty Portal
              </div>
              <NavLink
                to="/faculty"
                className="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-emerald-200 hover:bg-emerald-950/40 hover:text-emerald-100 transition-colors"
              >
                <Briefcase className="w-5 h-5" />
                <span>Faculty Console</span>
              </NavLink>
            </div>
          )}
        </nav>

        {/* Sidebar Footer Logout Option */}
        <div className="p-4 border-t border-brand-900/80">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:text-white hover:bg-rose-900/40 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-20 bg-white border-b border-slate-200/80 flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb Navigation */}
            <div>
              <div className="flex items-center space-x-2 text-xs font-medium text-slate-500">
                <span>Academic Portal</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-brand-600 font-semibold">{currentPageTitle}</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">{currentPageTitle}</h2>
            </div>
          </div>

          {/* Right Header Icons & Profile */}
          <div className="flex items-center space-x-4">
            {/* Notifications Button */}
            <button
              onClick={() => navigate('/notifications')}
              className="relative p-2.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Quick Profile Menu */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-3 p-1.5 pr-3 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>
                <div className="hidden sm:block text-left text-xs">
                  <p className="font-semibold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-slate-500 font-mono text-[11px] leading-tight">{user?.roll_number || user?.role}</p>
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 text-left transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 text-left transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </button>

                  <div className="my-1 border-t border-slate-100" />

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content View */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
