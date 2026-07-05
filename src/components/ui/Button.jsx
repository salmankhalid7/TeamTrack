import { cn } from '../../utils/helpers';

// Variant-driven button system
// Why: Consistent button styles with clear visual hierarchy
const variants = {
  primary: 'bg-[#0080c8] text-white hover:bg-[#006da8] active:bg-[#005a8c] ' +
           'focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-2',
  secondary: 'bg-white text-[#2b2d42] border border-[rgba(43,45,66,0.12)] ' +
             'hover:bg-[#92dce5] hover:border-[#92dce5] active:bg-[#7bc8d2]',
  ghost: 'bg-transparent text-[#2b2d42] hover:bg-[#f8f7f9] ' +
         'active:bg-[#f0eef3]',
  danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className,
  isLoading = false,
  disabled = false,
  icon: Icon,
  ...props
}) {
  return (
    <button
      className={cn(
        // Base styles
        'inline-flex items-center justify-center gap-2',
        'font-medium rounded-lg',
        'transition-all duration-200 ease-in-out',
        'focus:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        // Apply variant and size
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-5 h-5" />}
          {children}
        </>
      )}
    </button>
  );
}