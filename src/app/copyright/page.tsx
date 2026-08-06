import Footer from "@/components/Footer";

export const metadata = {
  title: "Copyright & Intellectual Property Policy | Property Hub Ghana",
  description: "Copyright and Intellectual Property Policy outlining content ownership and takedown procedures under Ghanaian law.",
};

export default function CopyrightPolicyPage() {
  return (
    <>
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-xl shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 pb-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-navy-base tracking-tight mb-2">
              Copyright & Intellectual Property Policy
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
              Real estate marketing relies heavily on quality photography, video walkthroughs, and architectural floor plans. This policy explains how Property Hub Ghana protects intellectual property rights, manages user-uploaded content, and handles notice-and-takedown requests under Ghanaian law.
            </p>
            <p>
              This policy is issued pursuant to the <strong>Copyright Act, 2005 (Act 690)</strong> and the <strong>Electronic Transactions Act, 2008 (Act 772)</strong>.
            </p>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Content Ownership
              </h2>
              <p>
                <strong>Platform Assets:</strong> Property Hub Ghana owns all software, source code, logos, branding, search algorithms, user interface designs, and administrative systems.
              </p>
              <p>
                <strong>User Media:</strong> You retain full ownership of property photos, videos, floor plans, and renders you upload. Uploading media to Property Hub Ghana does not transfer copyright ownership to us.
              </p>
              <p>
                <strong>Platform License:</strong> By uploading media, you grant Property Hub Ghana a non-exclusive, worldwide, royalty-free license to display, resize, and distribute the media solely for operating the property directory while your listing is active.
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Prohibited Content
              </h2>
              <p>
                Users may not upload:
              </p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Photos or floor plans copied from competing platforms without explicit authorization</li>
                <li>Images containing watermarks, logos, or phone numbers of other agencies</li>
                <li>Copyrighted architectural drawings or renders without permission from the creator</li>
              </ul>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Submitting a Takedown Notice
              </h2>
              <p>
                If you believe content on Property Hub Ghana infringes your copyright, you may submit a formal takedown notice under Act 690 and Act 772.
              </p>
              <p>Your notice must include:</p>
              <ul className="list-disc pl-6 space-y-1.5">
                <li>Description of the copyrighted work claimed to be infringed</li>
                <li>URL, Listing ID, or link to the infringing material on Property Hub Ghana</li>
                <li>Your contact information (name, address, phone number, and email)</li>
                <li>A statement that you are the copyright owner or authorized representative</li>
                <li>A good-faith statement that the use is unauthorized under Ghanaian law</li>
              </ul>
              <p className="pt-2">
                Send takedown notices to our Copyright Officer at: <a href="mailto:copyright@propertyhubgh.com" className="text-accent-emerald hover:underline font-semibold">copyright@propertyhubgh.com</a>
              </p>
            </section>

            <section className="space-y-3 pt-4">
              <h2 className="text-xl font-bold text-navy-base border-b border-slate-100 pb-2">
                Takedown Procedure & Counter-Notices
              </h2>
              <p>
                Upon receiving a valid takedown notice, we remove the challenged content from public view and record the action in our internal audit log.
              </p>
              <p>
                The uploader is given <strong>10 business days</strong> to submit a counter-notice with proof of ownership or authorization. If valid proof is provided, content may be restored; otherwise, the removal remains permanent.
              </p>
              <p>
                Accounts engaging in repeat copyright violations will be terminated and their verification status revoked.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-slate-200 pt-6">
              <h2 className="text-xl font-bold text-navy-base">
                Contact Copyright Team
              </h2>
              <p>
                For copyright inquiries or intellectual property questions:
              </p>
              <p className="font-semibold text-navy-base">
                Email: <a href="mailto:copyright@propertyhubgh.com" className="text-accent-emerald hover:underline">copyright@propertyhubgh.com</a>
              </p>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
