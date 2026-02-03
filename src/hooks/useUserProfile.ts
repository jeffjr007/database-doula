import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useAdmin } from './useAdmin';

export interface UserPersonalData {
  fullName: string;
  age: string;
  location: string;
  linkedinUrl: string;
  phone: string;
  email: string;
  nacionalidade: string;
}

interface UseUserProfileReturn {
  personalData: UserPersonalData;
  isLoading: boolean;
  updatePersonalData: (data: Partial<UserPersonalData>) => Promise<void>;
  refetch: () => Promise<void>;
}

const CACHE_KEY = 'user_personal_data_cache';

const defaultData: UserPersonalData = {
  fullName: '',
  age: '',
  location: '',
  linkedinUrl: '',
  phone: '',
  email: '',
  nacionalidade: '',
};

export function useUserProfile(): UseUserProfileReturn {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [personalData, setPersonalData] = useState<UserPersonalData>(() => {
    // Try to load from cache immediately (only for non-admins, but we don't know yet)
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

    // Skip auto-fill for ALL admin users - they need to fill forms manually for testing
    if (isAdmin) {
      setPersonalData(defaultData);
      sessionStorage.removeItem(CACHE_KEY);
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('full_name, age, location, linkedin_url, phone, email, nacionalidade')
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
        nacionalidade: profile?.nacionalidade || '',
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
  }, [user?.id, user?.email, isAdmin]);

  useEffect(() => {
    // Wait for admin check to complete before fetching profile
    if (adminLoading) return;
    fetchProfile();
  }, [fetchProfile, adminLoading]);

  const updatePersonalData = useCallback(async (data: Partial<UserPersonalData>) => {
    if (!user?.id) return;

    const updatePayload: Record<string, string | null> = {};
    
    if (data.fullName !== undefined) updatePayload.full_name = data.fullName;
    if (data.age !== undefined) updatePayload.age = data.age;
    if (data.location !== undefined) updatePayload.location = data.location;
    if (data.linkedinUrl !== undefined) updatePayload.linkedin_url = data.linkedinUrl;
    if (data.phone !== undefined) updatePayload.phone = data.phone;
    if (data.nacionalidade !== undefined) updatePayload.nacionalidade = data.nacionalidade;

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('user_id', user.id);

    if (error) throw error;

    // Update local state and cache (only for non-admins)
    const newData = { ...personalData, ...data };
    setPersonalData(newData);
    if (!isAdmin) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify(newData));
    }
  }, [user?.id, personalData, isAdmin]);

  return {
    personalData,
    isLoading: isLoading || adminLoading,
    updatePersonalData,
    refetch: fetchProfile,
  };
}
