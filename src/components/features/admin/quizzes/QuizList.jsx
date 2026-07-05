// src/components/features/admin/quizzes/QuizList.jsx
import { useState } from 'react';
import { Card } from '../../../ui/Card';
import { Badge } from '../../../ui/Badge';
import { Button } from '../../../ui/Button';
import { formatDate, cn } from '../../../../utils/helpers';
import { usePublishQuiz } from '../../../../api/queries';
import { useToast } from '../../../ui/Toast';
import { QuizResults } from './QuizResults'; // ✅ import the results modal

export function QuizList({ quizzes, assignments, onEdit, onAssign, disciplineId }) {
  const toast = useToast();
  const publishQuiz = usePublishQuiz();
  const [publishingId, setPublishingId] = useState(null);
  const [resultsQuizId, setResultsQuizId] = useState(null); // ✅ state for results modal

  const getAssignment = (quizId) => {
    return assignments?.find((a) => a.quiz_id === quizId);
  };

  const handlePublish = async (quiz) => {
    if (!disciplineId) {
      toast.warning('Please select a discipline first.');
      return;
    }
    setPublishingId(quiz.id);
    try {
      await publishQuiz.mutateAsync({
        quizId: quiz.id,
        disciplineId: disciplineId,
      });
      toast.success(`Quiz "${quiz.title}" published successfully!`);
    } catch (error) {
      toast.error(error.message || 'Failed to publish quiz.');
    } finally {
      setPublishingId(null);
    }
  };

  if (quizzes.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-[#2b2d42] text-opacity-50">
          No quizzes found. Create your first quiz!
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {quizzes.map((quiz) => {
          const assignment = getAssignment(quiz.id);
          return (
            <Card
              key={quiz.id}
              className={cn(
                quiz.status === 'draft' && 'border-l-4 border-l-yellow-400',
                quiz.status === 'published' && 'border-l-4 border-l-green-400',
                quiz.status === 'archived' && 'border-l-4 border-l-gray-400 opacity-70'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-[#2b2d42]">{quiz.title}</h3>
                    <Badge
                      variant={
                        quiz.status === 'published'
                          ? 'success'
                          : quiz.status === 'archived'
                          ? 'default'
                          : 'warning'
                      }
                      size="sm"
                    >
                      {quiz.status}
                    </Badge>
                  </div>
                  {quiz.description && (
                    <p className="text-sm text-[#2b2d42] text-opacity-70 mb-2">
                      {quiz.description.slice(0, 120)}
                      {quiz.description.length > 120 && '...'}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-[#2b2d42] text-opacity-50">
                    <span>Created: {formatDate(quiz.created_at)}</span>
                    {assignment && (
                      <>
                        <span>• Assigned to: {assignment.discipline_id}</span>
                        <span>• Opens: {formatDate(assignment.opens_at)}</span>
                        <span>• Closes: {formatDate(assignment.closes_at)}</span>
                        <span>• Duration: {assignment.duration_minutes}m</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {quiz.status === 'draft' && (
                    <>
                      <Button size="sm" onClick={() => onEdit(quiz)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handlePublish(quiz)}
                        isLoading={publishingId === quiz.id}
                        disabled={publishingId === quiz.id}
                      >
                        Publish
                      </Button>
                    </>
                  )}
                  {quiz.status === 'published' && !assignment && (
                    <Button size="sm" variant="secondary" onClick={() => onAssign(quiz)}>
                      Assign
                    </Button>
                  )}
                  {quiz.status === 'published' && assignment && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAssign(quiz)}
                      >
                        Edit Assignment
                      </Button>
                      {/* ✅ NEW: View Results button */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setResultsQuizId(quiz.id)}
                      >
                        Results
                      </Button>
                    </>
                  )}
                  {quiz.status === 'archived' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(quiz)}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ✅ Results Modal */}
      {resultsQuizId && (
        <QuizResults
          quizId={resultsQuizId}
          isOpen={!!resultsQuizId}
          onClose={() => setResultsQuizId(null)}
        />
      )}
    </>
  );
}