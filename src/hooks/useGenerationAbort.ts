import { useRef, useEffect, useCallback } from "react";

/**
 * Hook to manage AI generation requests with safe state updates.
 * 
 * IMPORTANT: Generation continues on the server even if the component unmounts
 * or the tab is in background. This hook only manages client-side state updates.
 * 
 * The isMounted check prevents React warnings about setting state on unmounted
 * components, but does NOT cancel server-side generation.
 */
export function useGenerationAbort() {
  const isMountedRef = useRef(true);
  const isGeneratingRef = useRef(false);

  // Track mounted state (no warning on unmount - generation continues server-side)
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      // Note: Server-side generation continues even after unmount
      // We just can't update state after this point
      isGeneratingRef.current = false;
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
