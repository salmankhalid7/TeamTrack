import { useLayout } from "../../context/LayoutContext";
import { cn } from "../../utils/helpers";

const AdminLayout = ({ children }) => {
  const { isCollapsed, isMobileOpen, sidebarWidth } = useLayout();

  // For desktop, we compute left padding based on sidebar width
  // For mobile, we don't add padding because sidebar overlays.
  const leftPaddingClass = isMobileOpen ? "pl-0" : "pl-0 lg:pl-" + (isCollapsed ? "20" : "64");

  // We'll use inline style for precise width and transition
  const mainStyle = {
    marginLeft: isMobileOpen ? 0 : sidebarWidth,
    transition: "margin-left 300ms ease-in-out",
  };

  return (
    <div
      className="flex-1 flex flex-col min-h-screen bg-gray-50"
      style={mainStyle}
    >
      {children}
    </div>
  );
};

export default AdminLayout;