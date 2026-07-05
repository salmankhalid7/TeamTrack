// AdminDashboard.jsx
import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../auth/useAuth";
import { useLayout } from "../context/LayoutContext";
import Sidebar from "../components/layout/Sidebar";
import { ADMIN_NAV_ITEMS } from "../components/layout/sidebarConfig";
import DashboardHeader from "../components/layout/DashboardHeader";
import {
  useDisciplines,
  useInterns,
  useTasks,
  useSubmissions,
  useApproveTask,
  useReviewSubmission,
  useManageIntern,
  useQuizzes,
  useAttendanceToday,
  useQuizStats,
} from "../api/queries";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { PageLoading } from "../components/ui/LoadingSpinner";
import { formatDate, cn } from "../utils/helpers";
import { useToast } from "../components/ui/Toast";
import { supabase } from "../api/supabase";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { InviteInternModal } from "../components/features/admin/InviteInternModal";
import { TaskEditModal } from "../components/features/admin/TaskEditModal";
import { QuizzesTab } from "../components/features/admin/quizzes/QuizzesTab";
import { useNavigate } from "react-router-dom";

// ─── Lucide Icons ──────────────────────────────────────────────
import {
  Users,
  BookOpen,
  Clock3,
  CheckCircle2,
  CalendarCheck,
  GraduationCap,
  ClipboardList,
  Bell,
  TrendingUp,
  TrendingDown,
  UserPlus,
  FileText,
  Award,
  BarChart3,
  PieChart,
  Activity,
  MoreHorizontal,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  Send,
  Plus,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  X,
} from "lucide-react";

// ─── Chart imports ──────────────────────────────────────────────
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RePieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

// ─── Skeleton Loader Component ────────────────────────────────
const WidgetSkeleton = ({ height = 250 }) => (
  <div className="animate-pulse bg-gray-200 rounded-lg" style={{ height }} />
);

// ─── Helper: sanitize filename ────────────────────────────────
const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9.]/g, "_");
};

