import { useEffect } from 'react';
import { cn } from '../../utils/helpers';

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer,    // ← accepts footer
  size = 'md' 
}) {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    large: 'max-w-2xl', // alias for lg
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[#f8f7f9] bg-opacity-80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div
        className={cn(
          'relative bg-white rounded-xl shadow-[0_10px_40px_rgba(43,45,66,0.15)] w-full',
          sizes[size] || sizes.md
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[rgba(43,45,66,0.12)]">
            <h3 className="font-semibold text-[#2b2d42]">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-[#f8f7f9] transition-colors"
            >
              <svg className="w-5 h-5 text-[#2b2d42] text-opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Body */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer - properly rendered */}
        {footer && (
          <div className="px-6 py-4 border-t border-[rgba(43,45,66,0.12)] bg-[#f8f7f9] rounded-b-xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}