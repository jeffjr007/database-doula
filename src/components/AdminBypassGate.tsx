import { useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';

interface AdminBypassGateProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Gate component that redirects admins away from user-specific flows.
 * Admins should NEVER see activation or gift pages - they go straight to Portal.
 */
const AdminBypassGate = ({ children, redirectTo = '/' }: AdminBypassGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isAdminSticky, loading: adminLoading } = useAdmin();

  useEffect(() => {
    // Wait for both auth and admin status to be determined
    if (authLoading || adminLoading) return;

    // If user is admin (current or sticky), redirect immediately
    if (isAdmin || isAdminSticky) {
      console.log('[AdminBypassGate] Admin detected, redirecting to:', redirectTo);
      window.location.replace(redirectTo);
    }
  }, [authLoading, adminLoading, isAdmin, isAdminSticky, redirectTo]);

  // Show nothing while loading or if admin (will redirect)
  // Child pages handle their own loading states
  if (authLoading || adminLoading || isAdmin || isAdminSticky) {
    return null;
  }

  // Not admin - render children
  return <>{children}</>;
};

export default AdminBypassGate;
