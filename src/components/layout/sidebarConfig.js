import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  GraduationCap,
  CalendarCheck,
  Settings,
  User,
  Award,
  FileText,   // <-- added for Submissions
} from "lucide-react";

// Navigation items for Admin
export const ADMIN_NAV_ITEMS = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "disciplines", label: "Disciplines", icon: BookOpen },
  { id: "interns", label: "Interns", icon: Users },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "submissions", label: "Submissions", icon: FileText },   // <-- new
  { id: "quizzes", label: "Quizzes", icon: GraduationCap },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
];

// Navigation items for Intern (unchanged)
export const INTERN_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Tasks", icon: ClipboardList },
  { id: "quizzes", label: "Quizzes", icon: Award },
  { id: "attendance", label: "Attendance", icon: CalendarCheck },
  { id: "profile", label: "Profile", icon: User },
];