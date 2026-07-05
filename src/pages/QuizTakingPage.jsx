// pages/QuizTakingPage.jsx
import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../api/supabase";
import { PageLoading } from "../components/ui/LoadingSpinner";
import { QuizTaking } from "../components/features/admin/quizzes/QuizTaking";
import { useAuth } from "../auth/useAuth";
import { AlertCircle, ArrowLeft, Clock3, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

// Helper to check if a string is a valid UUID v4
const isValidUUID = (id) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return typeof id === 'string' && uuidRegex.test(id);
};

export default function QuizTakingPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // ─── STEP 1: Redirect if attemptId is missing or invalid ───
  useEffect(() => {
    // Redirect if missing, or if it's the string "undefined", or not a valid UUID
    if (!attemptId || attemptId === "undefined" || !isValidUUID(attemptId)) {
      navigate("/intern/quizzes", { replace: true });
    }
  }, [attemptId, navigate]);

  // Early return while redirecting
  if (!attemptId || attemptId === "undefined" || !isValidUUID(attemptId)) {
    return null;
  }

  // ─── STEP 2: Fetch the attempt ────────────────────────────────
  const {
    data: attempt,
    isLoading: attemptLoading,
    error: attemptError,
  } = useQuery({
    queryKey: ["quiz-attempt", attemptId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quiz_attempts")
        .select("*, assignment:assignment_id(*)")
        .eq("id", attemptId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Attempt not found");
      return data;
    },
    enabled: !!attemptId && !!user?.id && isValidUUID(attemptId),
    retry: false,
  });

  // ─── STEP 3: Fetch the assignment ─────────────────────────────
  const {
    data: assignment,
    isLoading: assignmentLoading,
    error: assignmentError,
  } = useQuery({
    queryKey: ["quiz-assignment", attempt?.assignment_id],
    queryFn: async () => {
      if (!attempt?.assignment_id) return null;
      const { data, error } = await supabase
        .from("quiz_assignments")
        .select(`
          *,
          quizzes (*)
        `)
        .eq("id", attempt.assignment_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!attempt?.assignment_id && !!attemptId,
    retry: false,
  });

  // ─── STEP 4: Authorization and status checks ──────────────────
  const isAuthorized = attempt && user && attempt.intern_id === user.id;
  const isCompleted = attempt?.status === "submitted" || attempt?.status === "auto_submitted";
  const isInProgress = attempt?.status === "in_progress";

  // ─── STEP 5: Loading and Error states ──────────────────────────
  if (attemptLoading || assignmentLoading) {
    return <PageLoading />;
  }

  if (attemptError || assignmentError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="text-center border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Failed to Load Quiz
          </h2>
          <p className="text-gray-600">
            {attemptError?.message || assignmentError?.message || "Something went wrong."}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate("/intern/quizzes")}>
              Go to Quizzes
            </Button>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── STEP 6: Not found or unauthorized ──────────────────────
  if (!attempt || !assignment || !isAuthorized) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="text-center border-yellow-200">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock3 className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have access to this quiz attempt.
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => navigate("/intern/quizzes")}>
              View All Quizzes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── STEP 7: Already completed ──────────────────────────────
  if (isCompleted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="text-center border-green-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Quiz Already Completed
          </h2>
          <p className="text-gray-600">
            You have already submitted this quiz. View your results below.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate(`/intern/quiz-result/${attempt.id}`)}
            >
              View Results
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── STEP 8: Invalid attempt state (e.g., abandoned) ──────
  if (!isInProgress) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Card className="text-center border-red-200">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            Cannot Resume Quiz
          </h2>
          <p className="text-gray-600">
            This quiz attempt is no longer active. Please start a new attempt.
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => navigate("/intern/quizzes")}>
              View Quizzes
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── STEP 9: Render the quiz taking interface ──────────────
  const quizTakingProps = {
    assignment: {
      ...assignment,
      attempt: attempt,
      quizzes: assignment.quizzes,
    },
    onComplete: () => navigate("/intern/quizzes"),
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Header with back button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-800">
            {assignment.quizzes?.title || "Quiz"}
          </h1>
          <p className="text-sm text-gray-500">
            {assignment.duration_minutes} minutes • {attempt.questions_snapshot?.length || 0} questions
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-gray-400">Attempt #{attempt.id.slice(0, 8)}</span>
        </div>
      </div>

      <QuizTaking {...quizTakingProps} />
    </div>
  );
}