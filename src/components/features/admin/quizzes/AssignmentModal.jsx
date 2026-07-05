import { useState } from 'react';
import { Modal } from '../../../ui/Modal';
import { Button } from '../../../ui/Button';
import { Input } from '../../../ui/Input';
import { useToast } from '../../../ui/Toast';
import { useCreateAssignment } from '../../../../api/queries';

export function AssignmentModal({ isOpen, onClose, quiz, disciplineId }) {
  const toast = useToast();
  const [opensAt, setOpensAt] = useState('');
  const [closesAt, setClosesAt] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(20);
  const createAssignment = useCreateAssignment();

  const handleSubmit = async () => {
    if (!opensAt || !closesAt) {
      toast.warning('Please select open and close times.');
      return;
    }
    try {
      await createAssignment.mutateAsync({
        quizId: quiz.id,
        disciplineId,
        opensAt: new Date(opensAt).toISOString(),
        closesAt: new Date(closesAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        questionCount: null, // use all questions from pool
      });
      toast.success('Assignment created!');
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Quiz: ${quiz.title}`}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} isLoading={createAssignment.isPending}>
            Assign
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Opens At"
          type="datetime-local"
          value={opensAt}
          onChange={(e) => setOpensAt(e.target.value)}
        />
        <Input
          label="Closes At"
          type="datetime-local"
          value={closesAt}
          onChange={(e) => setClosesAt(e.target.value)}
        />
        <Input
          label="Duration (minutes)"
          type="number"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(Number(e.target.value))}
          min={1}
        />
        <p className="text-xs text-gray-500">Students must complete within this time.</p>
      </div>
    </Modal>
  );
}