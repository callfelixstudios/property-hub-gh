/**
 * adminAuth.ts
 * Reusable server-side admin identity guard.
 * Checks the Supabase user object's app_metadata for the explicit
 * `platform_admin` role (set at the DB layer in auth.users.app_metadata).
 * Role-based check — not derived from email domain.
 */
import type { User } from '@supabase/supabase-js';

export const isPlatformAdmin = (user: User | null | undefined): user is User => {
  if (!user) return false;
  return user.app_metadata?.role === 'platform_admin';
};