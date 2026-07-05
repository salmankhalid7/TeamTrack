import { useState } from "react";
import { supabase } from "../../../api/supabase";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { useToast } from "../../ui/Toast";
import { useQueryClient } from "@tanstack/react-query";

export function TaskEditor({ task, isOpen, onClose }) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    dayNumber: task?.day_number || "",
    estimatedHours: task?.estimated_hours || 4,
    learningObjectives: task?.learning_objectives?.join("\n") || "",
    resources: task?.resources?.join("\n") || "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const queryClient = useQueryClient();
  const toast = useToast();

  const handleSave = async () => {
    if (!formData.title || !formData.description) {
      toast.warning("Title and description are required");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("tasks")
        .update({
          title: formData.title.trim(),
          description: formData.description.trim(),
          day_number: parseInt(formData.dayNumber) || task.day_number,
          estimated_hours: parseInt(formData.estimatedHours) || 4,
          learning_objectives: formData.learningObjectives
            .split("\n")
            .filter((l) => l.trim()),
          resources: formData.resources.split("\n").filter((r) => r.trim()),
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);

      if (error) throw error;

      toast.success("Task updated successfully");
      await queryClient.invalidateQueries({
        queryKey: ["tasks", disciplineId],
      });

      await queryClient.refetchQueries({
        queryKey: ["tasks", disciplineId],
      });
      onClose();
    } catch (error) {
      toast.error("Failed to update task");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task" size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Day Number"
            type="number"
            value={formData.dayNumber}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, dayNumber: e.target.value }))
            }
            min="1"
          />
          <Input
            label="Estimated Hours"
            type="number"
            value={formData.estimatedHours}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                estimatedHours: e.target.value,
              }))
            }
            min="1"
            max="8"
          />
        </div>

        <Input
          label="Task Title"
          value={formData.title}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, title: e.target.value }))
          }
          placeholder="e.g., Introduction to React Hooks"
        />

        <div>
          <label className="block text-sm font-medium text-[#2b2d42] text-opacity-90 mb-1.5">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            rows={6}
            className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50 focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1 resize-none"
            placeholder="Detailed task description..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2b2d42] text-opacity-90 mb-1.5">
            Learning Objectives (one per line)
          </label>
          <textarea
            value={formData.learningObjectives}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                learningObjectives: e.target.value,
              }))
            }
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1 resize-none"
            placeholder="Understand React hooks&#10;Build a custom hook&#10;Test hooks with React Testing Library"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#2b2d42] text-opacity-90 mb-1.5">
            Resources (one per line)
          </label>
          <textarea
            value={formData.resources}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, resources: e.target.value }))
            }
            rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-[rgba(43,45,66,0.12)] text-[#2b2d42] focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1 resize-none"
            placeholder="https://react.dev/reference/react&#10;https://example.com/hooks-tutorial"
          />
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={isSaving}>
            Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
