import Footer from "@/components/Footer";

export const metadata = {
  title: "Privacy Policy | Property Hub Ghana",
  description: "Privacy Policy outlining how Property Hub Ghana collects, processes, and protects your personal data under Ghanaian law.",
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <div className="min-h-screen bg-slate-50 pt-16 flex flex-col">
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-base tracking-tight mb-2">
              Privacy Policy
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
              Property Hub Ghana takes your privacy seriously. Because a real estate platform handles personal contact details and identification documents, we maintain clear standards for how your data is collected, stored, and protected under Ghanaian law.
            </p>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Legal Framework
              </h2>
              <p>
                This policy is designed to comply with:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>
                  <strong>Article 18(2) of the 1992 Constitution of Ghana</strong>, which protects individual privacy rights across digital communications and online data.
                </li>
                <li>
                  <strong>The Data Protection Act, 2012 (Act 843)</strong>, which establishes key data processing principles including accountability, purpose specification, security safeguards, and data subject rights.
                </li>
              </ul>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Information We Collect
              </h2>
              <p>
                We collect only the essential information needed to operate a secure real estate directory:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Account Information:</strong> Name, email address, and mobile phone number. Local numbers (e.g. 024XXXXXXX) are converted to E.164 international format (+23324XXXXXXX) for SMS routing.</li>
                <li><strong>Verification (KYC) Documents:</strong> Government-issued photo ID, business registration certificates (from RGD or CAGD), and site plans submitted for agent or developer verification.</li>
                <li><strong>Listings & Activity:</strong> Property photos, descriptions, floor plans, search preferences, saved properties, and subscription records.</li>
                <li><strong>Technical Data:</strong> IP address, browser type, authentication session tokens, and security logs.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Handling Sensitive Documents
              </h2>
              <p>
                Verification documents (such as identification copies and corporate registration certificates) receive heightened security. They are stored in private cloud storage without public web addresses.
              </p>
              <p>
                Only authorized staff reviewing verification applications can view these files using temporary, time-limited access tokens that expire after review.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Communication & Messaging
              </h2>
              <p>
                We use your phone number to send login OTPs, listing approval notices, and messages from prospective clients through our SMS and WhatsApp partners (Moolre and Hubtel).
              </p>
              <p>
                We do not sell, rent, or trade phone numbers to third-party telemarketers or advertisers.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Internal Security & Audit Logs
              </h2>
              <p>
                To maintain transparency and prevent unauthorized changes, all administrative actions on the platform are logged into an append-only audit trail. This tracks what changed, who changed it, and when.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Your Rights Under Act 843
              </h2>
              <p>
                Under the Data Protection Act, 2012 (Act 843), you have the right to:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Access (Section 35):</strong> Request a copy of the personal data we hold about you.</li>
                <li><strong>Rectification (Section 40):</strong> Ask us to correct inaccurate or outdated information.</li>
                <li><strong>Erasure (Section 40):</strong> Request deletion of your data when there is no legal obligation to retain it.</li>
                <li><strong>Objection (Section 39):</strong> Object to processing for direct marketing or specific personal reasons.</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Data Sharing & Service Partners
              </h2>
              <p>
                We do not sell personal data. We share necessary data only with trusted infrastructure providers required to operate the service:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li><strong>Supabase Inc.</strong> (Database infrastructure & secure file storage)</li>
                <li><strong>Moolre & Hubtel</strong> (SMS/WhatsApp gateway and payment processing)</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Data Retention
              </h2>
              <p>
                We retain personal data only as long as necessary to provide platform services, complete verification reviews, or meet Ghanaian accounting and legal obligations. Data that is no longer required is deleted or anonymized.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-200 pt-6">
              <h2 className="text-xl font-bold text-navy-base">
                Contact Data Protection Officer
              </h2>
              <p>
                To exercise your rights or ask questions about data privacy, contact our Data Protection Officer:
              </p>
              <p className="font-semibold text-navy-base">
                Email: <a href="mailto:privacy@propertyhubgh.com" className="text-accent-emerald hover:underline">privacy@propertyhubgh.com</a>
              </p>
              <p className="text-sm text-slate-500">
                Address: Property Hub Ghana, Tumu Road, Kanda, Accra, Ghana
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
