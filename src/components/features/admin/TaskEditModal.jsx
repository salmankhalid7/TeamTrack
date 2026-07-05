import { useState, useEffect } from "react";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { useUpdateTask, useCreateTask } from "../../../api/queries";
import { useToast } from "../../ui/Toast";

export function TaskEditModal({
  isOpen,
  onClose,
  disciplineId,
  task = null,
}) {
  const toast = useToast();
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();

  const isEditMode = !!task;

  // Form state
  const [dayNumber, setDayNumber] = useState(task?.day_number || 1);
  const [title, setTitle] = useState(task?.title || "");
  const [description, setDescription] = useState(task?.description || "");
  const [learningObjectives, setLearningObjectives] = useState(
    task?.learning_objectives?.join("\n") || ""
  );
  const [resources, setResources] = useState(task?.resources?.join("\n") || "");
  const [estimatedHours, setEstimatedHours] = useState(
    task?.estimated_hours || 4
  );
  const [adminNotes, setAdminNotes] = useState(task?.admin_notes || "");

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setDayNumber(task?.day_number || 1);
      setTitle(task?.title || "");
      setDescription(task?.description || "");
      setLearningObjectives(task?.learning_objectives?.join("\n") || "");
      setResources(task?.resources?.join("\n") || "");
      setEstimatedHours(task?.estimated_hours || 4);
      setAdminNotes(task?.admin_notes || "");
    }
  }, [isOpen, task]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    const payload = {
      discipline_id: disciplineId,
      day_number: parseInt(dayNumber, 10),
      title: title.trim(),
      description: description.trim(),
      learning_objectives: learningObjectives
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      resources: resources
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      estimated_hours: parseFloat(estimatedHours) || 4,
      admin_notes: adminNotes.trim(),
    };

    try {
      if (isEditMode) {
        await updateTask.mutateAsync({ taskId: task.id, updates: payload });
        toast.success("Task updated successfully");
      } else {
        await createTask.mutateAsync({ ...payload, status: "draft" });
        toast.success("Custom task created as draft – you can now approve it");
      }
      onClose();
    } catch (error) {
      toast.error(error?.message || "Failed to save task");
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "Edit Task" : "Add Custom Task"}
      size="lg"
    >
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Day Number */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] mb-1">
            Day Number
          </label>
          <input
            type="number"
            value={dayNumber}
            onChange={(e) => setDayNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#2b2d42]"
            min="1"
            disabled={isEditMode} // day can't be changed when editing
          />
          <p className="text-xs text-gray-500 mt-1">
            You can add multiple tasks for the same day.
          </p>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] mb-1">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#2b2d42]"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#2b2d42] resize-y"
          />
        </div>

        {/* Learning Objectives */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] mb-1">
            Learning Objectives (one per line)
          </label>
          <textarea
            value={learningObjectives}
            onChange={(e) => setLearningObjectives(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#2b2d42] resize-y"
          />
        </div>

        {/* Resources */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] mb-1">
            Resources (URLs, one per line)
          </label>
          <textarea
            value={resources}
            onChange={(e) => setResources(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#2b2d42] resize-y"
          />
        </div>

        {/* Estimated Hours */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] mb-1">
            Estimated Hours
          </label>
          <input
            type="number"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#2b2d42]"
            min="0.5"
            step="0.5"
          />
        </div>

        {/* Admin Notes */}
        <div>
          <label className="block text-sm font-medium text-[#2b2d42] mb-1">
            Admin Notes
          </label>
          <textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            rows={3}
            placeholder="Add any extra instructions…"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[#2b2d42] resize-y"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          isLoading={updateTask.isPending || createTask.isPending}
        >
          {isEditMode ? "Save Changes" : "Create Task"}
        </Button>
      </div>
    </Modal>
  );
}