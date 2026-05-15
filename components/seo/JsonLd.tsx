// components/seo/JsonLd.tsx — Server Component
// JSON-LD Script 注入（nonce 屬性確保 CSP 相容）

import { serializeJsonLd } from "@/lib/seo/json-ld";

interface Props {
  data: Record<string, unknown>;
  nonce?: string;
}

export default function JsonLd({ data, nonce }: Props) {
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
