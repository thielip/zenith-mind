import type { AboutSectionData } from "@/lib/site/types";

/** 公版隱私權政策（繁中／英文），可在後台【全站設定】編輯 */
export const DEFAULT_PRIVACY_POLICY_SECTIONS: AboutSectionData[] = [
  {
    id: "privacy-intro",
    title: "簡介",
    titleEn: "Introduction",
    body: "歡迎使用巔峰思維（Zenith Mind，網址：https://www.getzenithmind.com，以下稱「本網站」）。我們重視您的隱私。本隱私權政策說明我們如何收集、使用、保存與保護您的個人資料，以及您可行使的權利。使用本網站即表示您已閱讀並理解本政策。",
    bodyEn:
      "Welcome to Zenith Mind (https://www.getzenithmind.com, the \"Site\"). We respect your privacy. This Privacy Policy explains what personal data we collect, how we use it, whether we share it with third parties, and how you can request access or deletion. By using the Site, you acknowledge this policy.",
    sortOrder: 0,
  },
  {
    id: "privacy-collect",
    title: "我們收集的資料",
    titleEn: "Information We Collect",
    body: "依您與本網站互動的方式，我們可能收集：\n（1）您主動提供的資料：例如姓名、電子郵件地址、留言或聯絡表單內容、訂閱資訊。\n（2）自動收集的資料：例如 IP 位址、瀏覽器類型、裝置資訊、造訪頁面、參照來源、Cookie 與類似技術產生的識別碼。\n（3）分析與行銷工具資料：若您同意 Cookie，我們可能透過 Google Analytics 等服務了解網站使用情形，以改善內容與體驗。",
    bodyEn:
      "Depending on how you interact with the Site, we may collect:\n(1) Information you provide: such as your name, email address, messages or contact form content, and subscription details.\n(2) Automatically collected data: such as IP address, browser type, device information, pages visited, referral source, and identifiers from cookies or similar technologies.\n(3) Analytics data: if you consent to cookies, we may use services such as Google Analytics to understand how the Site is used and to improve content and experience.",
    sortOrder: 1,
  },
  {
    id: "privacy-use",
    title: "資料的使用方式",
    titleEn: "How We Use Information",
    body: "我們將資料用於：提供與維運網站服務；回覆您的詢問；寄送您同意接收的電子報或通知；分析流量與內容成效；防制濫用、詐欺與資安事件；遵守法律義務；以及改善使用者體驗與內容品質。我們不會在未取得適當法律依據或您同意的情況下，將您的個人資料用於與上述目的顯著無關的用途。",
    bodyEn:
      "We use personal data to: operate and maintain the Site; respond to your inquiries; send newsletters or notices you have opted into; analyze traffic and content performance; prevent abuse, fraud, and security incidents; comply with legal obligations; and improve user experience and content quality. We do not use your data for materially unrelated purposes without a proper legal basis or your consent.",
    sortOrder: 2,
  },
  {
    id: "privacy-share",
    title: "第三方分享與服務供應商",
    titleEn: "Sharing and Service Providers",
    body: "我們不會出售您的個人資料。我們可能在必要範圍內，與協助營運網站的服務供應商分享資料，例如：主機／雲端（如 Vercel、Cloudflare）、資料庫（如 Supabase／Neon）、電子郵件寄送、分析（如 Google Analytics）、錯誤監控（如 Sentry）等。這些供應商僅能依我們指示處理資料，並須採取合理安全措施。若法律要求或為保護本網站、使用者或公眾之合法權益，我們亦可能依法揭露資料。",
    bodyEn:
      "We do not sell your personal data. We may share information with service providers that help us operate the Site, such as hosting (e.g., Vercel, Cloudflare), databases (e.g., Supabase/Neon), email delivery, analytics (e.g., Google Analytics), and error monitoring (e.g., Sentry). These providers process data only on our instructions and must use reasonable security measures. We may also disclose information when required by law or to protect the Site, users, or the public.",
    sortOrder: 3,
  },
  {
    id: "privacy-retention",
    title: "資料保存期間",
    titleEn: "Data Retention",
    body: "我們僅在達成收集目的所需期間內保存您的資料，或依法律規定保存更長時間。當資料不再需要時，我們將刪除或匿名化處理，除非法律另有要求。",
    bodyEn:
      "We retain personal data only as long as needed for the purposes described above or as required by law. When data is no longer needed, we delete or anonymize it unless a longer retention period is legally required.",
    sortOrder: 4,
  },
  {
    id: "privacy-rights",
    title: "您的權利與刪除請求",
    titleEn: "Your Rights and Deletion Requests",
    body: "依適用法律（例如 GDPR、CCPA 或台灣個人資料保護法），您可能享有查詢、閱覽、複製、更正、限制處理、反對處理或刪除個人資料等權利。若您希望存取、更正或刪除我們持有的您的個人資料，或撤回同意，請透過本網站「聯絡我們」頁面或頁尾所列方式與我們聯繫，並說明您的請求。我們將在合理期限內回覆；若需驗證身分，可能請您提供必要資訊。",
    bodyEn:
      "Depending on applicable law (such as GDPR, CCPA, or local privacy laws), you may have rights to access, correct, copy, restrict, object to, or delete your personal data, or to withdraw consent. To access, correct, or delete your data, contact us via the Site's contact options or the email listed in the footer. We will respond within a reasonable time and may ask you to verify your identity.",
    sortOrder: 5,
  },
  {
    id: "privacy-cookies",
    title: "Cookie 與類似技術",
    titleEn: "Cookies and Similar Technologies",
    body: "本網站使用 Cookie 及類似技術以維持基本功能、記住偏好，並在您同意時進行分析。您可透過瀏覽器設定管理 Cookie，或透過網站上的 Cookie 同意橫幅調整偏好。停用部分 Cookie 可能影響某些功能。",
    bodyEn:
      "The Site uses cookies and similar technologies for essential functionality, preferences, and—where you consent—analytics. You can manage cookies in your browser settings or through our cookie consent banner. Disabling some cookies may affect certain features.",
    sortOrder: 6,
  },
  {
    id: "privacy-changes",
    title: "政策更新",
    titleEn: "Changes to This Policy",
    body: "我們可能不定期更新本政策。更新後的版本將公布於本頁並註明生效日期。建議您定期查閱。若變更涉及重大權利影響，我們將以適當方式通知您。",
    bodyEn:
      "We may update this Privacy Policy from time to time. The current version will be posted on this page with an updated effective date. We encourage you to review it periodically. If changes materially affect your rights, we will notify you in an appropriate manner.",
    sortOrder: 7,
  },
  {
    id: "privacy-contact",
    title: "聯絡我們",
    titleEn: "Contact Us",
    body: "若對本隱私權政策或個人資料處理有任何疑問，請透過本網站聯絡管道與巔峰思維（Zenith Mind）聯繫。",
    bodyEn:
      "If you have questions about this Privacy Policy or our data practices, please contact Zenith Mind through the contact options on the Site.",
    sortOrder: 8,
  },
];

