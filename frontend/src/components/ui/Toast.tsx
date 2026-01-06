import type { HTMLAttributes } from 'react';
import { useEffect, useState, useRef, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';
import type { Toast as ToastType, ToastType as ToastVariant } from '../../store/toastStore';
import { useToastStore } from '../../store/toastStore';

// ============================================
// TYPES
// ============================================

export interface ToastItemProps extends HTMLAttributes<HTMLDivElement> {
  toast: ToastType;
  onDismiss: () => void;
}

export interface ToastContainerProps {
  /** Position of toast container */
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  /** Maximum number of visible toasts */
  maxVisible?: number;
  /** Portal container */
  container?: HTMLElement;
}

// ============================================
// STYLES
// ============================================

const iconMap: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const iconColorMap: Record<ToastVariant, string> = {
  success: 'text-success-500',
  error: 'text-error-500',
  warning: 'text-warning-500',
  info: 'text-info-500',
};

const progressColorMap: Record<ToastVariant, string> = {
  success: 'bg-success-500',
  error: 'bg-error-500',
  warning: 'bg-warning-500',
  info: 'bg-info-500',
};

const positionStyles: Record<NonNullable<ToastContainerProps['position']>, string> = {
  'top-right': 'top-4 right-4 items-end',
  'top-left': 'top-4 left-4 items-start',
  'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
  'bottom-right': 'bottom-4 right-4 items-end',
  'bottom-left': 'bottom-4 left-4 items-start',
  'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
};

// ============================================
// TOAST ITEM COMPONENT
// ============================================

const ToastItem = forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, onDismiss, className = '', ...props }, ref) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);
    const progressRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const remainingTimeRef = useRef<number>(toast.duration || 5000);
    const isPausedRef = useRef(false);

    const Icon = iconMap[toast.type];

    // Handle enter animation
    useEffect(() => {
      const timer = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(timer);
    }, []);

    // Handle progress bar and auto-dismiss
    useEffect(() => {
      if (!toast.duration || toast.duration <= 0) return;

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        if (!isPausedRef.current) {
          const elapsed = timestamp - startTimeRef.current;
          const remaining = remainingTimeRef.current - elapsed;
          const newProgress = (remaining / toast.duration!) * 100;

          if (newProgress <= 0) {
            handleDismiss();
            return;
          }

          setProgress(Math.max(0, newProgress));
        }

        progressRef.current = requestAnimationFrame(animate);
      };

      progressRef.current = requestAnimationFrame(animate);

      return () => {
        if (progressRef.current) {
          cancelAnimationFrame(progressRef.current);
        }
      };
    }, [toast.duration]);

    // Handle pause/resume on hover
    const handleMouseEnter = () => {
      isPausedRef.current = true;
      remainingTimeRef.current = (progress / 100) * (toast.duration || 5000);
    };

    const handleMouseLeave = () => {
      isPausedRef.current = false;
      startTimeRef.current = 0;
    };

    // Handle dismiss with exit animation
    const handleDismiss = () => {
      setIsExiting(true);
      setTimeout(() => {
        onDismiss();
      }, 200);
    };

    return (
      <div
        ref={ref}
        className={`
          relative w-full max-w-sm overflow-hidden
          bg-surface border border-border rounded-xl shadow-dropdown
          transition-all duration-normal ease-out-expo
          ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
          ${className}
        `.trim()}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {/* Content */}
        <div className="flex gap-3 p-4">
          {/* Icon */}
          <div className={`flex-shrink-0 ${iconColorMap[toast.type]}`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Text content */}
          <div className="flex-1 min-w-0">
            <p className="text-label-md font-medium text-foreground">
              {toast.title}
            </p>
            {toast.message && (
              <p className="mt-1 text-body-sm text-muted-foreground">
                {toast.message}
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            className={`
              flex-shrink-0 p-1 -mr-1 -mt-1 rounded-lg
              text-neutral-400 hover:text-neutral-600
              hover:bg-neutral-100
              dark:hover:text-neutral-300 dark:hover:bg-neutral-800
              transition-colors duration-fast
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500
            `.trim()}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        {toast.duration && toast.duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-100 dark:bg-neutral-800">
            <div
              className={`h-full ${progressColorMap[toast.type]} transition-all duration-100 ease-linear`}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }
);

ToastItem.displayName = 'ToastItem';

// ============================================
// TOAST CONTAINER COMPONENT
// ============================================

export function ToastContainer({
  position = 'top-right',
  maxVisible = 5,
  container,
}: ToastContainerProps = {}) {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  const visibleToasts = toasts.slice(-maxVisible);

  const content = (
    <div
      className={`
        fixed z-toast flex flex-col gap-3
        pointer-events-none
        ${positionStyles[position]}
      `.trim()}
      aria-label="Notifications"
    >
      {visibleToasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem
            toast={toast}
            onDismiss={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );

  return createPortal(content, container || document.body);
}

// ============================================
// EXPORTS
// ============================================

export { ToastItem };
export type { ToastType };
