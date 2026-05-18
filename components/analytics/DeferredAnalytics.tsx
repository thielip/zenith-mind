"use client";

import Script from "next/script";

interface LazyGa4Props {
  gaId: string;
  nonce?: string;
}

/** GA4：lazyOnload，避免阻塞 LCP / TBT */
export function LazyGoogleAnalytics({ gaId, nonce }: LazyGa4Props) {
  return (
    <>
      <Script
        id="ga4-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
        strategy="lazyOnload"
        nonce={nonce}
      />
      <Script id="ga4-init" strategy="lazyOnload" nonce={nonce}>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}

interface LazyGtmProps {
  gtmId: string;
  nonce?: string;
}

export function LazyGoogleTagManager({ gtmId, nonce }: LazyGtmProps) {
  return (
    <>
      <Script id="gtm-init" strategy="lazyOnload" nonce={nonce}>
        {`
          (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
