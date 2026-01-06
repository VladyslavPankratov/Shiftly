import type { HTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useState } from 'react';

// ============================================
// TYPES
// ============================================

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type AvatarShape = 'circle' | 'rounded';
type AvatarStatus = 'online' | 'offline' | 'busy' | 'away';

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /** Image source URL */
  src?: string;
  /** Alt text for image */
  alt?: string;
  /** Name for generating initials fallback */
  name?: string;
  /** Avatar size */
  size?: AvatarSize;
  /** Avatar shape */
  shape?: AvatarShape;
  /** Status indicator */
  status?: AvatarStatus;
  /** Custom fallback content */
  fallback?: ReactNode;
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Avatar elements */
  children: ReactNode;
  /** Maximum avatars to show before +N */
  max?: number;
  /** Size of avatars in group */
  size?: AvatarSize;
  /** Spacing between avatars (negative for overlap) */
  spacing?: 'tight' | 'normal' | 'loose';
}

// ============================================
// STYLES
// ============================================

const sizeStyles: Record<AvatarSize, { container: string; text: string; status: string; statusRing: string }> = {
  xs: {
    container: 'h-6 w-6',
    text: 'text-body-xs',
    status: 'h-2 w-2',
    statusRing: 'ring-1',
  },
  sm: {
    container: 'h-8 w-8',
    text: 'text-body-sm',
    status: 'h-2.5 w-2.5',
    statusRing: 'ring-2',
  },
  md: {
    container: 'h-10 w-10',
    text: 'text-body-md',
    status: 'h-3 w-3',
    statusRing: 'ring-2',
  },
  lg: {
    container: 'h-12 w-12',
    text: 'text-body-lg',
    status: 'h-3.5 w-3.5',
    statusRing: 'ring-2',
  },
  xl: {
    container: 'h-16 w-16',
    text: 'text-body-xl',
    status: 'h-4 w-4',
    statusRing: 'ring-2',
  },
};

const shapeStyles: Record<AvatarShape, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
};

const statusStyles: Record<AvatarStatus, string> = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  busy: 'bg-error-500',
  away: 'bg-warning-500',
};

const statusPosition: Record<AvatarShape, string> = {
  circle: 'bottom-0 right-0',
  rounded: '-bottom-0.5 -right-0.5',
};

const groupSpacing: Record<'tight' | 'normal' | 'loose', string> = {
  tight: '-space-x-3',
  normal: '-space-x-2',
  loose: '-space-x-1',
};

// Gradient backgrounds for fallback (based on name hash)
const fallbackGradients = [
  'from-primary-400 to-primary-600',
  'from-secondary-400 to-secondary-600',
  'from-accent-400 to-accent-600',
  'from-info-400 to-info-600',
  'from-success-400 to-success-600',
  'from-warning-400 to-warning-600',
  'from-error-400 to-error-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-indigo-400 to-indigo-600',
];

// ============================================
// UTILITIES
// ============================================

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradientIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % fallbackGradients.length;
}

// ============================================
// AVATAR IMAGE
// ============================================

interface AvatarImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  onLoadingStatusChange?: (status: 'loading' | 'loaded' | 'error') => void;
}

const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ src, alt, onLoadingStatusChange, className = '', ...props }, ref) => {
    return (
      <img
        ref={ref}
        src={src}
        alt={alt}
        onLoad={() => onLoadingStatusChange?.('loaded')}
        onError={() => onLoadingStatusChange?.('error')}
        className={`aspect-square h-full w-full object-cover ${className}`}
        {...props}
      />
    );
  }
);

AvatarImage.displayName = 'AvatarImage';

// ============================================
// AVATAR COMPONENT
// ============================================

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      name,
      size = 'md',
      shape = 'circle',
      status,
      fallback,
      className = '',
      ...props
    },
    ref
  ) => {
    const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>(
      src ? 'loading' : 'error'
    );

    const styles = sizeStyles[size];
    const initials = name ? getInitials(name) : '?';
    const gradientIndex = name ? getGradientIndex(name) : 0;

    const showImage = src && imageStatus !== 'error';
    const showFallback = !showImage;

    return (
      <div
        ref={ref}
        className={`
          relative inline-flex shrink-0 overflow-hidden
          ${styles.container}
          ${shapeStyles[shape]}
          ${className}
        `.trim()}
        {...props}
      >
        {/* Image */}
        {src && (
          <AvatarImage
            src={src}
            alt={alt || name || ''}
            onLoadingStatusChange={setImageStatus}
            className={`
              ${shapeStyles[shape]}
              ${imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'}
              transition-opacity duration-normal
            `}
          />
        )}

        {/* Fallback */}
        {showFallback && (
          <div
            className={`
              absolute inset-0 flex items-center justify-center
              bg-gradient-to-br ${fallbackGradients[gradientIndex]}
              text-white font-medium select-none
              ${styles.text}
              ${shapeStyles[shape]}
            `.trim()}
          >
            {fallback || initials}
          </div>
        )}

        {/* Status indicator */}
        {status && (
          <span
            className={`
              absolute ${statusPosition[shape]}
              ${styles.status}
              ${statusStyles[status]}
              ${styles.statusRing} ring-white dark:ring-neutral-900
              rounded-full
            `.trim()}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

// ============================================
// AVATAR GROUP COMPONENT
// ============================================

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      children,
      max = 4,
      size = 'md',
      spacing = 'normal',
      className = '',
      ...props
    },
    ref
  ) => {
    const childArray = Array.isArray(children) ? children : [children];
    const visibleCount = max;
    const excessCount = childArray.length - visibleCount;

    const styles = sizeStyles[size];

    return (
      <div
        ref={ref}
        className={`flex items-center ${groupSpacing[spacing]} ${className}`}
        {...props}
      >
        {childArray.slice(0, visibleCount).map((child, index) => (
          <div
            key={index}
            className="relative ring-2 ring-white dark:ring-neutral-900 rounded-full"
            style={{ zIndex: visibleCount - index }}
          >
            {child}
          </div>
        ))}

        {excessCount > 0 && (
          <div
            className={`
              relative flex items-center justify-center
              ${styles.container}
              rounded-full
              bg-neutral-200 dark:bg-neutral-700
              text-neutral-600 dark:text-neutral-300
              ${styles.text}
              font-medium
              ring-2 ring-white dark:ring-neutral-900
            `.trim()}
            style={{ zIndex: 0 }}
          >
            +{excessCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';