/** 公版服務條款（繁中／英文），可在後台【全站設定】編輯 */
export const DEFAULT_TERMS_OF_SERVICE_SECTIONS: AboutSectionData[] = [
  {
    id: "terms-accept",
    title: "接受條款",
    titleEn: "Acceptance of Terms",
    body: "歡迎使用巔峰思維（Zenith Mind）網站（https://www.getzenithmind.com）。存取或使用本網站，即表示您同意遵守本服務條款。若您不同意，請勿使用本網站。",
    bodyEn:
      "Welcome to the Zenith Mind website (https://www.getzenithmind.com). By accessing or using the Site, you agree to these Terms of Service. If you do not agree, do not use the Site.",
    sortOrder: 0,
  },
  {
    id: "terms-use",
    title: "網站使用規則",
    titleEn: "Use of the Website",
    body: "您同意僅以合法方式使用本網站，不得：\n（1）上傳或散布惡意程式、垃圾訊息或違法內容；\n（2）嘗試未經授權存取系統、帳號或資料；\n（3）干擾網站正常運作或他人使用；\n（4）以自動化方式過度抓取內容，致影響服務穩定；\n（5）冒充他人或誤導他人關於您身分的資訊。\n我們保留拒絕服務、暫停或終止違規使用者存取之權利。",
    bodyEn:
      "You agree to use the Site lawfully and not to: (1) upload or distribute malware, spam, or illegal content; (2) attempt unauthorized access to systems, accounts, or data; (3) interfere with the Site or other users; (4) scrape content in a way that harms service stability; (5) impersonate others or misrepresent your identity. We may refuse service or suspend access for violations.",
    sortOrder: 1,
  },
  {
    id: "terms-ip",
    title: "智慧財產權",
    titleEn: "Intellectual Property",
    body: "本網站上的文章、圖片、標誌、版面設計、程式碼及其他內容，除另有註明外，其著作權與相關權利均屬巔峰思維或其授權人所有。您得為個人、非商業之合理閱讀與分享而使用；未經書面同意，不得重製、改作、公開播送、販售或作為商業用途之大量再利用。若您認為本網站內容侵害您的權利，請與我們聯繫。",
    bodyEn:
      "Articles, images, logos, layout, code, and other content on the Site are owned by Zenith Mind or its licensors unless otherwise noted. You may view and share content for personal, non-commercial use. You may not reproduce, modify, publicly perform, sell, or commercially redistribute content without written permission. If you believe content infringes your rights, contact us.",
    sortOrder: 2,
  },
  {
    id: "terms-disclaimer",
    title: "免責聲明",
    titleEn: "Disclaimer",
    body: "本網站內容（含投資、理財、AI、科技等主題）僅供一般資訊與教育用途，不構成法律、稅務、投資或其他專業建議。您應自行判斷並承擔依內容所為決策之風險。本網站以「現狀」提供，我們不保證內容完整、即時、無錯誤或服務不中斷。",
    bodyEn:
      "Content on the Site (including investing, finance, AI, and technology topics) is for general information and education only and is not legal, tax, investment, or other professional advice. You are responsible for decisions you make based on the content. The Site is provided \"as is\" without warranties of completeness, timeliness, accuracy, or uninterrupted service.",
    sortOrder: 3,
  },
  {
    id: "terms-liability",
    title: "責任限制",
    titleEn: "Limitation of Liability",
    body: "在法律允許的最大範圍內，巔峰思維及其營運者對因使用或無法使用本網站所生之任何間接、附帶、特殊、懲罰性或衍生性損害不負責任，包括但不限於利潤損失、資料遺失或業務中斷。我們對您之總賠償責任，以您於相關事件發生前十二個月內為使用付費服務所支付之金額為上限（若無付費則為零），除非法律另有強制規定。",
    bodyEn:
      "To the fullest extent permitted by law, Zenith Mind and its operators are not liable for indirect, incidental, special, punitive, or consequential damages arising from use or inability to use the Site, including lost profits, data loss, or business interruption. Our total liability is limited to amounts you paid for paid services in the twelve months before the event (or zero if none), unless mandatory law provides otherwise.",
    sortOrder: 4,
  },
  {
    id: "terms-links",
    title: "第三方連結與聯盟連結",
    titleEn: "Third-Party and Affiliate Links",
    body: "本網站可能包含指向第三方網站或聯盟行銷連結。我們不控制第三方網站，亦不對其內容、隱私做法或服務負責。您與第三方之互動由您自行承擔風險。",
    bodyEn:
      "The Site may include links to third-party websites or affiliate links. We do not control third-party sites and are not responsible for their content, privacy practices, or services. Your interactions with third parties are at your own risk.",
    sortOrder: 5,
  },
  {
    id: "terms-termination",
    title: "終止服務",
    titleEn: "Termination",
    body: "我們得隨時修改、暫停或終止本網站之全部或部分功能，無須事先通知。若您違反本條款，我們得立即終止或限制您對本網站之存取。條款中依其性質應於終止後仍有效之條文（例如智慧財產權、免責聲明、責任限制）繼續有效。",
    bodyEn:
      "We may modify, suspend, or discontinue the Site or any part of it at any time without prior notice. If you violate these Terms, we may terminate or restrict your access immediately. Provisions that by nature should survive termination (such as intellectual property, disclaimers, and limitation of liability) remain in effect.",
    sortOrder: 6,
  },
  {
    id: "terms-law",
    title: "準據法與爭議",
    titleEn: "Governing Law",
    body: "本條款之解釋與適用，以中華民國法律為準據法（不含法律衝突法則），並以台灣台北地方法院為第一審管轄法院，除非強制法律另有規定。",
    bodyEn:
      "These Terms are governed by the laws of Taiwan (Republic of China), without regard to conflict-of-law rules, and disputes shall be subject to the jurisdiction of the Taipei District Court as the court of first instance, unless mandatory law provides otherwise.",
    sortOrder: 7,
  },
  {
    id: "terms-changes",
    title: "條款修訂",
    titleEn: "Changes to Terms",
    body: "我們可能更新本服務條款。更新後之條款公布於本頁後即生效（另有說明者除外）。您於修訂後繼續使用本網站，視為接受新條款。",
    bodyEn:
      "We may update these Terms. Updated Terms take effect when posted on this page unless stated otherwise. Continued use of the Site after changes constitutes acceptance of the new Terms.",
    sortOrder: 8,
  },
  {
    id: "terms-contact",
    title: "聯絡方式",
    titleEn: "Contact",
    body: "若對本服務條款有任何疑問，請透過本網站聯絡管道與我們聯繫。",
    bodyEn:
      "If you have questions about these Terms, please contact us through the Site's contact options.",
    sortOrder: 9,
  },
];
