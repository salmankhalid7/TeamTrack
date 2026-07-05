import { cn } from '../../utils/helpers';

// Card component for content containers
// Why: Creates visual depth on the #f8f7f9 background
export function Card({
  children,
  className,
  padding = 'md',
  hover = false,
  ...props
}) {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl',
        'shadow-[0_1px_3px_rgba(43,45,66,0.08),0_1px_2px_rgba(43,45,66,0.06)]',
        'border border-[rgba(43,45,66,0.06)]',
        paddings[padding],
        hover && 'transition-shadow duration-200 hover:shadow-[0_4px_6px_rgba(43,45,66,0.1),0_2px_4px_rgba(43,45,66,0.06)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}