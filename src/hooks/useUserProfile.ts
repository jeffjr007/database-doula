import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface UserPersonalData {
  fullName: string;
  age: string;
  location: string;
  linkedinUrl: string;
  phone: string;
  email: string;
}

interface UseUserProfileReturn {
  personalData: UserPersonalData;
  isLoading: boolean;
  updatePersonalData: (data: Partial<UserPersonalData>) => Promise<void>;
  refetch: () => Promise<void>;
}

const CACHE_KEY = 'user_personal_data_cache';

// Admin email that should NOT have auto-fill enabled
const ADMIN_NO_AUTOFILL_EMAIL = 'adrianoduartefxck@gmail.com';

const defaultData: UserPersonalData = {
  fullName: '',
  age: '',
  location: '',
  linkedinUrl: '',
  phone: '',
  email: '',
};

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const [personalData, setPersonalData] = useState<UserPersonalData>(() => {
    // Try to load from cache immediately
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          // Invalid cache, use default
        }
      }
    }
    return defaultData;
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) {
      setPersonalData(defaultData);
      setIsLoading(false);
      return;
    }

    // Skip auto-fill for specific admin user
    if (user?.email === ADMIN_NO_AUTOFILL_EMAIL) {
      setPersonalData(defaultData);
      sessionStorage.removeItem(CACHE_KEY);
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, age, location, linkedin_url, phone, email')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      const newData: UserPersonalData = {
        fullName: profile?.full_name || '',
        age: profile?.age || '',
        location: profile?.location || '',
        linkedinUrl: profile?.linkedin_url || '',
        phone: profile?.phone || '',
        email: profile?.email || user.email || '',
      };

      setPersonalData(newData);
      
      // Cache the data
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(newData));
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Fallback to email from auth
      if (user?.email) {
        setPersonalData(prev => ({ ...prev, email: user.email || '' }));
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updatePersonalData = useCallback(async (data: Partial<UserPersonalData>) => {
    if (!user?.id) return;

    const updatePayload: Record<string, string | null> = {};
    
    if (data.fullName !== undefined) updatePayload.full_name = data.fullName;
    if (data.age !== undefined) updatePayload.age = data.age;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.linkedinUrl !== undefined) updatePayload.linkedin_url = data.linkedinUrl;
    if (data.phone !== undefined) updatePayload.phone = data.phone;

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id);

    if (error) throw error;

    // Update local state and cache
    const newData = { ...personalData, ...data };
    setPersonalData(newData);
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(newData));
  }, [user?.id, personalData]);

  return {
    personalData,
    isLoading,
    updatePersonalData,
    refetch: fetchProfile,
  };
}
