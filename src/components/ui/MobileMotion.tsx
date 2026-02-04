import { motion, HTMLMotionProps, TargetAndTransition, Transition } from 'framer-motion';
import { ReactNode } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

type AnimationType = 
  | 'fade-in'
  | 'slide-up' 
  | 'slide-left' 
  | 'slide-right'
  | 'scale-in';

interface MobileMotionProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  // Pass-through for motion.div specific props (desktop only)
  motionProps?: Omit<HTMLMotionProps<'div'>, 'children' | 'className'>;
}

// CSS class mappings for mobile (GPU-accelerated)
const cssAnimationMap: Record<AnimationType, string> = {
  'fade-in': 'animate-mobile-fade-in',
  'slide-up': 'animate-mobile-slide-up',
  'slide-left': 'animate-mobile-slide-left',
  'slide-right': 'animate-mobile-slide-right',
  'scale-in': 'animate-mobile-scale-in',
};

// Framer motion variants for desktop
const motionVariants: Record<AnimationType, { initial: TargetAndTransition; animate: TargetAndTransition }> = {
  'fade-in': {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  },
  'slide-up': {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
  },
  'slide-left': {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
  },
  'slide-right': {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
  },
  'scale-in': {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
  },
};

/**
 * MobileMotion: Performance-optimized animation wrapper
 * 
 * - On mobile: Uses CSS animations (GPU-accelerated, 60fps)
 * - On desktop: Uses framer-motion (full feature set)
 * 
 * This prevents the "jank" caused by JavaScript-based animations on mobile.
 */
export function MobileMotion({
  children,
  animation = 'fade-in',
  delay = 0,
  duration = 200,
  className = '',
  motionProps,
}: MobileMotionProps) {
  const { shouldReduceMotion } = usePrefersReducedMotion();

  // Mobile: Use CSS animations (hardware-accelerated)
  if (shouldReduceMotion) {
    const cssClass = cssAnimationMap[animation];
    const style = {
      animationDelay: delay > 0 ? `${delay}ms` : undefined,
      animationDuration: `${duration}ms`,
    };

    return (
      <div 
        className={`${cssClass} ${className}`}
        style={style}
      >
        {children}
      </div>
    );
  }

  // Desktop: Use framer-motion (full animations)
  const variant = motionVariants[animation];
  
  return (
    <motion.div
      initial={variant.initial}
      animate={variant.animate}
      transition={{ 
        duration: duration / 1000, 
        delay: delay / 1000,
        ease: 'easeOut',
      }}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}

/**
 * Hook to conditionally render motion components
 * Returns CSS classes for mobile or framer-motion props for desktop
 */
export function useMotionConfig(animation: AnimationType = 'fade-in', delay = 0) {
  const { shouldReduceMotion } = usePrefersReducedMotion();
  
  if (shouldReduceMotion) {
    return {
      isMobile: true,
      className: cssAnimationMap[animation],
      style: { animationDelay: delay > 0 ? `${delay}ms` : undefined },
      motionProps: null,
    };
  }

  const variant = motionVariants[animation];
  return {
    isMobile: false,
    className: '',
    style: {},
    motionProps: {
      initial: variant.initial,
      animate: variant.animate,
      transition: { duration: 0.2, delay: delay / 1000, ease: 'easeOut' },
    },
  };
}
