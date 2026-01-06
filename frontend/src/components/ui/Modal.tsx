import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef, useEffect, useRef, useCallback, useState } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

// ============================================
// TYPES
// ============================================

type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
  /** Modal size */
  size?: ModalSize;
  /** Title for the modal header */
  title?: string;
  /** Description for the modal header */
  description?: string;
  /** Whether clicking backdrop closes modal */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape closes modal */
  closeOnEscape?: boolean;
  /** Whether to show close button in header */
  showCloseButton?: boolean;
  /** Footer content (typically action buttons) */
  footer?: ReactNode;
  /** Additional className for the modal content */
  className?: string;
  /** Portal container (defaults to document.body) */
  container?: HTMLElement;
}

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

// ============================================
// STYLES
// ============================================

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
};

// ============================================
// SUB-COMPONENTS
// ============================================

const ModalHeader = forwardRef<HTMLDivElement, ModalHeaderProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

ModalHeader.displayName = 'ModalHeader';

const ModalTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }>(
  ({ children, className = '', ...props }, ref) => (
    <h2
      ref={ref}
      className={`text-heading-lg font-semibold text-foreground leading-none tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h2>
  )
);

ModalTitle.displayName = 'ModalTitle';

const ModalDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement> & { children: ReactNode }>(
  ({ children, className = '', ...props }, ref) => (
    <p
      ref={ref}
      className={`text-body-sm text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </p>
  )
);

ModalDescription.displayName = 'ModalDescription';

const ModalBody = forwardRef<HTMLDivElement, ModalBodyProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`py-4 overflow-y-auto ${className}`}
      {...props}
    >
      {children}
    </div>
  )
);

ModalBody.displayName = 'ModalBody';

const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={`
        flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2
        pt-4 border-t border-border
        ${className}
      `.trim()}
      {...props}
    >
      {children}
    </div>
  )
);

ModalFooter.displayName = 'ModalFooter';

// ============================================
// MAIN MODAL COMPONENT
// ============================================

const ModalRoot = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      children,
      size = 'md',
      title,
      description,
      closeOnBackdropClick = true,
      closeOnEscape = true,
      showCloseButton = true,
      footer,
      className = '',
      container,
    },
    ref
  ) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const [isAnimating, setIsAnimating] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);

    // Handle escape key
    const handleKeyDown = useCallback(
      (event: KeyboardEvent) => {
        if (closeOnEscape && event.key === 'Escape') {
          onClose();
        }
      },
      [closeOnEscape, onClose]
    );

    // Handle backdrop click
    const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (closeOnBackdropClick && event.target === event.currentTarget) {
        onClose();
      }
    };

    // Basic focus trap
    useEffect(() => {
      if (!isOpen) return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      return () => document.removeEventListener('keydown', handleTabKey);
    }, [isOpen]);

    // Handle open/close animation
    useEffect(() => {
      if (isOpen) {
        setShouldRender(true);
        // Small delay for animation
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
        // Store currently focused element
        previousActiveElement.current = document.activeElement as HTMLElement;
        // Add keyboard listener
        document.addEventListener('keydown', handleKeyDown);
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
      } else {
        setIsAnimating(false);
        // Wait for animation to complete before removing from DOM
        const timer = setTimeout(() => {
          setShouldRender(false);
        }, 200);
        // Restore focus
        previousActiveElement.current?.focus();
        // Restore body scroll
        document.body.style.overflow = '';
        return () => clearTimeout(timer);
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
      };
    }, [isOpen, handleKeyDown]);

    // Focus modal when it opens
    useEffect(() => {
      if (isOpen && modalRef.current) {
        const firstFocusable = modalRef.current.querySelector<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        firstFocusable?.focus();
      }
    }, [isOpen]);

    if (!shouldRender) return null;

    const modalContent = (
      <div
        className={`
          fixed inset-0 z-modal-backdrop
          flex items-center justify-center p-4
          ${isAnimating ? 'animate-fade-in' : 'opacity-0'}
          transition-opacity duration-normal
        `.trim()}
        onClick={handleBackdropClick}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={description ? 'modal-description' : undefined}
      >
        {/* Backdrop */}
        <div
          className={`
            absolute inset-0 bg-black/50 backdrop-blur-xs
            ${isAnimating ? 'opacity-100' : 'opacity-0'}
            transition-opacity duration-normal
          `.trim()}
          aria-hidden="true"
        />

        {/* Modal Content */}
        <div
          ref={mergeRefs(ref, modalRef)}
          className={`
            relative w-full bg-surface rounded-xl shadow-modal
            ${sizeStyles[size]}
            ${size === 'full' ? 'h-full flex flex-col' : ''}
            ${isAnimating ? 'animate-scale-in' : 'scale-95 opacity-0'}
            transition-all duration-normal ease-out-expo
            ${className}
          `.trim()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-6 pb-0">
              {(title || description) && (
                <ModalHeader>
                  {title && <ModalTitle id="modal-title">{title}</ModalTitle>}
                  {description && (
                    <ModalDescription id="modal-description">{description}</ModalDescription>
                  )}
                </ModalHeader>
              )}
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className={`
                    -mr-1 -mt-1 p-1.5 rounded-lg
                    text-neutral-400 hover:text-neutral-600
                    hover:bg-neutral-100
                    dark:hover:text-neutral-300 dark:hover:bg-neutral-800
                    transition-colors duration-fast
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
                  `.trim()}
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* Body */}
          <div className={`px-6 ${size === 'full' ? 'flex-1 overflow-y-auto' : ''}`}>
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="px-6 pb-6">
              <ModalFooter>{footer}</ModalFooter>
            </div>
          )}
        </div>
      </div>
    );

    return createPortal(modalContent, container || document.body);
  }
);

ModalRoot.displayName = 'Modal';

// ============================================
// UTILITIES
// ============================================

function mergeRefs<T>(
  ...refs: (React.Ref<T> | null | undefined)[]
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

// ============================================
// COMPOUND COMPONENT EXPORT
// ============================================

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  Footer: ModalFooter,
});
