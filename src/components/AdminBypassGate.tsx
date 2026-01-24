import { useEffect } from 'react';
import { useAdmin } from '@/hooks/useAdmin';
import { useAuth } from '@/hooks/useAuth';
import { useDevUser } from '@/hooks/useDevUser';

interface AdminBypassGateProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Gate component that redirects admins and dev users away from user-specific flows.
 * Admins and dev users should NEVER see activation or gift pages - they go straight to Portal.
 */
const AdminBypassGate = ({ children, redirectTo = '/' }: AdminBypassGateProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isAdminSticky, loading: adminLoading } = useAdmin();
  const { isDevUser, loading: devLoading } = useDevUser();

  const shouldBypass = isAdmin || isAdminSticky || isDevUser;
  const isLoading = authLoading || adminLoading || devLoading;

  useEffect(() => {
    // Wait for auth, admin, and dev status to be determined
    if (isLoading) return;

    // If user is admin or dev, redirect immediately
    if (shouldBypass) {
      console.log('[AdminBypassGate] Admin/Dev detected, redirecting to:', redirectTo);
      window.location.replace(redirectTo);
    }
  }, [isLoading, shouldBypass, redirectTo]);

  // Show nothing while loading or if should bypass (will redirect)
  if (isLoading || shouldBypass) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not admin/dev - render children
  return <>{children}</>;
};

export default AdminBypassGate;
