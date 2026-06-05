"use client";

import React from 'react';

export default function SafeMovePage() {
  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-navy-base mb-6">
            Introducing <span className="text-accent-gold">SafeMove</span> Escrow
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            The trusted escrow framework for the Ghanaian real estate market. 
            Rent or buy property with absolute confidence and zero risk of fraud.
          </p>
        </div>

        {/* How It Works */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-navy-base mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-navy-base/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-navy-base font-bold text-xl">1</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-3">Deposit Securely</h3>
              <p className="text-sm text-gray-600">Renter deposits funds securely into our verified escrow account.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-accent-gold/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-accent-gold font-bold text-xl">2</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-3">Property Verification</h3>
              <p className="text-sm text-gray-600">Property Hub verifies property integrity and confirms the landlord's title.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-accent-emerald/10 rounded-full flex items-center justify-center mb-6">
                <span className="text-accent-emerald font-bold text-xl">3</span>
              </div>
              <h3 className="font-bold text-gray-900 mb-3">Secure Release</h3>
              <p className="text-sm text-gray-600">Funds are released to the landlord only upon successful key handoff.</p>
            </div>
          </div>
        </section>

        {/* Why SafeMove */}
        <section className="mb-20">
          <div className="bg-navy-base rounded-2xl p-10 text-white shadow-ambient">
            <h2 className="text-2xl font-bold mb-6">Why SafeMove?</h2>
            <div className="space-y-4 text-white/90">
              <p>
                The real estate market in areas like East Legon, Kumasi, and Tema has seen a rise in sophisticated fraud. SafeMove is designed to eliminate these risks entirely.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-4">
                <li><strong>Stops Rental Scams:</strong> Your money is held safely until you have confirmed access to the property.</li>
                <li><strong>Prevents Fake Landlord Fraud:</strong> We verify the legal title and identity of the property owner before any transaction proceeds.</li>
                <li><strong>Ends Double-Allocation:</strong> Eliminates the risk of a landlord taking rent from multiple tenants for the same property.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Waitlist */}
        <section>
          <div className="bg-white rounded-2xl p-10 text-center shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <div className="inline-block bg-accent-emerald/10 text-accent-emerald px-4 py-1.5 rounded-full text-sm font-bold mb-6">
              Coming Soon
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-navy-base mb-4">
              SafeMove Escrow Is Coming Soon
            </h2>
            <p className="text-gray-600 mb-8">
              Be the first to experience worry-free property transactions. Join our exclusive early access waitlist today.
            </p>
            
            <form className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl mx-auto w-full" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email address" 
                className="flex-1 px-4 py-3 rounded-md border border-gray-200 focus:outline-none focus:border-navy-base focus:ring-1 focus:ring-navy-base text-gray-900 w-full"
                required
              />
              <button 
                type="submit"
                className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 px-8 rounded-md transition-colors whitespace-nowrap"
              >
                Join Early Access
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
