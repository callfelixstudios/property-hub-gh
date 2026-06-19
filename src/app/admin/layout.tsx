import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, LogOut } from 'lucide-react';
import NavigationHeader from '@/components/NavigationHeader';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email?.endsWith('@propertyhubgh.com')) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <NavigationHeader />
      <div className="flex flex-1 pt-24">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800">Admin Control</h2>
          </div>
          <nav className="flex-1 px-4 space-y-2">
            <Link href="/admin" className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium">
              <LayoutDashboard className="w-5 h-5" />
              Dashboard
            </Link>
          </nav>
          <div className="p-4 border-t border-gray-200">
            <form action="/auth/signout" method="post">
              <button className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-xl font-medium transition-colors">
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </form>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
