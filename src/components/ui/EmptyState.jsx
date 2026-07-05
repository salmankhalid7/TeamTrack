import { Button } from './Button';
import { Card } from './Card';

// Reusable empty state with illustrations
// Why: Consistent UX when there's no data to display
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryAction,
  size = 'md',
}) {
  const sizes = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  };

  return (
    <Card className={`text-center ${sizes[size]}`}>
      {/* Icon */}
      {icon ? (
        <div className="mb-4">{icon}</div>
      ) : (
        <div className="w-16 h-16 bg-[#f8f7f9] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[#2b2d42] text-opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
            />
          </svg>
        </div>
      )}

      {/* Content */}
      <h3 className="text-lg font-semibold text-[#2b2d42] mb-2">
        {title || 'Nothing here yet'}
      </h3>
      
      {description && (
        <p className="text-sm text-[#2b2d42] text-opacity-60 max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction}>
            {actionLabel}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="ghost" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </Card>
  );
}

// Pre-built empty states for common scenarios
export function NoTasksEmptyState({ onUpload }) {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-[#0080c8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
      }
      title="No tasks yet"
      description="Upload a training plan PDF to automatically generate daily tasks for your interns."
      actionLabel="Upload Training PDF"
      onAction={onUpload}
    />
  );
}

export function NoSubmissionsEmptyState() {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
        </div>
      }
      title="No submissions yet"
      description="Intern submissions will appear here once they start submitting their work."
    />
  );
}

export function NoNotificationsEmptyState() {
  return (
    <EmptyState
      size="sm"
      icon={
        <div className="w-12 h-12 bg-[#f8f7f9] rounded-full flex items-center justify-center mx-auto">
          <svg className="w-6 h-6 text-[#2b2d42] text-opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
            />
          </svg>
        </div>
      }
      title="All caught up!"
      description="No new notifications"
    />
  );
}

export function NoQuizEmptyState({ onGenerate }) {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            />
          </svg>
        </div>
      }
      title="No quiz available"
      description="Generate a quiz from the approved task to test understanding."
      actionLabel="Generate Quiz"
      onAction={onGenerate}
    />
  );
}

export function NoInternsEmptyState({ onInvite }) {
  return (
    <EmptyState
      icon={
        <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" 
            />
          </svg>
        </div>
      }
      title="No interns yet"
      description="Invite interns by email to get started with the program."
      actionLabel="Invite Intern"
      onAction={onInvite}
    />
  );
}