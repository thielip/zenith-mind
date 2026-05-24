"use client";

import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Eye, Plus, Save, Trash2 } from "lucide-react";
import {
  saveHeroSlidesAction,
  saveHomeCarouselItemsAction,
  updateSiteSettingsAction,
} from "@/actions/site.actions";
import CmsAccordionSection from "@/components/admin/CmsAccordionSection";
import LegalHtmlCmsEditor from "@/components/admin/LegalHtmlCmsEditor";
import ExternalImageUrlField from "@/components/admin/ExternalImageUrlField";
import SortableList from "@/components/admin/SortableList";
import HeroSlider from "@/components/home/HeroSlider";
import type {
  HeroSlideData,
  HomeCarouselItemData,
  QuickLinkItem,
  SiteLocale,
  SiteSettingsData,
  HomepageCopy,
  AboutSectionData,
  TopicClusterCardCopy,
} from "@/lib/site/types";
import type { ActionError } from "@/domain/shared/core.types";
import { cn } from "@/shared/lib/cn";

const inputCls = "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm";

/** 左欄繁中、右欄英文（與前台閱讀順序對應的雙語編輯） */
function BilingualGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("grid gap-4 lg:grid-cols-2", className)}>{children}</div>;
}

function ColZh({ children, title = "繁中 zh-TW" }: { children: ReactNode; title?: string }) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-3">
      <p className="text-xs font-bold text-gray-700">{title}</p>
      {children}
    </div>
  );
}

function ColEn({ children, title = "English en" }: { children: ReactNode; title?: string }) {
  return (
    <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-3">
      <p className="text-xs font-bold text-gray-700">{title}</p>
      {children}
    </div>
  );
}

interface Props {
  initialSettings: SiteSettingsData;
  initialHeroSlides: Record<SiteLocale, HeroSlideData[]>;
  initialCarouselItems: Record<SiteLocale, HomeCarouselItemData[]>;
}

const LOCALES: SiteLocale[] = ["zh-TW", "en"];

function normalizeLocaleSlides(
  raw: Record<SiteLocale, HeroSlideData[]>
): Record<SiteLocale, HeroSlideData[]> {
  return {
    "zh-TW": Array.isArray(raw["zh-TW"]) ? raw["zh-TW"] : [],
    en: Array.isArray(raw["en"]) ? raw["en"] : [],
  };
}

function normalizeLocaleCarousel(
  raw: Record<SiteLocale, HomeCarouselItemData[]>
): Record<SiteLocale, HomeCarouselItemData[]> {
  return {
    "zh-TW": Array.isArray(raw["zh-TW"]) ? raw["zh-TW"] : [],
    en: Array.isArray(raw["en"]) ? raw["en"] : [],
  };
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={["block text-xs font-semibold text-gray-700", className ?? ""].join(" ")}>
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

function formatCmsSaveError(prefix: string, err: ActionError): string {
  if (err.code === "AUTH_FAILED") {
    return "登入已過期或閒置超過 1 小時，請重新整理頁面並再次登入後台。";
  }
  if (err.code === "VALIDATION_ERROR" && err.details && typeof err.details === "object") {
    const d = err.details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] };
    const parts = [
      ...(d.formErrors ?? []),
      ...Object.entries(d.fieldErrors ?? {}).flatMap(([key, msgs]) =>
        msgs.map((m) => `${key}: ${m}`)
      ),
    ];
    if (parts.length > 0) {
      return `${prefix}（${err.code}）：${parts.join("；")}`;
    }
  }
  if (err.code === "INTERNAL_ERROR") {
    return `${prefix}（伺服器錯誤）。若剛更新程式，請確認已執行 npm run db:deploy；其餘請確認 Hero／輪播圖片網址與標題是否有效。`;
  }
  return `${prefix}（${err.code}）。請確認：圖片為 http(s) 開頭且結尾為 .jpg/.jpeg/.png/.webp、標題非空；按鈕連結請用 /、# 錨點或完整 https URL。`;
}

/**
 * 列表項暫時 id（React key）。`crypto.randomUUID()` 僅在「安全環境」可用
 *（https 或 localhost）；以 http://192.168.x.x 開後台時會不存在而報錯。
 */
function newDraftRowId(): string {
  const c = typeof globalThis !== "undefined" ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === "function") {
    return c.randomUUID();
  }
  return `draft_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`;
}

function emptyHeroSlide(locale: SiteLocale): HeroSlideData {
  return {
    id: newDraftRowId(),
    locale,
    title: locale === "en" ? "New hero slide" : "新的首頁輪播",
    subtitle: "",
    buttonLabel: "",
    buttonHref: "",
    imageUrl: "",
    imageAlt: "",
    imageHref: "",
    textX: 12,
    textY: 50,
    sortOrder: 0,
    isActive: true,
  };
}

function emptyCarouselItem(locale: SiteLocale): HomeCarouselItemData {
  return {
    id: newDraftRowId(),
    locale,
    title: locale === "en" ? "New carousel item" : "新的小圖輪播",
    description: "",
    href: "",
    imageUrl: "",
    imageAlt: "",
    sortOrder: 0,
    isActive: true,
  };
}

