import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Groq from 'https://esm.sh/groq-sdk@0.5.0';
import { corsHeaders, handleCors, createResponse } from '../_shared/cors.js';

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { taskId, questionCount = 10 } = await req.json();

    if (!taskId) {
      return createResponse({ error: 'taskId is required' }, 400);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const groq = new Groq({
      apiKey: Deno.env.get('GROQ_API_KEY'),
    });

    // Fetch task content (only approved tasks)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('status', 'approved')
      .single();

    if (taskError || !task) {
      return createResponse({ error: 'Task not found or not approved' }, 404);
    }

    // Check if quiz already exists for this task
    const { data: existingQuiz } = await supabase
      .from('quizzes')
      .select('id')
      .eq('task_id', taskId)
      .single();

    if (existingQuiz) {
      return createResponse({ error: 'Quiz already exists for this task' }, 409);
    }

    // Generate quiz using Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a quiz generator for an internship program.
          
          Generate multiple-choice questions based on the provided task content.
          
          Output JSON format:
          {
            "questions": [
              {
                "question": "Question text",
                "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                "correctAnswer": 0,
                "explanation": "Why this is correct"
              }
            ]
          }
          
          Rules:
          - Generate exactly ${questionCount} questions
          - Each question must have exactly 4 options
          - Questions should test understanding, not just memorization
          - Include practical scenarios where relevant
          - Vary difficulty (easy, medium, hard)
          - Ensure only one correct answer per question
          - correctAnswer is the index (0-3) of the correct option
          - Include a brief explanation for the correct answer`
        },
        {
          role: 'user',
          content: `Generate ${questionCount} quiz questions based on this task:
          
          Title: ${task.title}
          Description: ${task.description}
          Learning Objectives: ${JSON.stringify(task.learning_objectives)}
          Discipline: ${task.discipline_id}`
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const generatedQuiz = JSON.parse(completion.choices[0].message.content);

    if (!generatedQuiz.questions || !Array.isArray(generatedQuiz.questions)) {
      throw new Error('Invalid quiz format generated');
    }

    // Validate quiz structure
    const validQuestions = generatedQuiz.questions.every(q => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length === 4 &&
      typeof q.correctAnswer === 'number' &&
      q.correctAnswer >= 0 && 
      q.correctAnswer <= 3
    );

    if (!validQuestions) {
      throw new Error('Generated quiz has invalid questions');
    }

    // Store quiz in draft state (pending admin review)
    const { data: quiz, error: insertError } = await supabase
      .from('quizzes')
      .insert({
        task_id: taskId,
        questions: generatedQuiz.questions,
        total_marks: questionCount, // 1 mark per question
        status: 'draft', // Requires admin approval
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Notify admins about pending review
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'admin');

    for (const admin of admins) {
      await supabase.from('notifications').insert({
        user_id: admin.id,
        type: 'quiz_review',
        title: 'Quiz Pending Review',
        message: `Quiz for "${task.title}" (Day ${task.day_number}) needs your approval.`,
        data: { quiz_id: quiz.id, task_id: taskId },
      });
    }

    return createResponse({
      success: true,
      message: 'Quiz generated successfully',
      quiz: {
        id: quiz.id,
        questionCount: generatedQuiz.questions.length,
        status: 'draft',
      },
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    return createResponse(
      { success: false, error: error.message },
      500
    );
  }
});