import { Modal } from './Modal';
import { Button } from './Button';

// Reusable confirmation dialog for destructive actions
// Why: Consistent UX for irreversible actions
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger', // danger, warning, primary
  isLoading = false,
  icon: CustomIcon,
}) {
  const icons = {
    danger: (
      <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
    ),
    warning: (
      <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
    ),
    primary: (
      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-6 h-6 text-[#0080c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
    ),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center">
        {CustomIcon || icons[variant]}
        
        <h3 className="text-lg font-semibold text-[#2b2d42] mb-2">
          {title}
        </h3>
        
        {message && (
          <p className="text-sm text-[#2b2d42] text-opacity-70 mb-6">
            {message}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// Pre-built confirmation dialogs for common actions
export function SuspendConfirmDialog({ isOpen, onClose, onConfirm, internName, isLoading }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={`Suspend ${internName}?`}
      message="They will lose access to their dashboard and tasks immediately. This action can be reversed later."
      confirmLabel="Suspend Intern"
      variant="danger"
      isLoading={isLoading}
    />
  );
}

export function DeleteTaskConfirmDialog({ isOpen, onClose, onConfirm, isLoading }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete this task?"
      message="This will permanently delete the task and all associated quizzes and submissions. This action cannot be undone."
      confirmLabel="Delete Task"
      variant="danger"
      isLoading={isLoading}
    />
  );
}

export function RejectTaskConfirmDialog({ isOpen, onClose, onConfirm, isLoading }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Reject this task?"
      message="The task will be sent back to draft state and won't be visible to interns."
      confirmLabel="Reject Task"
      variant="warning"
      isLoading={isLoading}
    />
  );
}

export function LogoutConfirmDialog({ isOpen, onClose, onConfirm, isLoading }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Sign out?"
      message="You will be redirected to the login page."
      confirmLabel="Sign Out"
      variant="primary"
      isLoading={isLoading}
    />
  );
}