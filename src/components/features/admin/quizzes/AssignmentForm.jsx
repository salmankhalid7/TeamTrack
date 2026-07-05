// src/components/features/admin/quizzes/AssignmentForm.jsx
import { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { useToast } from '../../../ui/Toast';
import { useCreateAssignment, useQuizPool, useDisciplines } from '../../../../api/queries';
import { 
  Calendar, 
  Clock, 
  Timer, 
  ListChecks, 
  CheckSquare, 
  Square,
  AlertCircle,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  Trash2
} from 'lucide-react';

// Helper to format date for display
const formatDateTimeDisplay = (date) => {
  if (!date) return 'Not set';
  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

export function AssignmentForm({ isOpen, onClose, quiz, disciplineId }) {
  const toast = useToast();
  const [opensAt, setOpensAt] = useState(null);
  const [closesAt, setClosesAt] = useState(null);
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [questionCount, setQuestionCount] = useState('');
  const [fixedQuestions, setFixedQuestions] = useState([]);
  const [isQuestionListOpen, setIsQuestionListOpen] = useState(true);

  const { data: pool = [] } = useQuizPool(quiz?.id);
  const { data: disciplines = [] } = useDisciplines();
  const createAssignment = useCreateAssignment();

  const isSelectAll = useMemo(() => {
    return pool.length > 0 && fixedQuestions.length === pool.length;
  }, [pool, fixedQuestions]);

  // Helper to get discipline name
  const getDisciplineName = (id) => {
    if (!id) return null;
    const discipline = disciplines.find(d => d.id === id);
    return discipline?.name || id;
  };

  // Set open time to now (rounded up to next minute)
  const setNow = () => {
    const now = new Date();
    now.setSeconds(0, 0);
    now.setMinutes(now.getMinutes() + 1);
    setOpensAt(now);
  };

  const handleSubmit = async () => {
    const finalDisciplineId = disciplineId || quiz?.discipline_id;
    if (!finalDisciplineId) {
      toast.error('This quiz has no discipline assigned. Please select a discipline.');
      return;
    }

    if (!opensAt || !closesAt) {
      toast.warning('Please set open and close times.');
      return;
    }
    if (opensAt >= closesAt) {
      toast.warning('Open time must be before close time.');
      return;
    }
    if (durationMinutes < 1) {
      toast.warning('Duration must be at least 1 minute.');
      return;
    }

    try {
      await createAssignment.mutateAsync({
        quizId: quiz.id,
        disciplineId: finalDisciplineId,
        opensAt: opensAt.toISOString(),
        closesAt: closesAt.toISOString(),
        durationMinutes,
        questionCount: questionCount ? parseInt(questionCount) : null,
        fixedQuestionIds: fixedQuestions,
      });
      toast.success('Quiz assigned successfully!');
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to assign quiz.');
    }
  };

  const toggleQuestion = (id) => {
    setFixedQuestions((prev) =>
      prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (isSelectAll) {
      setFixedQuestions([]);
    } else {
      setFixedQuestions(pool.map((q) => q.id));
    }
  };

  // Custom input for DatePicker
  const CustomDateInput = ({ value, onClick, placeholder, icon: Icon, onClear }) => (
    <div className="relative group">
      <button
        type="button"
        onClick={onClick}
        className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 text-left text-gray-800 bg-white hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:border-transparent transition-all shadow-sm"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {value ? formatDateTimeDisplay(value) : placeholder}
        </span>
      </button>
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 gap-1">
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear?.();
            }}
            className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        <Icon className="w-5 h-5 text-gray-400 group-focus-within:text-[#0080c8] transition-colors" />
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-[#0080c8]" />
          <span>Assign Quiz: <span className="font-normal">{quiz?.title}</span></span>
        </div>
      }
      size="large"
      footer={
        <div className="flex justify-end gap-3 w-full pt-2 border-t border-gray-200">
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <X className="w-4 h-4" /> Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={createAssignment.isPending}
            className="gap-2"
          >
            <CheckSquare className="w-4 h-4" /> Assign Quiz
          </Button>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {/* Discipline Info – shows name instead of ID */}
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800">Discipline</p>
            <p className="text-sm text-blue-700">
              {disciplineId 
                ? getDisciplineName(disciplineId)
                : quiz?.discipline_id 
                  ? getDisciplineName(quiz.discipline_id)
                  : <span className="text-red-600">⚠️ No discipline set – please select one in the quiz settings.</span>
              }
            </p>
          </div>
        </div>

        {/* Schedule Row – Premium Date/Time Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-500" /> Open Time
            </label>
            <DatePicker
              selected={opensAt}
              onChange={(date) => setOpensAt(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={5}
              timeCaption="Time"
              dateFormat="MMM d, yyyy h:mm aa"
              placeholderText="Select open time"
              minDate={new Date()}
              customInput={
                <CustomDateInput
                  icon={Calendar}
                  placeholder="Select open time"
                  onClear={() => setOpensAt(null)}
                />
              }
              popperClassName="react-datepicker-popper"
              popperPlacement="bottom-start"
              className="w-full"
            />
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-xs text-gray-400">When the quiz becomes available</p>
              <button
                type="button"
                onClick={setNow}
                className="text-xs text-[#0080c8] hover:text-[#006699] font-medium flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3 h-3" /> Now
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-500" /> Close Time
            </label>
            <DatePicker
              selected={closesAt}
              onChange={(date) => setClosesAt(date)}
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={5}
              timeCaption="Time"
              dateFormat="MMM d, yyyy h:mm aa"
              placeholderText="Select close time"
              minDate={opensAt || new Date()}
              excludeDateIntervals={[{ start: opensAt ? new Date(opensAt.getTime() - 60000) : null, end: opensAt ? new Date(opensAt.getTime() + 60000) : null }]}
              customInput={
                <CustomDateInput
                  icon={Calendar}
                  placeholder="Select close time"
                  onClear={() => setClosesAt(null)}
                />
              }
              popperClassName="react-datepicker-popper"
              popperPlacement="bottom-start"
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1.5">Must be after open time</p>
          </div>
        </div>

        {/* Duration & Question Count */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-gray-500" /> Duration (minutes)
            </label>
            <div className="relative">
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                min={1}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:border-transparent transition-all shadow-sm hover:shadow-md bg-white"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Time allowed for the quiz attempt</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
              <ListChecks className="w-4 h-4 text-gray-500" /> Question Count
            </label>
            <div className="relative">
              <input
                type="number"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                min={1}
                max={pool.length}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:border-transparent transition-all shadow-sm hover:shadow-md bg-white"
                placeholder={`${pool.length} available`}
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-gray-400">
                max {pool.length}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Leave blank to use all questions</p>
          </div>
        </div>

        {/* Question Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsQuestionListOpen(!isQuestionListOpen)}
                className="text-sm font-medium text-gray-700 hover:text-[#0080c8] transition-colors flex items-center gap-1"
              >
                {isQuestionListOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                Select Specific Questions (optional)
              </button>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                {fixedQuestions.length} selected
              </span>
            </div>
            <Button size="sm" variant="ghost" onClick={toggleAll} className="gap-1">
              {isSelectAll ? <Square className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
              {isSelectAll ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          {isQuestionListOpen && (
            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                {pool.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 flex flex-col items-center gap-2">
                    <AlertCircle className="w-8 h-8" />
                    <p>No questions available in the pool.</p>
                    <p className="text-sm">Add questions to the quiz before assigning.</p>
                  </div>
                ) : (
                  pool.map((q) => (
                    <label
                      key={q.id}
                      className="flex items-start gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={fixedQuestions.includes(q.id)}
                        onChange={() => toggleQuestion(q.id)}
                        className="mt-1 w-4 h-4 text-[#0080c8] border-gray-300 rounded focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1 cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 line-clamp-2">
                          {q.question_text}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-400">
                            {q.options?.length || 0} options
                          </span>
                          {q.explanation && (
                            <span className="text-xs text-gray-400">• has explanation</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Summary */}
        {(opensAt || closesAt || pool.length > 0) && (
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-gray-600">
              <span className="font-medium">{fixedQuestions.length}</span> of <span className="font-medium">{pool.length}</span> questions selected
              {questionCount && ` • ${questionCount} per attempt`}
            </span>
            <span className="text-gray-400 flex items-center gap-2">
              <Clock className="w-4 h-4" /> {durationMinutes} min
              {opensAt && (
                <span className="ml-2">• Opens: {formatDateTimeDisplay(opensAt)}</span>
              )}
              {closesAt && (
                <span className="ml-2">• Closes: {formatDateTimeDisplay(closesAt)}</span>
              )}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}