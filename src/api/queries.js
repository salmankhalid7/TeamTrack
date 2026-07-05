// src/api/queries.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';
import { useAuth } from '../auth/useAuth';
import { markAttendanceViaEdge } from './attendance'; // <-- secure edge function caller

// ============================================
// Task Hooks
// ============================================

// HOOK: Get ALL approved tasks for the current internship day
export function useTodayTasks() {
  const { profile } = useAuth();

  // Calculate internship day number from start_date
  const getDayNumber = () => {
    if (!profile?.start_date) return 1;
    const start = new Date(profile.start_date);
    const now = new Date();
    const diffTime = Math.abs(now - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const dayNumber = getDayNumber();

  return useQuery({
    queryKey: ['tasks', 'today', profile?.discipline_id, dayNumber],
    queryFn: async () => {
      if (!profile?.discipline_id) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('discipline_id', profile.discipline_id)
        .eq('day_number', dayNumber)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.discipline_id && profile?.role === 'intern',
    retry: (failureCount, error) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    },
  });
}

export function useTasks(disciplineId) {
  return useQuery({
    queryKey: ['tasks', disciplineId],
    queryFn: async () => {
      if (!disciplineId) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('discipline_id', disciplineId)
        .order('day_number', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!disciplineId,
    refetchOnMount: "always",
    refetchOnReconnect: true,
  });
}

export function useApproveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, status, approvedBy }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update({
          status,
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, updates }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.updates?.discipline_id] });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskData) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', data.discipline_id] });
    },
  });
}

// ============================================
// Attendance Hooks (SECURE – Edge Function only)
// ============================================

export function useTodayAttendance() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['attendance', 'today', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('intern_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    },
    enabled: !!user,
    retry: (failureCount, error) => {
      if (error?.code === 'PGRST116') return false;
      return failureCount < 3;
    },
  });
}

/**
 * Secure attendance marking – calls the Edge Function.
 * The Edge Function validates the time window, computes the status,
 * and checks for duplicates – all on the server.
 */
export function useMarkAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ internId }) => {
      if (!internId) throw new Error('Intern ID is required');
      const today = new Date().toISOString().split('T')[0];
      return await markAttendanceViaEdge();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
    // ✅ Add a custom error handler – if the error is still generic, we parse again
    onError: (error) => {
      // This is just for safety – but the error thrown from markAttendanceViaEdge should already be clean.
      // If not, we can try to extract it here.
      let cleanMessage = error.message;
      if (error.context?.error) cleanMessage = error.context.error;
      else if (error.body?.error) cleanMessage = error.body.error;
      // Re-throw with the clean message so the component can display it.
      throw new Error(cleanMessage);
    },
  });
}

// ============================================
// Quiz Hooks
// ============================================

export function useQuiz(taskId) {
  return useQuery({
    queryKey: ['quiz', taskId],
    queryFn: async () => {
      if (!taskId) return null;

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('task_id', taskId)
        .eq('status', 'approved')
        .maybeSingle();

      if (error) throw error;
      return data || null;
    },
    enabled: !!taskId,
  });
}

export function useSubmitQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, internId, answers }) => {
      const { data: quiz, error: quizError } = await supabase
        .from('quizzes')
        .select('questions, total_marks')
        .eq('id', quizId)
        .single();

      if (quizError) throw quizError;

      let score = 0;
      const questions = quiz.questions;
      questions.forEach((q, index) => {
        if (answers[index] === q.correctAnswer) {
          score += (quiz.total_marks / questions.length);
        }
      });

      const { data, error } = await supabase
        .from('quiz_attempts')
        .insert({
          quiz_id: quizId,
          intern_id: internId,
          answers,
          score: Math.round(score),
          total_marks: quiz.total_marks,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        ...data,
        correctCount: Object.values(answers).filter((ans, idx) =>
          ans === quiz.questions[idx].correctAnswer
        ).length,
        wrongCount: Object.values(answers).filter((ans, idx) =>
          ans !== quiz.questions[idx].correctAnswer
        ).length,
        feedback: data.score >= quiz.total_marks * 0.7
          ? 'Great job! You have a good understanding of the material.'
          : 'Keep reviewing the material and try again!'
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempts'] });
    },
  });
}

// ============================================
// Submission Hooks
// ============================================

