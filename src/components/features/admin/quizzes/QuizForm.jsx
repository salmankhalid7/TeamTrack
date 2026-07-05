import { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { useToast } from '../../../ui/Toast';
import { useAuth } from '../../../../auth/useAuth';
import {
  useCreateQuiz,
  useUpdateQuiz,
  useAddQuestionToPool,
  useDeleteQuestionFromPool,
  useQuizPool,
  useGenerateQuizPool,
} from '../../../../api/queries';
import { cn } from '../../../../utils/helpers';

const STEPS = ['Metadata', 'Generate Pool', 'Edit Pool'];

export function QuizForm({ isOpen, onClose, quiz, disciplineId }) {
  const toast = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // --- Main form state ---
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(quiz?.title || '');
  const [description, setDescription] = useState(quiz?.description || '');
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizId, setQuizId] = useState(quiz?.id || null);

  // --- Manual question state ---
  const [manualQuestion, setManualQuestion] = useState({
    question_text: '',
    options: ['', '', '', ''],
    correct_answer: 0,
    explanation: '',
  });

  // Fetch existing pool if editing
  const { data: existingQuestions = [], refetch: refetchPool } = useQuizPool(quizId);
  const pool = useMemo(() => existingQuestions || [], [existingQuestions]);

  // Mutations
  const createQuiz = useCreateQuiz();
  const updateQuiz = useUpdateQuiz();
  const addQuestion = useAddQuestionToPool();
  const deleteQuestion = useDeleteQuestionFromPool();
  const generateQuizPool = useGenerateQuizPool();

  // --- Step navigation ---
  const nextStep = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  // --- 1. Save metadata ---
  const handleSaveMetadata = async () => {
    if (!title.trim()) {
      toast.warning('Please enter a quiz title.');
      return;
    }
    if (!disciplineId) {
      toast.warning('Please select a discipline first.');
      return;
    }
    try {
      let id = quizId;
      if (!id) {
        const result = await createQuiz.mutateAsync({
          title,
          description,
          disciplineId,
          createdBy: user?.id,
        });
        id = result.id;
        setQuizId(id);
        toast.success('Quiz created. Now add questions.');
      } else {
        await updateQuiz.mutateAsync({
          quizId: id,
          updates: { title, description },
        });
        toast.success('Quiz updated.');
      }
      nextStep();
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || 'Failed to save quiz.');
    }
  };

  // --- 2. Generate questions with AI ---
  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.warning('Please enter a topic for the questions.');
      return;
    }
    setIsGenerating(true);
    try {
      const questions = await generateQuizPool.mutateAsync({
        topic,
        questionCount,
        taskIds: [],
      });
      setGeneratedQuestions(questions);
      toast.success(`Generated ${questions.length} questions.`);
    } catch (error) {
      toast.error(error.message || 'Failed to generate questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 3. Add a generated question to the pool ---
  const handleAddToPool = async (question) => {
    try {
      await addQuestion.mutateAsync({
        quizId,
        questionText: question.question_text,
        options: question.options,
        correctAnswer: question.correct_answer,
        explanation: question.explanation || '',
      });
      setGeneratedQuestions((prev) => prev.filter((q) => q !== question));
      await refetchPool();
      toast.success('Question added to pool.');
    } catch (error) {
      toast.error(error.message || 'Failed to add question.');
    }
  };

  // --- 4. Delete a question from the pool ---
  const handleDeleteFromPool = async (questionId) => {
    if (!confirm('Delete this question?')) return;
    try {
      await deleteQuestion.mutateAsync({ questionId, quizId });
      await refetchPool();
      toast.success('Question deleted.');
    } catch (error) {
      toast.error(error.message || 'Failed to delete question.');
    }
  };

  // --- 5. Add a manual question ---
  const handleAddManual = async () => {
    if (!manualQuestion.question_text.trim()) {
      toast.warning('Please enter a question.');
      return;
    }
    // Check that all options are filled
    if (manualQuestion.options.some((opt) => !opt.trim())) {
      toast.warning('All options must be filled.');
      return;
    }
    try {
      await addQuestion.mutateAsync({
        quizId,
        questionText: manualQuestion.question_text.trim(),
        options: manualQuestion.options.map((o) => o.trim()),
        correctAnswer: manualQuestion.correct_answer,
        explanation: manualQuestion.explanation.trim(),
      });
      toast.success('Manual question added.');
      // Reset form
      setManualQuestion({
        question_text: '',
        options: ['', '', '', ''],
        correct_answer: 0,
        explanation: '',
      });
      await refetchPool();
    } catch (error) {
      toast.error(error.message || 'Failed to add manual question.');
    }
  };

  // --- 6. Finish and close ---
  const handleFinish = async () => {
    await queryClient.invalidateQueries({ queryKey: ['quizzes'] });
    onClose();
  };

  // --- Render step content ---
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <Input
              label="Quiz Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., JavaScript Fundamentals Quiz"
              required
            />
            <div>
              <label className="block text-sm font-medium text-[#2b2d42] mb-1">
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
                placeholder="Brief description of the quiz"
              />
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#2b2d42] mb-1">
                Topic / Subject
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
                placeholder="e.g., React Hooks, Python OOP, Data Structures"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2b2d42] mb-1">
                Number of Questions
              </label>
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value) || 10)}
                min={1}
                max={50}
                className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
              />
            </div>
            <Button
              onClick={handleGenerate}
              isLoading={isGenerating || generateQuizPool.isPending}
              disabled={!topic.trim() || generateQuizPool.isPending}
            >
              Generate Questions with AI
            </Button>

            {generatedQuestions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-semibold text-[#2b2d42] mb-2">
                  Generated Questions ({generatedQuestions.length})
                </h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {generatedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-3 bg-[#f8f7f9] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">{q.question_text}</p>
                        <p className="text-xs text-[#2b2d42] text-opacity-50">
                          Options: {q.options.join(' | ')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddToPool(q)}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Existing pool display */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-[#2b2d42]">Question Pool ({pool.length})</h4>
              </div>
              {pool.length === 0 ? (
                <p className="text-sm text-[#2b2d42] text-opacity-50">
                  No questions yet. Generate some using AI or add manually below.
                </p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pool.map((q, idx) => (
                    <div
                      key={q.id}
                      className="flex items-start justify-between p-3 bg-[#f8f7f9] rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {idx + 1}. {q.question_text}
                        </p>
                        <p className="text-xs text-[#2b2d42] text-opacity-50">
                          Correct: {q.options[q.correct_answer]}
                        </p>
                        {q.explanation && (
                          <p className="text-xs text-[#2b2d42] text-opacity-40">
                            Explanation: {q.explanation}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleDeleteFromPool(q.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Manual question addition */}
            <div className="border-t border-[rgba(43,45,66,0.12)] pt-4">
              <h4 className="font-semibold text-[#2b2d42] mb-3">Add Manual Question</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#2b2d42] mb-1">
                    Question Text *
                  </label>
                  <input
                    type="text"
                    value={manualQuestion.question_text}
                    onChange={(e) =>
                      setManualQuestion((prev) => ({
                        ...prev,
                        question_text: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
                    placeholder="What is the capital of France?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {manualQuestion.options.map((opt, idx) => (
                    <div key={idx}>
                      <label className="block text-sm font-medium text-[#2b2d42] mb-1">
                        Option {String.fromCharCode(65 + idx)} *
                      </label>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const newOptions = [...manualQuestion.options];
                          newOptions[idx] = e.target.value;
                          setManualQuestion((prev) => ({
                            ...prev,
                            options: newOptions,
                          }));
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      />
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2b2d42] mb-1">
                    Correct Answer *
                  </label>
                  <select
                    value={manualQuestion.correct_answer}
                    onChange={(e) =>
                      setManualQuestion((prev) => ({
                        ...prev,
                        correct_answer: parseInt(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
                  >
                    {manualQuestion.options.map((_, idx) => (
                      <option key={idx} value={idx}>
                        Option {String.fromCharCode(65 + idx)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2b2d42] mb-1">
                    Explanation (optional)
                  </label>
                  <textarea
                    value={manualQuestion.explanation}
                    onChange={(e) =>
                      setManualQuestion((prev) => ({
                        ...prev,
                        explanation: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1"
                    placeholder="Brief explanation (shown after submission)"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleAddManual}
                    isLoading={addQuestion.isPending}
                    disabled={
                      !manualQuestion.question_text.trim() ||
                      manualQuestion.options.some((o) => !o.trim()) ||
                      addQuestion.isPending
                    }
                  >
                    Add Question
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // --- Modal rendering ---
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={quiz ? 'Edit Quiz' : 'Create New Quiz'}
      size="large"
      footer={
        <div className="flex justify-between w-full">
          <Button
            variant="ghost"
            onClick={step === 0 ? onClose : prevStep}
          >
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <div className="flex gap-2">
            {step === STEPS.length - 1 ? (
              <Button onClick={handleFinish}>Finish</Button>
            ) : (
              <Button
                onClick={step === 0 ? handleSaveMetadata : nextStep}
                isLoading={
                  step === 0
                    ? createQuiz.isPending || updateQuiz.isPending
                    : false
                }
              >
                {step === 0 ? 'Save & Continue' : 'Next'}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="mb-4">
        <div className="flex items-center gap-2">
          {STEPS.map((label, idx) => (
            <div
              key={idx}
              className={cn(
                'flex-1 text-center py-1 rounded-full text-sm font-medium',
                idx === step
                  ? 'bg-[#0080c8] text-white'
                  : idx < step
                  ? 'bg-green-100 text-green-700'
                  : 'bg-[#f8f7f9] text-[#2b2d42] text-opacity-50'
              )}
            >
              {idx < step ? '✓' : idx + 1} {label}
            </div>
          ))}
        </div>
      </div>
      {renderStep()}
    </Modal>
  );
}