import { useState } from 'react';
import { supabase } from '../../../api/supabase';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { useToast } from '../../ui/Toast';
import { useQueryClient } from '@tanstack/react-query';
import { useGenerateQuiz } from '../../../api/queries';

export function QuizReview({ quiz }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestions, setEditedQuestions] = useState(quiz.questions);
  const [isApproving, setIsApproving] = useState(false);
  
  const queryClient = useQueryClient();
  const toast = useToast();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const { error } = await supabase
        .from('quizzes')
        .update({ status: 'approved' })
        .eq('id', quiz.id);
      
      if (error) throw error;
      
      toast.success('Quiz approved!');
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (error) {
      toast.error('Failed to approve quiz');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', quiz.id);
      
      if (error) throw error;
      
      toast.success('Quiz rejected and removed');
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
    } catch (error) {
      toast.error('Failed to reject quiz');
    }
  };

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[#2b2d42]">Quiz Review</h3>
          <p className="text-sm text-[#2b2d42] text-opacity-50">
            {quiz.questions.length} questions • {quiz.total_marks} marks
          </p>
        </div>
        <Badge variant="warning">Draft</Badge>
      </div>

      {/* Questions Preview */}
      <div className="space-y-6 max-h-96 overflow-y-auto mb-6">
        {editedQuestions.map((q, qIndex) => (
          <div key={qIndex} className="p-4 bg-[#f8f7f9] rounded-lg">
            <p className="font-medium text-[#2b2d42] mb-3">
              Q{qIndex + 1}. {q.question}
            </p>
            <div className="space-y-1 ml-4">
              {q.options.map((option, oIndex) => (
                <div
                  key={oIndex}
                  className={`flex items-center p-2 rounded ${
                    oIndex === q.correctAnswer
                      ? 'bg-green-100 border border-green-300'
                      : 'border border-transparent'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2 ${
                    oIndex === q.correctAnswer
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-[#2b2d42]'
                  }`}>
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                  <span className="text-sm text-[#2b2d42] text-opacity-80">
                    {option.replace(/^[A-D]\)\s*/, '')}
                  </span>
                  {oIndex === q.correctAnswer && (
                    <Badge variant="success" size="sm" className="ml-auto">Correct</Badge>
                  )}
                </div>
              ))}
            </div>
            {q.explanation && (
              <p className="text-xs text-[#2b2d42] text-opacity-50 mt-2 ml-4">
                💡 {q.explanation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={handleApprove} isLoading={isApproving}>
          Approve Quiz
        </Button>
        <Button variant="danger" onClick={handleReject}>
          Reject & Delete
        </Button>
      </div>
    </Card>
  );
}

// Export QuizGenerator for use in other components
export function QuizGenerator({ task, onGenerated }) {
  const [questionCount, setQuestionCount] = useState(10);
  const generateQuiz = useGenerateQuiz();
  const toast = useToast();
  
  const handleGenerate = async () => {
    try {
      await generateQuiz.mutateAsync({ 
        taskId: task.id, 
        questionCount 
      });
      toast.success('Quiz generated! Pending your review.');
      onGenerated?.();
    } catch (error) {
      toast.error('Failed to generate quiz');
    }
  };
  
  return (
    <div className="p-4 bg-[#f8f7f9] rounded-lg space-y-3">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-[#2b2d42]">
          Number of Questions:
        </label>
        <select
          value={questionCount}
          onChange={(e) => setQuestionCount(Number(e.target.value))}
          className="px-3 py-1.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0080c8]"
        >
          <option value={5}>5 questions</option>
          <option value={10}>10 questions</option>
          <option value={15}>15 questions</option>
          <option value={20}>20 questions</option>
        </select>
      </div>
      <Button
        size="sm"
        onClick={handleGenerate}
        isLoading={generateQuiz.isPending}
      >
        Generate Quiz
      </Button>
    </div>
  );
}