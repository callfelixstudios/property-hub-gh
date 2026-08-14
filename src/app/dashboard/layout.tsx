import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import type { Metadata } from 'next';
import React from 'react';
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 pt-24 flex flex-col">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
