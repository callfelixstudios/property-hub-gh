"use client";
import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // you can optionally set email redirect URL here
      },
    });
    if (error) {
      alert(error.message);
    } else {
      // After successful signup, redirect to login page or directly to post-space if you prefer
      router.push("/login?message=Account%20created%20please%20log%20in");
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
            Create your Property Hub account
          </h2>
          <p className="mt-2 text-center text-sm text-navy-base">
            Fill in the details below to get started
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleRegister}>
          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-navy-base">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-accent-gold focus:outline-none focus:ring-accent-gold sm:text-sm"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-navy-base">
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
              <label htmlFor="password" className="block text-sm font-medium text-navy-base">
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
              Register
            </button>
          </div>
          <p className="mt-4 text-center text-sm text-navy-base">
            Already have an account? <Link href="/login" className="font-medium text-slate-900 hover:underline">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
