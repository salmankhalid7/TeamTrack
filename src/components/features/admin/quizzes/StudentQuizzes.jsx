// components/features/intern/StudentQuizzes.jsx
import { useNavigate } from "react-router-dom";
import { useToast } from "../../../../components/ui/Toast";
import { useAuth } from "../../../../auth/useAuth";
import { useStudentAssignedQuizzes, useStartQuizAttempt } from "../../../../api/queries";
import { Card } from "../../../../components/ui/Card";
import { Button } from "../../../../components/ui/Button";
import { Badge } from "../../../../components/ui/Badge";
import { formatDate } from "../../../../utils/helpers";
import {
  GraduationCap,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Play,
  Eye,
  Loader2,
  Calendar,
  Timer,
} from "lucide-react";

export function StudentQuizzes() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const { data: assignments = [], isLoading, error, refetch } = useStudentAssignedQuizzes();
  const startQuiz = useStartQuizAttempt();

  const handleStartQuiz = async (assignmentId) => {
    if (!assignmentId) {
      toast.error("Invalid assignment ID");
      return;
    }
    try {
      const attempt = await startQuiz.mutateAsync({ assignmentId });
      if (!attempt?.id) {
        throw new Error("Attempt created but no ID returned");
      }
      toast.success("Quiz started! Good luck!");
      navigate(`/intern/quiz/${attempt.id}`);
    } catch (err) {
      console.error("❌ Start quiz error:", err);
      toast.error(err?.message || "Failed to start quiz. Please try again.");
    }
  };

  const handleResumeQuiz = (attemptId) => {
    if (!attemptId) {
      toast.error("Unable to resume – missing attempt ID");
      return;
    }
    navigate(`/intern/quiz/${attemptId}`);
  };

  const handleViewResults = (attemptId) => {
    if (!attemptId) {
      toast.error("Unable to view results – missing attempt ID");
      return;
    }
    navigate(`/intern/quiz-result/${attemptId}`);
  };

  // Compute status robustly
  const getStatus = (assignment) => {
    const now = new Date();
    const opens = assignment.opens_at ? new Date(assignment.opens_at) : null;
    const closes = assignment.closes_at ? new Date(assignment.closes_at) : null;
    const attempt = assignment.attempt;

    if (opens && now < opens) return 'upcoming';
    if (closes && now > closes) return 'expired';
    if (attempt) {
      if (attempt.status === 'in_progress') return 'in_progress';
      if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') return 'completed';
    }
    // If we have an attempt but status is not recognized, treat as available (should not happen)
    if (attempt) return 'available';
    // If no attempt and within time window
    if (opens && closes && now >= opens && now <= closes) return 'available';
    return 'unknown';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-[#0080c8]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <div className="text-center py-8 text-red-500">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <p>Failed to load quizzes. Please refresh.</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <Card>
        <div className="text-center py-8 text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3" />
          <p>No quizzes assigned to you yet.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const quiz = assignment.quizzes;
        const attempt = assignment.attempt;
        const status = getStatus(assignment);

        // Determine badge and button states
        let badgeVariant = "default";
        let badgeLabel = "Not Started";
        let isStartable = false;
        let isResumable = false;
        let isCompleted = false;

        switch (status) {
          case "upcoming":
            badgeVariant = "default";
            badgeLabel = "Upcoming";
            break;
          case "expired":
            badgeVariant = "danger";
            badgeLabel = "Expired";
            break;
          case "in_progress":
            badgeVariant = "warning";
            badgeLabel = "In Progress";
            isResumable = !!attempt?.id;
            break;
          case "completed": {
            badgeVariant = "success";
            const scorePercent = attempt?.total_marks
              ? Math.round((attempt.score / attempt.total_marks) * 100)
              : 0;
            badgeLabel = `Completed (${scorePercent}%)`;
            isCompleted = true;
            break;
          }
          case "available":
          default:
            if (attempt) {
              // Should not happen if status is correct, but fallback
              if (attempt.status === 'in_progress') {
                badgeVariant = "warning";
                badgeLabel = "In Progress";
                isResumable = !!attempt?.id;
              } else if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
                badgeVariant = "success";
                const scorePercent = attempt?.total_marks
                  ? Math.round((attempt.score / attempt.total_marks) * 100)
                  : 0;
                badgeLabel = `Completed (${scorePercent}%)`;
                isCompleted = true;
              } else {
                badgeVariant = "info";
                badgeLabel = "Ready to Start";
                isStartable = true;
              }
            } else {
              badgeVariant = "info";
              badgeLabel = "Ready to Start";
              isStartable = true;
            }
            break;
        }

        // Safety: if attempt exists but no id, treat as not resumable/completed
        if (attempt && !attempt.id) {
          isResumable = false;
          isCompleted = false;
          isStartable = false;
        }

        return (
          <Card key={assignment.id} className="overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-800 truncate">
                    {quiz?.title || "Untitled Quiz"}
                  </h4>
                  <Badge variant={badgeVariant}>{badgeLabel}</Badge>
                </div>
                {quiz?.description && (
                  <p className="text-sm text-gray-500 truncate">{quiz.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                  {assignment.opens_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Opens: {formatDate(assignment.opens_at)}
                    </span>
                  )}
                  {assignment.closes_at && (
                    <span className="flex items-center gap-1">
                      <Timer className="w-3 h-3" /> Closes: {formatDate(assignment.closes_at)}
                    </span>
                  )}
                  {assignment.duration_minutes && (
                    <span className="flex items-center gap-1">
                      <Clock3 className="w-3 h-3" /> {assignment.duration_minutes} min
                    </span>
                  )}
                  {attempt && attempt.score !== undefined && attempt.total_marks && (
                    <span className="flex items-center gap-1 text-gray-600">
                      <CheckCircle2 className="w-3 h-3 text-green-500" /> Score: {attempt.score}/{attempt.total_marks}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {isStartable && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleStartQuiz(assignment.id)}
                    isLoading={startQuiz.isPending}
                    disabled={startQuiz.isPending}
                  >
                    <Play className="w-4 h-4 mr-1" /> Start
                  </Button>
                )}
                {isResumable && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleResumeQuiz(attempt.id)}
                  >
                    <Clock3 className="w-4 h-4 mr-1" /> Resume
                  </Button>
                )}
                {isCompleted && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleViewResults(attempt.id)}
                  >
                    <Eye className="w-4 h-4 mr-1" /> View Results
                  </Button>
                )}
                {status === "expired" && !attempt && (
                  <Button size="sm" variant="ghost" disabled>
                    <AlertCircle className="w-4 h-4 mr-1" /> Closed
                  </Button>
                )}
                {status === "upcoming" && (
                  <Button size="sm" variant="ghost" disabled>
                    <Clock3 className="w-4 h-4 mr-1" /> Coming Soon
                  </Button>
                )}
                {!isStartable && !isResumable && !isCompleted && status !== "upcoming" && status !== "expired" && (
                  <Button size="sm" variant="ghost" disabled>
                    <AlertCircle className="w-4 h-4 mr-1" /> Not Available
                  </Button>
                )}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}