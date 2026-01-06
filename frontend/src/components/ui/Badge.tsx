import type { HTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';
import { X } from 'lucide-react';

// ============================================
// TYPES
// ============================================

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeStyle = 'solid' | 'outline' | 'soft';
type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Badge semantic variant */
  variant?: BadgeVariant;
  /** Badge visual style */
  badgeStyle?: BadgeStyle;
  /** Badge size */
  size?: BadgeSize;
  /** Badge content */
  children: ReactNode;
  /** Show dot indicator */
  dot?: boolean;
  /** Make badge removable with X button */
  removable?: boolean;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
  /** Left icon */
  leftIcon?: ReactNode;
}

// ============================================
// STYLES
// ============================================

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-body-xs gap-1',
  md: 'px-2.5 py-0.5 text-label-sm gap-1.5',
  lg: 'px-3 py-1 text-label-md gap-1.5',
};

const dotSizeStyles: Record<BadgeSize, string> = {
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2 w-2',
};

const iconSizeStyles: Record<BadgeSize, string> = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
};

// Solid styles
const solidStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-600 text-white',
  secondary: 'bg-secondary-600 text-white',
  success: 'bg-success-600 text-white',
  warning: 'bg-warning-500 text-white',
  error: 'bg-error-600 text-white',
  info: 'bg-info-600 text-white',
  neutral: 'bg-neutral-600 text-white',
};

// Soft styles (lighter background with colored text)
const softStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 text-primary-800 dark:bg-primary-900/50 dark:text-primary-200',
  secondary: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-900/50 dark:text-secondary-200',
  success: 'bg-success-100 text-success-800 dark:bg-success-900/50 dark:text-success-200',
  warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/50 dark:text-warning-200',
  error: 'bg-error-100 text-error-800 dark:bg-error-900/50 dark:text-error-200',
  info: 'bg-info-100 text-info-800 dark:bg-info-900/50 dark:text-info-200',
  neutral: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200',
};

// Outline styles
const outlineStyles: Record<BadgeVariant, string> = {
  primary: 'border-primary-500 text-primary-700 dark:text-primary-400',
  secondary: 'border-secondary-500 text-secondary-700 dark:text-secondary-400',
  success: 'border-success-500 text-success-700 dark:text-success-400',
  warning: 'border-warning-500 text-warning-700 dark:text-warning-400',
  error: 'border-error-500 text-error-700 dark:text-error-400',
  info: 'border-info-500 text-info-700 dark:text-info-400',
  neutral: 'border-neutral-400 text-neutral-700 dark:border-neutral-500 dark:text-neutral-300',
};

// Dot colors (for soft/outline styles)
const dotStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-500',
  secondary: 'bg-secondary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-info-500',
  neutral: 'bg-neutral-500',
};

// Remove button hover styles
const removeButtonStyles: Record<BadgeVariant, Record<BadgeStyle, string>> = {
  primary: {
    solid: 'hover:bg-primary-700',
    soft: 'hover:bg-primary-200 dark:hover:bg-primary-800',
    outline: 'hover:bg-primary-100 dark:hover:bg-primary-900/50',
  },
  secondary: {
    solid: 'hover:bg-secondary-700',
    soft: 'hover:bg-secondary-200 dark:hover:bg-secondary-800',
    outline: 'hover:bg-secondary-100 dark:hover:bg-secondary-900/50',
  },
  success: {
    solid: 'hover:bg-success-700',
    soft: 'hover:bg-success-200 dark:hover:bg-success-800',
    outline: 'hover:bg-success-100 dark:hover:bg-success-900/50',
  },
  warning: {
    solid: 'hover:bg-warning-600',
    soft: 'hover:bg-warning-200 dark:hover:bg-warning-800',
    outline: 'hover:bg-warning-100 dark:hover:bg-warning-900/50',
  },
  error: {
    solid: 'hover:bg-error-700',
    soft: 'hover:bg-error-200 dark:hover:bg-error-800',
    outline: 'hover:bg-error-100 dark:hover:bg-error-900/50',
  },
  info: {
    solid: 'hover:bg-info-700',
    soft: 'hover:bg-info-200 dark:hover:bg-info-800',
    outline: 'hover:bg-info-100 dark:hover:bg-info-900/50',
  },
  neutral: {
    solid: 'hover:bg-neutral-700',
    soft: 'hover:bg-neutral-200 dark:hover:bg-neutral-700',
    outline: 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
  },
};

// ============================================
// COMPONENT
// ============================================

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'neutral',
      badgeStyle = 'soft',
      size = 'md',
      children,
      dot = false,
      removable = false,
      onRemove,
      leftIcon,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = [
      'inline-flex items-center justify-center',
      'font-medium rounded-full',
      'transition-colors duration-fast',
      'whitespace-nowrap',
    ].join(' ');

    const styleMap = {
      solid: solidStyles[variant],
      soft: softStyles[variant],
      outline: `border bg-transparent ${outlineStyles[variant]}`,
    };

    // For solid style, dot should be white
    const dotColor = badgeStyle === 'solid' ? 'bg-white/80' : dotStyles[variant];

    return (
      <span
        ref={ref}
        className={`
          ${baseStyles}
          ${sizeStyles[size]}
          ${styleMap[badgeStyle]}
          ${className}
        `.trim()}
        {...props}
      >
        {/* Dot indicator */}
        {dot && (
          <span
            className={`${dotSizeStyles[size]} ${dotColor} rounded-full flex-shrink-0`}
            aria-hidden="true"
          />
        )}

        {/* Left icon */}
        {leftIcon && !dot && (
          <span className={`${iconSizeStyles[size]} flex-shrink-0 flex items-center justify-center`}>
            {leftIcon}
          </span>
        )}

        {/* Content */}
        <span className="truncate">{children}</span>

        {/* Remove button */}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className={`
              -mr-0.5 ml-0.5 p-0.5 rounded-full
              transition-colors duration-fast
              focus:outline-none focus-visible:ring-1 focus-visible:ring-current
              ${removeButtonStyles[variant][badgeStyle]}
            `.trim()}
            aria-label="Remove"
          >
            <X className={iconSizeStyles[size]} />
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
