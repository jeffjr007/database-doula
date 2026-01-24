import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to generate signed URLs for private bucket files
 * URLs expire after 1 hour for security
 */
export const useSignedUrl = () => {
  const [loading, setLoading] = useState(false);

  const getSignedUrl = useCallback(async (filePath: string | null): Promise<string | null> => {
    if (!filePath) return null;

    // If it's already a full URL (legacy data), return as-is for backwards compat
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
      // Extract the path from the old public URL format
      const match = filePath.match(/\/mentee-files\/(.+)$/);
      if (match) {
        const extractedPath = match[1];
        setLoading(true);
        try {
          const { data, error } = await supabase.storage
            .from('mentee-files')
            .createSignedUrl(extractedPath, 3600); // 1 hour expiration

          if (error) {
            console.error('Error creating signed URL:', error);
            return null;
          }
          return data.signedUrl;
        } finally {
          setLoading(false);
        }
      }
      // Fallback for unknown URL format
      return null;
    }

    // It's a file path, generate signed URL
    setLoading(true);
    try {
      const { data, error } = await supabase.storage
        .from('mentee-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiration

      if (error) {
        console.error('Error creating signed URL:', error);
        return null;
      }
      return data.signedUrl;
    } finally {
      setLoading(false);
    }
  }, []);

  const downloadFile = useCallback(async (filePath: string | null, fileName?: string) => {
    const url = await getSignedUrl(filePath);
    if (!url) return;

    // Trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [getSignedUrl]);

  return { getSignedUrl, downloadFile, loading };
};
