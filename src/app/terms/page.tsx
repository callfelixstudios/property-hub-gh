import Footer from "@/components/Footer";

export const metadata = {
  title: "Terms of Service | Property Hub Ghana",
  description: "Terms of Service governing your access and use of Property Hub Ghana real estate platform.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <div className="min-h-screen bg-slate-50 pt-16 flex flex-col">
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-16">
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-base tracking-tight mb-2">
              Terms of Service
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
              These Terms of Service govern your access to and use of Property Hub Ghana at propertyhubgh.com, along with our web applications, portals, and related services.
            </p>
            <p>
              By creating an account, verifying your phone number, browsing listings, or uploading property content on Property Hub Ghana, you agree to these Terms. If you do not agree, please do not use the platform.
            </p>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Legal Basis of This Agreement
              </h2>
              <p>
                These Terms form a binding contract under the laws of the Republic of Ghana, specifically the <strong>Electronic Transactions Act, 2008 (Act 772)</strong>, which recognizes electronic records, signatures, and contracts as legally valid.
              </p>
              <p>
                When you register an account, confirm your phone number via a One-Time Password (OTP), or upload a property listing, you consent to enter this agreement electronically. We process personal data under the <strong>Data Protection Act, 2012 (Act 843)</strong> — see our <a href="/privacy" className="text-accent-emerald hover:underline font-semibold">Privacy Policy</a> for details.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                What Property Hub Ghana Is, and What It Is Not
              </h2>
              <p>
                Property Hub Ghana is a marketplace. We connect property seekers with agents, brokers, agencies, and developers listing properties for sale or rent.
              </p>
              <p>
                We do not own the properties listed on the platform. We do not hold or verify land title documents or conduct physical site inspections as a routine matter, except where a listing carries our &quot;Verified Developer/Agency&quot; badge (which indicates we reviewed identity and business documents, not land title ownership).
              </p>
              <p>
                Before committing funds to any property transaction, we strongly urge you to complete your own independent due diligence, including a title search at the Lands Commission of Ghana. Online listings are not a substitute for formal legal and physical property verification.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Creating an Account
              </h2>
              <p>
                You may sign up using an email address or a Ghanaian mobile number. If you register with a local number (e.g. 024XXXXXXX), our system formats it into standard E.164 format (+23324XXXXXXX) for authentication.
              </p>
              <p>
                Account verification codes and alerts are delivered via SMS and WhatsApp through our messaging partners. You are responsible for keeping your login credentials secure and for any activity under your account. Notify us immediately if you suspect unauthorized access.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Verification of Agents, Brokers, and Developers
              </h2>
              <p>
                To earn a &quot;Verified Badge&quot; on your listings, you must complete our verification process. Depending on your business status, you will need to submit:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>A valid government-issued photo ID (for individual brokers)</li>
                <li>Business registration certificates from the Registrar General&apos;s Department or CAGD (for developers and agencies)</li>
                <li>Proof of membership in professional bodies like GREDA or GREPA, where applicable</li>
              </ul>
              <p>
                We store these sensitive documents in private, access-controlled digital storage. They are never publicly indexed or accessible to search engines, and are only viewed by authorized staff using time-limited tokens during verification reviews.
              </p>
              <p>
                Submitting fraudulent identity documents or fake credentials will result in immediate account suspension, removal of listings, and potential reporting to law enforcement authorities.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Listing Content Rules
              </h2>
              <p>
                We moderate property listings to maintain directory trust. The following are prohibited:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>&quot;Ghost listings&quot; — unavailable, sold, let, or non-existent properties</li>
                <li>Misleading, deceptive, or unrealistic pricing</li>
                <li>Duplicate submissions or unauthorized reposts of existing listings</li>
                <li>Media copied from competing platforms or containing external logos/watermarks</li>
              </ul>
              <p>
                Listings can be for long-term leases or short-term stays (daily, weekly, or monthly). If you offer short-term stays, you must honor advertised availability and booking rates.
              </p>
              <p>
                By uploading photos, video walkthroughs, or floor plans, you grant Property Hub Ghana a non-exclusive, worldwide license to display and distribute that media across the platform while your listing remains active. You retain full ownership of your media.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Subscriptions, Listing Boosts, and Payment
              </h2>
              <p>
                Paid features — such as subscription plans, listing boosts, and featured placements — are processed securely via Mobile Money and card payments through our payment partners.
              </p>
              <p>
                Fees for delivered boosts or completed subscription periods are non-refundable, except where required by Ghanaian law or approved following an internal case review.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Internal Audit Logs and System Security
              </h2>
              <p>
                Every administrative action — such as approving an account, reviewing a listing, or changing verification status — is automatically recorded in an immutable internal audit ledger. This log tracks previous and new values, timestamps, and staff account IDs.
              </p>
              <p>
                Administrative access is strictly restricted to verified corporate accounts (@propertyhubgh.com) to protect platform integrity and prevent unauthorized modifications.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Limitation of Liability
              </h2>
              <p>
                The platform is provided &quot;as is&quot; and &quot;as available&quot;. Property Hub Ghana acts as an intermediary directory and is not a party to offline property agreements between buyers, tenants, agents, or developers.
              </p>
              <p>
                In accordance with <strong>Section 93 of the Electronic Transactions Act, 2008 (Act 772)</strong>, Property Hub Ghana is not liable for losses arising from offline real estate transactions, land ownership disputes, or misrepresentations made by listing creators. Nothing in these terms limits liability that cannot be excluded under Ghanaian law.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Governing Law and Dispute Resolution
              </h2>
              <p>
                These Terms are governed by the laws of the Republic of Ghana. Any legal disputes connected with these Terms fall under the exclusive jurisdiction of the courts of Ghana.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-200 pt-6">
              <h2 className="text-xl font-bold text-navy-base">
                Contact Us
              </h2>
              <p>
                If you have questions about these Terms of Service, reach out to our Legal Department at:
              </p>
              <p className="font-semibold text-navy-base">
                Email: <a href="mailto:legal@propertyhubgh.com" className="text-accent-emerald hover:underline">legal@propertyhubgh.com</a>
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
