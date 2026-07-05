import { cn } from '../../utils/helpers';

const sizes = {
  small: 'w-4 h-4',
  medium: 'w-8 h-8',
  large: 'w-12 h-12',
};

export function LoadingSpinner({ size = 'medium', className }) {
  return (
    <div className="flex items-center justify-center" role="status" aria-label="Loading">
      <svg
        className={cn('animate-spin text-[#0080c8]', sizes[size], className)}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Full page loading overlay
export function PageLoading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <LoadingSpinner size="large" />
      <p className="text-[#2b2d42] text-opacity-50 animate-pulse">
        Loading...
      </p>
    </div>
  );
}