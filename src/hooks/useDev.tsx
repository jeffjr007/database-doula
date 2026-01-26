import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

/**
 * Hook to check if the current user is a dev user.
 * Dev users have access to ALL stages without restrictions.
 * 
 * IMPORTANT: isDevSticky is a "sticky" flag that, once true, never goes back to false
 * in the same session. This prevents redirect loops caused by transient RPC errors.
 */
export const useDev = () => {
  const { user, loading: authLoading } = useAuth();
  const [isDev, setIsDev] = useState(false);
  const [isDevSticky, setIsDevSticky] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkDevStatus = useCallback(async () => {
    if (!user) {
      setIsDev(false);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('is_dev_user', {
        _user_id: user.id,
      });

      if (error) {
        console.error('[useDev] RPC error:', error);
        if (!isDevSticky) {
          setIsDev(false);
        }
      } else {
        const devResult = Boolean(data);
        setIsDev(devResult);
        
        if (devResult && !isDevSticky) {
          console.log('[useDev] Dev user detected, setting sticky flag');
          setIsDevSticky(true);
        }
      }
    } catch (error) {
      console.error('[useDev] Unexpected error:', error);
      if (!isDevSticky) {
        setIsDev(false);
      }
    } finally {
      setLoading(false);
    }
  }, [user, isDevSticky]);

  useEffect(() => {
    if (authLoading) return;
    checkDevStatus();
  }, [authLoading, checkDevStatus]);

  // Listen for logout to reset sticky state
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        console.log('[useDev] User signed out, resetting sticky flag');
        setIsDevSticky(false);
        setIsDev(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return { 
    isDev: isDev || isDevSticky,
    isDevSticky,
    loading: authLoading || loading 
  };
};
