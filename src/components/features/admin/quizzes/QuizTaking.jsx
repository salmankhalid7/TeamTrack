import { useState, useEffect } from "react";
import { Card } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import { Badge } from "../../../ui/Badge";
import { useSubmitQuizAttempt } from "../../../../api/queries";
import { useToast } from "../../../ui/Toast";
import { QuizResult } from "../../intern/QuizResult";
export function QuizTaking({ assignment, onComplete }) {
  const toast = useToast();
  const [attempt, setAttempt] = useState(assignment.attempt);
  const [answers, setAnswers] = useState(assignment.attempt?.answers || {});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const submitQuiz = useSubmitQuizAttempt();

  const questions = attempt?.questions_snapshot || [];
  const total = questions.length;

  // Timer logic
  useEffect(() => {
    if (!attempt?.started_at || submitted) return;
    const start = new Date(attempt.started_at);
    const durationMs = assignment.duration_minutes * 60 * 1000;
    const end = start.getTime() + durationMs;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      if (remaining <= 0) {
        clearInterval(interval);
        handleAutoSubmit();
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [attempt, submitted]);

  const handleAutoSubmit = async () => {
    if (submitted) return;
    toast.warning("Time is up! Submitting your quiz.");
    try {
      const result = await submitQuiz.mutateAsync({
        attemptId: attempt.id,
        answers,
      });
      setResult(result);
      setSubmitted(true);
      toast.success("Quiz submitted!");
      onComplete?.();
    } catch (error) {
      toast.error("Auto‑submit failed. Please contact admin.");
    }
  };

  const handleSubmit = async () => {
    if (submitted) return;
    try {
      const result = await submitQuiz.mutateAsync({
        attemptId: attempt.id,
        answers,
      });
      setResult(result);
      setSubmitted(true);
      toast.success("Quiz submitted successfully!");
      onComplete?.();
    } catch (error) {
      toast.error(error.message || "Failed to submit.");
    }
  };

  const handleAnswer = (qIndex, optionIndex) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));
    // Optionally save to Supabase periodically – not needed; we save on submit.
  };

  if (submitted && result) {
    return <QuizResult result={result} />;
  }

  if (!attempt) {
    return (
      <Card className="text-center py-12">
        <p>No attempt found. Please restart.</p>
        <Button onClick={onComplete}>Back</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-[#2b2d42]">
          {assignment.quizzes?.title || "Quiz"}
        </h2>
        <div className="flex items-center gap-3">
          <Badge variant="warning">{timeLeft || "–"}</Badge>
          <span className="text-sm text-[#2b2d42] text-opacity-50">
            {Object.keys(answers).length} / {total} answered
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <Card key={qIndex} className="p-4">
            <p className="font-medium text-[#2b2d42] mb-3">
              Q{qIndex + 1}. {q.question_text}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oIndex) => {
                const isSelected = answers[qIndex] === oIndex;
                return (
                  <label
                    key={oIndex}
                    className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
                      isSelected
                        ? "border-[#0080c8] bg-blue-50"
                        : "border-[rgba(43,45,66,0.12)] hover:bg-[#f8f7f9]"
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q${qIndex}`}
                      value={oIndex}
                      checked={isSelected}
                      onChange={() => handleAnswer(qIndex, oIndex)}
                      className="mr-3"
                    />
                    <span className="text-sm text-[#2b2d42]">
                      {String.fromCharCode(65 + oIndex)}. {opt}
                    </span>
                  </label>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onComplete}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          isLoading={submitQuiz.isPending}
          disabled={Object.keys(answers).length < total}
        >
          Submit Quiz ({Object.keys(answers).length}/{total})
        </Button>
      </div>
    </div>
  );
}