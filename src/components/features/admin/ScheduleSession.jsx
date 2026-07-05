import { useState } from 'react';
import { supabase } from '../../../api/supabase';
import { Modal } from '../../ui/Modal';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { useDisciplines, useInterns } from '../../../api/queries';
import { useToast } from '../../ui/Toast';
import { Calendar, Clock, Users, User, BookOpen, Send, X } from 'lucide-react';

export function ScheduleSessionModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    disciplineId: '',
    internId: '',
    scheduledDate: '',
    scheduledTime: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { data: disciplines = [] } = useDisciplines();
  const { data: interns = [] } = useInterns(formData.disciplineId || null);
  const toast = useToast();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.disciplineId) newErrors.disciplineId = 'Please select a discipline';
    if (!formData.scheduledDate) newErrors.scheduledDate = 'Please select a date';
    if (!formData.scheduledTime) newErrors.scheduledTime = 'Please select a time';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSchedule = async () => {
    if (!validateForm()) {
      toast.warning('Please fix the errors before submitting');
      return;
    }

    setIsLoading(true);
    try {
      const scheduledAt = new Date(`${formData.scheduledDate}T${formData.scheduledTime}:00+05:00`);
      
      // Create session
      const { data: session, error } = await supabase
        .from('expert_sessions')
        .insert({
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          discipline_id: formData.disciplineId,
          intern_id: formData.internId || null,
          scheduled_at: scheduledAt.toISOString(),
          created_by: (await supabase.auth.getUser()).data.user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify relevant interns
      const notificationMessage = `${formData.title} – ${scheduledAt.toLocaleDateString()} at ${formData.scheduledTime}`;
      
      if (formData.internId) {
        // Notify specific intern
        await supabase.from('notifications').insert({
          user_id: formData.internId,
          type: 'expert_session',
          title: 'Expert Session Scheduled',
          message: notificationMessage,
          data: { session_id: session.id },
        });
      } else {
        // Notify all interns in the discipline
        const disciplineInterns = interns.filter(i => i.discipline_id === formData.disciplineId);
        if (disciplineInterns.length > 0) {
          const notifications = disciplineInterns.map(intern => ({
            user_id: intern.id,
            type: 'expert_session',
            title: 'Expert Session Scheduled',
            message: notificationMessage,
            data: { session_id: session.id },
          }));
          await supabase.from('notifications').insert(notifications);
        }
      }

      toast.success('Expert session scheduled successfully!');
      onClose();
      resetForm();
      
    } catch (error) {
      console.error('Schedule error:', error);
      toast.error('Failed to schedule session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      disciplineId: '',
      internId: '',
      scheduledDate: '',
      scheduledTime: '',
    });
    setErrors({});
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Schedule Expert Session" size="md">
      <div className="space-y-5">
        {/* Session Title */}
        <div>
          <label htmlFor="session-title" className="block text-sm font-medium text-gray-700 mb-1.5">
            Session Title <span className="text-red-500">*</span>
          </label>
          <Input
            id="session-title"
            value={formData.title}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, title: e.target.value }));
              if (errors.title) setErrors(prev => ({ ...prev, title: '' }));
            }}
            placeholder="e.g., React Advanced Patterns Workshop"
            className={errors.title ? 'border-red-300 focus:ring-red-500' : ''}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="session-description" className="block text-sm font-medium text-gray-700 mb-1.5">
            Description <span className="text-gray-400 text-xs">(optional)</span>
          </label>
          <textarea
            id="session-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the session..."
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:border-[#0080c8] resize-none transition-all"
          />
        </div>

        {/* Discipline */}
        <div>
          <label htmlFor="discipline-select" className="block text-sm font-medium text-gray-700 mb-1.5">
            Discipline <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              id="discipline-select"
              value={formData.disciplineId}
              onChange={(e) => {
                setFormData(prev => ({ 
                  ...prev, 
                  disciplineId: e.target.value, 
                  internId: '' // Reset intern when discipline changes
                }));
                if (errors.disciplineId) setErrors(prev => ({ ...prev, disciplineId: '' }));
              }}
              className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.disciplineId ? 'border-red-300' : 'border-gray-200'} text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:border-[#0080c8] transition-all`}
            >
              <option value="">Select discipline...</option>
              {disciplines.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.disciplineId && <p className="mt-1 text-sm text-red-600">{errors.disciplineId}</p>}
        </div>

        {/* Intern Selection (optional) */}
        {formData.disciplineId && (
          <div>
            <label htmlFor="intern-select" className="block text-sm font-medium text-gray-700 mb-1.5">
              Specific Intern <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                id="intern-select"
                value={formData.internId}
                onChange={(e) => setFormData(prev => ({ ...prev, internId: e.target.value }))}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-gray-800 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:border-[#0080c8] transition-all"
              >
                <option value="">All interns in this discipline</option>
                {interns.map((intern) => (
                  <option key={intern.id} value={intern.id}>
                    {intern.full_name} ({intern.email})
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {formData.internId && (
              <p className="mt-1 text-xs text-blue-600 flex items-center gap-1">
                <Users className="w-3 h-3" /> This session will be private to the selected intern.
              </p>
            )}
          </div>
        )}

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="session-date" className="block text-sm font-medium text-gray-700 mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="session-date"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, scheduledDate: e.target.value }));
                  if (errors.scheduledDate) setErrors(prev => ({ ...prev, scheduledDate: '' }));
                }}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${errors.scheduledDate ? 'border-red-300' : 'border-gray-200'} text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:border-[#0080c8] transition-all`}
              />
            </div>
            {errors.scheduledDate && <p className="mt-1 text-sm text-red-600">{errors.scheduledDate}</p>}
          </div>

          <div>
            <label htmlFor="session-time" className="block text-sm font-medium text-gray-700 mb-1.5">
              Time (PKT) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="session-time"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, scheduledTime: e.target.value }));
                  if (errors.scheduledTime) setErrors(prev => ({ ...prev, scheduledTime: '' }));
                }}
                className={`w-full pl-10 pr-3 py-2.5 rounded-lg border ${errors.scheduledTime ? 'border-red-300' : 'border-gray-200'} text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:border-[#0080c8] transition-all`}
              />
            </div>
            {errors.scheduledTime && <p className="mt-1 text-sm text-red-600">{errors.scheduledTime}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            <X className="w-4 h-4 mr-1" /> Cancel
          </Button>
          <Button onClick={handleSchedule} isLoading={isLoading}>
            <Send className="w-4 h-4 mr-1.5" /> Schedule Session
          </Button>
        </div>
      </div>
    </Modal>
  );
}