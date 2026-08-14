"use client";

import { GoogleAnalytics } from "@next/third-parties/google";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const CONSENT_BOOTSTRAP = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
var phConsent = (document.cookie.match(/(?:^|; )ph_consent=([^;]*)/) || [])[1];
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: phConsent === 'granted' ? 'granted' : 'denied'
});
`;

export default function Analytics() {
  if (!GA_ID) return null;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CONSENT_BOOTSTRAP }} />
      <GoogleAnalytics gaId={GA_ID} />
    </>
  );
}
