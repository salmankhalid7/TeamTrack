// src/components/layout/DashboardHeader.jsx
import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, User, ChevronDown, Menu, LogOut, Settings, Shield, HelpCircle } from "lucide-react";
import { cn } from "../../utils/helpers";
import { useAuth } from "../../auth/useAuth";
import { useNotifications, useMarkNotificationRead } from "../../api/queries";
import { formatDate } from "../../utils/helpers";
import { useLayout } from "../../context/LayoutContext";
import { useToast } from "../ui/Toast";

const DashboardHeader = ({ title, breadcrumbs }) => {
  const { openMobile } = useLayout();
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  const { data: notifications = [] } = useNotifications();
  const markAsRead = useMarkNotificationRead();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    notifications
      .filter((n) => !n.is_read)
      .forEach((n) => markAsRead.mutate(n.id));
  };

  const handleNotificationClick = (id) => {
    markAsRead.mutate(id);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setShowProfile(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 transition-all duration-300 ease-in-out">
      <div className="flex items-center gap-4">
        <button
          onClick={openMobile}
          className="lg:hidden p-2 -ml-2 rounded-md hover:bg-gray-100 transition-colors"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
          {breadcrumbs && (
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {breadcrumbs.map((crumb, i) => (
                <span key={i}>
                  {i > 0 && <span className="mx-1">/</span>}
                  <span className={i === breadcrumbs.length - 1 ? "text-gray-700 font-medium" : ""}>
                    {crumb}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 animate-slideDown">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-medium text-gray-800">Notifications</span>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#0080c8] hover:underline"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-sm text-gray-500 text-center">No notifications</div>
                ) : (
                  notifications.slice(0, 10).map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                        !notif.is_read && "bg-blue-50/50"
                      )}
                    >
                      <p className="text-sm text-gray-800">{notif.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(notif.created_at)}
                      </p>
                    </button>
                  ))
                )}
              </div>
              {notifications.length > 10 && (
                <div className="px-4 py-2 border-t border-gray-100 text-center">
                  <Link to="/notifications" className="text-xs text-[#0080c8] hover:underline">
                    View all
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-[#0080c8]/10 flex items-center justify-center text-[#0080c8] font-semibold text-sm">
              {profile?.full_name?.[0]?.toUpperCase() || "U"}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
          {showProfile && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50 animate-slideDown">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-800">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-gray-500">{profile?.email}</p>
              </div>
              <div className="py-1">
              </div>
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;