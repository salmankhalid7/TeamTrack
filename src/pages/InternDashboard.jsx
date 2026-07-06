// src/pages/InternDashboard.jsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useToast } from "../components/ui/Toast";
import { useAuth } from "../auth/useAuth";
import { useLayout } from "../context/LayoutContext";
import Sidebar from "../components/layout/Sidebar";
import DashboardHeader from "../components/layout/DashboardHeader";
import { INTERN_NAV_ITEMS } from "../components/layout/sidebarConfig";
import { supabase } from "../api/supabase";

import {
  useTodayTasks,
  useTodayAttendance,
  useUploadSubmission,
  useEvaluations,
  useNotifications,
  usePastApprovedTasks,
  useMySubmissions,
  useQuizStats,
  useStartQuizAttempt,
  useStudentAssignedQuizzes,
  useDisciplines,
  useMarkAttendance,
} from "../api/queries";

import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Modal } from "../components/ui/Modal";
import { PageLoading } from "../components/ui/LoadingSpinner";
import { formatDate, cn } from "../utils/helpers";

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
  LogOut,
  Settings,
  User,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
  HelpCircle,
  Shield,
  Link,
  Mail,
  ChevronDown,
  ChevronUp,
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
  ComposedChart,
} from "recharts";

// ─── Error message mapper ──────────────────────────────────────
function getAttendanceErrorMessage(error) {
  const message = error?.message || "";

  if (message.includes("can only be marked between 11:00 AM and 4:00 PM PKT")) {
    return {
      title: "⏰ Outside Attendance Window",
      description:
        "Attendance can only be marked between 11:00 AM and 4:00 PM PKT. Please try again during working hours.",
    };
  }
  if (message.includes("Attendance already marked for today")) {
    return {
      title: "✅ Already Marked",
      description: "You have already marked your attendance for today.",
    };
  }
  if (message.includes("Invalid or expired token")) {
    return {
      title: "🔒 Session Expired",
      description: "Your session has expired. Please log in again.",
    };
  }
  if (message.includes("Missing Authorization header")) {
    return {
      title: "🔒 Not Authenticated",
      description: "Please log in to mark your attendance.",
    };
  }
  if (message.includes("Failed to fetch") || message.includes("NetworkError")) {
    return {
      title: "🌐 Network Error",
      description:
        "Could not connect to the server. Please check your internet connection and try again.",
    };
  }
  return {
    title: "⚠️ Something went wrong",
    description: message || "Please try again later.",
  };
}

// ─── Skeleton Loader ────────────────────────────────────────────
const WidgetSkeleton = ({ height = 120 }) => (
  <div className="animate-pulse bg-gray-200 rounded-lg" style={{ height }} />
);

// ─── 1. Suspended View ──────────────────────────────────────────
function SuspendedView() {
  const { profile } = useAuth();
  const toast = useToast();
  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <Card className="text-center border-red-200">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-[#2b2d42] mb-2">
          Account Suspended
        </h2>
        <p className="text-[#2b2d42] text-opacity-70 mb-4">
          Your account has been suspended. Please contact the administrator.
        </p>
        {profile?.suspension_reason && (
          <div className="p-4 bg-red-50 rounded-lg text-sm text-red-700">
            Reason: {profile.suspension_reason}
          </div>
        )}
        <Button
          variant="outline"
          className="mt-4"
          onClick={async () => {
            try {
              const { error } = await supabase.from("notifications").insert({
                user_id: profile.id,
                type: "reinstatement_request",
                title: "Reinstatement Request",
                message: "An intern has requested account reinstatement.",
                data: { intern_id: profile.id },
                is_read: false,
              });
              if (error) throw error;
              const { data: admins } = await supabase
                .from("profiles")
                .select("id")
                .eq("role", "admin");
              if (admins) {
                const adminNotifications = admins.map((admin) => ({
                  user_id: admin.id,
                  type: "reinstatement_request",
                  title: "Reinstatement Request",
                  message: `Intern ${profile.full_name} has requested account reinstatement.`,
                  data: {
                    intern_id: profile.id,
                    intern_name: profile.full_name,
                  },
                  is_read: false,
                }));
                await supabase.from("notifications").insert(adminNotifications);
              }
              toast.success("Reinstatement request sent to admin!");
            } catch (error) {
              toast.error("Failed to send reinstatement request");
            }
          }}
        >
          Request Reinstatement
        </Button>
      </Card>
    </div>
  );
}

