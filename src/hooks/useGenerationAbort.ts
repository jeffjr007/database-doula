import { useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";

/**
 * Hook to manage AI generation requests with automatic cancellation on unmount
 * Shows a warning toast if generation is cancelled due to navigation
 */
export function useGenerationAbort() {
  const isMountedRef = useRef(true);
  const isGeneratingRef = useRef(false);

  // Track mounted state and show warning on unmount if generating
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (isGeneratingRef.current) {
        toast.warning("Geração cancelada", {
          description: "Você saiu da página durante a geração. O processo foi interrompido.",
        });
      }
    };
  }, []);

  const startGeneration = useCallback(() => {
    isGeneratingRef.current = true;
  }, []);

  const endGeneration = useCallback(() => {
    isGeneratingRef.current = false;
  }, []);

  // Check if component is still mounted (use this before setting state after async operations)
  const isMounted = useCallback(() => {
    return isMountedRef.current;
  }, []);

  // Wrapper for async operations that checks mount status
  const safeSetState = useCallback(<T>(setter: (value: T) => void, value: T) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  return {
    startGeneration,
    endGeneration,
    isMounted,
    safeSetState,
    isMountedRef,
    isGeneratingRef,
  };
}
