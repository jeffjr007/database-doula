import { useEffect, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

/**
 * Hook that detects if reduced motion should be used.
 * Returns true for:
 * - Mobile devices (to prevent framer-motion jank)
 * - Users who prefer reduced motion (accessibility)
 */
export function usePrefersReducedMotion() {
  const isMobile = useIsMobile();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Reduce motion on mobile OR if user prefers reduced motion
  const shouldReduceMotion = isMobile || prefersReducedMotion;

  return {
    isMobile,
    prefersReducedMotion,
    shouldReduceMotion,
  };
}
