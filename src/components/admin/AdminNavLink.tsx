'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  LayoutDashboard,
  Users,
  ListChecks,
  BadgeCheck,
  Settings,
  Activity,
  BarChart3,
  LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  ListChecks,
  BadgeCheck,
  Settings,
  Activity,
  BarChart3,
};

type NavItem = {
  href: string;
  label: string;
  iconName: string;
  badge?: string;
  exact?: boolean;
};

export function AdminNavLink({ item }: { item: NavItem }) {
  const pathname = usePathname();
  const Icon = ICON_MAP[item.iconName] || LayoutDashboard;

  const isActive = item.exact
    ? pathname === item.href
    : pathname.startsWith(item.href);

  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${
        isActive
          ? 'bg-white/15 text-white shadow-sm'
          : 'text-slate-400 hover:text-white hover:bg-white/8'
      }`}
    >
      {/* Active indicator bar */}
      <span
        className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#eab308] transition-opacity duration-150 ${
          isActive ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <Icon
        className={`w-4 h-4 flex-shrink-0 transition-colors ${
          isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
        }`}
      />
      <span className="flex-1">{item.label}</span>
      {item.badge && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-slate-400">
          {item.badge}
        </span>
      )}
    </Link>
  );
}
