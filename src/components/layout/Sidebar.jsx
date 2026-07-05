import { useState } from "react";
import { useLayout } from "../../context/LayoutContext";
import { Settings, LogOut, ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "../../utils/helpers";

const Sidebar = ({
  activeItem,
  onSelect,
  onLogout,
  items,
  showSettings = true,
  subtitle = "Admin Panel", // explicit subtitle
}) => {
  const { isCollapsed, toggleCollapse, isMobileOpen, closeMobile } = useLayout();
  const [isHovered, setIsHovered] = useState(false);

  const isExpanded = !isCollapsed || isHovered;

  const handleNavClick = (id) => {
    onSelect(id);
    if (isMobileOpen) closeMobile();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={closeMobile}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col",
          "lg:translate-x-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          "shadow-xl lg:shadow-none"
        )}
        style={{ width: isMobileOpen ? 256 : isExpanded ? 256 : 80 }}
        role="navigation"
        aria-label="Main navigation"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Logo & toggle */}
        <div className="flex items-center h-16 px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              className={cn(
                "transition-opacity duration-300 whitespace-nowrap",
                isExpanded ? "opacity-100" : "opacity-0 w-0"
              )}
            >
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                TechTide
              </p>
              <p className="text-xs text-gray-500">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={toggleCollapse}
            className="hidden lg:flex ml-auto p-1 rounded-md hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-500" />
            )}
          </button>
          <button
            onClick={closeMobile}
            className="lg:hidden ml-auto p-1 rounded-md hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-[#0080c8]/10 text-[#0080c8] font-semibold"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
                  !isExpanded && "justify-center"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isActive ? "text-[#0080c8]" : "text-gray-500 group-hover:text-gray-700"
                  )}
                />
                <span
                  className={cn(
                    "truncate transition-opacity duration-300",
                    isExpanded ? "opacity-100" : "opacity-0 w-0"
                  )}
                >
                  {item.label}
                </span>
                {!isExpanded && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                    {item.label}
                  </div>
                )}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#0080c8] rounded-r-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom: Settings & Logout */}
        <div className="border-t border-gray-100 p-3 space-y-1 shrink-0">
          {showSettings && (
            <button
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors",
                !isExpanded && "justify-center"
              )}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span
                className={cn(
                  "truncate transition-opacity",
                  isExpanded ? "opacity-100" : "opacity-0 w-0"
                )}
              >
                Settings
              </span>
            </button>
          )}
          <button
            onClick={onLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors",
              !isExpanded && "justify-center"
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span
              className={cn(
                "truncate transition-opacity",
                isExpanded ? "opacity-100" : "opacity-0 w-0"
              )}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;