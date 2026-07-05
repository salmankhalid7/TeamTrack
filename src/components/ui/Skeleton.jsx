import { cn } from '../../utils/helpers';

// Base skeleton component with pulse animation
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-[#2b2d42] bg-opacity-[0.06]',
        className
      )}
      {...props}
    />
  );
}

// Text skeleton for paragraphs
export function TextSkeleton({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

// Card skeleton for content cards
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(43,45,66,0.12)]">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-5 w-1/3 mb-2" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      
      {/* Content */}
      <TextSkeleton lines={3} className="mb-4" />
      
      {/* Footer */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

// Task card skeleton
export function TaskCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(43,45,66,0.12)] border-l-4 border-l-[rgba(43,45,66,0.12)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-16 rounded" />
          <Skeleton className="h-5 w-48" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <TextSkeleton lines={2} className="mb-4" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-16 rounded-lg" />
      </div>
    </div>
  );
}

// Table row skeleton
export function TableRowSkeleton({ columns = 4 }) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-[rgba(43,45,66,0.06)]">
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === 0 ? 'w-8 flex-shrink-0' : 'flex-1'
          )}
        />
      ))}
    </div>
  );
}

// Dashboard stats skeleton
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(43,45,66,0.12)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-3" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
    </div>
  );
}

// Profile card skeleton
export function ProfileCardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 border border-[rgba(43,45,66,0.12)]">
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    </div>
  );
}

// Dashboard page skeleton (full layout)
export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Stats Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TaskCardSkeleton />
          <TaskCardSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}