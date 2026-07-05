import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors, createResponse } from '../_shared/cors.js';

// Schedule: Every Sunday at midnight PKT (Saturday 19:00 UTC)
// Cron: 0 19 * * 6

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Calculate week boundaries (previous Monday to Sunday)
    const now = new Date();
    const pktNow = new Date(now.getTime() + (5 * 60 * 60 * 1000));
    
    // Get previous week's Monday
    const weekStart = new Date(pktNow);
    weekStart.setDate(pktNow.getDate() - pktNow.getDay() - 6); // Last Monday
    weekStart.setHours(0, 0, 0, 0);
    
    // Get previous week's Sunday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    console.log(`Evaluating week: ${weekStartStr} to ${weekEndStr}`);

    // Get all active interns
    const { data: interns, error: internsError } = await supabase
      .from('profiles')
      .select('id, full_name, discipline_id')
      .eq('role', 'intern')
      .eq('is_suspended', false);

    if (internsError) throw internsError;

    const results = {
      evaluated: 0,
      errors: 0,
    };

    for (const intern of interns) {
      try {
        // Check if evaluation already exists for this week
        const { data: existingEval } = await supabase
          .from('evaluations')
          .select('id')
          .eq('intern_id', intern.id)
          .eq('week_start', weekStartStr)
          .single();

        if (existingEval) {
          console.log(`Evaluation already exists for ${intern.full_name}, skipping...`);
          continue;
        }

        // === 1. Attendance Score (30%) ===
        const { data: attendance } = await supabase
          .from('attendance')
          .select('status')
          .eq('intern_id', intern.id)
          .gte('date', weekStartStr)
          .lte('date', weekEndStr);

        const workingDays = 5; // Monday to Friday
        const presentDays = attendance?.filter(a => 
          a.status === 'present' || a.status === 'late'
        ).length || 0;
        
        // Late attendance gets 50% of the day's score
        const lateDays = attendance?.filter(a => a.status === 'late').length || 0;
        const effectivePresentDays = presentDays - (lateDays * 0.5);
        
        const attendanceScore = Math.round((effectivePresentDays / workingDays) * 30);

        // === 2. Task Completion Score (40%) ===
        const { data: submissions } = await supabase
          .from('submissions')
          .select('status')
          .eq('intern_id', intern.id)
          .gte('submitted_at', weekStartStr)
          .lte('submitted_at', weekEndStr);

        const totalSubmissions = submissions?.length || 0;
        const completedSubmissions = submissions?.filter(s => 
          s.status === 'completed'
        ).length || 0;

        // Expected tasks per week (assuming 1 task per day)
        const expectedTasks = 5;
        const taskScore = totalSubmissions > 0
          ? Math.round((completedSubmissions / expectedTasks) * 40)
          : 0;

        // === 3. Expert Feedback Score (30%) ===
        const { data: quizAttempts } = await supabase
          .from('quiz_attempts')
          .select('score, total_marks')
          .eq('intern_id', intern.id)
          .gte('submitted_at', weekStartStr)
          .lte('submitted_at', weekEndStr);

        let quizScore = 0;
        if (quizAttempts && quizAttempts.length > 0) {
          const avgPercentage = quizAttempts.reduce((acc, attempt) => {
            return acc + (attempt.score / attempt.total_marks);
          }, 0) / quizAttempts.length;
          quizScore = Math.round(avgPercentage * 30);
        }

        // === Total Score ===
        const totalScore = attendanceScore + taskScore + quizScore;

        // Store evaluation
        const { error: evalError } = await supabase
          .from('evaluations')
          .insert({
            intern_id: intern.id,
            week_start: weekStartStr,
            week_end: weekEndStr,
            attendance_score: attendanceScore,
            task_score: taskScore,
            expert_score: quizScore,
            total_score: Math.min(totalScore, 100), // Cap at 100
            computed_at: new Date().toISOString(),
          });

        if (evalError) throw evalError;

        // Notify intern
        await supabase.from('notifications').insert({
          user_id: intern.id,
          type: 'evaluation_ready',
          title: '📊 Weekly Evaluation Ready',
          message: `Your evaluation for ${weekStartStr} to ${weekEndStr} is ready. Total score: ${Math.min(totalScore, 100)}%`,
          data: {
            week_start: weekStartStr,
            week_end: weekEndStr,
            scores: {
              attendance: attendanceScore,
              tasks: taskScore,
              quiz: quizScore,
              total: Math.min(totalScore, 100),
            },
          },
        });

        results.evaluated++;
        console.log(`Evaluated ${intern.full_name}: ${Math.min(totalScore, 100)}%`);

      } catch (error) {
        console.error(`Error evaluating ${intern.full_name}:`, error);
        results.errors++;
      }
    }

    return createResponse({
      success: true,
      message: 'Weekly evaluations completed',
      week: { start: weekStartStr, end: weekEndStr },
      results,
    });

  } catch (error) {
    console.error('Evaluation error:', error);
    return createResponse(
      { success: false, error: error.message },
      500
    );
  }
});