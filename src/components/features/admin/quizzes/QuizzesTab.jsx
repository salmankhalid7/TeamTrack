// src/components/features/admin/quizzes/QuizzesTab.jsx
import { useState } from "react";
import { useQuizzes, useAssignments } from "../../../../api/queries";
import { Card } from "../../../ui/Card";
import { Button } from "../../../ui/Button";
import { Badge } from "../../../ui/Badge";
import { PageLoading } from "../../../ui/LoadingSpinner";
import { QuizList } from "./QuizList";
import { QuizForm } from "./QuizForm";
import { AssignmentForm } from "./AssignmentForm";
import { cn } from "../../../../utils/helpers";

export function QuizzesTab({ disciplineId }) {
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [selectedQuizForAssignment, setSelectedQuizForAssignment] =
    useState(null);

  const { data: quizzes = [], isLoading: quizzesLoading } =
    useQuizzes(disciplineId);
  const { data: assignments = [], isLoading: assignmentsLoading } =
    useAssignments(disciplineId);

  if (quizzesLoading || assignmentsLoading) {
    return <PageLoading />;
  }

  const handleEdit = (quiz) => {
    setEditingQuiz(quiz);
    setShowQuizForm(true);
  };

  const handleAssign = (quiz) => {
    setSelectedQuizForAssignment(quiz);
    setShowAssignmentForm(true);
  };

  const handleCloseForms = () => {
    setShowQuizForm(false);
    setEditingQuiz(null);
    setShowAssignmentForm(false);
    setSelectedQuizForAssignment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-[#2b2d42]">Quizzes</h2>
          <p className="text-sm text-[#2b2d42] text-opacity-60">
            Create, edit, and assign quizzes to disciplines
          </p>
        </div>
        <Button onClick={() => setShowQuizForm(true)}>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          New Quiz
        </Button>
      </div>
      {/* Quiz List */}
      <QuizList
        quizzes={quizzes}
        assignments={assignments}
        onEdit={handleEdit}
        onAssign={handleAssign}
        disciplineId={disciplineId}
      />
      {/* Quiz Form Modal (Create / Edit) */}
      {showQuizForm && (
        <QuizForm
          isOpen={showQuizForm}
          onClose={handleCloseForms}
          quiz={editingQuiz}
          disciplineId={disciplineId}
        />
      )}
      {showAssignmentForm && selectedQuizForAssignment && (
        <AssignmentForm
          isOpen={showAssignmentForm}
          onClose={handleCloseForms}
          quiz={selectedQuizForAssignment}
          disciplineId={disciplineId || selectedQuizForAssignment.discipline_id} // ✅ fallback
        />
      )}
    </div>
  );
}