export function useUploadSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, fileUrl, taskId, internId, description, type = 'file' }) => {
      let finalUrl = fileUrl || null;

      if (file && type === 'file') {
        const formData = new FormData();
        formData.append('file', file);

        const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
        if (!uploadPreset) {
          throw new Error('Cloudinary upload preset is not configured. Please contact admin.');
        }
        formData.append('upload_preset', uploadPreset);
        formData.append('folder', 'task-submissions');

        const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
        if (!cloudName) {
          throw new Error('Cloudinary cloud name is not configured.');
        }
        console.log('☁️ Upload preset:', uploadPreset);
        console.log('☁️ Cloud name:', cloudName);
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/upload`,
          { method: 'POST', body: formData }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Cloudinary error:', errorData);
          throw new Error(errorData.error?.message || 'Failed to upload file to Cloudinary');
        }

        const cloudinaryData = await response.json();
        finalUrl = cloudinaryData.secure_url;
      }

      const { data, error } = await supabase
        .from('submissions')
        .insert({
          task_id: taskId,
          intern_id: internId,
          file_url: finalUrl,
          description,
          submission_type: type,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

export function useSubmissions(filters = {}) {
  return useQuery({
    queryKey: ['submissions', filters],
    queryFn: async () => {
      let query = supabase
        .from('submissions')
        .select(`
          *,
          tasks (title, day_number),
          profiles!submissions_intern_id_fkey (full_name, email)
        `);

      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.internId) {
        query = query.eq('intern_id', filters.internId);
      }

      const { data, error } = await query.order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useReviewSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ submissionId, status, remark, reviewerId }) => {
      const { data, error } = await supabase
        .from('submissions')
        .update({
          status,
          admin_remark: remark,
          reviewed_by: reviewerId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', submissionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });
}

// ============================================
// Evaluation Hooks
// ============================================

export function useEvaluations(internId) {
  return useQuery({
    queryKey: ['evaluations', internId],
    queryFn: async () => {
      if (!internId) return [];

      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('intern_id', internId)
        .order('week_start', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!internId,
  });
}

// ============================================
// Notification Hooks
// ============================================

export function useNotifications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUnreadNotificationCount() {
  const { data: notifications } = useNotifications();

  return notifications?.filter(n => !n.is_read).length || 0;
}

// ============================================
// Admin Hooks
// ============================================

export function useInterns(disciplineId = null) {
  return useQuery({
    queryKey: ['interns', disciplineId],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('role', 'intern');

      if (disciplineId) {
        query = query.eq('discipline_id', disciplineId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });
}

export function useManageIntern() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ internId, action, reason }) => {
      const updates = action === 'suspend'
        ? { is_suspended: true, suspension_reason: reason }
        : { is_suspended: false, suspension_reason: null };

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', internId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interns'] });
      queryClient.invalidateQueries({ queryKey: ['profiles'] });
    },
  });
}

export function useDisciplines() {
  return useQuery({
    queryKey: ['disciplines'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disciplines')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

// ============================================
// AI Generation Hooks
// ============================================

export function useGenerateTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pdfText, disciplineId, disciplineName }) => {
      const { data, error } = await supabase.functions.invoke('generate-tasks', {
        body: { pdfText, disciplineId, disciplineName },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (variables?.disciplineId) {
        queryClient.invalidateQueries({ queryKey: ['tasks', variables.disciplineId] });
      }
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

export function useGenerateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, questionCount = 10 }) => {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { taskId, questionCount },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quiz'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useTriggerAttendanceCheck() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('attendance-check');

      if (error) throw error;
      return data;
    },
  });
}

export function useTriggerEvaluation() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('evaluate-weekly');

      if (error) throw error;
      return data;
    },
  });
}

// Request reinstatement (intern)
export function useRequestReinstatement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ internId, reason }) => {
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      const notifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'reinstatement_request',
        title: 'Reinstatement Request',
        message: `An intern has requested account reinstatement. Reason: ${reason}`,
        data: { intern_id: internId, reason },
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;

      await supabase.from('notifications').insert({
        user_id: internId,
        type: 'reinstatement_requested',
        title: 'Reinstatement Requested',
        message: 'Your reinstatement request has been submitted. An admin will review it shortly.',
        data: { reason },
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

// Get all approved tasks for a discipline BEFORE today's day number (task history)
export function usePastApprovedTasks(disciplineId, beforeDay) {
  return useQuery({
    queryKey: ['tasks', 'approved', 'past', disciplineId, beforeDay],
    queryFn: async () => {
      if (!disciplineId || !beforeDay) return [];

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('discipline_id', disciplineId)
        .eq('status', 'approved')
        .lt('day_number', beforeDay)
        .order('day_number', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!disciplineId && !!beforeDay,
  });
}

// Get all of the current intern's submissions (across all tasks), for status lookup
export function useMySubmissions(internId) {
  return useQuery({
    queryKey: ['submissions', 'mine', internId],
    queryFn: async () => {
      if (!internId) return [];

      const { data, error } = await supabase
        .from('submissions')
        .select('task_id, status, submitted_at, admin_remark')
        .eq('intern_id', internId)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!internId,
  });
}

// ============================================
// NEW QUIZ SYSTEM HOOKS (updated)
// ============================================

// 1. Generate Quiz Pool (calls Edge Function)
export function useGenerateQuizPool() {
  return useMutation({
    mutationFn: async ({ topic, questionCount = 10, taskIds = [] }) => {
      const { data, error } = await supabase.functions.invoke('generate-quiz-pool', {
        body: { topic, questionCount, taskIds },
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error || 'Failed to generate questions.');
      return data.questions;
    },
  });
}

// 2. Create Quiz (metadata only)
export function useCreateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, disciplineId, createdBy }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .insert({
          title,
          description,
          discipline_id: disciplineId,
          created_by: createdBy,
          status: 'draft',
          questions: [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
  });
}

// 3. Update Quiz (metadata)
export function useUpdateQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, updates }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', quizId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-pool'] });
    },
  });
}

// 4. Publish Quiz (change status, send notifications)
export function usePublishQuiz() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, disciplineId }) => {
      const { data, error } = await supabase
        .from('quizzes')
        .update({ status: 'published', updated_at: new Date().toISOString() })
        .eq('id', quizId)
        .select()
        .single();

      if (error) throw error;

      const { data: interns } = await supabase
        .from('profiles')
        .select('id')
        .eq('discipline_id', disciplineId)
        .eq('role', 'intern');

      if (interns && interns.length > 0) {
        const notifications = interns.map((intern) => ({
          user_id: intern.id,
          type: 'quiz_published',
          title: 'New Quiz Available',
          message: `A new quiz "${data.title}" has been published for your discipline.`,
          data: { quiz_id: quizId },
          is_read: false,
        }));
        await supabase.from('notifications').insert(notifications);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    },
    onError: (error) => {
      console.error('Publish quiz error:', error);
    },
  });
}

// 5. Add Question to Pool
export function useAddQuestionToPool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, questionText, options, correctAnswer, explanation }) => {
      const { data, error } = await supabase
        .from('quiz_questions')
        .insert({
          quiz_id: quizId,
          question_text: questionText,
          options,
          correct_answer: correctAnswer,
          explanation,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-pool', variables.quizId] });
    },
  });
}

// 6. Delete Question from Pool
export function useDeleteQuestionFromPool() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ questionId, quizId }) => {
      const { error } = await supabase
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-pool', variables.quizId] });
    },
  });
}

// 7. Fetch Quiz Pool (questions)
export function useQuizPool(quizId) {
  return useQuery({
    queryKey: ['quiz-pool', quizId],
    queryFn: async () => {
      if (!quizId) return [];

      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!quizId,
  });
}

// 8. Fetch All Quizzes (for admin)
export function useQuizzes(disciplineId = null) {
  return useQuery({
    queryKey: ['quizzes', disciplineId],
    queryFn: async () => {
      let query = supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (disciplineId) {
        query = query.eq('discipline_id', disciplineId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });
}

// 9. Create Assignment
export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ quizId, disciplineId, opensAt, closesAt, durationMinutes, questionCount = null, fixedQuestionIds = [] }) => {
      const { data, error } = await supabase
        .from('quiz_assignments')
        .insert({
          quiz_id: quizId,
          discipline_id: disciplineId,
          opens_at: opensAt,
          closes_at: closesAt,
          duration_minutes: durationMinutes,
          question_count: questionCount,
          fixed_question_ids: fixedQuestionIds.length > 0 ? fixedQuestionIds : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
}

// 10. Fetch Assignments (for admin or intern)
export function useAssignments(disciplineId = null) {
  return useQuery({
    queryKey: ['assignments', disciplineId],
    queryFn: async () => {
      let query = supabase
        .from('quiz_assignments')
        .select(`
          *,
          quizzes (id, title, description, status)
        `)
        .order('opens_at', { ascending: true });

      if (disciplineId) {
        query = query.eq('discipline_id', disciplineId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });
}

export function useStudentAssignedQuizzes() {
  const { profile, user } = useAuth();

  return useQuery({
    queryKey: ['student-assigned-quizzes', profile?.discipline_id, user?.id],
    queryFn: async () => {
      if (!profile?.discipline_id || !user?.id) {
        return [];
      }

      const { data: assignments, error } = await supabase
        .from('quiz_assignments')
        .select(`
          *,
          quizzes (id, title, description, status)
        `)
        .eq('discipline_id', profile.discipline_id)
        .eq('quizzes.status', 'published')
        .order('opens_at', { ascending: true });

      if (error) throw error;

      console.log('🔍 Assignments for intern:', assignments);

      const { data: attempts, error: attemptsError } = await supabase
        .from('quiz_attempts')
        .select('assignment_id, status, started_at, submitted_at, score, total_marks')
        .eq('intern_id', user.id);

      if (attemptsError) throw attemptsError;

      const attemptsMap = {};
      attempts.forEach((a) => {
        attemptsMap[a.assignment_id] = a;
      });

      const now = new Date();
      return assignments.map((assignment) => {
        const attempt = attemptsMap[assignment.id];
        let status = 'available';

        const opensAt = new Date(assignment.opens_at);
        const closesAt = new Date(assignment.closes_at);

        if (now < opensAt) {
          status = 'upcoming';
        } else if (now > closesAt) {
          status = 'expired';
        } else if (attempt) {
          if (attempt.status === 'submitted' || attempt.status === 'auto_submitted') {
            status = 'completed';
          } else if (attempt.status === 'in_progress') {
            status = 'in_progress';
          }
        }

        return {
          ...assignment,
          attempt,
          status,
          opensAt,
          closesAt,
        };
      });
    },
    enabled: !!profile?.discipline_id && !!user?.id,
    retry: false,
  });
}

export function useStartQuizAttempt() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ assignmentId, internId }) => {
      const finalInternId = internId || user?.id;
      if (!finalInternId) {
        throw new Error('You must be logged in to start a quiz.');
      }

      const { data: existing, error: fetchError } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('intern_id', finalInternId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (existing) {
        if (existing.status === 'submitted' || existing.status === 'auto_submitted') {
          throw new Error('This quiz has already been completed.');
        }
        return existing;
      }

      const { data: assignment, error: assignmentError } = await supabase
        .from('quiz_assignments')
        .select('quiz_id, question_count, fixed_question_ids, duration_minutes')
        .eq('id', assignmentId)
        .maybeSingle();

      if (assignmentError) throw assignmentError;
      if (!assignment) {
        throw new Error('Assignment not found or you do not have access.');
      }

      const { data: allQuestions, error: questionsError } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', assignment.quiz_id);

      if (questionsError) throw questionsError;
      if (!allQuestions || allQuestions.length === 0) {
        throw new Error('No questions found for this quiz.');
      }

      let selectedQuestions;
      if (assignment.fixed_question_ids?.length) {
        selectedQuestions = allQuestions.filter((q) =>
          assignment.fixed_question_ids.includes(q.id)
        );
        if (selectedQuestions.length === 0) {
          throw new Error('No valid fixed questions found.');
        }
      } else {
        const count = assignment.question_count || allQuestions.length;
        const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
        selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
      }

      const now = new Date().toISOString();
      const questionsSnapshot = selectedQuestions.map((q) => ({
        id: q.id,
        question_text: q.question_text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
      }));

      const { data: newAttempt, error: insertError } = await supabase
        .from('quiz_attempts')
        .insert({
          assignment_id: assignmentId,
          intern_id: finalInternId,
          started_at: now,
          status: 'in_progress',
          question_ids: selectedQuestions.map((q) => q.id),
          questions_snapshot: questionsSnapshot,
          answers: {},
        })
        .select()
        .single();

      if (insertError) throw insertError;
      return newAttempt;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['quiz-attempt', data.assignment_id] });
      queryClient.invalidateQueries({ queryKey: ['student-assigned-quizzes'] });
    },
  });
}

export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ attemptId, answers }) => {
      const { data: attempt, error: fetchError } = await supabase
        .from('quiz_attempts')
        .select('questions_snapshot, assignment_id, intern_id')
        .eq('id', attemptId)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!attempt) throw new Error('Attempt not found.');

      const snapshot = attempt.questions_snapshot;
      if (!snapshot || !Array.isArray(snapshot) || snapshot.length === 0) {
        throw new Error('Quiz snapshot is missing or empty.');
      }

      let score = 0;
      const total = snapshot.length;
      for (let i = 0; i < total; i++) {
        const question = snapshot[i];
        const userAnswer = answers[i] ?? null;
        if (userAnswer === question.correct_answer) {
          score++;
        }
      }

      const { data: attemptData, error: fetchAttemptError } = await supabase
        .from('quiz_attempts')
        .select('assignment_id, intern_id')
        .eq('id', attemptId)
        .maybeSingle();
      if (fetchAttemptError) throw fetchAttemptError;

      const { data: assignment, error: assignmentError } = await supabase
        .from('quiz_assignments')
        .select('quizzes (title)')
        .eq('id', attemptData.assignment_id)
        .maybeSingle();
      if (assignmentError) throw assignmentError;
      const quizTitle = assignment?.quizzes?.title || 'Untitled Quiz';

      const { data: updated, error: updateError } = await supabase
        .from('quiz_attempts')
        .update({
          answers,
          score,
          total_marks: total,
          status: 'submitted',
          submitted_at: new Date().toISOString(),
        })
        .eq('id', attemptId)
        .select()
        .maybeSingle();

      if (updateError) throw updateError;
      if (!updated) throw new Error('Failed to update attempt.');

      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins?.length) {
        const notifications = admins.map((admin) => ({
          user_id: admin.id,
          type: 'quiz_submitted',
          title: 'Quiz Submission',
          message: `An intern has submitted a quiz: "${quizTitle}"`,
          data: { attempt_id: attemptId, intern_id: attemptData.intern_id },
          is_read: false,
        }));
        await supabase.from('notifications').insert(notifications);
      }

      let correctCount = 0;
      let wrongCount = 0;
      for (let i = 0; i < total; i++) {
        const question = snapshot[i];
        const userAnswer = answers[i] ?? null;
        if (userAnswer === question.correct_answer) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }

      const percentage = Math.round((score / total) * 100);
      let feedback = 'Keep reviewing the material and try again!';
      if (percentage >= 80) {
        feedback = 'Excellent work! 🌟';
      } else if (percentage >= 60) {
        feedback = 'Good effort! Keep improving! 💪';
      }

      return {
        ...updated,
        correctCount,
        wrongCount,
        feedback,
        percentage,
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['student-assigned-quizzes'] });
      queryClient.invalidateQueries({ queryKey: ['quiz-attempt', data.assignment_id] });
    },
  });
}

// ============================================
// Additional Admin Stats Hooks
// ============================================

export function useAttendanceToday(disciplineId = null) {
  const today = new Date().toISOString().split("T")[0];
  return useQuery({
    queryKey: ["attendance", "today", disciplineId],
    queryFn: async () => {
      let query = supabase
        .from("attendance")
        .select("id, intern_id, status, marked_at, created_at")
        .eq("date", today);

      if (disciplineId) {
        const { data: interns, error: internsError } = await supabase
          .from("profiles")
          .select("id")
          .eq("discipline_id", disciplineId)
          .eq("role", "intern");
        if (internsError) throw internsError;
        const internIds = interns.map(i => i.id);
        if (internIds.length === 0) return [];
        query = query.in("intern_id", internIds);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!disciplineId,
    staleTime: 60 * 1000,
  });
}

export function useQuizStats(disciplineId = null) {
  return useQuery({
    queryKey: ["quiz-stats", disciplineId],
    queryFn: async () => {
      let query = supabase
        .from("quizzes")
        .select("id, status, created_at")
        .eq("status", "published");

      if (disciplineId) {
        query = query.eq("discipline_id", disciplineId);
      }

      const { data: quizzes, error } = await query;
      if (error) throw error;

      const totalQuizzes = quizzes.length;
      let avgScore = 0;
      if (quizzes.length > 0) {
        const quizIds = quizzes.map(q => q.id);
        const { data: attempts, error: attError } = await supabase
          .from("quiz_attempts")
          .select("score, total_marks")
          .in("quiz_id", quizIds)
          .eq("status", "submitted");

        if (attError) throw attError;

        if (attempts.length > 0) {
          const totalPercent = attempts.reduce((sum, a) => sum + (a.score / a.total_marks) * 100, 0);
          avgScore = Math.round(totalPercent / attempts.length);
        }
      }

      return { totalQuizzes, averageScore: avgScore };
    },
    enabled: !!disciplineId,
    staleTime: 5 * 60 * 1000,
  });
}