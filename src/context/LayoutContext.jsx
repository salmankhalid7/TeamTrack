import { createContext, useContext, useState, useEffect, useMemo } from "react";

const LayoutContext = createContext();

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) throw new Error("useLayout must be used within LayoutProvider");
  return context;
};

export const LayoutProvider = ({ children }) => {
  // Desktop: expanded or collapsed
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved !== null ? JSON.parse(saved) : false;
  });

  // Mobile: drawer open/closed
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Save to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Close mobile drawer on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMobileOpen]);

  const toggleCollapse = () => setIsCollapsed((prev) => !prev);

  const openMobile = () => setIsMobileOpen(true);
  const closeMobile = () => setIsMobileOpen(false);

  const sidebarWidth = isCollapsed ? 80 : 256; // 5rem or 16rem

  const value = useMemo(
    () => ({
      isCollapsed,
      setIsCollapsed,
      toggleCollapse,
      isMobileOpen,
      setIsMobileOpen,
      openMobile,
      closeMobile,
      sidebarWidth,
    }),
    [isCollapsed, isMobileOpen, sidebarWidth]
  );

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};