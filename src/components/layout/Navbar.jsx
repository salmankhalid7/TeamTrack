// src/components/layout/DashboardNavbar.jsx
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  Menu, X, LayoutDashboard, ListTodo, TrendingUp, FileText, BookOpen,
  User, Settings, Shield, HelpCircle, LogOut, Bell, ChevronDown,
  AlertCircle, CheckCircle, Clock, Info,
} from 'lucide-react';
import { useAuth } from '../../auth/useAuth';
import { useNotifications, useMarkNotificationRead } from '../../api/queries';
import { formatDate, cn } from '../../utils/helpers';
import { useToast } from '../ui/Toast';

// --- Default navigation items (can be overridden via props) ---
const DEFAULT_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'My Tasks', href: '/tasks', icon: ListTodo },
  { label: 'Progress', href: '/progress', icon: TrendingUp },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Resources', href: '/resources', icon: BookOpen },
];

const DEFAULT_PROFILE_ITEMS = [
  { label: 'My Profile', href: '/profile', icon: User },
  { label: 'Account Settings', href: '/settings', icon: Settings },
  { label: 'Security', href: '/security', icon: Shield },
  { label: 'Help', href: '/help', icon: HelpCircle },
];

// --- Sub‑Components ---

// 1. Notification Bell
const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const shouldReduceMotion = useReducedMotion();
  const toast = useToast();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleMarkAsRead = async (id) => {
    // Only mark if unread
    const notification = notifications.find(n => n.id === id);
    if (!notification || notification.is_read) return;

    try {
      await markAsRead.mutateAsync(id);
    } catch (error) {
      toast.error('Failed to mark notification as read.');
    }
  };

  const getNotificationIcon = (type) => {
    const baseClass = 'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0';
    const iconMap = {
      attendance_warning: { icon: Clock, className: 'bg-yellow-100 text-yellow-600' },
      task_pending: { icon: FileText, className: 'bg-blue-100 text-blue-600' },
      quiz_result: { icon: CheckCircle, className: 'bg-green-100 text-green-600' },
      default: { icon: Info, className: 'bg-gray-100 text-gray-600' },
    };
    const config = iconMap[type] || iconMap.default;
    const Icon = config.icon;
    return (
      <div className={`${baseClass} ${config.className}`}>
        <Icon className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-[#0080c8] hover:bg-slate-100 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#0080c8]"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
            className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-slate-200/50 z-50 overflow-hidden"
            role="menu"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs text-[#0080c8] font-medium">
                  {unreadCount} unread
                </span>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="px-4 py-8 text-center space-y-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-full animate-pulse mx-auto" />
                  <p className="text-sm text-slate-400">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">All caught up!</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer border-b border-slate-50 last:border-0',
                      !notification.is_read && 'bg-[#f0f7ff]'
                    )}
                    onClick={() => handleMarkAsRead(notification.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleMarkAsRead(notification.id)}
                  >
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn('text-sm', !notification.is_read ? 'font-semibold text-slate-800' : 'text-slate-600')}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-[#0080c8] rounded-full flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                      )}
                      <p className="text-xs text-slate-300 mt-1">
                        {formatDate(notification.created_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/50 text-center">
                <Link to="/notifications" className="text-xs text-[#0080c8] hover:underline font-medium">
                  View all notifications
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 2. Logout Confirmation Dialog
const LogoutDialog = ({ isOpen, onClose, onConfirm, isLoading }) => {
  const dialogRef = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const toast = useToast();

  // Trap focus inside dialog when open
  useEffect(() => {
    if (isOpen) {
      const focusableElements = dialogRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements && focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
        className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <LogOut className="w-6 h-6 text-red-600" />
          </div>
          <h3 id="logout-dialog-title" className="text-lg font-semibold text-slate-800">
            Log out of InternTrack?
          </h3>
          <p className="mt-2 text-sm text-slate-500">
            You will be redirected to the login page and all unsaved data will be lost.
          </p>
          <div className="mt-6 flex w-full gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Logging out...
                </>
              ) : (
                'Yes, Log out'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Main DashboardNavbar Component ---
export function Navbar({
  navItems = DEFAULT_NAV_ITEMS,
  profileItems = DEFAULT_PROFILE_ITEMS,
  appName = 'InternTrack',
  appIcon = LayoutDashboard,
}) {
  const { isAuthenticated, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const toast = useToast();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const mobileMenuRef = useRef(null);
  const profileDropdownRef = useRef(null);

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileDropdownOpen(false);
  }, [location.pathname]);

  // Click outside for profile dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Escape key for mobile menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  // Trap focus inside mobile menu when open
  useEffect(() => {
    if (isMobileMenuOpen && mobileMenuRef.current) {
      const focusable = mobileMenuRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length) {
        focusable[0].focus();
      }
    }
  }, [isMobileMenuOpen]);

  const toggleMobileMenu = useCallback(() => setIsMobileMenuOpen((prev) => !prev), []);
  const toggleProfileDropdown = useCallback(() => setIsProfileDropdownOpen((prev) => !prev), []);

  const isActiveLink = useCallback(
    (href) => location.pathname === href || location.pathname.startsWith(href + '/'),
    [location.pathname]
  );

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
      setIsLoggingOut(false);
      setShowLogoutDialog(false);
    }
  }, [logout, navigate, toast]);

  // Redirect if not authenticated (protect page)
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  // Get display name from profile
  const displayName = profile?.full_name || profile?.name || 'User';
  const userRole = profile?.role || 'Member';

  const AppIcon = appIcon;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/50 h-[72px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          {/* Left – Logo */}
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0080c8] to-[#00a8e8] flex items-center justify-center shadow-lg shadow-[#0080c8]/20 group-hover:shadow-[#0080c8]/40 transition-shadow">
                <AppIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#2b2d42]">
                <span className="text-[#0080c8]">Intern</span>Track
              </span>
            </Link>
            <div className="hidden lg:block h-6 w-px bg-slate-200 mx-1" />
            <span className="hidden lg:block text-sm font-medium text-slate-600">
              {navItems.find(item => isActiveLink(item.href))?.label || 'Dashboard'}
            </span>
          </div>

          {/* Center – Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navItems.map((item) => {
              const isActive = isActiveLink(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    'relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2',
                    isActive ? 'text-[#0080c8] bg-[#0080c8]/5' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="active-nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-[#0080c8] rounded-full"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right – Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />

            {/* Profile Dropdown (Desktop) */}
            <div className="relative hidden md:block" ref={profileDropdownRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-2.5 pl-2 pr-1.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0080c8]"
                aria-label="User menu"
                aria-expanded={isProfileDropdownOpen}
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0080c8] to-[#00a8e8] flex items-center justify-center text-white text-sm font-medium ring-2 ring-white">
                  {displayName.charAt(0)}
                </div>
                <div className="hidden lg:flex flex-col items-start text-left">
                  <span className="text-sm font-medium text-slate-800 leading-none">{displayName}</span>
                  <span className="text-xs text-slate-500 capitalize leading-none mt-1">{userRole}</span>
                </div>
                <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform duration-200', isProfileDropdownOpen && 'rotate-180')} />
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200/50 py-1.5 overflow-hidden"
                    role="menu"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-sm font-semibold text-slate-800">{displayName}</p>
                      <p className="text-xs text-slate-500 capitalize">{userRole}</p>
                    </div>
                    {profileItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors group"
                          role="menuitem"
                        >
                          <Icon className="w-4 h-4 text-slate-400 group-hover:text-[#0080c8] transition-colors" />
                          {item.label}
                        </Link>
                      );
                    })}
                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => { setShowLogoutDialog(true); setIsProfileDropdownOpen(false); }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform" />
                        Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-[#0080c8]"
              aria-label="Toggle navigation menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-slate-700" /> : <Menu className="w-6 h-6 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.nav
              ref={mobileMenuRef}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30, duration: shouldReduceMotion ? 0 : 0.3 }}
              className="fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl z-40 flex flex-col pt-4 pb-6 overflow-y-auto md:hidden safe-area-inset-bottom"
              aria-label="Mobile navigation"
              role="navigation"
            >
              <div className="px-6 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <Link to="/dashboard" className="flex items-center gap-2.5" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0080c8] to-[#00a8e8] flex items-center justify-center">
                      <AppIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-[#2b2d42]">
                      <span className="text-[#0080c8]">Intern</span>Track
                    </span>
                  </Link>
                  <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" aria-label="Close menu">
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>
              </div>

              <div className="flex-1 px-4 py-6 space-y-1">
                {navItems.map((item) => {
                  const isActive = isActiveLink(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                        isActive ? 'bg-[#0080c8]/5 text-[#0080c8]' : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>

              <div className="px-4 mt-auto border-t border-slate-100 pt-4">
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0080c8] to-[#00a8e8] flex items-center justify-center text-white font-medium">
                    {displayName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{displayName}</p>
                    <p className="text-xs text-slate-500 capitalize truncate">{userRole}</p>
                  </div>
                </div>

                <div className="space-y-0.5">
                  {profileItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <Icon className="w-4 h-4 text-slate-400" />
                        {item.label}
                      </Link>
                    );
                  })}
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setShowLogoutDialog(true); }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* Logout Dialog */}
      <LogoutDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleLogout}
        isLoading={isLoggingOut}
      />
    </>
  );
}