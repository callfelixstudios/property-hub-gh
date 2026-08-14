import Footer from "@/components/Footer";

export const metadata = {
  title: "Cookie & Local Storage Policy | Property Hub Ghana",
  description: "Learn how Property Hub Ghana uses cookies and browser local storage to deliver secure authentication, preferences, and fast performance.",
};

export default function CookiePolicyPage() {
  return (
    <>
      <div className="min-h-screen bg-slate-50 pt-16 flex flex-col">
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-base tracking-tight mb-2">
              Cookie & Local Storage Policy
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Property Hub Ghana</span>
              <span>•</span>
              <span>Effective Date: 6 August 2026</span>
              <span>•</span>
              <span>Last Updated: 6 August 2026</span>
            </div>
          </div>

          <div className="prose prose-slate max-w-none space-y-8 text-slate-700 text-base leading-relaxed">
            <p>
              This policy explains how Property Hub Ghana uses cookies and browser storage technologies when you visit our website or use our web applications. It serves as a technical companion to our <a href="/privacy" className="text-accent-emerald hover:underline font-semibold">Privacy Policy</a>.
            </p>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Understanding Cookies and Local Storage
              </h2>
              <p>
                <strong>Cookies:</strong> Small text snippets stored by your browser when visiting a website. They allow the platform to recognize your session as you navigate between pages, keeping you logged in securely.
              </p>
              <p>
                <strong>Local Storage:</strong> A modern browser storage feature that lets web applications save client-side preferences (such as selected currency or active search filters) directly on your device without transmitting data back and forth on every request.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                What We Store and Why
              </h2>
              
              <h3 className="text-lg font-semibold text-navy-base pt-2">1. Essential Security & Authentication</h3>
              <p>
                Strictly necessary for operating the platform. These store your active session tokens and CSRF security tokens to keep you logged in and protect forms from unauthorized tampering. Session tokens expire upon closing your browser, while login refresh tokens persist for up to 30 days.
              </p>

              <h3 className="text-lg font-semibold text-navy-base pt-2">2. Preferences & UI Customization</h3>
              <p>
                Remembers your chosen settings across visits, such as:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Currency display preference (GHS ₵ vs. USD $)</li>
                <li>Filter selections (Region, Property Type, Lease Terms)</li>
                <li>View preferences (Grid layout vs. Map view)</li>
              </ul>

              <h3 className="text-lg font-semibold text-navy-base pt-2">3. Performance & Analytics</h3>
              <p>
                We use lightweight, aggregated performance tokens to measure page load speeds and search response times to keep Property Hub Ghana fast and reliable.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                No Third-Party Advertising Trackers
              </h2>
              <p>
                Property Hub Ghana does not use invasive third-party ad trackers or cross-site behavioral marketing cookies. The only external services with browser storage footprints are functional infrastructure partners required to operate authentication and SMS/WhatsApp notification delivery. We do run Google Analytics in aggregate, privacy-friendly mode to understand general page performance and traffic levels — it does not track you across other websites and is never used for advertising.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Managing Cookie Settings
              </h2>
              <p>
                You can adjust or disable cookies directly in your browser settings:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Google Chrome:</strong> Settings → Privacy and Security → Third-party cookies</li>
                <li><strong>Mozilla Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Apple Safari:</strong> Preferences → Privacy → Block all cookies</li>
              </ul>
              <p className="text-sm text-slate-500 pt-2">
                Note: Disabling essential authentication cookies will prevent you from logging in, accessing dashboards, or managing property listings.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-200 pt-6">
              <h2 className="text-xl font-bold text-navy-base">
                Contact Support
              </h2>
              <p>
                If you have questions regarding our cookie practices:
              </p>
              <p className="font-semibold text-navy-base">
                Email: <a href="mailto:support@propertyhubgh.com" className="text-accent-emerald hover:underline">support@propertyhubgh.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
      </div>
      <Footer />
    </>
  );
}
