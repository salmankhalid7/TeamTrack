// src/components/features/admin/quizzes/QuizResults.jsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../../ui/Modal';
import { Card } from '../../../ui/Card';
import { Badge } from '../../../ui/Badge';
import { supabase } from '../../../../api/supabase';
import { formatDate } from '../../../../utils/helpers';
import { LoadingSpinner } from '../../../ui/LoadingSpinner';

export function QuizResults({ quizId, isOpen, onClose }) {
  const { data: attempts = [], isLoading, error } = useQuery({
    queryKey: ['quiz-results', quizId],
    queryFn: async () => {
      // First, find all assignments for this quiz
      const { data: assignments, error: assignError } = await supabase
        .from('quiz_assignments')
        .select('id')
        .eq('quiz_id', quizId);

      if (assignError) throw assignError;
      if (!assignments || assignments.length === 0) return [];

      const assignmentIds = assignments.map((a) => a.id);

      // Then fetch all attempts for those assignments, with intern profiles
      const { data, error } = await supabase
        .from('quiz_attempts')
        .select(`
          *,
          profiles!intern_id (
            full_name,
            email
          )
        `)
        .in('assignment_id', assignmentIds)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!quizId && isOpen,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quiz Results"
      size="large"
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-600">
          Failed to load results: {error.message}
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-8 text-[#2b2d42] text-opacity-50">
          No attempts yet for this quiz.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f7f9] border-b border-[rgba(43,45,66,0.12)]">
              <tr>
                <th className="text-left p-3 font-medium text-[#2b2d42]">Intern</th>
                <th className="text-left p-3 font-medium text-[#2b2d42]">Score</th>
                <th className="text-left p-3 font-medium text-[#2b2d42]">Percentage</th>
                <th className="text-left p-3 font-medium text-[#2b2d42]">Status</th>
                <th className="text-left p-3 font-medium text-[#2b2d42]">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => {
                const percentage = attempt.total_marks
                  ? Math.round((attempt.score / attempt.total_marks) * 100)
                  : 0;
                return (
                  <tr
                    key={attempt.id}
                    className="border-b border-[rgba(43,45,66,0.06)] hover:bg-[#f8f7f9]"
                  >
                    <td className="p-3">
                      <div className="font-medium text-[#2b2d42]">
                        {attempt.profiles?.full_name || 'Unknown'}
                      </div>
                      <div className="text-xs text-[#2b2d42] text-opacity-50">
                        {attempt.profiles?.email || 'No email'}
                      </div>
                    </td>
                    <td className="p-3">
                      {attempt.score}/{attempt.total_marks}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-semibold ${
                          percentage >= 80
                            ? 'text-green-600'
                            : percentage >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {percentage}%
                      </span>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant={
                          attempt.status === 'submitted'
                            ? 'success'
                            : attempt.status === 'auto_submitted'
                            ? 'warning'
                            : 'default'
                        }
                        size="sm"
                      >
                        {attempt.status === 'auto_submitted'
                          ? 'Auto-submitted'
                          : attempt.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-[#2b2d42] text-opacity-50">
                      {attempt.submitted_at
                        ? formatDate(attempt.submitted_at)
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}