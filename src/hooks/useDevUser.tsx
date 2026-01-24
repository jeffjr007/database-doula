import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DevUserContextType {
  isDevUser: boolean;
  loading: boolean;
  /** Bypasses all form validation, required fields, and stage blocking */
  bypassValidation: boolean;
  /** Skips wait times for mentor messages and animations */
  skipAnimations: boolean;
  /** Always shows gift/reward screens for testing */
  forceShowRewards: boolean;
  /** Auto-saves data immediately without requiring flow completion */
  autoSave: boolean;
  /** Allows navigation to any stage regardless of prerequisites */
  freeNavigation: boolean;
}

const DevUserContext = createContext<DevUserContextType>({
  isDevUser: false,
  loading: true,
  bypassValidation: false,
  skipAnimations: false,
  forceShowRewards: false,
  autoSave: false,
  freeNavigation: false,
});

export const useDevUser = () => useContext(DevUserContext);

interface DevUserProviderProps {
  children: ReactNode;
}

export const DevUserProvider = ({ children }: DevUserProviderProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isDevUser, setIsDevUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkDevStatus = useCallback(async () => {
    if (!user) {
      setIsDevUser(false);
      setLoading(false);
      return;
    }

    try {
      // Use the RPC function to check dev role securely
      const { data, error } = await supabase.rpc('is_dev_user', {
        _user_id: user.id,
      });

      if (error) {
        console.error('[useDevUser] RPC error:', error);
        setIsDevUser(false);
      } else {
        const devResult = Boolean(data);
        setIsDevUser(devResult);
        
        if (devResult) {
          console.log('[useDevUser] 🔧 Dev mode activated - all bypasses enabled');
        }
      }
    } catch (error) {
      console.error('[useDevUser] Unexpected error:', error);
      setIsDevUser(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    checkDevStatus();
  }, [authLoading, checkDevStatus]);

  // Reset on logout
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setIsDevUser(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const value: DevUserContextType = {
    isDevUser,
    loading: authLoading || loading,
    // All dev features enabled when isDevUser is true
    bypassValidation: isDevUser,
    skipAnimations: isDevUser,
    forceShowRewards: isDevUser,
    autoSave: isDevUser,
    freeNavigation: isDevUser,
  };

  return (
    <DevUserContext.Provider value={value}>
      {children}
    </DevUserContext.Provider>
  );
};
