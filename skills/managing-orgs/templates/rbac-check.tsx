// Server Component - check role/permission
import { auth } from '@clerk/nextjs/server';

export default async function AdminSettingsPage() {
  const { has } = await auth();

  // Check by role
  const isAdmin = await has({ role: 'org:admin' });

  // Check by custom permission
  const canManageSettings = await has({ permission: 'org:settings:manage' });

  if (!isAdmin && !canManageSettings) {
    return <div>Access denied. Admin only.</div>;
  }

  return <div>Admin Settings...</div>;
}

// Client Component - check role/permission
'use client';

import { useAuth } from '@clerk/nextjs';

export function AdminPanel() {
  const { has, isLoaded } = useAuth();

  // Wait for auth to load
  if (!isLoaded) return null;

  // Check by role - has() is guaranteed after isLoaded
  if (!has({ role: 'org:admin' })) {
    return null;
  }

  return <div>Admin controls...</div>;
}

// API Route - check role/permission
import { auth } from '@clerk/nextjs/server';

export async function PATCH(req: Request) {
  const { userId, orgId, has } = await auth();

  if (!userId || !orgId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const canManage = await has({ role: 'org:admin' });
  if (!canManage) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Update settings...
  return Response.json({ success: true });
}
