import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-navy-base text-white">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          {/* Brand Column */}
          <div>
            <h3 className="text-lg font-bold mb-4">Property Hub Ghana</h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              We&apos;re on a mission to bring real estate in Ghana to a global
              standard. Full verification, zero fraud, and transparent
              transactions for every listing.
            </p>
            <div className="flex items-center gap-4">
              {/* Facebook */}
              <a href="https://www.facebook.com/prophub.gh" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
                </svg>
              </a>
              {/* Instagram */}
              <a href="https://www.instagram.com/propertyhub.gh/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
              </a>
              {/* TikTok */}
              <a href="https://www.tiktok.com/@propertyhub.gh" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="TikTok">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.63 4.14.97 1.08 2.3 1.83 3.75 2.1v3.91c-1.28-.02-2.52-.43-3.61-1.12-.66-.41-1.23-.96-1.68-1.61v6.33c.02 2.22-1.16 4.31-3.07 5.43-1.87 1.13-4.26 1.25-6.24.32-2.07-.94-3.56-3.03-3.8-5.3-.29-2.73 1.5-5.36 4.17-5.97.87-.2 1.77-.2 2.64-.01v3.96c-.84-.25-1.77-.12-2.5.37-.8.52-1.21 1.47-1.13 2.42.06.91.73 1.72 1.61 1.96.94.27 2-.04 2.58-.8.36-.45.54-1.02.53-1.59V.02z" />
                </svg>
              </a>
              {/* Twitter/X */}
              <a href="https://x.com/propertyhub_gh" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/careers" className="text-sm text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link href="/agents" className="text-sm text-gray-400 hover:text-white transition-colors">Agents / Pros</Link></li>
              <li><Link href="/scout" className="text-sm text-gray-400 hover:text-white transition-colors">The Scout Program</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Resources</h4>
            <ul className="space-y-3">
              <li><Link href="/guides/buying" className="text-sm text-gray-400 hover:text-white transition-colors">Home Buying Fundamentals</Link></li>
              <li><Link href="/guides/mortgage" className="text-sm text-gray-400 hover:text-white transition-colors">Mortgage FAQs</Link></li>
              <li><Link href="/insights" className="text-sm text-gray-400 hover:text-white transition-colors">Market Trends</Link></li>
              <li><Link href="/help" className="text-sm text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-300 mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="text-sm text-gray-400">Tumu Road, Kanda</li>
              <li className="text-sm text-gray-400">Accra, Ghana</li>
              <li>
                <a href="mailto:hello@propertyhubgh.com" className="text-sm text-gray-400 hover:text-white transition-colors">
                  hello@propertyhubgh.com
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-500">
            &copy; 2026 Property Hub Ghana. All rights reserved. Built in High-Trust Compliance.
          </p>
          <div className="flex flex-wrap items-center gap-6">
            <Link href="/terms" className="text-xs text-gray-500 hover:text-white transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="text-xs text-gray-500 hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="/cookie-policy" className="text-xs text-gray-500 hover:text-white transition-colors">Cookie Policy</Link>
            <Link href="/copyright" className="text-xs text-gray-500 hover:text-white transition-colors">Copyright Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
