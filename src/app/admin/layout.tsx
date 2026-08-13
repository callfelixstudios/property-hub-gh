import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { isPlatformAdmin } from '@/utils/adminAuth';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};
import { AdminNavLink } from '@/components/admin/AdminNavLink';
import {
  LogOut,
  ChevronRight,
} from 'lucide-react';

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

const NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Overview',
    iconName: 'LayoutDashboard',
    exact: true,
  },
  {
    href: '/admin/users',
    label: 'User Management',
    iconName: 'Users',
  },
  {
    href: '/admin/listings',
    label: 'Listings Queue',
    iconName: 'ListChecks',
  },
  {
    href: '/admin/verification',
    label: 'Verifications',
    iconName: 'BadgeCheck',
  },
  {
    href: '/admin/listing-health',
    label: 'Listing Health',
    iconName: 'Activity',
  },
  {
    href: '/admin/analytics',
    label: 'Analytics & Alerts',
    iconName: 'BarChart3',
  },
  {
    href: '/admin/locations',
    label: 'Locations',
    iconName: 'MapPin',
  },
  {
    href: '/admin/config',
    label: 'System Config',
    iconName: 'Settings',
  },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isPlatformAdmin(user)) {
    redirect('/unauthorized');
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside className="w-64 bg-[#0d1b2a] hidden md:flex flex-col fixed top-0 left-0 h-screen z-40">
        {/* Logo area */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#eab308] flex items-center justify-center flex-shrink-0">
              <span className="text-[#0d1b2a] font-black text-xs">PH</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm leading-tight">Admin Portal</p>
              <p className="text-slate-400 text-xs">Property Hub GH</p>
            </div>
          </div>
        </div>

        {/* Admin identity badge */}
        <div className="px-4 py-3 mx-3 mt-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-slate-400 text-xs mb-0.5">Signed in as</p>
          <p className="text-white text-xs font-medium truncate">{user.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Control
          </p>
          <div className="space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <div key={item.href} className="relative">
                <AdminNavLink item={item} />
              </div>
            ))}
          </div>
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-white/10">
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2.5 w-full text-left text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-medium transition-all group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content area ───────────────────────────────────────────── */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="font-medium text-slate-800">Admin</span>
            <ChevronRight className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-500">Live</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}

