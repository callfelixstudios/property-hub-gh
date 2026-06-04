"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
    } else {
      router.push("/rentals");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <div>
          {/* Tab Navigation */}
          <div className="flex justify-center space-x-6 mb-6">
            <Link href="/login" className={`font-medium pb-1 transition-colors ${pathname === "/login" ? "text-navy-base border-b-2 border-accent-gold" : "text-slate-400 hover:text-navy-base"}`}>Login</Link>
            <Link href="/register" className={`font-medium pb-1 transition-colors ${pathname === "/register" ? "text-navy-base border-b-2 border-accent-gold" : "text-slate-400 hover:text-navy-base"}`}>Register</Link>
          </div>
          <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-navy-base">
            Sign in to Property Hub
          </h2>
          <p className="mt-2 text-center text-sm text-navy-base">
            Enter your email and password to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-accent-gold focus:outline-none focus:ring-accent-gold sm:text-sm"
                  placeholder="you@example.com"
                />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-accent-gold focus:outline-none focus:ring-accent-gold sm:text-sm"
                  placeholder="••••••••"
                />
            </div>
          </div>

          <div className="flex flex-col space-y-3">
                <button
                  type="submit"
                  className="group relative flex w-full justify-center rounded-sm bg-slate-900 text-white font-medium py-2 px-4 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-colors"
                >
                Sign in
              </button>
          </div>
          <p className="mt-4 text-center text-sm text-navy-base">
            Don’t have an account? <Link href="/register" className="font-medium text-slate-900 hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
