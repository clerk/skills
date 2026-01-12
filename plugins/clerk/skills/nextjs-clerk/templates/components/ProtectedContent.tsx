/**
 * Protected Content Component (Client Component)
 * 
 * Conditionally renders content based on authentication state and roles.
 * Uses the Protect component for role-based access control.
 */
"use client";

import { Protect, useAuth, useUser } from "@clerk/nextjs";
import { ReactNode } from "react";

interface ProtectedContentProps {
  children: ReactNode;
  /** Required role (e.g., "org:admin", "org:member") */
  role?: string;
  /** Required permission (e.g., "org:billing:manage") */
  permission?: string;
  /** Content to show when access is denied */
  fallback?: ReactNode;
  /** Show loading state while checking auth */
  showLoading?: boolean;
}

export function ProtectedContent({
  children,
  role,
  permission,
  fallback = <p>You don't have access to this content.</p>,
  showLoading = true,
}: ProtectedContentProps) {
  const { isLoaded } = useAuth();

  if (!isLoaded && showLoading) {
    return <div className="animate-pulse">Loading...</div>;
  }

  // If role or permission is specified, use Protect component
  if (role || permission) {
    return (
      <Protect role={role} permission={permission} fallback={fallback}>
        {children}
      </Protect>
    );
  }

  // Otherwise, just check if signed in
  return (
    <Protect fallback={fallback}>
      {children}
    </Protect>
  );
}

/**
 * Admin-only content wrapper
 */
export function AdminContent({
  children,
  fallback = <p>Admin access required.</p>,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <ProtectedContent role="org:admin" fallback={fallback}>
      {children}
    </ProtectedContent>
  );
}

/**
 * Example usage:
 * 
 * <ProtectedContent>
 *   <p>Only signed-in users can see this</p>
 * </ProtectedContent>
 * 
 * <ProtectedContent role="org:admin">
 *   <AdminDashboard />
 * </ProtectedContent>
 * 
 * <ProtectedContent permission="org:billing:manage">
 *   <BillingSettings />
 * </ProtectedContent>
 */

