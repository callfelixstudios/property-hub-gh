import { isPlatformAdmin } from '@/utils/adminAuth';
import { safeDestination } from '@/utils/safeDestination';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Resolves where to send the user after a successful login.
 * An explicit validated ?next= target always wins; otherwise platform
 * admins land on /admin and everyone else on /rentals.
 */
export async function resolvePostLoginDestination(
  supabase: SupabaseClient,
  redirectTo?: string | null
): Promise<string> {
  if (redirectTo) {
    return safeDestination(redirectTo) ?? '/rentals';
  }
  const { data } = await supabase.auth.getUser();
  return isPlatformAdmin(data.user) ? '/admin' : '/rentals';
}