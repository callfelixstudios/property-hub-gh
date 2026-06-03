import SearchWidget from "@/components/SearchWidget";
import PropertyCard from "@/components/PropertyCard";
import Link from "next/link";

export default function Home() {
  return (
    <div className="w-full">
      {/* BLOCK 1: Hero Section */}
      <section className="w-full bg-surface-primary pt-16 pb-20 px-6">
        <div className="max-w-container-max mx-auto text-center flex flex-col items-center">
          <h1 className="text-4xl md:text-6xl font-extrabold text-navy-base leading-tight tracking-tight mb-6">
            Secure Your Next Space in Ghana.
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-12 leading-relaxed">
            Verified listings, transparent terms, and zero agent duplication. Search rentals and properties for sale across Accra, Kumasi, and beyond.
          </p>
          <div className="w-full max-w-3xl">
            <SearchWidget />
          </div>
        </div>
      </section>

      {/* BLOCK 2: Dual-Gateway Core */}
      <section className="w-full bg-white py-16 px-6">
        <div className="max-w-container-max mx-auto grid md:grid-cols-2 gap-6 md:gap-8">
          
          {/* Rent Gateway */}
          <div className="bg-surface-primary p-8 md:p-10 rounded-md shadow-ambient border border-gray-100 flex flex-col items-start hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-navy-base rounded-full flex items-center justify-center text-white mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-navy-base mb-4">Browse Spaces for Rent</h2>
            <ul className="text-gray-600 space-y-3 mb-8 flex-grow">
              <li className="flex items-center gap-2"><span className="text-accent-emerald">✓</span> Student Hostels & Single Rooms</li>
              <li className="flex items-center gap-2"><span className="text-accent-emerald">✓</span> Chamber & Halls / Apartments</li>
              <li className="flex items-center gap-2"><span className="text-accent-emerald">✓</span> Verified Rent Advances</li>
            </ul>
            <Link href="/rentals" className="mt-auto px-8 py-3 bg-navy-base text-white font-bold rounded-sm hover:bg-navy-light transition-colors shadow-sm inline-block">
              View Rentals &rarr;
            </Link>
          </div>

          {/* Sale Gateway */}
          <div className="bg-surface-primary p-8 md:p-10 rounded-md shadow-ambient border border-gray-100 flex flex-col items-start hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-accent-gold rounded-full flex items-center justify-center text-navy-base mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-navy-base mb-4">Browse Properties for Sale</h2>
            <ul className="text-gray-600 space-y-3 mb-8 flex-grow">
              <li className="flex items-center gap-2"><span className="text-accent-emerald">✓</span> Litigation-Free Land Plots</li>
              <li className="flex items-center gap-2"><span className="text-accent-emerald">✓</span> Uncompleted & Complete Estates</li>
              <li className="flex items-center gap-2"><span className="text-accent-emerald">✓</span> Direct Developer Access</li>
            </ul>
            <Link href="/sales" className="mt-auto px-8 py-3 bg-navy-base text-white font-bold rounded-sm hover:bg-navy-light transition-colors shadow-sm inline-block">
              View Sales &rarr;
            </Link>
          </div>
          
        </div>
      </section>

      {/* BLOCK 3: SafeMove Value Proposition */}
      <section className="w-full bg-accent-emerald/10 py-16 px-6 border-y border-accent-emerald/20">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="md:w-2/3">
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-accent-emerald text-white text-xs font-bold px-2 py-1 rounded-sm uppercase tracking-wider">Trust Builder</span>
              <h2 className="text-2xl md:text-3xl font-bold text-navy-base">Introducing SafeMove</h2>
            </div>
            <p className="text-lg text-navy-base/80 leading-relaxed">
              Tired of fake agents and double-rented apartments? Look for the SafeMove badge. We hold your rent advance securely in escrow and only release it to the lister after you successfully move in.
            </p>
          </div>
          <div className="md:w-1/3 flex md:justify-end w-full">
            <Link href="/safemove" className="w-full md:w-auto text-center px-8 py-4 border-2 border-navy-base text-navy-base font-bold rounded-sm hover:bg-navy-base hover:text-white transition-colors">
              How SafeMove Protects You
            </Link>
          </div>
        </div>
      </section>

      {/* BLOCK 4: Dynamic Featured Grid */}
      <section className="w-full bg-surface-primary py-20 px-6">
        <div className="max-w-container-max mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-navy-base mb-2">Freshly Added</h2>
              <p className="text-gray-600">The latest verified listings across Ghana.</p>
            </div>
            <Link href="/search" className="hidden md:inline-flex items-center text-navy-base font-bold hover:underline">
              View all listings &rarr;
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* 6 Property Skeletons */}
            <PropertyCard isFeatured={true} />
            <PropertyCard />
            <PropertyCard />
            <PropertyCard isFeatured={true} />
            <PropertyCard />
            <PropertyCard />
          </div>

          <div className="mt-8 text-center md:hidden">
            <Link href="/search" className="inline-block px-6 py-3 bg-white border border-gray-200 text-navy-base font-bold rounded-sm shadow-sm">
              View all listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