// ═══════════════════════════════════════════════════════════════════
// 1. OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════
function OverviewTab({
  disciplines,
  interns,
  tasks,
  submissions,
  selectedDiscipline,
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: attendanceToday = [], isLoading: attendanceLoading } =
    useAttendanceToday(selectedDiscipline);
  const {
    data: quizStats = { totalQuizzes: 0, averageScore: 0 },
    isLoading: quizLoading,
  } = useQuizStats(selectedDiscipline);
  const { data: quizzes = [] } = useQuizzes(selectedDiscipline);

  const totalInterns = interns.length;
  const activeDisciplines = disciplines.length;
  const pendingReviews =
    tasks.filter((t) => t.status === "draft").length +
    submissions.filter((s) => s.status === "pending").length;
  const approvedTasks = tasks.filter((t) => t.status === "approved").length;
  const attendanceCount = attendanceToday.filter(
    (a) => a.status !== "absent",
  ).length;

  // Trends – compute historical pending task trends (last 7 days vs previous 7)
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const getTrend = (items, dateField) => {
    const current = items.filter(
      (i) => new Date(i[dateField]) >= oneWeekAgo,
    ).length;
    const previous = items.filter(
      (i) =>
        new Date(i[dateField]) >= twoWeeksAgo &&
        new Date(i[dateField]) < oneWeekAgo,
    ).length;
    const change =
      previous === 0 ? 0 : Math.round(((current - previous) / previous) * 100);
    return { value: change, positive: change >= 0 };
  };

  // More accurate pending trend – track draft tasks created in those periods
  const pendingTasksLastWeek = tasks.filter(
    (t) => t.status === "draft" && new Date(t.created_at) >= oneWeekAgo,
  ).length;
  const pendingTasksPrevWeek = tasks.filter(
    (t) =>
      t.status === "draft" &&
      new Date(t.created_at) >= twoWeeksAgo &&
      new Date(t.created_at) < oneWeekAgo,
  ).length;
  const pendingChange =
    pendingTasksPrevWeek === 0
      ? 0
      : Math.round(
          ((pendingTasksLastWeek - pendingTasksPrevWeek) /
            pendingTasksPrevWeek) *
            100,
        );

  // Attendance trend – placeholder (we don't have historical data here)
  const attendanceTrend = { value: 0, positive: true };

  const trends = {
    interns: getTrend(interns, "created_at"),
    disciplines: getTrend(disciplines, "created_at"),
    pending: { value: pendingChange, positive: pendingChange >= 0 },
    approved: getTrend(
      tasks.filter((t) => t.status === "approved"),
      "approved_at",
    ),
    attendance: attendanceTrend,
    quizzes: getTrend(quizzes, "created_at"),
  };

  const kpiData = [
    {
      title: "Total Interns",
      value: totalInterns,
      icon: Users,
      color: "blue",
      trend: trends.interns,
      description: "Active interns in the program",
      goal: 50,
    },
    {
      title: "Active Disciplines",
      value: activeDisciplines,
      icon: BookOpen,
      color: "green",
      trend: trends.disciplines,
      description: "Disciplines with content",
      goal: 10,
    },
    {
      title: "Pending Reviews",
      value: pendingReviews,
      icon: Clock3,
      color: "yellow",
      trend: trends.pending,
      description: "Tasks & submissions awaiting approval",
      goal: 0,
    },
    {
      title: "Approved Tasks",
      value: approvedTasks,
      icon: CheckCircle2,
      color: "purple",
      trend: trends.approved,
      description: "Tasks published for interns",
      goal: 100,
    },
    {
      title: "Attendance Today",
      value: attendanceCount,
      icon: CalendarCheck,
      color: "green",
      trend: trends.attendance,
      description: "Interns marked present/late",
      goal: totalInterns || 1,
    },
    {
      title: "Quizzes Generated",
      value: quizStats.totalQuizzes,
      icon: GraduationCap,
      color: "purple",
      trend: trends.quizzes,
      description: "Published quizzes",
      goal: 20,
    },
    {
      title: "Avg. Quiz Score",
      value: `${quizStats.averageScore}%`,
      icon: Award,
      color: "yellow",
      trend: { value: 0, positive: true },
      description: "Across all attempts",
      goal: 80,
    },
  ];

  // Discipline Distribution
  const disciplineDistribution = disciplines.map((d) => ({
    name: d.name,
    value: interns.filter((i) => i.discipline_id === d.id).length,
  }));

  const COLORS = ["#0080c8", "#92dce5", "#f7b731", "#6c5ce7", "#00b894"];

  // Weekly Activity
  const weeklyActivity = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    return days.map((day) => {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);
      return {
        day: new Date(day).toLocaleDateString("en-US", { weekday: "short" }),
        interns: interns.filter(
          (i) => i.created_at >= dayStart && i.created_at < dayEnd,
        ).length,
        tasks: tasks.filter(
          (t) => t.created_at >= dayStart && t.created_at < dayEnd,
        ).length,
        submissions: submissions.filter(
          (s) => s.submitted_at >= dayStart && s.submitted_at < dayEnd,
        ).length,
      };
    });
  }, [interns, tasks, submissions, now]);

  // Submission Trend (stacked bar)
  const submissionTrend = useMemo(() => {
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last30.push(d.toISOString().split("T")[0]);
    }
    return last30.map((day) => {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const daySubs = submissions.filter(
        (s) => s.submitted_at >= dayStart && s.submitted_at < dayEnd,
      );
      return {
        date: new Date(day).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        pending: daySubs.filter((s) => s.status === "pending").length,
        approved: daySubs.filter(
          (s) => s.status === "approved" || s.status === "completed",
        ).length,
        rejected: daySubs.filter(
          (s) => s.status === "rejected" || s.status === "not_completed",
        ).length,
      };
    });
  }, [submissions, now]);

  // Recent Activity (expanded)
  const recentActivities = useMemo(() => {
    const activities = [];

    interns.forEach((i) => {
      activities.push({
        id: `intern-${i.id}`,
        type: "intern",
        user: i.full_name || "New Intern",
        action: "joined the program",
        time: i.created_at,
        avatar: i.full_name?.[0]?.toUpperCase() || "I",
      });
    });

    tasks
      .filter((t) => t.status === "approved" && t.approved_at)
      .forEach((t) => {
        activities.push({
          id: `task-${t.id}`,
          type: "task",
          user: "Admin",
          action: `approved task "${t.title}"`,
          time: t.approved_at,
          avatar: "A",
        });
      });

    submissions.forEach((s) => {
      const statusLabel = s.status === "pending" ? "submitted" : "reviewed";
      activities.push({
        id: `submission-${s.id}`,
        type: "submission",
        user: s.profiles?.full_name || "Intern",
        action: `${statusLabel} a task submission`,
        time: s.submitted_at,
        avatar: s.profiles?.full_name?.[0]?.toUpperCase() || "S",
      });
    });

    disciplines.forEach((d) => {
      activities.push({
        id: `discipline-${d.id}`,
        type: "discipline",
        user: "Admin",
        action: `created discipline "${d.name}"`,
        time: d.created_at,
        avatar: "D",
      });
    });

    quizzes
      .filter((q) => q.status === "published")
      .forEach((q) => {
        activities.push({
          id: `quiz-${q.id}`,
          type: "quiz",
          user: "Admin",
          action: `published quiz "${q.title}"`,
          time: q.updated_at || q.created_at,
          avatar: "Q",
        });
      });

    attendanceToday.forEach((a) => {
      const intern = interns.find((i) => i.id === a.intern_id);
      activities.push({
        id: `attendance-${a.id}`,
        type: "attendance",
        user: intern?.full_name || "Intern",
        action: `marked ${a.status} attendance`,
        time: a.marked_at || a.created_at,
        avatar: intern?.full_name?.[0]?.toUpperCase() || "A",
      });
    });

    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    return activities.slice(0, 20);
  }, [interns, tasks, submissions, disciplines, quizzes, attendanceToday]);

  const getActivityIcon = (type) => {
    switch (type) {
      case "intern":
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case "task":
        return <ClipboardList className="w-4 h-4 text-green-600" />;
      case "submission":
        return <Send className="w-4 h-4 text-purple-600" />;
      case "discipline":
        return <BookOpen className="w-4 h-4 text-indigo-600" />;
      case "quiz":
        return <GraduationCap className="w-4 h-4 text-purple-600" />;
      case "attendance":
        return <CalendarCheck className="w-4 h-4 text-green-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  // Real‑time subscriptions for Overview
  useEffect(() => {
    const channels = [
      supabase
        .channel("overview-interns")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "profiles" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["interns"] });
          },
        ),
      supabase
        .channel("overview-submissions")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "submissions" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["submissions"] });
          },
        ),
      supabase
        .channel("overview-disciplines")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "disciplines" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["disciplines"] });
          },
        ),
      supabase
        .channel("overview-quizzes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "quizzes" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["quizzes"] });
          },
        ),
      supabase
        .channel("overview-attendance")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "attendance" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["attendance"] });
          },
        ),
      supabase
        .channel("overview-tasks")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "tasks" },
          () => {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
          },
        ),
    ];

    channels.forEach((ch) => ch.subscribe());
    return () => channels.forEach((ch) => supabase.removeChannel(ch));
  }, [queryClient]);

  const isLoading = attendanceLoading || quizLoading;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((item) => {
          const Icon = item.icon;
          const TrendIcon = item.trend.positive ? TrendingUp : TrendingDown;
          const trendColor = item.trend.positive
            ? "text-green-600"
            : "text-red-600";
          const colorMap = {
            blue: "bg-blue-50 text-blue-600 border-blue-200",
            green: "bg-green-50 text-green-600 border-green-200",
            yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
            purple: "bg-purple-50 text-purple-600 border-purple-200",
          };
          const progress = Math.min((item.value / (item.goal || 1)) * 100, 100);
          return isLoading ? (
            <WidgetSkeleton key={item.title} height={120} />
          ) : (
            <Card
              key={item.title}
              className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {item.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-800">
                    {item.value}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={cn(
                        "text-xs font-medium flex items-center gap-1",
                        trendColor,
                      )}
                    >
                      <TrendIcon className="w-3 h-3" />{" "}
                      {Math.abs(item.trend.value)}%
                    </span>
                    <span className="text-xs text-gray-400">vs last week</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                    colorMap[item.color],
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-3 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    item.color === "blue" && "bg-blue-500",
                    item.color === "green" && "bg-green-500",
                    item.color === "yellow" && "bg-yellow-500",
                    item.color === "purple" && "bg-purple-500",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Weekly Activity (last
            7 days)
          </h3>
          {isLoading ? (
            <WidgetSkeleton height={250} />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="interns"
                  stroke="#0080c8"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke="#92dce5"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line
                  type="monotone"
                  dataKey="submissions"
                  stroke="#f7b731"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Discipline Distribution */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" /> Interns by
            Discipline
          </h3>
          {isLoading ? (
            <WidgetSkeleton height={250} />
          ) : disciplineDistribution.every((d) => d.value === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <PieChart className="w-12 h-12 mb-2" />
              <p>No interns assigned to any discipline yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={disciplineDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {disciplineDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-600" /> Tasks Completed by
            Discipline
          </h3>
          {isLoading ? (
            <WidgetSkeleton height={250} />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={disciplines.map((d) => ({
                  name: d.name,
                  completed: tasks.filter(
                    (t) => t.discipline_id === d.id && t.status === "approved",
                  ).length,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Bar dataKey="completed" fill="#0080c8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AreaChart className="w-4 h-4 text-yellow-600" /> Submission Trend
            (last 30 days)
          </h3>
          {isLoading ? (
            <WidgetSkeleton height={250} />
          ) : submissionTrend.every(
              (d) => d.pending === 0 && d.approved === 0 && d.rejected === 0,
            ) ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <AreaChart className="w-12 h-12 mb-2" />
              <p>No submissions yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={submissionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={10}
                  interval={2}
                />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pending" stackId="a" fill="#f7b731" />
                <Bar dataKey="approved" stackId="a" fill="#00b894" />
                <Bar dataKey="rejected" stackId="a" fill="#e17055" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Activity className="w-4 h-4 text-gray-600" /> Recent Activity
            </h3>
            <Button variant="ghost" size="sm" className="text-xs">
              View All
            </Button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="text-gray-400 text-sm">No recent activity.</p>
            ) : (
              recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-700 shrink-0">
                    {activity.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">{activity.user}</span>{" "}
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatDate(activity.time)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MoreHorizontal className="w-4 h-4 text-gray-600" /> Quick Actions
          </h3>
          <div className="space-y-3">
            <Button
              variant="secondary"
              className="w-full justify-start gap-2"
              // We'll use a custom event but it will be handled in AdminDashboard
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openInviteModal"))
              }
            >
              <UserPlus className="w-4 h-4" /> Invite Intern
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-2"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openTaskModal"))
              }
            >
              <FileText className="w-4 h-4" /> Create Task
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-2"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openQuizTab"))
              }
            >
              <GraduationCap className="w-4 h-4" /> Create Quiz
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-2"
              onClick={() => navigate("/admin/reports")}
            >
              <BarChart3 className="w-4 h-4" /> View Reports
            </Button>
            <Button
              variant="secondary"
              className="w-full justify-start gap-2"
              onClick={() =>
                window.dispatchEvent(new CustomEvent("openNotifications"))
              }
            >
              <Bell className="w-4 h-4" /> View Notifications
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 2. TASKS TAB
// ═══════════════════════════════════════════════════════════════════
function TasksTab({ disciplineId, disciplines }) {
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: tasks = [], isLoading } = useTasks(disciplineId);
  const [showPdfUploader, setShowPdfUploader] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [loadingTaskId, setLoadingTaskId] = useState(null);

  const [editingTask, setEditingTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const approveTask = useApproveTask();

  const handlePdfUpload = async () => {
    if (!selectedPdf) {
      toast.warning("Please select a PDF");
      return;
    }
    if (!disciplineId) {
      toast.warning("Please select a discipline");
      return;
    }

    try {
      setIsUploading(true);
      setUploadProgress("uploading");

      // Sanitize filename and use UUID to avoid collisions
      const sanitized = sanitizeFilename(selectedPdf.name);
      const uuid = crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString();
      const filePath = `training-pdfs/${disciplineId}/${uuid}-${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from("training-pdfs")
        .upload(filePath, selectedPdf, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("training-pdfs")
        .getPublicUrl(filePath);
      const pdfUrl = publicUrlData?.publicUrl;
      if (!pdfUrl) throw new Error("Failed to generate public URL.");

      const disciplineName =
        disciplines.find((d) => d.id === disciplineId)?.name || "General";
      setUploadProgress("processing");

      const { data, error } = await supabase.functions.invoke(
        "generate-tasks",
        {
          body: { pdfUrl, disciplineId, disciplineName },
        },
      );
      if (error) throw error;
      if (!data?.success)
        throw new Error(data.error || "Task generation failed.");

      toast.success(`Successfully generated ${data.tasks?.length ?? 0} tasks`);
      await queryClient.refetchQueries({ queryKey: ["tasks"] });
      await queryClient.refetchQueries({ queryKey: ["tasks", disciplineId] });
      await queryClient.invalidateQueries({ queryKey: ["tasks", "today"] });

      setUploadProgress("success");
      setTimeout(() => {
        setShowPdfUploader(false);
        setSelectedPdf(null);
        setUploadProgress(null);
      }, 1500);
    } catch (err) {
      console.error("PDF Upload Error:", err);
      toast.error(err?.message || "Something went wrong.");
      setUploadProgress("error");
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (!disciplineId) return;
    const channel = supabase
      .channel(`tasks-${disciplineId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tasks",
          filter: `discipline_id=eq.${disciplineId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["tasks", disciplineId] });
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [disciplineId, queryClient]);

  const handleApprove = async (taskId) => {
    if (!taskId) {
      toast.error("Task ID is required");
      return;
    }
    setLoadingTaskId(taskId);
    try {
      await approveTask.mutateAsync({
        taskId,
        status: "approved",
        approvedBy: user?.id,
      });
      const { data: interns } = await supabase
        .from("profiles")
        .select("id")
        .eq("discipline_id", disciplineId)
        .eq("role", "intern");
      if (interns && interns.length > 0) {
        const notifications = interns.map((intern) => ({
          user_id: intern.id,
          type: "task_approved",
          title: "New Task Available",
          message: "A new daily task has been assigned to you!",
          data: { task_id: taskId, discipline_id: disciplineId },
          is_read: false,
        }));
        await supabase.from("notifications").insert(notifications);
      }
      queryClient.invalidateQueries({ queryKey: ["tasks", disciplineId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "today"] });
      toast.success(
        "✅ Task approved! Interns will be notified automatically.",
      );
    } catch (error) {
      console.error("Approve error:", error);
      toast.error(
        error?.message || "Failed to approve task. Please try again.",
      );
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleReject = async (taskId) => {
    if (!taskId) {
      toast.error("Task ID is required");
      return;
    }
    setLoadingTaskId(taskId);
    try {
      await approveTask.mutateAsync({
        taskId,
        status: "rejected",
        approvedBy: user?.id,
      });
      toast.success("Task rejected");
      queryClient.invalidateQueries({ queryKey: ["tasks", disciplineId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    } catch (error) {
      console.error("Reject error:", error);
      toast.error(error?.message || "Failed to reject task. Please try again.");
    } finally {
      setLoadingTaskId(null);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleAddNew = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  return (
    <div className="space-y-6">
      {!disciplineId ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">
            Select a discipline above to manage its tasks
          </p>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              {disciplines.find((d) => d.id === disciplineId)?.name} Tasks
            </h2>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleAddNew}>
                + Add Custom Task
              </Button>
              <Button onClick={() => setShowPdfUploader(true)}>
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                Upload Training PDF
              </Button>
            </div>
          </div>

          {showPdfUploader && (
            <Card>
              <h3 className="font-semibold text-gray-800 mb-4">
                Upload Training Plan PDF
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Upload a PDF containing the training plan. AI will automatically
                break it into daily tasks.
              </p>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedPdf(e.target.files[0])}
                className="block w-full text-sm text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#92dce5] file:text-gray-800 hover:file:bg-[#7bc8d2] mb-4"
              />
              {uploadProgress === "uploading" && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
                  ⬆️ Uploading PDF...
                </div>
              )}
              {uploadProgress === "processing" && (
                <div className="mb-4 p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                  🤖 AI generating tasks...
                </div>
              )}
              {uploadProgress === "success" && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                  ✅ Tasks generated successfully!
                </div>
              )}
              {uploadProgress === "error" && (
                <div className="mb-4 p-3 bg-red-50 rounded-lg text-sm text-red-700">
                  ❌ Failed to generate tasks. Please try again.
                </div>
              )}
              <div className="flex gap-3">
                <Button
                  onClick={handlePdfUpload}
                  disabled={!selectedPdf || isUploading}
                >
                  {isUploading ? "Processing..." : "Generate Tasks with AI"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowPdfUploader(false);
                    setSelectedPdf(null);
                    setUploadProgress(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {isLoading ? (
              <PageLoading />
            ) : tasks.length === 0 ? (
              <Card className="text-center py-12">
                <p className="text-gray-500">
                  No tasks yet. Upload a PDF or add a custom task.
                </p>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card
                  key={task.id}
                  className={cn(
                    task.status === "draft" && "border-l-4 border-l-yellow-400",
                    task.status === "approved" &&
                      "border-l-4 border-l-green-400",
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#0080c8] bg-[#92dce5] bg-opacity-20 px-2 py-1 rounded">
                        Day {task.day_number}
                      </span>
                      <h3 className="font-semibold text-gray-800">
                        {task.title}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          task.status === "approved"
                            ? "success"
                            : task.status === "rejected"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {task.status}
                      </Badge>
                      <button
                        onClick={() => handleEdit(task)}
                        className="text-gray-400 hover:text-[#0080c8] p-1"
                        title="Edit task"
                        aria-label="Edit task"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    {task.description?.slice(0, 150)}
                    {task.description?.length > 150 && "..."}
                  </p>
                  {task.admin_notes && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      <span className="font-semibold">📝 Admin Note:</span>{" "}
                      {task.admin_notes.slice(0, 120)}
                      {task.admin_notes.length > 120 && "..."}
                    </div>
                  )}
                  {task.learning_objectives?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        Learning Objectives:
                      </p>
                      <ul className="space-y-0.5">
                        {task.learning_objectives.slice(0, 2).map((obj, i) => (
                          <li key={i} className="text-xs text-gray-500">
                            • {obj}
                          </li>
                        ))}
                        {task.learning_objectives.length > 2 && (
                          <li className="text-xs text-gray-400">
                            +{task.learning_objectives.length - 2} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
                    {task.created_at && (
                      <span>Created: {formatDate(task.created_at)}</span>
                    )}
                    {task.approved_at && (
                      <span>Approved: {formatDate(task.approved_at)}</span>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    {task.status === "draft" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApprove(task.id)}
                          isLoading={loadingTaskId === task.id}
                          disabled={loadingTaskId === task.id}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleReject(task.id)}
                          isLoading={loadingTaskId === task.id}
                          disabled={loadingTaskId === task.id}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(task)}
                    >
                      Edit
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <TaskEditModal
            isOpen={showTaskModal}
            onClose={() => {
              setShowTaskModal(false);
              setEditingTask(null);
            }}
            disciplineId={disciplineId}
            task={editingTask}
          />
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 3. INTERNS TAB
// ═══════════════════════════════════════════════════════════════════
function InternsTab({ interns, disciplineId, disciplines, onDeleteIntern }) {
  const toast = useToast();
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showReinstateModal, setShowReinstateModal] = useState(false);
  const [suspendReason, setSuspendReason] = useState("");
  const manageIntern = useManageIntern();

  const handleSuspend = (intern) => {
    setSelectedIntern(intern);
    setShowSuspendModal(true);
  };
  const handleReinstate = (intern) => {
    setSelectedIntern(intern);
    setShowReinstateModal(true);
  };

  const confirmSuspend = async () => {
    if (!selectedIntern) return;
    try {
      await manageIntern.mutateAsync({
        internId: selectedIntern.id,
        action: "suspend",
        reason: suspendReason,
      });
      toast.success(`${selectedIntern.full_name} suspended successfully`);
      setShowSuspendModal(false);
      setSuspendReason("");
      setSelectedIntern(null);
    } catch (error) {
      toast.error("Failed to suspend intern: " + error.message);
    }
  };

  const confirmReinstate = async () => {
    if (!selectedIntern) return;
    try {
      await manageIntern.mutateAsync({
        internId: selectedIntern.id,
        action: "reinstate",
      });
      toast.success(`${selectedIntern.full_name} reinstated successfully`);
      setShowReinstateModal(false);
      setSelectedIntern(null);
    } catch (error) {
      toast.error("Failed to reinstate intern: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          {disciplineId
            ? `${disciplines.find((d) => d.id === disciplineId)?.name} Interns`
            : "All Interns"}
        </h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowInviteModal(true)}
        >
          <UserPlus className="w-4 h-4 mr-2" /> Invite Intern
        </Button>
      </div>

      {interns.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-gray-500">
            No interns assigned to this discipline yet.
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {interns.map((intern) => (
            <Card
              key={intern.id}
              className={cn(intern.is_suspended && "opacity-60 border-red-200")}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#92dce5] flex items-center justify-center">
                  <span className="font-semibold text-gray-800">
                    {intern.full_name?.[0]?.toUpperCase() || "?"}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {intern.full_name || "Unnamed Intern"}
                  </h3>
                  <p className="text-xs text-gray-500">{intern.email}</p>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                {intern.is_suspended ? (
                  <Badge variant="danger">Suspended</Badge>
                ) : (
                  <Badge variant="success">Active</Badge>
                )}
              </div>
              <div className="flex gap-2 flex-wrap">
                {intern.is_suspended ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleReinstate(intern)}
                    aria-label={`Reinstate ${intern.full_name}`}
                  >
                    Reinstate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleSuspend(intern)}
                    aria-label={`Suspend ${intern.full_name}`}
                  >
                    Suspend
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => onDeleteIntern(intern.id)}
                  aria-label={`Delete ${intern.full_name}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <InviteInternModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        disciplineId={disciplineId}
      />

      <Modal
        isOpen={showSuspendModal}
        onClose={() => {
          setShowSuspendModal(false);
          setSelectedIntern(null);
          setSuspendReason("");
        }}
        title={`Suspend ${selectedIntern?.full_name || "Intern"}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            This will prevent the intern from accessing their dashboard.
          </p>
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Reason for suspension..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
          />
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowSuspendModal(false);
                setSelectedIntern(null);
                setSuspendReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmSuspend}
              isLoading={manageIntern.isPending}
              disabled={!suspendReason.trim()}
            >
              Confirm Suspend
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showReinstateModal}
        onClose={() => {
          setShowReinstateModal(false);
          setSelectedIntern(null);
        }}
        title={`Reinstate ${selectedIntern?.full_name || "Intern"}`}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            This will reactivate the intern's account.
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowReinstateModal(false);
                setSelectedIntern(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={confirmReinstate}
              isLoading={manageIntern.isPending}
            >
              Confirm Reinstate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 4. SUBMISSIONS TAB
// ═══════════════════════════════════════════════════════════════════
function SubmissionsTab({ submissions, disciplineId, disciplines }) {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const reviewSubmission = useReviewSubmission();

  const [filterStatus, setFilterStatus] = useState("all");
  const [filterIntern, setFilterIntern] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [remark, setRemark] = useState("");

  const total = submissions.length;
  const pending = submissions.filter((s) => s.status === "pending").length;
  const completed = submissions.filter((s) => s.status === "completed").length;
  const rejected = submissions.filter(
    (s) => s.status === "not_completed",
  ).length;

  const internOptions = useMemo(() => {
    const unique = new Set(
      submissions.map((s) => s.profiles?.id).filter(Boolean),
    );
    return Array.from(unique).map((id) => ({
      id,
      name:
        submissions.find((s) => s.profiles?.id === id)?.profiles?.full_name ||
        "Unknown",
    }));
  }, [submissions]);

  const filteredSubmissions = useMemo(() => {
    let filtered = submissions;
    if (filterStatus !== "all") {
      filtered = filtered.filter((s) => s.status === filterStatus);
    }
    if (filterIntern !== "all") {
      filtered = filtered.filter((s) => s.profiles?.id === filterIntern);
    }
    return filtered;
  }, [submissions, filterStatus, filterIntern]);

  const statusData = [
    { name: "Pending", value: pending, color: "#f7b731" },
    { name: "Completed", value: completed, color: "#00b894" },
    { name: "Rejected", value: rejected, color: "#e17055" },
  ];

  const submissionTrend = useMemo(() => {
    const now = new Date();
    const last30 = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last30.push(d.toISOString().split("T")[0]);
    }
    return last30.map((day) => {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const daySubs = submissions.filter(
        (s) => s.submitted_at >= dayStart && s.submitted_at < dayEnd,
      );
      return {
        date: new Date(day).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        pending: daySubs.filter((s) => s.status === "pending").length,
        completed: daySubs.filter((s) => s.status === "completed").length,
        rejected: daySubs.filter((s) => s.status === "not_completed").length,
      };
    });
  }, [submissions]);

  const handleReview = async (submissionId, status) => {
    try {
      await reviewSubmission.mutateAsync({
        submissionId,
        status,
        remark,
        reviewerId: user.id,
      });
      toast.success(`Submission marked as ${status}`);
      setSelectedSubmission(null);
      setRemark("");
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
    } catch (error) {
      toast.error("Failed to review submission: " + error.message);
    }
  };

  const handleResetFilters = () => {
    setFilterStatus("all");
    setFilterIntern("all");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-gray-800">
          Submissions
          {total > 0 && ` (${total} total)`}
          {pending > 0 && ` • ${pending} pending`}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleResetFilters}>
            <RefreshCw className="w-4 h-4 mr-1" /> Reset Filters
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Total</p>
              <p className="text-2xl font-bold text-blue-800">{total}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-blue-600 opacity-60" />
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-800">{pending}</p>
            </div>
            <Clock3 className="w-8 h-8 text-yellow-600 opacity-60" />
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-800">{completed}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600 opacity-60" />
          </div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Rejected</p>
              <p className="text-2xl font-bold text-red-800">{rejected}</p>
            </div>
            <X className="w-8 h-8 text-red-600 opacity-60" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filters:</span>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0080c8] focus:border-[#0080c8]"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="not_completed">Rejected</option>
        </select>
        <select
          value={filterIntern}
          onChange={(e) => setFilterIntern(e.target.value)}
          className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#0080c8] focus:border-[#0080c8]"
        >
          <option value="all">All Interns</option>
          {internOptions.map((intern) => (
            <option key={intern.id} value={intern.id}>
              {intern.name}
            </option>
          ))}
        </select>
        {filterStatus !== "all" || filterIntern !== "all" ? (
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            Clear
          </Button>
        ) : null}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" /> Submission Status
          </h3>
          {total === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No submissions yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <AreaChart className="w-4 h-4 text-blue-600" /> Submission Trend (30
            days)
          </h3>
          {submissionTrend.every(
            (d) => d.pending === 0 && d.completed === 0 && d.rejected === 0,
          ) ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No data
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={submissionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={10}
                  interval={2}
                />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="1"
                  fill="#f7b731"
                  stroke="#f7b731"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stackId="1"
                  fill="#00b894"
                  stroke="#00b894"
                />
                <Area
                  type="monotone"
                  dataKey="rejected"
                  stackId="1"
                  fill="#e17055"
                  stroke="#e17055"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Submissions List */}
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-gray-600" /> Submissions
          {filteredSubmissions.length > 0 && ` (${filteredSubmissions.length})`}
        </h3>
        {filteredSubmissions.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No submissions match the current filters.
          </p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission.id}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  submission.status === "pending"
                    ? "border-l-4 border-l-yellow-400 bg-yellow-50"
                    : submission.status === "completed"
                      ? "border-l-4 border-l-green-400 bg-green-50"
                      : "border-l-4 border-l-red-400 bg-red-50",
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-800">
                        {submission.tasks?.title || "Task Submission"}
                      </h4>
                      <Badge
                        variant={
                          submission.status === "pending"
                            ? "warning"
                            : submission.status === "completed"
                              ? "success"
                              : "danger"
                        }
                      >
                        {submission.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      by {submission.profiles?.full_name || "Unknown"} •{" "}
                      {formatDate(submission.submitted_at)}
                    </p>
                    {submission.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {submission.description}
                      </p>
                    )}
                    {submission.file_url && (
                      <a
                        href={submission.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#0080c8] hover:underline inline-block mt-1"
                      >
                        View Attachment →
                      </a>
                    )}
                  </div>
                </div>

                {selectedSubmission?.id === submission.id ? (
                  <div className="mt-3 space-y-3">
                    <textarea
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      placeholder="Leave a remark..."
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
                    />
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => handleReview(submission.id, "completed")}
                        isLoading={reviewSubmission.isPending}
                      >
                        Mark Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() =>
                          handleReview(submission.id, "not_completed")
                        }
                      >
                        Not Completed
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedSubmission(null);
                          setRemark("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant={
                      submission.status === "pending" ? "primary" : "secondary"
                    }
                    size="sm"
                    onClick={() => setSelectedSubmission(submission)}
                  >
                    {submission.status === "pending"
                      ? "Review"
                      : "View Details"}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 5. DISCIPLINES TAB
// ═══════════════════════════════════════════════════════════════════
function DisciplinesTab() {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { data: disciplines = [], isLoading } = useDisciplines();
  const { data: interns = [] } = useInterns(null);
  const { data: tasks = [] } = useTasks(null);
  const { data: quizzes = [] } = useQuizzes(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDiscipline, setEditingDiscipline] = useState(null);
  const [disciplineName, setDisciplineName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const disciplineStats = useMemo(() => {
    return disciplines.map((d) => ({
      ...d,
      internCount: interns.filter((i) => i.discipline_id === d.id).length,
      taskCount: tasks.filter((t) => t.discipline_id === d.id).length,
      quizCount: quizzes.filter((q) => q.discipline_id === d.id).length,
    }));
  }, [disciplines, interns, tasks, quizzes]);

  const chartData = disciplineStats.map((d) => ({
    name: d.name,
    interns: d.internCount,
    tasks: d.taskCount,
    quizzes: d.quizCount,
  }));

  const handleAddDiscipline = async () => {
    if (!disciplineName.trim()) {
      toast.warning("Please enter a discipline name");
      return;
    }
    try {
      const { data, error } = await supabase
        .from("disciplines")
        .insert({ name: disciplineName.trim() })
        .select()
        .single();
      if (error) throw error;
      toast.success(`Discipline "${data.name}" created`);
      setDisciplineName("");
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ["disciplines"] });
    } catch (error) {
      toast.error("Failed to create discipline: " + error.message);
    }
  };

  const handleEditDiscipline = async () => {
    if (!editingDiscipline || !disciplineName.trim()) {
      toast.warning("Please enter a discipline name");
      return;
    }
    try {
      const { error } = await supabase
        .from("disciplines")
        .update({ name: disciplineName.trim() })
        .eq("id", editingDiscipline.id);
      if (error) throw error;
      toast.success(`Discipline updated to "${disciplineName}"`);
      setEditingDiscipline(null);
      setDisciplineName("");
      setShowAddModal(false);
      queryClient.invalidateQueries({ queryKey: ["disciplines"] });
    } catch (error) {
      toast.error("Failed to update discipline: " + error.message);
    }
  };

  const handleDeleteDiscipline = async () => {
    if (!deleteTarget) return;
    try {
      const hasInterns = interns.some(
        (i) => i.discipline_id === deleteTarget.id,
      );
      if (hasInterns) {
        toast.error(
          "Cannot delete discipline with assigned interns. Reassign or remove them first.",
        );
        return;
      }
      const { error } = await supabase
        .from("disciplines")
        .delete()
        .eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success(`Discipline "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      setShowDeleteModal(false);
      queryClient.invalidateQueries({ queryKey: ["disciplines"] });
      queryClient.invalidateQueries({ queryKey: ["interns"] });
    } catch (error) {
      toast.error("Failed to delete discipline: " + error.message);
    }
  };

  const openEditModal = (discipline) => {
    setEditingDiscipline(discipline);
    setDisciplineName(discipline.name);
    setShowAddModal(true);
  };

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Disciplines</h2>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setEditingDiscipline(null);
            setDisciplineName("");
            setShowAddModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Discipline
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Total Disciplines
              </p>
              <p className="text-2xl font-bold text-blue-800">
                {disciplines.length}
              </p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-600 opacity-60" />
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">
                Total Interns
              </p>
              <p className="text-2xl font-bold text-green-800">
                {interns.length}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-600 opacity-60" />
          </div>
        </Card>
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">
                Avg. Interns / Discipline
              </p>
              <p className="text-2xl font-bold text-purple-800">
                {disciplines.length
                  ? (interns.length / disciplines.length).toFixed(1)
                  : 0}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-600 opacity-60" />
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" /> Content per Discipline
        </h3>
        {chartData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            No disciplines to display
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="interns" fill="#0080c8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="tasks" fill="#f7b731" radius={[4, 4, 0, 0]} />
              <Bar dataKey="quizzes" fill="#6c5ce7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {disciplineStats.map((d) => (
          <Card key={d.id} className="relative group">
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => openEditModal(d)}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600"
                title="Edit discipline"
                aria-label={`Edit ${d.name}`}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setDeleteTarget(d);
                  setShowDeleteModal(true);
                }}
                className="p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600"
                title="Delete discipline"
                aria-label={`Delete ${d.name}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">{d.name}</h3>
              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div className="bg-blue-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Interns</p>
                  <p className="font-bold text-blue-700">{d.internCount}</p>
                </div>
                <div className="bg-yellow-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Tasks</p>
                  <p className="font-bold text-yellow-700">{d.taskCount}</p>
                </div>
                <div className="bg-purple-50 p-2 rounded-lg text-center">
                  <p className="text-xs text-gray-500">Quizzes</p>
                  <p className="font-bold text-purple-700">{d.quizCount}</p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                ID: {d.id.slice(0, 8)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingDiscipline(null);
          setDisciplineName("");
        }}
        title={editingDiscipline ? "Edit Discipline" : "Add New Discipline"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discipline Name
            </label>
            <input
              type="text"
              value={disciplineName}
              onChange={(e) => setDisciplineName(e.target.value)}
              placeholder="e.g., Web Development"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowAddModal(false);
                setEditingDiscipline(null);
                setDisciplineName("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={
                editingDiscipline ? handleEditDiscipline : handleAddDiscipline
              }
            >
              {editingDiscipline ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteTarget(null);
        }}
        title="Delete Discipline"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the discipline{" "}
            <strong>"{deleteTarget?.name}"</strong>? This action cannot be
            undone.
            {interns.some((i) => i.discipline_id === deleteTarget?.id) && (
              <span className="block mt-2 text-red-600 font-medium">
                ⚠️ This discipline has interns assigned. Please reassign or
                remove them first.
              </span>
            )}
          </p>
          <div className="flex gap-3 justify-end">
            <Button
              variant="ghost"
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteDiscipline}
              disabled={interns.some(
                (i) => i.discipline_id === deleteTarget?.id,
              )}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 6. ATTENDANCE TAB – FIXED: manual join & receives disciplines prop
// ═══════════════════════════════════════════════════════════════════
function AttendanceTab({ disciplineId, disciplines }) {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: attendanceToday = [], isLoading: todayLoading } =
    useAttendanceToday(disciplineId);

  // ⬇️ FIXED: manual two-step fetch to avoid nested select issues
  const { data: attendanceHistory = [], isLoading: historyLoading } = useQuery({
    queryKey: ["attendanceHistory", disciplineId],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // 1. Fetch attendance records
      let query = supabase
        .from("attendance")
        .select("*")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (disciplineId) {
        // Get intern ids for this discipline
        const { data: internIds, error: idError } = await supabase
          .from("profiles")
          .select("id")
          .eq("discipline_id", disciplineId)
          .eq("role", "intern");
        if (idError) throw idError;
        if (!internIds || internIds.length === 0) {
          return []; // no interns → no attendance records
        }
        const ids = internIds.map((i) => i.id);
        query = query.in("intern_id", ids);
      }

      const { data, error } = await query;
      if (error) throw error;

      // 2. Attach profile names
      if (data && data.length > 0) {
        const internIds = [...new Set(data.map((r) => r.intern_id))];
        const { data: profiles, error: pError } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", internIds);
        if (pError) throw pError;
        const profileMap = Object.fromEntries(
          profiles.map((p) => [p.id, p.full_name]),
        );
        data.forEach((record) => {
          record.profiles = {
            full_name: profileMap[record.intern_id] || "Unknown",
          };
        });
      }
      return data || [];
    },
    enabled: true,
  });

  const presentToday = attendanceToday.filter(
    (a) => a.status === "present",
  ).length;
  const lateToday = attendanceToday.filter((a) => a.status === "late").length;
  const absentToday = attendanceToday.filter(
    (a) => a.status === "absent",
  ).length;
  const totalMarked = attendanceToday.length;

  const dailyTrend = useMemo(() => {
    if (!attendanceHistory || attendanceHistory.length === 0) return [];
    const grouped = attendanceHistory.reduce((acc, record) => {
      const date = new Date(record.created_at).toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { date, present: 0, late: 0, absent: 0 };
      }
      if (record.status === "present") acc[date].present += 1;
      else if (record.status === "late") acc[date].late += 1;
      else if (record.status === "absent") acc[date].absent += 1;
      return acc;
    }, {});
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [attendanceHistory]);

  const isLoading = todayLoading || historyLoading;

  // Safely get discipline name
  const disciplineName = disciplineId
    ? disciplines?.find((d) => d.id === disciplineId)?.name || "Selected"
    : "";

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-800">
        Attendance {disciplineName && `- ${disciplineName}`}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">
                Today's Marked
              </p>
              <p className="text-2xl font-bold text-blue-800">{totalMarked}</p>
            </div>
            <CalendarCheck className="w-8 h-8 text-blue-600 opacity-60" />
          </div>
        </Card>
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Present</p>
              <p className="text-2xl font-bold text-green-800">
                {presentToday}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600 opacity-60" />
          </div>
        </Card>
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">Late</p>
              <p className="text-2xl font-bold text-yellow-800">{lateToday}</p>
            </div>
            <Clock3 className="w-8 h-8 text-yellow-600 opacity-60" />
          </div>
        </Card>
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Absent</p>
              <p className="text-2xl font-bold text-red-800">{absentToday}</p>
            </div>
            <X className="w-8 h-8 text-red-600 opacity-60" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Daily Attendance
            (last 30 days)
          </h3>
          {isLoading ? (
            <WidgetSkeleton height={250} />
          ) : dailyTrend.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No attendance records in the last 30 days
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={10}
                  interval={2}
                />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="present" stackId="a" fill="#00b894" />
                <Bar dataKey="late" stackId="a" fill="#f7b731" />
                <Bar dataKey="absent" stackId="a" fill="#e17055" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" /> Today's Attendance
          </h3>
          {isLoading ? (
            <WidgetSkeleton height={250} />
          ) : totalMarked === 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              No attendance marked today
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={[
                    { name: "Present", value: presentToday, color: "#00b894" },
                    { name: "Late", value: lateToday, color: "#f7b731" },
                    { name: "Absent", value: absentToday, color: "#e17055" },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {[
                    { name: "Present", value: presentToday, color: "#00b894" },
                    { name: "Late", value: lateToday, color: "#f7b731" },
                    { name: "Absent", value: absentToday, color: "#e17055" },
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-600" /> Today's Attendance Records
        </h3>
        {isLoading ? (
          <WidgetSkeleton height={200} />
        ) : attendanceToday.length === 0 ? (
          <p className="text-gray-400 text-sm">
            No attendance records for today.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Intern
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceToday.map((record) => (
                  <tr key={record.id}>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {record.profiles?.full_name || "Unknown"}
                    </td>
                    <td className="px-4 py-2">
                      <Badge
                        variant={
                          record.status === "present"
                            ? "success"
                            : record.status === "late"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {record.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {formatDate(record.marked_at || record.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ADMIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { profile, user, logout } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState("overview");
  const [selectedDiscipline, setSelectedDiscipline] = useState(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const { sidebarWidth, isMobileOpen } = useLayout();

  const { data: disciplines = [], isLoading: disciplinesLoading } =
    useDisciplines();
  const { data: interns = [], isLoading: internsLoading } =
    useInterns(selectedDiscipline);
  const { data: tasks = [] } = useTasks(selectedDiscipline);
  // ✅ FIX: remove status filter – pass all submissions for the discipline
  const { data: submissions = [] } = useSubmissions(
    selectedDiscipline ? { discipline_id: selectedDiscipline } : {},
  );

  // Quick action handlers – using direct state setters
  const handleOpenInvite = () => setInviteModalOpen(true);
  const handleOpenTask = () => setTaskModalOpen(true);
  const handleOpenQuiz = () => setActiveItem("quizzes");
  const handleOpenNotifications = () =>
    toast.info("Notifications will be shown here.");

  // Setup custom event listeners (for backward compatibility with OverviewTab quick actions)
  useEffect(() => {
    const onInvite = () => handleOpenInvite();
    const onTask = () => handleOpenTask();
    const onQuiz = () => handleOpenQuiz();
    const onNotif = () => handleOpenNotifications();

    window.addEventListener("openInviteModal", onInvite);
    window.addEventListener("openTaskModal", onTask);
    window.addEventListener("openQuizTab", onQuiz);
    window.addEventListener("openNotifications", onNotif);

    return () => {
      window.removeEventListener("openInviteModal", onInvite);
      window.removeEventListener("openTaskModal", onTask);
      window.removeEventListener("openQuizTab", onQuiz);
      window.removeEventListener("openNotifications", onNotif);
    };
  }, []);

  const deleteIntern = async (userId) => {
    try {
      const { error } = await supabase.functions.invoke("delete-intern", {
        method: "DELETE",
        body: { userId },
      });
      if (error) throw error;
      toast.success("Intern deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["interns"] });
    } catch (error) {
      toast.error(error.message || "Failed to delete intern");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const pageTitle =
    ADMIN_NAV_ITEMS.find((i) => i.id === activeItem)?.label || "Dashboard";

  if (disciplinesLoading || internsLoading) return <PageLoading />;

  const renderContent = () => {
    switch (activeItem) {
      case "overview":
        return (
          <OverviewTab
            disciplines={disciplines}
            interns={interns}
            tasks={tasks}
            submissions={submissions}
            selectedDiscipline={selectedDiscipline}
          />
        );
      case "disciplines":
        return <DisciplinesTab />;
      case "interns":
        return (
          <InternsTab
            interns={interns}
            disciplineId={selectedDiscipline}
            disciplines={disciplines}
            onDeleteIntern={deleteIntern}
          />
        );
      case "tasks":
        return (
          <TasksTab
            disciplineId={selectedDiscipline}
            disciplines={disciplines}
          />
        );
      case "submissions":
        return (
          <SubmissionsTab
            submissions={submissions}
            disciplineId={selectedDiscipline}
            disciplines={disciplines}
          />
        );
      case "quizzes":
        return <QuizzesTab disciplineId={selectedDiscipline} />;
      case "attendance":
        // ✅ FIX: pass disciplines prop
        return (
          <AttendanceTab
            disciplineId={selectedDiscipline}
            disciplines={disciplines}
          />
        );
      default:
        return <div>Page not found</div>;
    }
  };

  const showDisciplineSelector = [
    "overview",
    "interns",
    "tasks",
    "submissions",
    "quizzes",
    "attendance",
  ].includes(activeItem);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        activeItem={activeItem}
        onSelect={setActiveItem}
        onLogout={() => setShowLogoutModal(true)}
        items={ADMIN_NAV_ITEMS}
        showSettings={true}
        subtitle="Admin Panel"
      />
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{ marginLeft: isMobileOpen ? 0 : sidebarWidth }}
      >
        <DashboardHeader title={pageTitle} breadcrumbs={["Admin", pageTitle]} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {showDisciplineSelector && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedDiscipline(null)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    !selectedDiscipline
                      ? "bg-[#0080c8] text-white"
                      : "bg-white text-gray-700 border border-gray-200 hover:border-[#0080c8]",
                  )}
                >
                  All Disciplines
                </button>
                {disciplines.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setSelectedDiscipline(d.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                      selectedDiscipline === d.id
                        ? "bg-[#0080c8] text-white"
                        : "bg-white text-gray-700 border border-gray-200 hover:border-[#0080c8]",
                    )}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          {renderContent()}
        </main>
      </div>

      <InviteInternModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        disciplineId={selectedDiscipline}
      />
      <TaskEditModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        disciplineId={selectedDiscipline}
        task={null}
      />

      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="Confirm Logout"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to log out?
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="ghost" onClick={() => setShowLogoutModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleLogout}
              isLoading={isLoggingOut}
              disabled={isLoggingOut}
            >
              Logout
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