export default function SiteCmsManager({
  initialSettings,
  initialHeroSlides,
  initialCarouselItems,
}: Props) {
  const [settings, setSettings] = useState(initialSettings);
  const [activeLocale, setActiveLocale] = useState<SiteLocale>("zh-TW");
  const [heroSlides, setHeroSlides] = useState(() => normalizeLocaleSlides(initialHeroSlides));
  const [carouselItems, setCarouselItems] = useState(() => normalizeLocaleCarousel(initialCarouselItems));
  const [message, setMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const previewSlides = useMemo(
    () => (heroSlides[activeLocale] ?? []).filter((slide) => slide.imageUrl),
    [heroSlides, activeLocale]
  );

  function slidesToSave(
    locale: SiteLocale,
    slides: HeroSlideData[]
  ): HeroSlideData[] | null {
    const toSave = slides.filter((s) => s.title.trim() && s.imageUrl.trim());
    if (slides.length > 0 && toSave.length === 0) return null;
    return toSave;
  }

  function carouselToSave(
    locale: SiteLocale,
    items: HomeCarouselItemData[]
  ): HomeCarouselItemData[] | null {
    const toSave = items.filter((i) => i.title.trim() && i.imageUrl.trim());
    if (items.length > 0 && toSave.length === 0) return null;
    return toSave;
  }

  function saveAll() {
    setMessage("");
    for (const locale of LOCALES) {
      const heroList = heroSlides[locale] ?? [];
      if (slidesToSave(locale, heroList) === null) {
        setMessage(
          locale === "en"
            ? "Hero (English): each slide needs a valid image URL and title."
            : "Hero（繁中）：每一張都須填寫有效圖片網址與標題，否則無法儲存。"
        );
        return;
      }
      const carouselList = carouselItems[locale] ?? [];
      if (carouselToSave(locale, carouselList) === null) {
        setMessage(
          locale === "en"
            ? "Carousel (English): each item needs image URL and title."
            : "小圖輪播（繁中）：每一筆都須填寫圖片網址與標題，否則無法儲存。"
        );
        return;
      }
    }

    startTransition(async () => {
      const settingsResult = await updateSiteSettingsAction({
        ...settings,
        quickLinks: settings.quickLinks.filter(
          (link) => link.label.trim() && link.href.trim()
        ),
      });
      if (!settingsResult.success) {
        setMessage(
          formatCmsSaveError("全站設定與首頁文案儲存失敗", settingsResult.error)
        );
        return;
      }

      const nextHero = { ...heroSlides };
      const nextCarousel = { ...carouselItems };

      for (const locale of LOCALES) {
        const heroPayload = slidesToSave(locale, heroSlides[locale] ?? []) ?? [];
        const heroResult = await saveHeroSlidesAction(locale, heroPayload);
        if (!heroResult.success) {
          setMessage(formatCmsSaveError(`Hero（${locale}）儲存失敗`, heroResult.error));
          return;
        }
        nextHero[locale] = heroResult.data;

        const carouselPayload =
          carouselToSave(locale, carouselItems[locale] ?? []) ?? [];
        const carouselResult = await saveHomeCarouselItemsAction(
          locale,
          carouselPayload
        );
        if (!carouselResult.success) {
          setMessage(
            formatCmsSaveError(`小圖輪播（${locale}）儲存失敗`, carouselResult.error)
          );
          return;
        }
        nextCarousel[locale] = carouselResult.data;
      }

      setSettings(settingsResult.data);
      setHeroSlides(nextHero);
      setCarouselItems(nextCarousel);
      setMessage("已全部儲存：全站設定、Hero、小圖輪播與首頁文案。");
    });
  }

  function updateQuickLink(index: number, patch: Partial<QuickLinkItem>) {
    setSettings((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    }));
  }

  function updateHeroSlide(
    locale: SiteLocale,
    index: number,
    patch: Partial<HeroSlideData>
  ) {
    setHeroSlides((prev) => ({
      ...prev,
      [locale]: (prev[locale] ?? []).map((slide, i) =>
        i === index ? { ...slide, ...patch } : slide
      ),
    }));
  }

  function updateCarouselItem(
    locale: SiteLocale,
    index: number,
    patch: Partial<HomeCarouselItemData>
  ) {
    setCarouselItems((prev) => ({
      ...prev,
      [locale]: (prev[locale] ?? []).map((item, i) =>
        i === index ? { ...item, ...patch } : item
      ),
    }));
  }

  function updateHomepageCopy<K extends keyof HomepageCopy>(
    section: K,
    patch: Partial<HomepageCopy[K]>
  ) {
    setSettings((prev) => ({
      ...prev,
      homepageCopy: {
        ...prev.homepageCopy,
        [section]: { ...prev.homepageCopy[section], ...patch },
      },
    }));
  }

  function updateSocialProofBadge(index: number, lang: "zh" | "en", value: string) {
    const key = lang === "zh" ? "badges" : "badgesEn";
    setSettings((prev) => {
      const next = [...prev.homepageCopy.socialProof[key]];
      next[index] = value;
      return {
        ...prev,
        homepageCopy: {
          ...prev.homepageCopy,
          socialProof: { ...prev.homepageCopy.socialProof, [key]: next },
        },
      };
    });
  }

  function updateTopicClusterCard(
    index: number,
    patch: Partial<Omit<TopicClusterCardCopy, "slug">>
  ) {
    setSettings((prev) => {
      const cards = [...prev.homepageCopy.topicClusters.cards];
      const prevCard = cards[index];
      if (!prevCard) return prev;
      cards[index] = { ...prevCard, ...patch };
      return {
        ...prev,
        homepageCopy: {
          ...prev.homepageCopy,
          topicClusters: { ...prev.homepageCopy.topicClusters, cards },
        },
      };
    });
  }

  function updateAboutSection(index: number, patch: Partial<AboutSectionData>) {
    setSettings((prev) => ({
      ...prev,
      aboutSections: prev.aboutSections.map((section, i) =>
        i === index ? { ...section, ...patch } : section
      ),
    }));
  }

  function reorderQuickLinks(next: QuickLinkItem[]) {
    setSettings((prev) => ({ ...prev, quickLinks: next }));
  }

  function reorderHeroSlidesForLocale(locale: SiteLocale, next: HeroSlideData[]) {
    setHeroSlides((prev) => ({ ...prev, [locale]: next }));
  }

  function reorderCarouselForLocale(locale: SiteLocale, next: HomeCarouselItemData[]) {
    setCarouselItems((prev) => ({ ...prev, [locale]: next }));
  }

  function reorderAboutSections(next: AboutSectionData[]) {
    setSettings((prev) => ({ ...prev, aboutSections: next }));
  }

  const heroPreviewControls = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500">預覽語系：</span>
      {LOCALES.map((locale) => (
        <button
          key={`preview-${locale}`}
          type="button"
          onClick={() => setActiveLocale(locale)}
          className={[
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            activeLocale === locale ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-600",
          ].join(" ")}
        >
          {locale}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="sticky top-0 z-30 -mx-1 border-b border-gray-200 bg-white/95 px-1 pb-4 pt-1 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Frontend CMS
            </p>
            <h1 className="mt-1 text-2xl font-bold text-gray-900">首頁版型與全站組件</h1>
            <p className="mt-1 text-sm text-gray-500">
              編輯後請按右側「儲存」一次寫入全站設定、Hero、輪播與首頁文案。
            </p>
          </div>
          <button
            type="button"
            onClick={saveAll}
            disabled={isPending}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} aria-hidden="true" />
            {isPending ? "儲存中…" : "儲存"}
          </button>
        </div>

        {message ? (
          <p className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm text-blue-800">
            {message}
          </p>
        ) : null}

        <nav
          aria-label="CMS 區塊捷徑"
          className="mt-3 flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm"
        >
          <a href="#site-settings" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-blue-700 ring-1 ring-blue-100 hover:bg-blue-50">全站</a>
          <a href="#home-hero" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">1 Hero</a>
          <a href="#home-social-proof" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">2 數據帶</a>
          <a href="#home-topics" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">3 主題</a>
          <a href="#home-visual-carousel" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">4 精選視覺</a>
          <a href="#home-featured" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">5 精選文章</a>
          <a href="#home-conversion" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">6 轉換橫幅</a>
          <a href="#home-monetization" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">7 變現</a>
          <a href="#home-affiliate" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">8 聯盟</a>
          <a href="#home-programmatic" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-700 ring-1 ring-gray-200 hover:bg-gray-100">9 SEO</a>
          <a href="#about-page" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-500 ring-1 ring-gray-200 hover:bg-gray-100">關於頁</a>
          <a href="#privacy-policy" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-500 ring-1 ring-gray-200 hover:bg-gray-100">隱私權</a>
          <a href="#terms-of-service" className="rounded-lg bg-white px-3 py-1.5 font-semibold text-gray-500 ring-1 ring-gray-200 hover:bg-gray-100">服務條款</a>
        </nav>
      </div>

      <CmsAccordionSection
        id="site-settings"
        eyebrow="全站設定"
        title="LOGO、快速導覽與輪播時序"
        description="與下方首頁區塊一併由頂部「儲存」寫入。拖曳 ☰ 可調整快速導覽順序。"
      >
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <ExternalImageUrlField id="site-logo-url" label="LOGO 圖片網址" value={settings.logoUrl} onChange={(logoUrl) => setSettings((prev) => ({ ...prev, logoUrl }))} uploadFolder="cms/logo" previewAlt={settings.logoAlt || "LOGO"} />
            <input value={settings.logoAlt} onChange={(e) => setSettings((prev) => ({ ...prev, logoAlt: e.target.value }))} className={cn(inputCls, "mt-3")} placeholder="LOGO alt" />
          </div>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-800">Quick Access Bar</span>
              <button type="button" onClick={() => setSettings((prev) => ({ ...prev, quickLinks: [...prev.quickLinks, { label: "", labelEn: "", href: "" }] }))} className="text-sm font-semibold text-blue-600">新增</button>
            </div>
            <SortableList
              items={settings.quickLinks}
              onReorder={reorderQuickLinks}
              getItemId={(_, index) => `quick-link-${index}`}
              renderItem={(link, index) => (
                <div className="rounded-xl border border-gray-100 p-3">
                  <BilingualGrid>
                    <ColZh>
                      <Field label="標籤（繁中）"><input value={link.label} onChange={(e) => updateQuickLink(index, { label: e.target.value })} className={inputCls} /></Field>
                    </ColZh>
                    <ColEn>
                      <Field label="Label (EN)"><input value={link.labelEn ?? ""} onChange={(e) => updateQuickLink(index, { labelEn: e.target.value })} className={inputCls} /></Field>
                    </ColEn>
                  </BilingualGrid>
                  <Field label="連結 URL / 錨點" className="mt-2">
                    <div className="flex gap-2">
                      <input value={link.href} onChange={(e) => updateQuickLink(index, { href: e.target.value })} className={cn(inputCls, "min-w-0 flex-1")} />
                      <button type="button" onClick={() => setSettings((prev) => ({ ...prev, quickLinks: prev.quickLinks.filter((_, i) => i !== index) }))} className="rounded-lg border border-gray-200 px-2 text-gray-500 hover:bg-gray-50" aria-label="刪除"><Trash2 size={15} /></button>
                    </div>
                  </Field>
                </div>
              )}
            />
            <BilingualGrid className="mt-4">
              <ColZh>
                <Field label="Hero 自動切換（秒）"><input type="number" min={0} max={120} value={settings.heroAutoplaySeconds} onChange={(e) => setSettings((prev) => ({ ...prev, heroAutoplaySeconds: Math.min(120, Math.max(0, Number(e.target.value) || 0)) }))} className={inputCls} /></Field>
              </ColZh>
              <ColEn>
                <Field label="Carousel autoplay (sec)"><input type="number" min={0} max={120} value={settings.carouselAutoplaySeconds} onChange={(e) => setSettings((prev) => ({ ...prev, carouselAutoplaySeconds: Math.min(120, Math.max(0, Number(e.target.value) || 0)) }))} className={inputCls} /></Field>
              </ColEn>
            </BilingualGrid>
          </div>
        </div>
      </CmsAccordionSection>

      <CmsAccordionSection
        id="home-hero"
        variant="hero"
        eyebrow="1 · Homepage Hero"
        title="Hero 大圖輪播"
        description="對應前台最上方大圖。左欄繁中、右欄 English；可上傳或貼網址。拖曳 ☰ 調整各語系內的顯示順序。"
        headerExtra={heroPreviewControls}
      >
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setPreviewOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <Eye size={16} />
            {previewOpen ? "關閉預覽" : "儲存前預覽"}
          </button>
        </div>

        {previewOpen && previewSlides.length > 0 && (
          <div className="mt-6 max-h-[min(560px,80vh)] overflow-auto rounded-3xl border border-gray-200">
            <HeroSlider locale={activeLocale} slides={previewSlides} autoplaySeconds={0} />
          </div>
        )}
        {previewOpen && previewSlides.length === 0 && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            目前無法預覽：請至少為一張 Hero 填寫有效圖片網址與標題。
          </p>
        )}

        <BilingualGrid className="mt-6 items-start">
          {(["zh-TW", "en"] as const).map((heroLocale) => {
            const slides = heroSlides[heroLocale] ?? [];
            const isEn = heroLocale === "en";
            return (
              <div key={heroLocale} className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-gray-950">
                    {isEn ? "English en" : "繁中 zh-TW"}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setHeroSlides((prev) => ({
                        ...prev,
                        [heroLocale]: [...(prev[heroLocale] ?? []), emptyHeroSlide(heroLocale)],
                      }))
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                    {isEn ? "Add slide" : "新增"}
                  </button>
                </div>
                {slides.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-gray-300 bg-white px-4 py-6 text-center text-sm text-gray-500">
                    {isEn ? "No Hero slides yet." : "尚無 Hero 項目。"}
                  </p>
                ) : (
                  <SortableList
                    items={slides}
                    onReorder={(next) => reorderHeroSlidesForLocale(heroLocale, next)}
                    getItemId={(slide) => slide.id}
                    renderItem={(slide, index) => (
                    <article className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="grid gap-4 lg:grid-cols-[minmax(160px,200px)_1fr]">
                        <ExternalImageUrlField
                          id={`hero-image-${heroLocale}-${slide.id}`}
                          label={isEn ? "Image URL" : "大圖網址"}
                          value={slide.imageUrl}
                          onChange={(imageUrl) =>
                            updateHeroSlide(heroLocale, index, { imageUrl })
                          }
                          uploadFolder="cms/hero"
                          previewAlt={slide.imageAlt || slide.title}
                          previewAspect="16:9"
                        />
                        <div className="space-y-2">
                          <Field label={isEn ? "Title" : "標題"}>
                            <input
                              value={slide.title}
                              onChange={(e) =>
                                updateHeroSlide(heroLocale, index, { title: e.target.value })
                              }
                              className={inputCls}
                            />
                          </Field>
                          <Field label={isEn ? "Subtitle" : "副標"}>
                            <input
                              value={slide.subtitle}
                              onChange={(e) =>
                                updateHeroSlide(heroLocale, index, { subtitle: e.target.value })
                              }
                              className={inputCls}
                            />
                          </Field>
                          <Field label={isEn ? "Button label" : "按鈕文字"}>
                            <input
                              value={slide.buttonLabel}
                              onChange={(e) =>
                                updateHeroSlide(heroLocale, index, { buttonLabel: e.target.value })
                              }
                              className={inputCls}
                            />
                          </Field>
                          <Field label={isEn ? "Button link" : "按鈕連結"}>
                            <input
                              value={slide.buttonHref}
                              onChange={(e) =>
                                updateHeroSlide(heroLocale, index, { buttonHref: e.target.value })
                              }
                              className={inputCls}
                            />
                          </Field>
                          <Field label={isEn ? "Image tap link" : "大圖點擊連結"}>
                            <input
                              value={slide.imageHref}
                              onChange={(e) =>
                                updateHeroSlide(heroLocale, index, { imageHref: e.target.value })
                              }
                              className={inputCls}
                              placeholder="https://..."
                            />
                          </Field>
                          <Field label="alt">
                            <input
                              value={slide.imageAlt}
                              onChange={(e) =>
                                updateHeroSlide(heroLocale, index, { imageAlt: e.target.value })
                              }
                              className={inputCls}
                            />
                          </Field>
                          <div className="flex items-center justify-between gap-2">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={slide.isActive}
                                onChange={(e) =>
                                  updateHeroSlide(heroLocale, index, {
                                    isActive: e.target.checked,
                                  })
                                }
                              />
                              {isEn ? "Active" : "啟用"}
                            </label>
                            <button
                              type="button"
                              onClick={() =>
                                setHeroSlides((prev) => ({
                                  ...prev,
                                  [heroLocale]: (prev[heroLocale] ?? []).filter(
                                    (_, i) => i !== index
                                  ),
                                }))
                              }
                              className="text-sm font-semibold text-red-600"
                            >
                              {isEn ? "Delete" : "刪除"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                    )}
                  />
                )}
              </div>
            );
          })}
        </BilingualGrid>
      </CmsAccordionSection>

        <div className="space-y-6">
          <CmsAccordionSection
            id="home-social-proof"
            variant="nested"
            eyebrow="2 · Homepage"
            title="數據帶（累積動能）"
            description="數字仍由系統統計；左欄繁中、右欄 English。"
            className="border-blue-100 bg-blue-50/30"
          >
            <BilingualGrid className="mt-4">
              <ColZh>
                <Field label="小標">
                  <input value={settings.homepageCopy.socialProof.eyebrow} onChange={(e) => updateHomepageCopy("socialProof", { eyebrow: e.target.value })} className={inputCls} />
                </Field>
                <Field label="主標">
                  <input value={settings.homepageCopy.socialProof.title} onChange={(e) => updateHomepageCopy("socialProof", { title: e.target.value })} className={inputCls} />
                </Field>
                <Field label="副文">
                  <textarea value={settings.homepageCopy.socialProof.lead} onChange={(e) => updateHomepageCopy("socialProof", { lead: e.target.value })} rows={2} className={inputCls} />
                </Field>
                <Field label="統計：篇數">
                  <input value={settings.homepageCopy.socialProof.statPostsLabel} onChange={(e) => updateHomepageCopy("socialProof", { statPostsLabel: e.target.value })} className={inputCls} />
                </Field>
                <Field label="統計：主題數">
                  <input value={settings.homepageCopy.socialProof.statTopicsLabel} onChange={(e) => updateHomepageCopy("socialProof", { statTopicsLabel: e.target.value })} className={inputCls} />
                </Field>
                <Field label="統計：首頁瀏覽">
                  <input value={settings.homepageCopy.socialProof.statViewsLabel} onChange={(e) => updateHomepageCopy("socialProof", { statViewsLabel: e.target.value })} className={inputCls} />
                </Field>
              </ColZh>
              <ColEn>
                <Field label="Eyebrow">
                  <input value={settings.homepageCopy.socialProof.eyebrowEn} onChange={(e) => updateHomepageCopy("socialProof", { eyebrowEn: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Title">
                  <input value={settings.homepageCopy.socialProof.titleEn} onChange={(e) => updateHomepageCopy("socialProof", { titleEn: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Lead">
                  <textarea value={settings.homepageCopy.socialProof.leadEn} onChange={(e) => updateHomepageCopy("socialProof", { leadEn: e.target.value })} rows={2} className={inputCls} />
                </Field>
                <Field label="Stat: posts">
                  <input value={settings.homepageCopy.socialProof.statPostsLabelEn} onChange={(e) => updateHomepageCopy("socialProof", { statPostsLabelEn: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Stat: topics">
                  <input value={settings.homepageCopy.socialProof.statTopicsLabelEn} onChange={(e) => updateHomepageCopy("socialProof", { statTopicsLabelEn: e.target.value })} className={inputCls} />
                </Field>
                <Field label="Stat: views">
                  <input value={settings.homepageCopy.socialProof.statViewsLabelEn} onChange={(e) => updateHomepageCopy("socialProof", { statViewsLabelEn: e.target.value })} className={inputCls} />
                </Field>
              </ColEn>
            </BilingualGrid>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-600">底部標籤（繁中，共 4 個）</p>
                <div className="grid gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={`sb-zh-${i}`}
                      value={settings.homepageCopy.socialProof.badges[i] ?? ""}
                      onChange={(e) => updateSocialProofBadge(i, "zh", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-gray-600">底部標籤（英文，共 4 個）</p>
                <div className="grid gap-2">
                  {[0, 1, 2, 3].map((i) => (
                    <input
                      key={`sb-en-${i}`}
                      value={settings.homepageCopy.socialProof.badgesEn[i] ?? ""}
                      onChange={(e) => updateSocialProofBadge(i, "en", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  ))}
                </div>
              </div>
            </div>
          </CmsAccordionSection>

          <CmsAccordionSection
            id="home-topics"
            variant="nested"
            eyebrow="3 · Homepage"
            title="主題內容群集（六大主題）"
            description="六大主題 slug 固定。每張卡片含繁中／English 兩組圖片網址（可上傳）+ 標題 + 描述 + 連結 + alt。"
            className="border-indigo-100 bg-indigo-50/30"
          >
            <BilingualGrid className="mt-4">
              <ColZh>
                <Field label="區塊小標"><input value={settings.homepageCopy.topicClusters.eyebrow} onChange={(e) => updateHomepageCopy("topicClusters", { eyebrow: e.target.value })} className={inputCls} /></Field>
                <Field label="區塊主標"><input value={settings.homepageCopy.topicClusters.title} onChange={(e) => updateHomepageCopy("topicClusters", { title: e.target.value })} className={inputCls} /></Field>
                <Field label="查看全部"><input value={settings.homepageCopy.topicClusters.viewAll} onChange={(e) => updateHomepageCopy("topicClusters", { viewAll: e.target.value })} className={inputCls} /></Field>
                <Field label="卡片 CTA"><input value={settings.homepageCopy.topicClusters.explore} onChange={(e) => updateHomepageCopy("topicClusters", { explore: e.target.value })} className={inputCls} /></Field>
              </ColZh>
              <ColEn>
                <Field label="Eyebrow"><input value={settings.homepageCopy.topicClusters.eyebrowEn} onChange={(e) => updateHomepageCopy("topicClusters", { eyebrowEn: e.target.value })} className={inputCls} /></Field>
                <Field label="Title"><input value={settings.homepageCopy.topicClusters.titleEn} onChange={(e) => updateHomepageCopy("topicClusters", { titleEn: e.target.value })} className={inputCls} /></Field>
                <Field label="View all"><input value={settings.homepageCopy.topicClusters.viewAllEn} onChange={(e) => updateHomepageCopy("topicClusters", { viewAllEn: e.target.value })} className={inputCls} /></Field>
                <Field label="Explore CTA"><input value={settings.homepageCopy.topicClusters.exploreEn} onChange={(e) => updateHomepageCopy("topicClusters", { exploreEn: e.target.value })} className={inputCls} /></Field>
              </ColEn>
            </BilingualGrid>
            <div className="mt-6 space-y-4">
              {settings.homepageCopy.topicClusters.cards.map((card, index) => (
                <article key={card.slug} className="rounded-2xl border border-gray-200 bg-white p-4">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    slug: {card.slug}（前台 16:9；繁中／English 各一組圖片與連結）
                  </p>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="mb-3 text-sm font-bold text-gray-900">繁中 (zh-TW)</p>
                      <div className="grid gap-4 lg:grid-cols-[minmax(180px,240px)_1fr]">
                        <ExternalImageUrlField
                          id={`topic-image-zh-${card.slug}`}
                          label="小圖網址（外部連結）"
                          value={card.imageUrl ?? ""}
                          onChange={(imageUrl) => updateTopicClusterCard(index, { imageUrl })}
                          uploadFolder="cms/topics"
                          previewAlt={card.imageAlt || card.name}
                          previewAspect="16:9"
                        />
                        <div className="space-y-2">
                          <Field label="主題名稱（繁中）">
                            <input
                              value={card.name}
                              onChange={(e) =>
                                updateTopicClusterCard(index, { name: e.target.value })
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </Field>
                          <Field label="描述（繁中）">
                            <textarea
                              value={card.description}
                              onChange={(e) =>
                                updateTopicClusterCard(index, { description: e.target.value })
                              }
                              rows={2}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </Field>
                          <Field label="點擊圖卡導向的連結（https 或站內 / 路徑）">
                            <input
                              value={card.href ?? ""}
                              onChange={(e) =>
                                updateTopicClusterCard(index, { href: e.target.value })
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              placeholder="留空則導向該主題文章列表"
                            />
                          </Field>
                          <Field label="圖片替代文字 alt">
                            <input
                              value={card.imageAlt ?? ""}
                              onChange={(e) =>
                                updateTopicClusterCard(index, { imageAlt: e.target.value })
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <p className="mb-3 text-sm font-bold text-gray-900">English (en)</p>
                      <div className="grid gap-4 lg:grid-cols-[minmax(180px,240px)_1fr]">
                        <ExternalImageUrlField
                          id={`topic-image-en-${card.slug}`}
                          label="Image URL (external)"
                          value={card.imageUrlEn ?? ""}
                          onChange={(imageUrlEn) =>
                            updateTopicClusterCard(index, { imageUrlEn })
                          }
                          uploadFolder="cms/topics"
                          previewAlt={card.imageAltEn || card.nameEn}
                          previewAspect="16:9"
                        />
                        <div className="space-y-2">
                          <Field label="Topic name (English)">
                            <input
                              value={card.nameEn}
                              onChange={(e) =>
                                updateTopicClusterCard(index, { nameEn: e.target.value })
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </Field>
                          <Field label="Description (English)">
                            <textarea
                              value={card.descriptionEn}
                              onChange={(e) =>
                                updateTopicClusterCard(index, { descriptionEn: e.target.value })
                              }
                              rows={2}
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </Field>
                          <Field label="Card link (https or /path)">
                            <input
                              value={card.hrefEn ?? ""}
                              onChange={(e) =>
                                updateTopicClusterCard(index, { hrefEn: e.target.value })
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                              placeholder="Leave empty for category blog list"
                            />
                          </Field>
                          <Field label="Image alt">
                            <input
                              value={card.imageAltEn ?? ""}
                              onChange={(e) =>
                                updateTopicClusterCard(index, { imageAltEn: e.target.value })
                              }
                              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                            />
                          </Field>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </CmsAccordionSection>

          <CmsAccordionSection
            id="home-visual-carousel"
            variant="nested"
            eyebrow="4 · Homepage"
            title="精選視覺內容（橫幅標題 + 小圖輪播）"
            description="區塊標題在下方；輪播項目左繁中、右 English。拖曳 ☰ 調整各語系輪播順序。"
            className="border-slate-200 bg-slate-50/80"
          >
            <BilingualGrid className="mt-4">
              <ColZh>
                <Field label="小標"><input value={settings.homepageCopy.visualCarousel.eyebrow} onChange={(e) => updateHomepageCopy("visualCarousel", { eyebrow: e.target.value })} className={inputCls} /></Field>
                <Field label="主標"><input value={settings.homepageCopy.visualCarousel.title} onChange={(e) => updateHomepageCopy("visualCarousel", { title: e.target.value })} className={inputCls} /></Field>
                <Field label="右側說明"><textarea value={settings.homepageCopy.visualCarousel.description} onChange={(e) => updateHomepageCopy("visualCarousel", { description: e.target.value })} rows={2} className={inputCls} /></Field>
              </ColZh>
              <ColEn>
                <Field label="Eyebrow"><input value={settings.homepageCopy.visualCarousel.eyebrowEn} onChange={(e) => updateHomepageCopy("visualCarousel", { eyebrowEn: e.target.value })} className={inputCls} /></Field>
                <Field label="Title"><input value={settings.homepageCopy.visualCarousel.titleEn} onChange={(e) => updateHomepageCopy("visualCarousel", { titleEn: e.target.value })} className={inputCls} /></Field>
                <Field label="Description"><textarea value={settings.homepageCopy.visualCarousel.descriptionEn} onChange={(e) => updateHomepageCopy("visualCarousel", { descriptionEn: e.target.value })} rows={2} className={inputCls} /></Field>
              </ColEn>
            </BilingualGrid>

            <BilingualGrid className="mt-8 items-start">
              {(["zh-TW", "en"] as const).map((carouselLocale) => {
                const items = carouselItems[carouselLocale] ?? [];
                const isEn = carouselLocale === "en";
                return (
                  <div
                    key={carouselLocale}
                    id={isEn ? "carousel-items-en" : "carousel-items-zh"}
                    className="scroll-mt-6 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-bold text-gray-900">{isEn ? "English en" : "繁中 zh-TW"}</p>
                      <button type="button" onClick={() => setCarouselItems((prev) => ({ ...prev, [carouselLocale]: [...(prev[carouselLocale] ?? []), emptyCarouselItem(carouselLocale)] }))} className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                        <Plus size={14} className="inline" /> {isEn ? "Add" : "新增"}
                      </button>
                    </div>
                    {items.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-gray-300 bg-white px-3 py-5 text-center text-xs text-gray-500">{isEn ? "No items yet." : "尚無項目。"}</p>
                    ) : (
                      <SortableList
                        items={items}
                        onReorder={(next) => reorderCarouselForLocale(carouselLocale, next)}
                        getItemId={(item) => item.id}
                        renderItem={(item, index) => (
                          <article className="rounded-xl border border-gray-200 bg-white p-3">
                            <div className="grid gap-3 lg:grid-cols-[minmax(140px,180px)_1fr]">
                              <ExternalImageUrlField id={`carousel-${carouselLocale}-${item.id}`} label={isEn ? "Image URL" : "小圖網址"} value={item.imageUrl} onChange={(imageUrl) => updateCarouselItem(carouselLocale, index, { imageUrl })} uploadFolder="cms/carousel" previewAlt={item.imageAlt || item.title} />
                              <div className="space-y-2">
                                <Field label={isEn ? "Title" : "標題"}><input value={item.title} onChange={(e) => updateCarouselItem(carouselLocale, index, { title: e.target.value })} className={inputCls} /></Field>
                                <Field label={isEn ? "Description" : "描述"}><input value={item.description} onChange={(e) => updateCarouselItem(carouselLocale, index, { description: e.target.value })} className={inputCls} /></Field>
                                <Field label={isEn ? "Link" : "點擊連結"}><input value={item.href} onChange={(e) => updateCarouselItem(carouselLocale, index, { href: e.target.value })} className={inputCls} placeholder="https://..." /></Field>
                                <Field label="alt"><input value={item.imageAlt} onChange={(e) => updateCarouselItem(carouselLocale, index, { imageAlt: e.target.value })} className={inputCls} /></Field>
                                <div className="flex justify-between">
                                  <label className="inline-flex items-center gap-2 text-xs text-gray-700"><input type="checkbox" checked={item.isActive} onChange={(e) => updateCarouselItem(carouselLocale, index, { isActive: e.target.checked })} />{isEn ? "Active" : "啟用"}</label>
                                  <button type="button" onClick={() => setCarouselItems((prev) => ({ ...prev, [carouselLocale]: (prev[carouselLocale] ?? []).filter((_, i) => i !== index) }))} className="text-xs font-semibold text-red-600">{isEn ? "Delete" : "刪除"}</button>
                                </div>
                              </div>
                            </div>
                          </article>
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </BilingualGrid>
          </CmsAccordionSection>

          <CmsAccordionSection
            id="home-featured"
            variant="nested"
            eyebrow="5 · Homepage"
            title="精選文章區"
            className="border-emerald-100 bg-emerald-50/30"
          >
            <BilingualGrid className="mt-4">
              <ColZh>
                <Field label="小標"><input value={settings.homepageCopy.featuredPosts.eyebrow} onChange={(e) => updateHomepageCopy("featuredPosts", { eyebrow: e.target.value })} className={inputCls} /></Field>
                <Field label="主標"><input value={settings.homepageCopy.featuredPosts.title} onChange={(e) => updateHomepageCopy("featuredPosts", { title: e.target.value })} className={inputCls} /></Field>
                <Field label="瀏覽全部"><input value={settings.homepageCopy.featuredPosts.browseAll} onChange={(e) => updateHomepageCopy("featuredPosts", { browseAll: e.target.value })} className={inputCls} /></Field>
                <Field label="閱讀時間後綴"><input value={settings.homepageCopy.featuredPosts.minRead} onChange={(e) => updateHomepageCopy("featuredPosts", { minRead: e.target.value })} className={inputCls} /></Field>
              </ColZh>
              <ColEn>
                <Field label="Eyebrow"><input value={settings.homepageCopy.featuredPosts.eyebrowEn} onChange={(e) => updateHomepageCopy("featuredPosts", { eyebrowEn: e.target.value })} className={inputCls} /></Field>
                <Field label="Title"><input value={settings.homepageCopy.featuredPosts.titleEn} onChange={(e) => updateHomepageCopy("featuredPosts", { titleEn: e.target.value })} className={inputCls} /></Field>
                <Field label="Browse all"><input value={settings.homepageCopy.featuredPosts.browseAllEn} onChange={(e) => updateHomepageCopy("featuredPosts", { browseAllEn: e.target.value })} className={inputCls} /></Field>
                <Field label="Min read suffix"><input value={settings.homepageCopy.featuredPosts.minReadEn} onChange={(e) => updateHomepageCopy("featuredPosts", { minReadEn: e.target.value })} className={inputCls} /></Field>
              </ColEn>
            </BilingualGrid>
          </CmsAccordionSection>

          <CmsAccordionSection
            id="home-conversion"
            variant="nested"
            eyebrow="6 · Homepage"
            title="精選文章下方 — 轉換橫幅"
            description="CTA 連結可使用 #錨點（例 #affiliate-links）。留空主標題可隱藏。"
            className="border-amber-100 bg-amber-50/40"
          >
            <BilingualGrid className="mt-4">
              <ColZh>
                <Field label="小標"><input value={settings.homepageCopy.conversionBanner.eyebrow} onChange={(e) => updateHomepageCopy("conversionBanner", { eyebrow: e.target.value })} className={inputCls} /></Field>
                <Field label="主標"><input value={settings.homepageCopy.conversionBanner.title} onChange={(e) => updateHomepageCopy("conversionBanner", { title: e.target.value })} className={inputCls} /></Field>
                <Field label="描述"><textarea value={settings.homepageCopy.conversionBanner.description} onChange={(e) => updateHomepageCopy("conversionBanner", { description: e.target.value })} rows={3} className={inputCls} /></Field>
                <Field label="按鈕文字"><input value={settings.homepageCopy.conversionBanner.ctaLabel} onChange={(e) => updateHomepageCopy("conversionBanner", { ctaLabel: e.target.value })} className={inputCls} /></Field>
                <Field label="按鈕連結"><input value={settings.homepageCopy.conversionBanner.ctaHref} onChange={(e) => updateHomepageCopy("conversionBanner", { ctaHref: e.target.value })} className={inputCls} placeholder="#affiliate-links" /></Field>
              </ColZh>
              <ColEn>
                <Field label="Eyebrow"><input value={settings.homepageCopy.conversionBanner.eyebrowEn} onChange={(e) => updateHomepageCopy("conversionBanner", { eyebrowEn: e.target.value })} className={inputCls} /></Field>
                <Field label="Title"><input value={settings.homepageCopy.conversionBanner.titleEn} onChange={(e) => updateHomepageCopy("conversionBanner", { titleEn: e.target.value })} className={inputCls} /></Field>
                <Field label="Description"><textarea value={settings.homepageCopy.conversionBanner.descriptionEn} onChange={(e) => updateHomepageCopy("conversionBanner", { descriptionEn: e.target.value })} rows={3} className={inputCls} /></Field>
                <Field label="Button label"><input value={settings.homepageCopy.conversionBanner.ctaLabelEn} onChange={(e) => updateHomepageCopy("conversionBanner", { ctaLabelEn: e.target.value })} className={inputCls} /></Field>
              </ColEn>
            </BilingualGrid>
          </CmsAccordionSection>

          <CmsAccordionSection
            id="home-monetization"
            variant="nested"
            eyebrow="7 · Homepage"
            title="商業定位與變現邏輯"
          >
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="小標（繁中）"><input value={settings.homepageCopy.monetization.eyebrow} onChange={(e) => updateHomepageCopy("monetization", { eyebrow: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="小標（英文）"><input value={settings.homepageCopy.monetization.eyebrowEn} onChange={(e) => updateHomepageCopy("monetization", { eyebrowEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="主標（繁中）"><input value={settings.homepageCopy.monetization.title} onChange={(e) => updateHomepageCopy("monetization", { title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="主標（英文）"><input value={settings.homepageCopy.monetization.titleEn} onChange={(e) => updateHomepageCopy("monetization", { titleEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="描述（繁中）"><textarea value={settings.homepageCopy.monetization.description} onChange={(e) => updateHomepageCopy("monetization", { description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="描述（英文）"><textarea value={settings.homepageCopy.monetization.descriptionEn} onChange={(e) => updateHomepageCopy("monetization", { descriptionEn: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {settings.homepageCopy.monetization.items.map((item, index) => (
                <div key={index} className="rounded-xl border border-gray-200 bg-white p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label={`卡片 ${index + 1} 標題（繁中）`}><input value={item.title} onChange={(e) => {
                      const items = [...settings.homepageCopy.monetization.items];
                      items[index] = { ...item, title: e.target.value };
                      updateHomepageCopy("monetization", { items });
                    }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                    <Field label={`卡片 ${index + 1} 標題（英文）`}><input value={item.titleEn ?? ""} onChange={(e) => {
                      const items = [...settings.homepageCopy.monetization.items];
                      items[index] = { ...item, titleEn: e.target.value };
                      updateHomepageCopy("monetization", { items });
                    }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                    <Field label={`卡片 ${index + 1} 內文（繁中）`}><textarea value={item.description} onChange={(e) => {
                      const items = [...settings.homepageCopy.monetization.items];
                      items[index] = { ...item, description: e.target.value };
                      updateHomepageCopy("monetization", { items });
                    }} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                    <Field label={`卡片 ${index + 1} 內文（英文）`}><textarea value={item.descriptionEn ?? ""} onChange={(e) => {
                      const items = [...settings.homepageCopy.monetization.items];
                      items[index] = { ...item, descriptionEn: e.target.value };
                      updateHomepageCopy("monetization", { items });
                    }} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                  </div>
                </div>
              ))}
            </div>
          </CmsAccordionSection>

          <CmsAccordionSection
            id="home-affiliate"
            variant="nested"
            eyebrow="8 · Homepage"
            title="推薦資源 / 精選聯盟連結"
          >
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="小標（繁中）"><input value={settings.homepageCopy.affiliate.eyebrow} onChange={(e) => updateHomepageCopy("affiliate", { eyebrow: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="小標（英文）"><input value={settings.homepageCopy.affiliate.eyebrowEn} onChange={(e) => updateHomepageCopy("affiliate", { eyebrowEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="主標（繁中）"><input value={settings.homepageCopy.affiliate.title} onChange={(e) => updateHomepageCopy("affiliate", { title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="主標（英文）"><input value={settings.homepageCopy.affiliate.titleEn} onChange={(e) => updateHomepageCopy("affiliate", { titleEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="描述（繁中）" className="md:col-span-2"><textarea value={settings.homepageCopy.affiliate.description} onChange={(e) => updateHomepageCopy("affiliate", { description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="描述（英文）" className="md:col-span-2"><textarea value={settings.homepageCopy.affiliate.descriptionEn} onChange={(e) => updateHomepageCopy("affiliate", { descriptionEn: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              </div>
          </CmsAccordionSection>

          <CmsAccordionSection
            id="home-programmatic"
            variant="nested"
            eyebrow="9 · Homepage"
            title="Programmatic SEO 引擎"
          >
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="小標（繁中）"><input value={settings.homepageCopy.programmaticSeo.eyebrow} onChange={(e) => updateHomepageCopy("programmaticSeo", { eyebrow: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="小標（英文）"><input value={settings.homepageCopy.programmaticSeo.eyebrowEn} onChange={(e) => updateHomepageCopy("programmaticSeo", { eyebrowEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="主標（繁中）"><input value={settings.homepageCopy.programmaticSeo.title} onChange={(e) => updateHomepageCopy("programmaticSeo", { title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="主標（英文）"><input value={settings.homepageCopy.programmaticSeo.titleEn} onChange={(e) => updateHomepageCopy("programmaticSeo", { titleEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="描述（繁中）" className="md:col-span-2"><textarea value={settings.homepageCopy.programmaticSeo.description} onChange={(e) => updateHomepageCopy("programmaticSeo", { description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="描述（英文）" className="md:col-span-2"><textarea value={settings.homepageCopy.programmaticSeo.descriptionEn} onChange={(e) => updateHomepageCopy("programmaticSeo", { descriptionEn: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="按鈕文字（繁中）"><input value={settings.homepageCopy.programmaticSeo.buttonLabel} onChange={(e) => updateHomepageCopy("programmaticSeo", { buttonLabel: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="按鈕文字（英文）"><input value={settings.homepageCopy.programmaticSeo.buttonLabelEn} onChange={(e) => updateHomepageCopy("programmaticSeo", { buttonLabelEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              </div>
              <div className="mt-4 space-y-3">
                {settings.homepageCopy.programmaticSeo.strategies.map((item, index) => (
                  <div key={index} className="rounded-xl border border-gray-200 bg-white p-3">
                    <p className="mb-2 text-xs font-semibold text-gray-500">策略 {index + 1}</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="標題（繁中）"><input value={item.title} onChange={(e) => {
                        const strategies = [...settings.homepageCopy.programmaticSeo.strategies];
                        strategies[index] = { ...item, title: e.target.value };
                        updateHomepageCopy("programmaticSeo", { strategies });
                      }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                      <Field label="標題（英文）"><input value={item.titleEn ?? ""} onChange={(e) => {
                        const strategies = [...settings.homepageCopy.programmaticSeo.strategies];
                        strategies[index] = { ...item, titleEn: e.target.value };
                        updateHomepageCopy("programmaticSeo", { strategies });
                      }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                      <Field label="內文（繁中）"><textarea value={item.description} onChange={(e) => {
                        const strategies = [...settings.homepageCopy.programmaticSeo.strategies];
                        strategies[index] = { ...item, description: e.target.value };
                        updateHomepageCopy("programmaticSeo", { strategies });
                      }} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                      <Field label="內文（英文）"><textarea value={item.descriptionEn ?? ""} onChange={(e) => {
                        const strategies = [...settings.homepageCopy.programmaticSeo.strategies];
                        strategies[index] = { ...item, descriptionEn: e.target.value };
                        updateHomepageCopy("programmaticSeo", { strategies });
                      }} rows={2} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                    </div>
                  </div>
                ))}
              </div>
          </CmsAccordionSection>

          <CmsAccordionSection
            id="about-page"
            eyebrow="關於頁"
            title="關於頁段落（非首頁區塊）"
            description="拖曳 ☰ 調整段落顯示順序。"
            headerExtra={
              <button type="button" onClick={() => setSettings((prev) => ({ ...prev, aboutSections: [...prev.aboutSections, { id: newDraftRowId(), title: "", titleEn: "", body: "", bodyEn: "", sortOrder: prev.aboutSections.length }] }))} className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600">
                <Plus size={15} /> 新增段落
              </button>
            }
          >
            <SortableList
              items={settings.aboutSections}
              onReorder={reorderAboutSections}
              getItemId={(section) => section.id}
              renderItem={(section, index) => (
                <article className="rounded-xl border border-gray-200 bg-white p-4">
                  <BilingualGrid>
                    <ColZh>
                      <Field label="段落標題"><input value={section.title} onChange={(e) => updateAboutSection(index, { title: e.target.value })} className={inputCls} /></Field>
                      <Field label="段落內文"><textarea value={section.body} onChange={(e) => updateAboutSection(index, { body: e.target.value })} rows={4} className={inputCls} /></Field>
                    </ColZh>
                    <ColEn>
                      <Field label="Title"><input value={section.titleEn ?? ""} onChange={(e) => updateAboutSection(index, { titleEn: e.target.value })} className={inputCls} /></Field>
                      <Field label="Body"><textarea value={section.bodyEn ?? ""} onChange={(e) => updateAboutSection(index, { bodyEn: e.target.value })} rows={4} className={inputCls} /></Field>
                    </ColEn>
                  </BilingualGrid>
                  <button type="button" onClick={() => setSettings((prev) => ({ ...prev, aboutSections: prev.aboutSections.filter((_, i) => i !== index) }))} className="mt-3 text-sm font-semibold text-red-600">刪除段落</button>
                </article>
              )}
            />
          </CmsAccordionSection>

          <CmsAccordionSection
            id="privacy-policy"
            eyebrow="全站設定"
            title="隱私權政策（/privacy-policy）"
            description="公開雙語頁面。使用 HTML 編輯器撰寫繁中與英文內容，儲存後約 1 小時內同步至公開站。"
          >
            <LegalHtmlCmsEditor
              htmlZh={settings.privacyPolicyHtml}
              htmlEn={settings.privacyPolicyHtmlEn}
              onChangeZh={(privacyPolicyHtml) =>
                setSettings((prev) => ({ ...prev, privacyPolicyHtml }))
              }
              onChangeEn={(privacyPolicyHtmlEn) =>
                setSettings((prev) => ({ ...prev, privacyPolicyHtmlEn }))
              }
            />
          </CmsAccordionSection>

          <CmsAccordionSection
            id="terms-of-service"
            eyebrow="全站設定"
            title="服務條款（/terms-of-service）"
            description="公開雙語頁面。使用 HTML 編輯器撰寫繁中與英文內容。"
          >
            <LegalHtmlCmsEditor
              htmlZh={settings.termsOfServiceHtml}
              htmlEn={settings.termsOfServiceHtmlEn}
              onChangeZh={(termsOfServiceHtml) =>
                setSettings((prev) => ({ ...prev, termsOfServiceHtml }))
              }
              onChangeEn={(termsOfServiceHtmlEn) =>
                setSettings((prev) => ({ ...prev, termsOfServiceHtmlEn }))
              }
            />
          </CmsAccordionSection>
        </div>
    </div>
  );
}