// ─── 2. Attendance Timer ──────────────────────────────────────
function AttendanceTimer() {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const pktTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Karachi" }),
      );
      const hours = pktTime.getHours();
      const minutes = pktTime.getMinutes();

      if (hours < 11 || (hours === 11 && minutes < 15)) {
        const endTime = new Date(pktTime);
        endTime.setHours(11, 15, 0, 0);
        const diff = endTime - pktTime;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${mins}m ${secs}s remaining`);
      } else if (hours >= 11 && hours < 16) {
        setTimeLeft("Attendance window open");
      } else {
        setTimeLeft("Attendance window closed");
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);
  return (
    <span className="text-sm text-[#2b2d42] text-opacity-50">{timeLeft}</span>
  );
}

// ─── 3. Submission Status ──────────────────────────────────────
function SubmissionStatus({ submission }) {
  if (!submission) return null;
  return (
    <div className="mt-4 p-4 bg-[#f8f7f9] rounded-lg">
      <h4 className="font-semibold text-[#2b2d42] mb-1">Submission Status</h4>
      <div className="flex items-center space-x-2">
        <Badge
          variant={
            submission.status === "completed"
              ? "success"
              : submission.status === "not_completed"
                ? "danger"
                : "warning"
          }
          size="md"
        >
          {submission.status.charAt(0).toUpperCase() +
            submission.status.slice(1)}
        </Badge>
        {submission.submitted_at && (
          <span className="text-xs text-[#2b2d42] text-opacity-50">
            {formatDate(submission.submitted_at)}
          </span>
        )}
      </div>
      {submission.admin_remark && (
        <p className="text-sm text-[#2b2d42] text-opacity-70 mt-2">
          <span className="font-medium">Admin:</span> {submission.admin_remark}
        </p>
      )}
    </div>
  );
}

// ─── 4. Submission Section ─────────────────────────────────────
function SubmissionSection({ task, user }) {
  const toast = useToast();
  const [submissionType, setSubmissionType] = useState("file");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submissionUrl, setSubmissionUrl] = useState("");
  const [submissionDescription, setSubmissionDescription] = useState("");
  const [fileError, setFileError] = useState(null);
  const uploadSubmission = useUploadSubmission();

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_TYPES = [
    "application/pdf",
    "image/png",
    "image/jpeg",
    "application/zip",
  ];

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFileError(
        "File type not allowed. Please upload PDF, PNG, JPEG, or ZIP.",
      );
      setSubmissionFile(null);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size exceeds 10MB limit.");
      setSubmissionFile(null);
      return;
    }
    setFileError(null);
    setSubmissionFile(file);
  }, []);

  const handleSubmit = async () => {
    if (submissionType === "file" && !submissionFile) {
      toast.warning("Please select a file to upload");
      return;
    }
    if (submissionType === "url" && !submissionUrl.trim()) {
      toast.warning("Please provide a URL");
      return;
    }
    try {
      if (submissionType === "file") {
        await uploadSubmission.mutateAsync({
          file: submissionFile,
          taskId: task.id,
          internId: user.id,
          description: submissionDescription,
        });
      } else {
        await uploadSubmission.mutateAsync({
          file: null,
          fileUrl: submissionUrl.trim(),
          taskId: task.id,
          internId: user.id,
          description: submissionDescription,
          type: "url",
        });
      }
      toast.success("Submission uploaded successfully!");
      setSubmissionFile(null);
      setSubmissionUrl("");
      setSubmissionDescription("");
      setFileError(null);
    } catch (error) {
      toast.error(error?.message || "Failed to submit. Please try again.");
    }
  };

  return (
    <div className="border-t border-[rgba(43,45,66,0.12)] pt-6">
      <h3 className="font-semibold text-[#2b2d42] mb-4">Submit Your Work</h3>
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => {
            setSubmissionType("file");
            setFileError(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            submissionType === "file"
              ? "bg-[#0080c8] text-white"
              : "bg-[#f8f7f9] text-[#2b2d42] hover:bg-[#92dce5] hover:bg-opacity-30"
          }`}
        >
          <FileText className="w-4 h-4" /> File Upload
        </button>
        <button
          onClick={() => {
            setSubmissionType("url");
            setFileError(null);
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            submissionType === "url"
              ? "bg-[#0080c8] text-white"
              : "bg-[#f8f7f9] text-[#2b2d42] hover:bg-[#92dce5] hover:bg-opacity-30"
          }`}
        >
          <Link className="w-4 h-4" /> Code / URL
        </button>
      </div>
      {submissionType === "file" ? (
        <div className="mb-4">
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.png,.jpg,.jpeg,.zip"
            className="block w-full text-sm text-[#2b2d42] file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#92dce5] file:text-[#2b2d42] hover:file:bg-[#7bc8d2]"
          />
          {fileError && (
            <p className="text-sm text-red-500 mt-2">{fileError}</p>
          )}
          <p className="text-xs text-[#2b2d42] text-opacity-40 mt-1">
            Upload screenshots, documents, or ZIP files (Max 10MB)
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <input
            type="url"
            value={submissionUrl}
            onChange={(e) => setSubmissionUrl(e.target.value)}
            placeholder="https://github.com/yourusername/project"
            className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
          />
          <p className="text-xs text-[#2b2d42] text-opacity-40 mt-1">
            Paste GitHub repo, CodePen, or live deployment URL
          </p>
        </div>
      )}
      <textarea
        value={submissionDescription}
        onChange={(e) => setSubmissionDescription(e.target.value)}
        placeholder="Describe what you built, challenges faced, or notes for the reviewer..."
        rows={3}
        className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1 mb-4"
      />
      <Button
        onClick={handleSubmit}
        isLoading={uploadSubmission.isPending}
        disabled={
          (submissionType === "file" && !submissionFile) ||
          (submissionType === "url" && !submissionUrl.trim()) ||
          !!fileError
        }
        className="w-full sm:w-auto"
      >
        Submit Task
      </Button>
      {uploadSubmission.isError && (
        <p className="text-sm text-red-500 mt-2">
          Failed to upload submission. Please try again.
        </p>
      )}
    </div>
  );
}

// ─── 5. Past Tasks Section ─────────────────────────────────────
const PAST_STATUS_CONFIG = {
  completed: { label: "Completed", variant: "success" },
  not_completed: { label: "Not Completed", variant: "danger" },
  pending: { label: "Pending Review", variant: "warning" },
  not_submitted: { label: "Not Submitted", variant: "default" },
};

function PastTasksSection({ tasks, submissionsByTaskId }) {
  const [expanded, setExpanded] = useState(false);
  if (!tasks || tasks.length === 0) return null;
  const visibleTasks = expanded ? tasks : tasks.slice(0, 5);
  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-[#2b2d42]">Task History</h3>
        <Badge variant="info" size="sm">
          {tasks.length} past task{tasks.length > 1 ? "s" : ""}
        </Badge>
      </div>
      <div className="space-y-2">
        {visibleTasks.map((task) => {
          const submission = submissionsByTaskId[task.id];
          const statusKey = submission ? submission.status : "not_submitted";
          const config =
            PAST_STATUS_CONFIG[statusKey] || PAST_STATUS_CONFIG.not_submitted;
          return (
            <div
              key={task.id}
              className="flex items-center justify-between gap-3 p-3 rounded-lg bg-[#f8f7f9] opacity-60 hover:opacity-100 transition-opacity"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-bold text-[#0080c8]">
                    Day {task.day_number}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#2b2d42] truncate">
                  {task.title}
                </p>
              </div>
              <Badge
                variant={config.variant}
                size="sm"
                className="flex-shrink-0"
              >
                {config.label}
              </Badge>
            </div>
          );
        })}
      </div>
      {tasks.length > 5 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 text-sm text-[#0080c8] hover:underline"
        >
          {expanded ? "Show less" : `Show all ${tasks.length} tasks`}
        </button>
      )}
    </Card>
  );
}

// ─── 6. Task Skeleton ──────────────────────────────────────────
function TaskSkeleton() {
  return (
    <Card>
      <div className="animate-pulse space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-4 w-16 bg-gray-200 rounded"></div>
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
          </div>
          <div className="h-6 w-20 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
        </div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    </Card>
  );
}

// ─── 7. InternDashboardOverview ────────────────────────────────
function InternDashboardOverview({
  profile,
  user,
  todayTasks,
  taskLoading,
  taskError,
  refetchTasks,
  todayAttendance,
  attendanceQueryLoading,
  refetchAttendance,
  evaluations,
  evaluationsLoading,
  notifications,
  hasNewTask,
  pastTasks,
  submissionsByTaskId,
  mySubmissions,
  totalTasksCount,
  submittedCount,
  handleMarkAttendance,
  attendanceLoading,
  attendanceError,
  refetchTasksAndAttendance,
  onSwitchToTasks, // new prop
}) {
  // ── Real data for charts ──

  const weeklyTaskTrend = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    const dayMap = {};
    if (mySubmissions) {
      mySubmissions.forEach((sub) => {
        if (sub.submitted_at) {
          const date = new Date(sub.submitted_at).toLocaleDateString("en-US", {
            weekday: "short",
          });
          if (!dayMap[date]) dayMap[date] = 0;
          dayMap[date]++;
        }
      });
    }
    const result = days.map((d) => {
      const label = new Date(d).toLocaleDateString("en-US", {
        weekday: "short",
      });
      return { day: label, submissions: dayMap[label] || 0 };
    });
    return result;
  }, [mySubmissions]);

  const attendanceTrend = useMemo(() => {
    if (!evaluations || evaluations.length === 0) return [];
    const sorted = [...evaluations].sort(
      (a, b) => new Date(a.week_start) - new Date(b.week_start),
    );
    const last7 = sorted.slice(-7);
    return last7.map((e) => ({
      week: `W${new Date(e.week_start).getWeek ? new Date(e.week_start).getWeek() : Math.ceil((new Date(e.week_start) - new Date(new Date(e.week_start).getFullYear(), 0, 1)) / 604800000)}`,
      attendance: Math.round(e.attendance_score || 0),
      tasks: Math.round(e.task_score || 0),
    }));
  }, [evaluations]);

  const taskStatusData = useMemo(() => {
    const completed = todayTasks.filter(
      (t) => submissionsByTaskId[t.id]?.status === "completed",
    ).length;
    const pending = todayTasks.filter(
      (t) => submissionsByTaskId[t.id]?.status === "pending",
    ).length;
    const notCompleted = todayTasks.filter(
      (t) => submissionsByTaskId[t.id]?.status === "not_completed",
    ).length;
    const notSubmitted = todayTasks.filter(
      (t) => !submissionsByTaskId[t.id],
    ).length;
    return [
      { name: "Completed", value: completed },
      { name: "Pending Review", value: pending },
      { name: "Not Completed", value: notCompleted },
      { name: "Not Submitted", value: notSubmitted },
    ].filter((d) => d.value > 0);
  }, [todayTasks, submissionsByTaskId]);

  const COLORS = ["#00b894", "#f7b731", "#e17055", "#74b9ff"];

  const kpiData = [
    {
      title: "Today's Tasks",
      value: totalTasksCount,
      icon: ClipboardList,
      color: "blue",
      description: `${submittedCount} submitted`,
    },
    {
      title: "Attendance",
      value:
        todayAttendance?.status === "present"
          ? "Present"
          : todayAttendance?.status === "late"
            ? "Late"
            : "Not Marked",
      icon: CalendarCheck,
      color:
        todayAttendance?.status === "present"
          ? "green"
          : todayAttendance?.status === "late"
            ? "yellow"
            : "gray",
      description: todayAttendance?.marked_at
        ? formatDate(todayAttendance.marked_at, "HH:mm")
        : "",
    },
    {
      title: "Pending Submissions",
      value: todayTasks.filter(
        (t) => submissionsByTaskId[t.id]?.status === "pending",
      ).length,
      icon: Clock3,
      color: "yellow",
      description: "Awaiting review",
    },
    {
      title: "Completed Tasks",
      value: todayTasks.filter(
        (t) => submissionsByTaskId[t.id]?.status === "completed",
      ).length,
      icon: CheckCircle2,
      color: "green",
      description: "Approved by admin",
    },
  ];

  if (attendanceQueryLoading) return <PageLoading />;

  if (!todayAttendance) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card padding="lg" className="text-center">
          <div className="w-20 h-20 bg-[#92dce5] bg-opacity-30 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock3 className="w-10 h-10 text-[#0080c8]" />
          </div>
          <h1 className="text-2xl font-bold text-[#2b2d42] mb-3">
            Mark Your Attendance First
          </h1>
          <div className="bg-[#f8f7f9] rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-2">
              <CalendarCheck className="w-5 h-5 text-[#0080c8]" />
              <span className="font-medium text-[#2b2d42]">Today's Window</span>
            </div>
            <p className="text-sm text-[#2b2d42] text-opacity-70 ml-7">
              11:00 AM – 11:15 AM PKT (On Time)
              <br />
              11:16 AM – 4:00 PM PKT (Marked Late)
            </p>
          </div>
          <p className="text-[#2b2d42] text-opacity-60 mb-6 text-sm">
            Your daily tasks and quizzes will be available once you mark your
            attendance.
          </p>
          {attendanceError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {attendanceError}
            </div>
          )}
          <Button
            size="lg"
            onClick={handleMarkAttendance}
            isLoading={attendanceLoading}
            disabled={attendanceLoading}
            className="px-10"
          >
            Mark Present
          </Button>
          <div className="mt-4">
            <AttendanceTimer />
          </div>
          <p className="text-xs text-[#2b2d42] text-opacity-40 mt-4">
            If you don't mark by 11:15 AM, you'll be automatically marked late.
          </p>
        </Card>
      </div>
    );
  }

  if (taskError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="text-center border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Error Loading Dashboard
          </h2>
          <p className="text-[#2b2d42] text-opacity-70">
            {taskError?.message || "Please try again later."}
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={refetchTasksAndAttendance}
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  if (taskLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mt-2"></div>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TaskSkeleton />
          </div>
          <div>
            <Card className="animate-pulse h-40 bg-gray-100"></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#2b2d42] mb-1">
            Welcome back, {profile?.full_name?.split(" ")[0] || "Intern"}!
          </h1>
          <p className="text-[#2b2d42] text-opacity-70">
            {formatDate(new Date())} • Day {todayTasks[0]?.day_number || "—"}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {hasNewTask && (
            <Badge variant="success" size="md" className="animate-pulse">
              <Bell className="w-3 h-3 inline mr-1" /> New Task!
            </Badge>
          )}
          <Badge
            variant={todayAttendance?.status === "late" ? "warning" : "success"}
            size="md"
            className="flex items-center space-x-1"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-current animate-pulse"></span>
            <span>
              {todayAttendance?.status === "late"
                ? "Marked Late"
                : "Present Today"}
            </span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((item) => {
          const Icon = item.icon;
          const colorMap = {
            blue: "bg-blue-50 text-blue-600 border-blue-200",
            green: "bg-green-50 text-green-600 border-green-200",
            yellow: "bg-yellow-50 text-yellow-600 border-yellow-200",
            gray: "bg-gray-50 text-gray-600 border-gray-200",
          };
          return (
            <Card
              key={item.title}
              className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    {item.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {item.value}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {item.description}
                  </p>
                </div>
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110",
                    colorMap[item.color] ||
                      "bg-gray-50 text-gray-600 border-gray-200",
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" /> Submission Trend
            (last 7 days)
          </h3>
          {weeklyTaskTrend.every((d) => d.submissions === 0) ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <BarChart3 className="w-12 h-12 mb-2" />
              <p>No submission data yet.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyTaskTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Bar
                  dataKey="submissions"
                  fill="#0080c8"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-purple-600" /> Task Status
          </h3>
          {taskStatusData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <PieChart className="w-12 h-12 mb-2" />
              <p>No tasks assigned today.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={taskStatusData}
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
                  {taskStatusData.map((entry, index) => (
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

      {attendanceTrend.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-600" /> Performance Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <ComposedChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="week" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="attendance" fill="#0080c8" />
              <Line
                type="monotone"
                dataKey="tasks"
                stroke="#f7b731"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Tasks Summary (simplified) */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Today's Tasks</h3>
              <Button variant="ghost" size="sm" onClick={onSwitchToTasks}>
                View All Tasks →
              </Button>
            </div>
            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3" />
                <p>No tasks assigned for today.</p>
                <p className="text-sm text-gray-300 mt-1">
                  Check back tomorrow
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task) => {
                  const submission = submissionsByTaskId[task.id];
                  let status = "Not Submitted";
                  let variant = "default";
                  if (submission) {
                    if (submission.status === "completed") {
                      status = "Completed";
                      variant = "success";
                    } else if (submission.status === "pending") {
                      status = "Pending Review";
                      variant = "warning";
                    } else if (submission.status === "not_completed") {
                      status = "Not Completed";
                      variant = "danger";
                    }
                  }
                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs text-gray-400">
                          Day {task.day_number}
                        </span>
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {task.title}
                        </p>
                      </div>
                      <Badge
                        variant={variant}
                        size="sm"
                        className="ml-2 shrink-0"
                      >
                        {status}
                      </Badge>
                    </div>
                  );
                })}
                {todayTasks.length > 5 && (
                  <div className="text-center text-sm text-gray-400 pt-2">
                    + {todayTasks.length - 5} more tasks
                  </div>
                )}
              </div>
            )}
          </Card>

          <PastTasksSection
            tasks={pastTasks}
            submissionsByTaskId={submissionsByTaskId}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <h3 className="font-semibold text-[#2b2d42] mb-3">
              Attendance Status
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-[#0080c8]">
                  {todayAttendance?.status === "present" ? "✓" : "⚠"}
                </span>
                <div>
                  <Badge
                    variant={
                      todayAttendance?.status === "late" ? "warning" : "success"
                    }
                  >
                    {todayAttendance?.status === "late" ? "Late" : "On Time"}
                  </Badge>
                  <p className="text-xs text-[#2b2d42] text-opacity-50 mt-1">
                    Marked at{" "}
                    {todayAttendance?.marked_at
                      ? formatDate(todayAttendance.marked_at, "HH:mm")
                      : "—"}
                  </p>
                </div>
              </div>
            </div>
            {todayAttendance?.status === "late" && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-700">
                <AlertCircle className="w-4 h-4 inline mr-1" /> Please try to
                mark attendance before 11:15 AM PKT.
              </div>
            )}
          </Card>

          {evaluations?.[0] && (
            <Card>
              <h3 className="font-semibold text-[#2b2d42] mb-3">
                Latest Evaluation
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold text-[#0080c8] mb-2">
                  {Math.round(evaluations[0].total_score)}%
                </div>
                <p className="text-sm text-[#2b2d42] text-opacity-50">
                  Week of {formatDate(evaluations[0].week_start)}
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#2b2d42] text-opacity-70">
                      Attendance
                    </span>
                    <span className="font-medium text-[#2b2d42]">
                      {Math.round(evaluations[0].attendance_score)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0080c8] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(evaluations[0].attendance_score, 100)}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#2b2d42] text-opacity-70">
                      Tasks
                    </span>
                    <span className="font-medium text-[#2b2d42]">
                      {Math.round(evaluations[0].task_score)}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#92dce5] rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(evaluations[0].task_score, 100)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <h3 className="font-semibold text-[#2b2d42] mb-3">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 bg-[#f8f7f9] rounded-lg">
                <span className="text-sm text-[#2b2d42] text-opacity-70">
                  Discipline
                </span>
                <span className="text-sm font-medium text-[#2b2d42]">
                  {profile?.discipline_name || "Not assigned"}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-[#f8f7f9] rounded-lg">
                <span className="text-sm text-[#2b2d42] text-opacity-70">
                  Day
                </span>
                <span className="text-sm font-medium text-[#2b2d42]">
                  {todayTasks[0]?.day_number || "—"}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-[#f8f7f9] rounded-lg">
                <span className="text-sm text-[#2b2d42] text-opacity-70">
                  Tasks Today
                </span>
                <span className="text-sm font-medium text-[#2b2d42]">
                  {totalTasksCount} total ({submittedCount} submitted)
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── 8. TASKS TAB (improved with expandable list) ──────────────
function InternTasksView({ profile, user }) {
  const { data: todayTasks = [], isLoading: todayLoading } = useTodayTasks();
  const getDayNumber = useCallback(() => {
    if (!profile?.start_date) return 1;
    const start = new Date(profile.start_date);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }, [profile?.start_date]);
  const todayDayNumber = getDayNumber();
  const { data: pastTasks = [], isLoading: pastLoading } = usePastApprovedTasks(
    profile?.discipline_id,
    todayDayNumber,
    100,
  );
  const { data: mySubmissions = [] } = useMySubmissions(user?.id);

  const submissionsByTaskId = useMemo(() => {
    const map = {};
    for (const s of mySubmissions) {
      if (!map[s.task_id]) map[s.task_id] = s;
    }
    return map;
  }, [mySubmissions]);

  const allTasks = useMemo(() => {
    const combined = [...todayTasks, ...pastTasks];
    const unique = combined.reduce((acc, task) => {
      if (!acc.some((t) => t.id === task.id)) acc.push(task);
      return acc;
    }, []);
    return unique.sort((a, b) => b.day_number - a.day_number);
  }, [todayTasks, pastTasks]);

  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const toggleExpand = (taskId) => {
    setExpandedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) newSet.delete(taskId);
      else newSet.add(taskId);
      return newSet;
    });
  };

  const isLoading = todayLoading || pastLoading;
  if (isLoading) return <PageLoading />;
  if (allTasks.length === 0) {
    return (
      <Card className="text-center py-12">
        <ClipboardList className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-800">No Tasks Found</h3>
        <p className="text-gray-500">You don't have any tasks assigned yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">All Tasks</h2>
        <Badge variant="info" size="sm">
          {allTasks.length} total
        </Badge>
      </div>

      <div className="space-y-3">
        {allTasks.map((task) => {
          const submission = submissionsByTaskId[task.id];
          const isToday = task.day_number === todayDayNumber;
          const isExpanded = expandedTasks.has(task.id);

          const canSubmit =
            !submission || submission.status === "not_completed";

          let statusBadge = null;
          if (submission) {
            if (submission.status === "completed")
              statusBadge = <Badge variant="success">Completed</Badge>;
            else if (submission.status === "pending")
              statusBadge = <Badge variant="warning">Pending Review</Badge>;
            else if (submission.status === "not_completed")
              statusBadge = <Badge variant="danger">Not Completed</Badge>;
          } else {
            statusBadge = <Badge variant="default">Not Submitted</Badge>;
          }

          return (
            <Card
              key={task.id}
              className={`transition-all duration-200 ${
                isToday ? "border-l-4 border-l-blue-500" : ""
              } ${isExpanded ? "shadow-md" : "hover:shadow-sm"}`}
            >
              {/* Compact header – always visible */}
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => toggleExpand(task.id)}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-[#0080c8] bg-[#92dce5] bg-opacity-20 px-2 py-0.5 rounded">
                      Day {task.day_number}
                    </span>
                    {isToday && (
                      <Badge variant="info" size="sm">
                        Today
                      </Badge>
                    )}
                    {task.status === "approved" && (
                      <Badge variant="success" size="sm">
                        Approved
                      </Badge>
                    )}
                    <span className="ml-2 text-sm text-gray-400">
                      {task.estimated_hours}h
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-800 truncate">
                    {task.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  {statusBadge}
                  <Button
                    size="sm"
                    variant={isExpanded ? "secondary" : "primary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpand(task.id);
                    }}
                    className="whitespace-nowrap"
                  >
                    {isExpanded ? "Close" : "Start"}
                  </Button>
                </div>
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div className="mt-4 border-t border-gray-100 pt-4 space-y-4">
                  {task.description && (
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  )}

                  {task.admin_notes && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-1">
                        <AlertCircle className="w-4 h-4 inline mr-1" /> Special
                        Note
                      </h4>
                      <p className="text-sm text-blue-800 whitespace-pre-wrap">
                        {task.admin_notes}
                      </p>
                    </div>
                  )}

                  {task.learning_objectives?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Learning Objectives
                      </h4>
                      <ul className="space-y-1">
                        {task.learning_objectives.map((obj, i) => (
                          <li
                            key={i}
                            className="flex items-start text-sm text-gray-600"
                          >
                            <CheckCircle2 className="w-4 h-4 text-[#0080c8] mr-2 mt-0.5 flex-shrink-0" />
                            {obj}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {task.resources?.length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <h4 className="font-semibold text-gray-700 mb-2">
                        Resources
                      </h4>
                      <ul className="space-y-1">
                        {task.resources.map((resource, i) => (
                          <li key={i}>
                            <a
                              href={resource}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#0080c8] hover:underline flex items-center"
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              {resource}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {submission ? (
                    <SubmissionStatus submission={submission} />
                  ) : canSubmit ? (
                    <SubmissionSection task={task} user={user} />
                  ) : (
                    <div className="text-sm text-gray-400 italic">
                      This task is not available for submission.
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ─── 9. QUIZZES TAB ─────────────────────────────────────────────
function InternQuizzesView() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const { data: assignedQuizzes = [], isLoading: loadingAssigned } =
    useStudentAssignedQuizzes();
  const { data: quizStats = { totalQuizzes: 0, averageScore: 0 } } =
    useQuizStats(profile?.discipline_id);
  const startQuiz = useStartQuizAttempt();

  const totalAttempts = assignedQuizzes.filter((q) => q.attempt).length;
  const completedAttempts = assignedQuizzes.filter(
    (q) =>
      q.attempt &&
      (q.attempt.status === "submitted" ||
        q.attempt.status === "auto_submitted"),
  ).length;
  const inProgressAttempts = assignedQuizzes.filter(
    (q) => q.attempt && q.attempt.status === "in_progress",
  ).length;

  const attemptsWithScores = assignedQuizzes
    .filter(
      (q) =>
        q.attempt && q.attempt.score !== undefined && q.attempt.score !== null,
    )
    .map((q) => q.attempt);
  const avgScore = attemptsWithScores.length
    ? Math.round(
        attemptsWithScores.reduce(
          (acc, a) => acc + (a.score / a.total_marks) * 100,
          0,
        ) / attemptsWithScores.length,
      )
    : 0;

  const chartData = useMemo(() => {
    return assignedQuizzes
      .filter((q) => q.attempt && q.attempt.score !== undefined)
      .map((q) => ({
        name: q.quizzes?.title || `Quiz ${q.quiz_id}`,
        score: q.attempt.score,
        total: q.attempt.total_marks,
        percentage: Math.round((q.attempt.score / q.attempt.total_marks) * 100),
        status: q.attempt.status,
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [assignedQuizzes]);

  const handleStartQuiz = async (assignmentId) => {
    if (!assignmentId) {
      toast.error("Invalid assignment ID");
      return;
    }
    try {
      const attempt = await startQuiz.mutateAsync({ assignmentId });
      if (!attempt?.id) throw new Error("No attempt ID returned");
      toast.success("Quiz started! Good luck!");
      navigate(`/intern/quiz/${attempt.id}`);
    } catch (err) {
      console.error("Start quiz error:", err);
      toast.error(err?.message || "Failed to start quiz.");
    }
  };

  const handleResumeQuiz = (attemptId) => {
    if (!attemptId) {
      toast.error("Cannot resume – attempt ID missing");
      return;
    }
    navigate(`/intern/quiz/${attemptId}`);
  };

  const handleViewResults = (attemptId) => {
    if (!attemptId) {
      toast.error("Cannot view results – attempt ID missing");
      return;
    }
    navigate(`/intern/quiz-result/${attemptId}`);
  };

  const getStatus = (assignment) => {
    const now = new Date();
    const opens = assignment.opens_at ? new Date(assignment.opens_at) : null;
    const closes = assignment.closes_at ? new Date(assignment.closes_at) : null;
    const attempt = assignment.attempt;

    if (opens && now < opens) return "upcoming";
    if (closes && now > closes) return "expired";
    if (attempt) {
      if (attempt.status === "in_progress") return "in_progress";
      if (attempt.status === "submitted" || attempt.status === "auto_submitted")
        return "completed";
    }
    if (opens && closes && now >= opens && now <= closes) return "available";
    return "unknown";
  };

  if (loadingAssigned) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">My Quizzes</h2>
        <Badge variant="info" size="sm">
          {totalAttempts} attempts
        </Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Assigned</p>
              <p className="text-2xl font-bold text-gray-800">
                {assignedQuizzes.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {completedAttempts}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">
                {inProgressAttempts}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Avg. Score</p>
              <p className="text-2xl font-bold text-purple-600">{avgScore}%</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" /> Quiz Performance
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="name"
                stroke="#888"
                fontSize={11}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis stroke="#888" fontSize={12} domain={[0, 100]} />
              <Tooltip
                formatter={(value) => [`${value}%`, "Score"]}
                labelFormatter={(label) => `Quiz: ${label}`}
              />
              <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.percentage >= 80
                        ? "#00b894"
                        : entry.percentage >= 60
                          ? "#f7b731"
                          : "#e17055"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Card>
        <h3 className="font-semibold text-gray-800 mb-4">Quiz Attempts</h3>
        {assignedQuizzes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <GraduationCap className="w-12 h-12 mx-auto mb-3" />
            <p>No quizzes assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {assignedQuizzes.map((assignment) => {
              const quiz = assignment.quizzes;
              const attempt = assignment.attempt;
              const status = getStatus(assignment);
              const isCompleted =
                status === "completed" ||
                (attempt &&
                  (attempt.status === "submitted" ||
                    attempt.status === "auto_submitted"));
              const isInProgress = status === "in_progress";
              const isUpcoming = status === "upcoming";
              const isExpired = status === "expired";
              const isAvailable = status === "available";

              let statusBadge = null;
              if (isCompleted) {
                const scorePercent = attempt?.total_marks
                  ? Math.round((attempt.score / attempt.total_marks) * 100)
                  : 0;
                statusBadge = (
                  <Badge variant={scorePercent >= 60 ? "success" : "warning"}>
                    {scorePercent}% - Completed
                  </Badge>
                );
              } else if (isInProgress) {
                statusBadge = <Badge variant="warning">In Progress</Badge>;
              } else if (isUpcoming) {
                statusBadge = <Badge variant="default">Upcoming</Badge>;
              } else if (isExpired) {
                statusBadge = <Badge variant="danger">Expired</Badge>;
              } else if (isAvailable) {
                statusBadge = <Badge variant="info">Available</Badge>;
              } else {
                statusBadge = <Badge variant="default">Not Started</Badge>;
              }

              let actionButton = null;
              if (isInProgress && attempt?.id) {
                actionButton = (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleResumeQuiz(attempt.id)}
                  >
                    <Clock3 className="w-4 h-4 mr-1" /> Continue
                  </Button>
                );
              } else if (isAvailable) {
                actionButton = (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStartQuiz(assignment.id)}
                    isLoading={startQuiz.isPending}
                    disabled={startQuiz.isPending}
                  >
                    Start
                  </Button>
                );
              } else if (isCompleted && attempt?.id) {
                actionButton = (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewResults(attempt.id)}
                  >
                    View Results
                  </Button>
                );
              } else if (isUpcoming || isExpired) {
                actionButton = (
                  <Button size="sm" variant="ghost" disabled>
                    {isUpcoming ? "Coming Soon" : "Closed"}
                  </Button>
                );
              }

              return (
                <div
                  key={assignment.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium text-gray-800">
                        {quiz?.title || "Untitled Quiz"}
                      </h4>
                      {isCompleted && attempt?.submitted_at && (
                        <span className="text-xs text-gray-400">
                          {formatDate(attempt.submitted_at)}
                        </span>
                      )}
                    </div>
                    {quiz?.description && (
                      <p className="text-sm text-gray-500 truncate">
                        {quiz.description}
                      </p>
                    )}
                    {attempt && (
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        {attempt.score !== undefined && (
                          <span>
                            Score: {attempt.score}/{attempt.total_marks}
                          </span>
                        )}
                        {attempt.started_at && (
                          <span>Started: {formatDate(attempt.started_at)}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {statusBadge}
                    {actionButton}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── 10. ATTENDANCE TAB ──────────────────────────────────────────
function InternAttendanceView({ user }) {
  const { data: attendanceHistory = [], isLoading } = useQuery({
    queryKey: ["attendance", "history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("intern_id", user.id)
        .order("date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const attendanceByDate = useMemo(() => {
    if (!attendanceHistory.length) return [];
    const dateMap = {};
    attendanceHistory.forEach((record) => {
      const date = record.date;
      if (!dateMap[date]) {
        dateMap[date] = { date, present: 0, late: 0, absent: 0 };
      }
      if (record.status === "present") dateMap[date].present++;
      else if (record.status === "late") dateMap[date].late++;
      else if (record.status === "absent") dateMap[date].absent++;
    });
    return Object.values(dateMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date),
    );
  }, [attendanceHistory]);

  const statusDistribution = useMemo(() => {
    const counts = { present: 0, late: 0, absent: 0 };
    attendanceHistory.forEach((record) => {
      if (record.status === "present") counts.present++;
      else if (record.status === "late") counts.late++;
      else if (record.status === "absent") counts.absent++;
    });
    return [
      { name: "Present", value: counts.present },
      { name: "Late", value: counts.late },
      { name: "Absent", value: counts.absent },
    ].filter((d) => d.value > 0);
  }, [attendanceHistory]);

  const COLORS = ["#00b894", "#f7b731", "#e17055"];

  if (isLoading) return <PageLoading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">
          Attendance History
        </h2>
        <Badge variant="info" size="sm">
          {attendanceHistory.length} records
        </Badge>
      </div>

      {attendanceHistory.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              Daily Attendance
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={attendanceByDate}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={12}
                  tickFormatter={(value) => formatDate(value)}
                />
                <YAxis stroke="#888" fontSize={12} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(value) => formatDate(value)}
                  formatter={(value, name) => [
                    value,
                    name.charAt(0).toUpperCase() + name.slice(1),
                  ]}
                />
                <Legend />
                <Bar dataKey="present" stackId="a" fill="#00b894" />
                <Bar dataKey="late" stackId="a" fill="#f7b731" />
                <Bar dataKey="absent" stackId="a" fill="#e17055" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-600" />
              Overall Status
            </h3>
            {statusDistribution.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <PieChart className="w-12 h-12 mb-2" />
                <p>No attendance data yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={statusDistribution}
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
                    {statusDistribution.map((entry, index) => (
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
      )}

      {attendanceHistory.length === 0 ? (
        <Card className="text-center py-12">
          <CalendarCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800">
            No Attendance Records
          </h3>
          <p className="text-gray-500">You haven't marked attendance yet.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600 font-medium">
                  Date
                </th>
                <th className="px-4 py-2 text-left text-gray-600 font-medium">
                  Status
                </th>
                <th className="px-4 py-2 text-left text-gray-600 font-medium">
                  Marked At
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendanceHistory.map((record) => (
                <tr
                  key={record.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">{formatDate(record.date)}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        record.status === "present"
                          ? "success"
                          : record.status === "late"
                            ? "warning"
                            : "danger"
                      }
                    >
                      {record.status.charAt(0).toUpperCase() +
                        record.status.slice(1)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {record.marked_at
                      ? formatDate(record.marked_at, "HH:mm")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── 11. PROFILE TAB ──────────────────────────────────────────
function InternProfileView() {
  const { profile, user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: disciplines = [] } = useDisciplines();
  const { data: evaluations = [] } = useEvaluations(user?.id);
  const { data: mySubmissions = [] } = useMySubmissions(user?.id);
  const { data: todayAttendance } = useTodayAttendance();

  const disciplineName = useMemo(() => {
    if (!profile?.discipline_id) return null;
    const discipline = disciplines.find((d) => d.id === profile.discipline_id);
    return discipline?.name || profile.discipline_id;
  }, [disciplines, profile?.discipline_id]);

  const startDate = profile?.start_date || profile?.created_at;
  const totalSubmissions = mySubmissions.length;
  const completedSubmissions = mySubmissions.filter(
    (s) => s.status === "completed",
  ).length;
  const pendingSubmissions = mySubmissions.filter(
    (s) => s.status === "pending",
  ).length;

  const latestEval = evaluations[0];
  const overallScore = latestEval ? Math.round(latestEval.total_score) : 0;
  const attendanceScore = latestEval
    ? Math.round(latestEval.attendance_score)
    : 0;
  const taskScore = latestEval ? Math.round(latestEval.task_score) : 0;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-[#0080c8] flex items-center justify-center text-white text-3xl font-bold shrink-0">
            {profile?.full_name?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-gray-800">
              {profile?.full_name}
            </h2>
            <p className="text-gray-500">{profile?.email}</p>
            <div className="flex flex-wrap items-center gap-3 mt-2">
              <Badge variant="info">
                {profile?.role?.toUpperCase() || "Intern"}
              </Badge>
              <Badge variant="success">
                {disciplineName || "No Discipline"}
              </Badge>
              <span className="text-sm text-gray-400">
                • Joined{" "}
                {profile?.created_at ? formatDate(profile.created_at) : "N/A"}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Submissions</p>
              <p className="text-2xl font-bold text-gray-800">
                {totalSubmissions}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {completedSubmissions}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">
                {pendingSubmissions}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-yellow-50 flex items-center justify-center">
              <Clock3 className="w-5 h-5 text-yellow-600" />
            </div>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Overall Score</p>
              <p className="text-2xl font-bold text-purple-600">
                {overallScore}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Personal Information
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium text-gray-800">
                  {profile?.full_name || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">
                  {profile?.email || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Discipline</p>
                <p className="font-medium text-gray-800">
                  {disciplineName || "Not assigned"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <CalendarCheck className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500">Start Date</p>
                <p className="font-medium text-gray-800">
                  {startDate ? formatDate(startDate) : "—"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-semibold text-gray-800 mb-4">
            Performance Summary
          </h3>
          {latestEval ? (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Attendance Score</span>
                  <span className="font-medium text-gray-800">
                    {attendanceScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0080c8] rounded-full transition-all duration-500"
                    style={{ width: `${attendanceScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Task Score</span>
                  <span className="font-medium text-gray-800">
                    {taskScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#92dce5] rounded-full transition-all duration-500"
                    style={{ width: `${taskScore}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Overall Score</span>
                  <span className="font-medium text-gray-800">
                    {overallScore}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#6c5ce7] rounded-full transition-all duration-500"
                    style={{ width: `${overallScore}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Latest Evaluation</p>
                <p className="font-medium text-gray-800">
                  Week of{" "}
                  {latestEval.week_start
                    ? formatDate(latestEval.week_start)
                    : "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Award className="w-12 h-12 mx-auto mb-3" />
              <p>No evaluations yet.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ─── 12. MAIN INTERN DASHBOARD ──────────────────────────────────
export default function InternDashboard() {
  const toast = useToast();
  const { profile, user, logout } = useAuth();
  const queryClient = useQueryClient();
  const { sidebarWidth, isMobileOpen } = useLayout();

  const [activeItem, setActiveItem] = useState("dashboard");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const markAttendance = useMarkAttendance();

  const {
    data: todayTasks = [],
    isLoading: taskLoading,
    error: taskError,
    refetch: refetchTasks,
  } = useTodayTasks();

  const getDayNumber = useCallback(() => {
    if (!profile?.start_date) return 1;
    const start = new Date(profile.start_date);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  }, [profile?.start_date]);

  const todayDayNumber = getDayNumber();
  const { data: pastTasks = [] } = usePastApprovedTasks(
    profile?.discipline_id,
    todayDayNumber,
    10,
  );
  const { data: mySubmissions = [] } = useMySubmissions(user?.id);

  const submissionsByTaskId = useMemo(() => {
    const map = {};
    for (const s of mySubmissions) {
      if (!map[s.task_id]) map[s.task_id] = s;
    }
    return map;
  }, [mySubmissions]);

  const {
    data: todayAttendance,
    isLoading: attendanceQueryLoading,
    error: attendanceQueryError,
    refetch: refetchAttendance,
  } = useTodayAttendance();

  const { data: evaluations, isLoading: evaluationsLoading } = useEvaluations(
    user?.id,
  );
  const { data: notifications = [], refetch: refetchNotifications } =
    useNotifications();

  const hasNewTask = useMemo(() => {
    return notifications.some((n) => n.type === "task_approved" && !n.is_read);
  }, [notifications]);

  const totalTasksCount = todayTasks.length;
  const submittedCount = todayTasks.filter(
    (t) => submissionsByTaskId[t.id]?.status,
  ).length;

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new;
          console.log("🔔 New notification:", notification);
          if (notification.type === "task_approved") {
            toast.success("📋 New task available! Check your dashboard.");
            refetchTasks();
            queryClient.invalidateQueries({
              queryKey: ["tasks", "today", profile?.discipline_id],
            });
          } else {
            toast.info(notification.message || "New notification received");
          }
          refetchNotifications();
        },
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [
    user?.id,
    refetchNotifications,
    refetchTasks,
    toast,
    queryClient,
    profile?.discipline_id,
  ]);

  const handleMarkAttendance = () => {
    if (!user?.id) {
      toast.error("User not found.");
      return;
    }
    if (todayAttendance) {
      toast.info(`Already marked as ${todayAttendance.status} today.`);
      return;
    }
    markAttendance.mutate(
      { internId: user.id },
      {
        onSuccess: (data) => {
          toast.success(`✅ Marked as ${data.status}!`);
          refetchAttendance();
          refetchTasks();
        },
        onError: (error) => {
          const { title, description } = getAttendanceErrorMessage(error);
          toast.error(`${title}\n${description}`);
        },
      },
    );
  };

  const refetchTasksAndAttendance = () => {
    refetchTasks();
    refetchAttendance();
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

  if (profile?.is_suspended) return <SuspendedView />;
  if (!profile?.discipline_id) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-[#2b2d42] mb-2">
            No Discipline Assigned
          </h2>
          <p className="text-[#2b2d42] text-opacity-70">
            Please contact your administrator to be assigned to a discipline.
          </p>
        </Card>
      </div>
    );
  }

  const pageTitle =
    INTERN_NAV_ITEMS.find((i) => i.id === activeItem)?.label || "Dashboard";
  const mainMarginLeft = isMobileOpen ? 0 : sidebarWidth;

  const renderContent = () => {
    switch (activeItem) {
      case "dashboard":
        return (
          <InternDashboardOverview
            profile={profile}
            user={user}
            todayTasks={todayTasks}
            taskLoading={taskLoading}
            taskError={taskError}
            refetchTasks={refetchTasks}
            todayAttendance={todayAttendance}
            attendanceQueryLoading={attendanceQueryLoading}
            refetchAttendance={refetchAttendance}
            evaluations={evaluations}
            evaluationsLoading={evaluationsLoading}
            notifications={notifications}
            hasNewTask={hasNewTask}
            pastTasks={pastTasks}
            submissionsByTaskId={submissionsByTaskId}
            mySubmissions={mySubmissions}
            totalTasksCount={totalTasksCount}
            submittedCount={submittedCount}
            handleMarkAttendance={handleMarkAttendance}
            attendanceLoading={markAttendance.isPending}
            attendanceError={
              markAttendance.error
                ? getAttendanceErrorMessage(markAttendance.error).description
                : null
            }
            refetchTasksAndAttendance={refetchTasksAndAttendance}
            onSwitchToTasks={() => setActiveItem("tasks")}
          />
        );
      case "tasks":
        return <InternTasksView profile={profile} user={user} />;
      case "quizzes":
        return <InternQuizzesView />;
      case "attendance":
        return <InternAttendanceView user={user} />;
      case "profile":
        return <InternProfileView />;
      default:
        return <div>Page not found</div>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        activeItem={activeItem}
        onSelect={setActiveItem}
        onLogout={() => setShowLogoutModal(true)}
        items={INTERN_NAV_ITEMS}
        showSettings={false}
        subtitle="Intern Portal"
      />

      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        style={{ marginLeft: mainMarginLeft }}
      >
        <DashboardHeader
          title={pageTitle}
          breadcrumbs={["Intern", pageTitle]}
        />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {renderContent()}
        </main>
      </div>

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
