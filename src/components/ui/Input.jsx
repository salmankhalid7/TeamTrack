import { forwardRef } from 'react';
import { cn } from '../../utils/helpers';

// ForwardRef for form library compatibility
export const Input = forwardRef(({
  label,
  error,
  hint,
  icon: Icon,
  className,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[#2b2d42] text-opacity-90">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-[#2b2d42] text-opacity-40" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'block w-full rounded-lg',
            'bg-white',
            'border border-[rgba(43,45,66,0.12)]',
            'text-[#2b2d42] placeholder:text-[#2b2d42] placeholder:text-opacity-50',
            'px-4 py-2.5',
            Icon && 'pl-10',
            'transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-[#0080c8] focus:ring-offset-1 focus:border-[#0080c8]',
            'hover:border-[rgba(43,45,66,0.2)]',
            error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
            className
          )}
          {...props}
        />
      </div>
      {hint && !error && (
        <p className="text-sm text-[#2b2d42] text-opacity-50">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';