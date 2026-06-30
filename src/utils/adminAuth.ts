/**
 * adminAuth.ts
 * Reusable server-side admin identity guard.
 * Uses split_part logic (same as the DB RLS policy) to prevent:
 * - Case sensitivity issues (Admin@PROPERTYHUBGH.COM still passes)
 * - Subdomain spoofing (attacker@subdomain.propertyhubgh.com fails — no @ in front)
 */
export const isAuthorizedAdmin = (email: string | undefined | null): boolean => {
  if (!email) return false;
  const parts = email.split('@');
  if (parts.length !== 2) return false;
  return parts[1].toLowerCase() === 'propertyhubgh.com';
};
