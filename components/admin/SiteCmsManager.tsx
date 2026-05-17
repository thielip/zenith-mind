"use client";

import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";
import { Eye, ImagePlus, Plus, Save, Trash2 } from "lucide-react";
import {
  saveHeroSlidesAction,
  saveHomeCarouselItemsAction,
  updateSiteSettingsAction,
  uploadSiteAssetAction,
} from "@/actions/site.actions";
import HeroSlider from "@/components/home/HeroSlider";
import { DEFAULT_QUICK_LINKS } from "@/lib/site/default-quick-links";
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

function formatUploadError(err: ActionError): string {
  if (err.code === "VALIDATION_ERROR" && err.details && typeof err.details === "object") {
    const d = err.details as { formErrors?: string[] };
    if (d.formErrors?.length) return d.formErrors.join(" ");
  }
  if (err.code === "AUTH_FAILED") {
    return "登入已過期，請重新整理頁面並再次登入後台。";
  }
  return `圖片上傳失敗（${err.code}）。請確認 Supabase Storage（site-assets）與網路連線。`;
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
  return `${prefix}（${err.code}）。請確認：圖片為有效 https URL（或以 / 開頭路徑）、標題非空；按鈕連結請用 /、# 錨點或完整 https URL。`;
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

  const activeHeroSlides = useMemo(
    () => heroSlides[activeLocale] ?? [],
    [heroSlides, activeLocale]
  );
  const activeCarouselItems = carouselItems[activeLocale] ?? [];
  const previewSlides = useMemo(
    () => activeHeroSlides.filter((slide) => slide.imageUrl),
    [activeHeroSlides]
  );

  async function uploadImage(file: File, folder: string) {
    setMessage("圖片上傳中...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientFileName", file.name);
    formData.append("folder", folder);
    const result = await uploadSiteAssetAction(formData);
    if (!result.success) {
      setMessage(formatUploadError(result.error));
      return "";
    }
    setMessage("圖片已上傳，請記得按儲存讓設定同步到前台。");
    return result.data.url;
  }

  function saveSettings() {
    setMessage("");
    startTransition(async () => {
      const result = await updateSiteSettingsAction({
        ...settings,
        quickLinks: settings.quickLinks.filter(
          (link) => link.label.trim() && link.href.trim()
        ),
      });
      if (result.success) {
        setSettings(result.data);
        setMessage("全站設定已儲存。");
      } else {
        setMessage(`全站設定儲存失敗：${result.error.code}。請檢查 URL 與欄位格式。`);
      }
    });
  }

  function saveHeroSlides() {
    setMessage("");
    const toSave = activeHeroSlides.filter(
      (slide) => slide.title.trim() && slide.imageUrl.trim()
    );
    if (activeHeroSlides.length > 0 && toSave.length === 0) {
      setMessage(
        "目前沒有可儲存的 Hero：每一張都必須「上傳圖片」且「標題非空」才會寫入。若全部尚未完成，請先上傳圖片再按儲存（避免誤清空資料庫既有輪播）。"
      );
      return;
    }
    startTransition(async () => {
      const result = await saveHeroSlidesAction(activeLocale, toSave);
      if (result.success) {
        setHeroSlides((prev) => ({ ...prev, [activeLocale]: result.data }));
        setMessage("Hero Slider 已儲存。");
      } else {
        setMessage(formatCmsSaveError("Hero Slider 儲存失敗", result.error));
      }
    });
  }

  function saveCarouselItems() {
    setMessage("");
    const toSave = activeCarouselItems.filter(
      (item) => item.title.trim() && item.imageUrl.trim()
    );
    if (activeCarouselItems.length > 0 && toSave.length === 0) {
      setMessage(
        "目前沒有可儲存的小圖輪播：每一筆都必須「上傳圖片」且「標題非空」才會寫入。請先完成圖片與標題再儲存（避免誤清空既有資料）。"
      );
      return;
    }
    startTransition(async () => {
      const result = await saveHomeCarouselItemsAction(activeLocale, toSave);
      if (result.success) {
        setCarouselItems((prev) => ({ ...prev, [activeLocale]: result.data }));
        setMessage("小圖輪播已儲存。");
      } else {
        setMessage(formatCmsSaveError("小圖輪播儲存失敗", result.error));
      }
    });
  }

  function updateQuickLink(index: number, patch: Partial<QuickLinkItem>) {
    setSettings((prev) => ({
      ...prev,
      quickLinks: prev.quickLinks.map((link, i) => (i === index ? { ...link, ...patch } : link)),
    }));
  }

  function updateHeroSlide(index: number, patch: Partial<HeroSlideData>) {
    setHeroSlides((prev) => ({
      ...prev,
      [activeLocale]: (prev[activeLocale] ?? []).map((slide, i) =>
        i === index ? { ...slide, ...patch } : slide
      ),
    }));
  }

  function updateCarouselItem(index: number, patch: Partial<HomeCarouselItemData>) {
    setCarouselItems((prev) => ({
      ...prev,
      [activeLocale]: (prev[activeLocale] ?? []).map((item, i) =>
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

  return (
    <div className="space-y-8">
      {message && (
        <p className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          {message}
        </p>
      )}

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Site Identity
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-950">LOGO、快速導覽與社群設定</h2>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} aria-hidden="true" />
            儲存全站設定
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-800">自訂 LOGO</p>
            <div className="mt-3 flex min-h-24 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-4">
              {settings.logoUrl ? (
                <Image
                  src={settings.logoUrl}
                  alt={settings.logoAlt || "LOGO"}
                  width={220}
                  height={80}
                  unoptimized={settings.logoUrl.endsWith(".svg")}
                  className="max-h-20 w-auto object-contain"
                />
              ) : (
                <span className="text-sm text-gray-400">尚未上傳 LOGO</span>
              )}
            </div>
            <label className="mt-3 inline-flex cursor-pointer items-center justify-center rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
              上傳 LOGO 圖片
              <input
                className="sr-only"
                type="file"
                accept="image/*"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  const url = await uploadImage(file, "logo");
                  if (url) setSettings((prev) => ({ ...prev, logoUrl: url }));
                }}
              />
            </label>
            <input
              value={settings.logoAlt}
              onChange={(event) =>
                setSettings((prev) => ({ ...prev, logoAlt: event.target.value }))
              }
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="LOGO alt 文字"
            />
          </div>

          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">Quick Access Bar</span>
                <button
                  type="button"
                  onClick={() =>
                    setSettings((prev) => ({
                      ...prev,
                      quickLinks: [...prev.quickLinks, { label: "", labelEn: "", href: "" }],
                    }))
                  }
                  className="text-sm font-semibold text-blue-600"
                >
                  新增
                </button>
              </div>
              <p className="mb-2 text-xs leading-relaxed text-gray-500">
                建議順序（與 Footer 一致）：{DEFAULT_QUICK_LINKS.map((l) => l.label).join(" → ")}。錨點請對應首頁各區塊 id。
              </p>
              <div className="space-y-3">
                {settings.quickLinks.map((link, index) => (
                  <div key={index} className="grid gap-2 rounded-xl border border-gray-100 p-3 sm:grid-cols-3">
                    <Field label="快速連結標籤（繁中）"><input
                      value={link.label}
                      onChange={(event) => updateQuickLink(index, { label: event.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    /></Field>
                    <Field label="快速連結標籤（英文）"><input
                      value={link.labelEn ?? ""}
                      onChange={(event) => updateQuickLink(index, { labelEn: event.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    /></Field>
                    <div className="flex gap-2">
                      <Field label="連結 URL / 錨點"><input
                        value={link.href}
                        onChange={(event) => updateQuickLink(index, { href: event.target.value })}
                        className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      /></Field>
                      <button
                        type="button"
                        onClick={() =>
                          setSettings((prev) => ({
                            ...prev,
                            quickLinks: prev.quickLinks.filter((_, i) => i !== index),
                          }))
                        }
                        className="rounded-lg border border-gray-200 px-2 text-gray-500 hover:bg-gray-50"
                        aria-label="刪除快速連結"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Facebook 粉絲專頁 URL"><input
                value={settings.socialLinks.facebookPageUrl ?? ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, facebookPageUrl: event.target.value },
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              /></Field>
              <Field label="YouTube 頻道 URL"><input
                value={settings.socialLinks.youtubeChannelUrl ?? ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, youtubeChannelUrl: event.target.value },
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              /></Field>
              <Field label="Instagram URL"><input
                value={settings.socialLinks.instagramUrl ?? ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, instagramUrl: event.target.value },
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              /></Field>
              <Field label="LINE 官方帳號 URL"><input
                value={settings.socialLinks.lineUrl ?? ""}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, lineUrl: event.target.value },
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              /></Field>
              <Field label="LINE QRCode 下方文字"><input
                value={settings.socialLinks.lineLabel ?? "官方帳號"}
                onChange={(event) =>
                  setSettings((prev) => ({
                    ...prev,
                    socialLinks: { ...prev.socialLinks, lineLabel: event.target.value },
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              /></Field>
              <Field label="Instagram 單篇 embed URL"><input
                value={settings.instagramEmbedUrl}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, instagramEmbedUrl: event.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              /></Field>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={settings.socialSidebarActive}
                onChange={(event) =>
                  setSettings((prev) => ({ ...prev, socialSidebarActive: event.target.checked }))
                }
              />
              啟用右側社群側邊欄
            </label>

            <div className="mt-6 border-t border-gray-200 pt-5">
              <h3 className="text-sm font-semibold text-gray-900">
                {activeLocale === "en" ? "Homepage carousel timing" : "首頁輪播時序"}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {activeLocale === "en"
                  ? "Saved with “Save site settings” above. Use 0 to disable auto-rotation."
                  : "與上方「儲存全站設定」一併寫入。填 0 表示不自動輪播。"}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Field label={activeLocale === "en" ? "Hero autoplay (seconds)" : "大圖 Hero 自動切換（秒）"}>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={settings.heroAutoplaySeconds}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        heroAutoplaySeconds: Math.min(120, Math.max(0, Number(event.target.value) || 0)),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </Field>
                <Field label={activeLocale === "en" ? "Small carousel autoplay (seconds)" : "小圖橫幅自動捲動（秒）"}>
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={settings.carouselAutoplaySeconds}
                    onChange={(event) =>
                      setSettings((prev) => ({
                        ...prev,
                        carouselAutoplaySeconds: Math.min(120, Math.max(0, Number(event.target.value) || 0)),
                      }))
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </Field>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Editable Frontend Copy
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-950">前台固定文案與關於頁</h2>
            <p className="mt-2 text-sm text-gray-500">
              管理首頁數據帶、主題群集、精選視覺／精選文章標題、推薦資源與 Programmatic SEO 等雙語文案。
            </p>
          </div>
          <button
            type="button"
            onClick={saveSettings}
            disabled={isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} aria-hidden="true" />
            儲存文案設定
          </button>
        </div>

        <div className="mt-6 space-y-8">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-gray-950">關於頁內容</h3>
              <button
                type="button"
                onClick={() =>
                  setSettings((prev) => ({
                    ...prev,
                    aboutSections: [
                      ...prev.aboutSections,
                      {
                        id: newDraftRowId(),
                        title: "",
                        titleEn: "",
                        body: "",
                        bodyEn: "",
                        sortOrder: prev.aboutSections.length,
                      },
                    ],
                  }))
                }
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600"
              >
                <Plus size={15} />
                新增段落
              </button>
            </div>
            <div className="space-y-4">
              {settings.aboutSections.map((section, index) => (
                <article key={section.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="段落標題（繁中）">
                      <input value={section.title} onChange={(e) => updateAboutSection(index, { title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </Field>
                    <Field label="段落標題（英文）">
                      <input value={section.titleEn ?? ""} onChange={(e) => updateAboutSection(index, { titleEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </Field>
                    <Field label="段落內文（繁中）">
                      <textarea value={section.body} onChange={(e) => updateAboutSection(index, { body: e.target.value })} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </Field>
                    <Field label="段落內文（英文）">
                      <textarea value={section.bodyEn ?? ""} onChange={(e) => updateAboutSection(index, { bodyEn: e.target.value })} rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </Field>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        aboutSections: prev.aboutSections.filter((_, i) => i !== index),
                      }))
                    }
                    className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-red-600"
                  >
                    <Trash2 size={15} />
                    刪除段落
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/30 p-4">
            <h3 className="font-semibold text-gray-950">首頁 — 數據帶（累積動能）</h3>
            <p className="mt-1 text-xs text-gray-600">數字仍由系統統計；此處僅編輯標題、說明與標籤文案（繁／英）。</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="小標（繁中）">
                <input
                  value={settings.homepageCopy.socialProof.eyebrow}
                  onChange={(e) => updateHomepageCopy("socialProof", { eyebrow: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="小標（英文）">
                <input
                  value={settings.homepageCopy.socialProof.eyebrowEn}
                  onChange={(e) => updateHomepageCopy("socialProof", { eyebrowEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="主標（繁中）">
                <input
                  value={settings.homepageCopy.socialProof.title}
                  onChange={(e) => updateHomepageCopy("socialProof", { title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="主標（英文）">
                <input
                  value={settings.homepageCopy.socialProof.titleEn}
                  onChange={(e) => updateHomepageCopy("socialProof", { titleEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="副文（繁中）" className="md:col-span-2">
                <textarea
                  value={settings.homepageCopy.socialProof.lead}
                  onChange={(e) => updateHomepageCopy("socialProof", { lead: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="副文（英文）" className="md:col-span-2">
                <textarea
                  value={settings.homepageCopy.socialProof.leadEn}
                  onChange={(e) => updateHomepageCopy("socialProof", { leadEn: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="統計標籤：篇數（繁）">
                <input
                  value={settings.homepageCopy.socialProof.statPostsLabel}
                  onChange={(e) => updateHomepageCopy("socialProof", { statPostsLabel: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="統計標籤：篇數（英）">
                <input
                  value={settings.homepageCopy.socialProof.statPostsLabelEn}
                  onChange={(e) => updateHomepageCopy("socialProof", { statPostsLabelEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="統計標籤：主題數（繁）">
                <input
                  value={settings.homepageCopy.socialProof.statTopicsLabel}
                  onChange={(e) => updateHomepageCopy("socialProof", { statTopicsLabel: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="統計標籤：主題數（英）">
                <input
                  value={settings.homepageCopy.socialProof.statTopicsLabelEn}
                  onChange={(e) => updateHomepageCopy("socialProof", { statTopicsLabelEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="統計標籤：首頁瀏覽（繁）">
                <input
                  value={settings.homepageCopy.socialProof.statViewsLabel}
                  onChange={(e) => updateHomepageCopy("socialProof", { statViewsLabel: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="統計標籤：首頁瀏覽（英）">
                <input
                  value={settings.homepageCopy.socialProof.statViewsLabelEn}
                  onChange={(e) => updateHomepageCopy("socialProof", { statViewsLabelEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
            </div>
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
          </div>

          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/30 p-4">
            <h3 className="font-semibold text-gray-950">首頁 — 主題內容群集</h3>
            <p className="mt-1 text-xs text-gray-600">六大主題 slug 固定；可調整顯示名稱與卡片描述（繁／英）。</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="區塊小標（繁中）">
                <input
                  value={settings.homepageCopy.topicClusters.eyebrow}
                  onChange={(e) => updateHomepageCopy("topicClusters", { eyebrow: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="區塊小標（英文）">
                <input
                  value={settings.homepageCopy.topicClusters.eyebrowEn}
                  onChange={(e) => updateHomepageCopy("topicClusters", { eyebrowEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="區塊主標（繁中）">
                <input
                  value={settings.homepageCopy.topicClusters.title}
                  onChange={(e) => updateHomepageCopy("topicClusters", { title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="區塊主標（英文）">
                <input
                  value={settings.homepageCopy.topicClusters.titleEn}
                  onChange={(e) => updateHomepageCopy("topicClusters", { titleEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="「查看全部」連結文字（繁）">
                <input
                  value={settings.homepageCopy.topicClusters.viewAll}
                  onChange={(e) => updateHomepageCopy("topicClusters", { viewAll: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="「查看全部」連結文字（英）">
                <input
                  value={settings.homepageCopy.topicClusters.viewAllEn}
                  onChange={(e) => updateHomepageCopy("topicClusters", { viewAllEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="卡片底部 CTA（繁）">
                <input
                  value={settings.homepageCopy.topicClusters.explore}
                  onChange={(e) => updateHomepageCopy("topicClusters", { explore: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="卡片底部 CTA（英）">
                <input
                  value={settings.homepageCopy.topicClusters.exploreEn}
                  onChange={(e) => updateHomepageCopy("topicClusters", { exploreEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <div className="mt-6 space-y-4">
              {settings.homepageCopy.topicClusters.cards.map((card, index) => (
                <article key={card.slug} className="rounded-xl border border-gray-200 bg-white p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    slug: {card.slug}
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="主題名稱（繁中）">
                      <input
                        value={card.name}
                        onChange={(e) => updateTopicClusterCard(index, { name: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </Field>
                    <Field label="主題名稱（英文）">
                      <input
                        value={card.nameEn}
                        onChange={(e) => updateTopicClusterCard(index, { nameEn: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </Field>
                    <Field label="描述（繁中）" className="md:col-span-2">
                      <textarea
                        value={card.description}
                        onChange={(e) => updateTopicClusterCard(index, { description: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </Field>
                    <Field label="描述（英文）" className="md:col-span-2">
                      <textarea
                        value={card.descriptionEn}
                        onChange={(e) => updateTopicClusterCard(index, { descriptionEn: e.target.value })}
                        rows={2}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </Field>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
            <h3 className="font-semibold text-gray-950">首頁 — 精選視覺內容（小圖橫幅區標題）</h3>
            <p className="mt-1 text-xs text-gray-600">輪播圖片與卡片文字仍在下方「小圖輪播」管理；此處僅區塊標題與右側說明。</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="小標（繁中）">
                <input
                  value={settings.homepageCopy.visualCarousel.eyebrow}
                  onChange={(e) => updateHomepageCopy("visualCarousel", { eyebrow: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="小標（英文）">
                <input
                  value={settings.homepageCopy.visualCarousel.eyebrowEn}
                  onChange={(e) => updateHomepageCopy("visualCarousel", { eyebrowEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="主標（繁中）">
                <input
                  value={settings.homepageCopy.visualCarousel.title}
                  onChange={(e) => updateHomepageCopy("visualCarousel", { title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="主標（英文）">
                <input
                  value={settings.homepageCopy.visualCarousel.titleEn}
                  onChange={(e) => updateHomepageCopy("visualCarousel", { titleEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="右側說明（繁中）" className="md:col-span-2">
                <textarea
                  value={settings.homepageCopy.visualCarousel.description}
                  onChange={(e) => updateHomepageCopy("visualCarousel", { description: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="右側說明（英文）" className="md:col-span-2">
                <textarea
                  value={settings.homepageCopy.visualCarousel.descriptionEn}
                  onChange={(e) => updateHomepageCopy("visualCarousel", { descriptionEn: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/30 p-4">
            <h3 className="font-semibold text-gray-950">首頁 — 精選文章區</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="小標（繁中）">
                <input
                  value={settings.homepageCopy.featuredPosts.eyebrow}
                  onChange={(e) => updateHomepageCopy("featuredPosts", { eyebrow: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="小標（英文）">
                <input
                  value={settings.homepageCopy.featuredPosts.eyebrowEn}
                  onChange={(e) => updateHomepageCopy("featuredPosts", { eyebrowEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="主標（繁中）">
                <input
                  value={settings.homepageCopy.featuredPosts.title}
                  onChange={(e) => updateHomepageCopy("featuredPosts", { title: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="主標（英文）">
                <input
                  value={settings.homepageCopy.featuredPosts.titleEn}
                  onChange={(e) => updateHomepageCopy("featuredPosts", { titleEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="瀏覽全部連結（繁）">
                <input
                  value={settings.homepageCopy.featuredPosts.browseAll}
                  onChange={(e) => updateHomepageCopy("featuredPosts", { browseAll: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="瀏覽全部連結（英）">
                <input
                  value={settings.homepageCopy.featuredPosts.browseAllEn}
                  onChange={(e) => updateHomepageCopy("featuredPosts", { browseAllEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="閱讀時間後綴（繁，例：分鐘閱讀）">
                <input
                  value={settings.homepageCopy.featuredPosts.minRead}
                  onChange={(e) => updateHomepageCopy("featuredPosts", { minRead: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
              <Field label="閱讀時間後綴（英，例：min read）">
                <input
                  value={settings.homepageCopy.featuredPosts.minReadEn}
                  onChange={(e) => updateHomepageCopy("featuredPosts", { minReadEn: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <h3 className="font-semibold text-gray-950">商業定位與變現邏輯</h3>
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
          </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-950">推薦資源 / 精選聯盟連結</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <Field label="小標（繁中）"><input value={settings.homepageCopy.affiliate.eyebrow} onChange={(e) => updateHomepageCopy("affiliate", { eyebrow: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="小標（英文）"><input value={settings.homepageCopy.affiliate.eyebrowEn} onChange={(e) => updateHomepageCopy("affiliate", { eyebrowEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="主標（繁中）"><input value={settings.homepageCopy.affiliate.title} onChange={(e) => updateHomepageCopy("affiliate", { title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="主標（英文）"><input value={settings.homepageCopy.affiliate.titleEn} onChange={(e) => updateHomepageCopy("affiliate", { titleEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="描述（繁中）" className="md:col-span-2"><textarea value={settings.homepageCopy.affiliate.description} onChange={(e) => updateHomepageCopy("affiliate", { description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                <Field label="描述（英文）" className="md:col-span-2"><textarea value={settings.homepageCopy.affiliate.descriptionEn} onChange={(e) => updateHomepageCopy("affiliate", { descriptionEn: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-950">Programmatic SEO 引擎</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
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
            </div>

          <div className="rounded-2xl border border-amber-100 bg-amber-50/40 p-4">
            <h3 className="font-semibold text-gray-950">精選文章下方 — 轉換橫幅</h3>
            <p className="mt-1 text-xs text-gray-600">顯示於精選文章與商業定位區塊之間；CTA 連結可使用 <code className="rounded bg-white px-1">#錨點</code>（例如 <code className="rounded bg-white px-1">#affiliate-links</code>）。留空主標題可隱藏橫幅。</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <Field label="小標（繁中）"><input value={settings.homepageCopy.conversionBanner.eyebrow} onChange={(e) => updateHomepageCopy("conversionBanner", { eyebrow: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="小標（英文）"><input value={settings.homepageCopy.conversionBanner.eyebrowEn} onChange={(e) => updateHomepageCopy("conversionBanner", { eyebrowEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="主標（繁中）"><input value={settings.homepageCopy.conversionBanner.title} onChange={(e) => updateHomepageCopy("conversionBanner", { title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="主標（英文）"><input value={settings.homepageCopy.conversionBanner.titleEn} onChange={(e) => updateHomepageCopy("conversionBanner", { titleEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="描述（繁中）" className="md:col-span-2"><textarea value={settings.homepageCopy.conversionBanner.description} onChange={(e) => updateHomepageCopy("conversionBanner", { description: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="描述（英文）" className="md:col-span-2"><textarea value={settings.homepageCopy.conversionBanner.descriptionEn} onChange={(e) => updateHomepageCopy("conversionBanner", { descriptionEn: e.target.value })} rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="按鈕文字（繁中）"><input value={settings.homepageCopy.conversionBanner.ctaLabel} onChange={(e) => updateHomepageCopy("conversionBanner", { ctaLabel: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="按鈕文字（英文）"><input value={settings.homepageCopy.conversionBanner.ctaLabelEn} onChange={(e) => updateHomepageCopy("conversionBanner", { ctaLabelEn: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
              <Field label="按鈕連結" className="md:col-span-2"><input value={settings.homepageCopy.conversionBanner.ctaHref} onChange={(e) => updateHomepageCopy("conversionBanner", { ctaHref: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="#affiliate-links" /></Field>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
              Homepage CMS
            </p>
            <h2 className="mt-1 text-xl font-bold text-gray-950">Hero Slider 與小圖輪播</h2>
            <p className="mt-2 text-sm text-gray-500">
              大圖輪播建議尺寸：1600 × 900 px（16:9）。小圖輪播建議尺寸：900 × 1200 px（3:4）。上傳 WebP / JPG / PNG，單檔建議 5MB 以下。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {LOCALES.map((locale) => (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveLocale(locale)}
                className={[
                  "rounded-full px-4 py-2 text-sm font-semibold",
                  activeLocale === locale ? "bg-gray-950 text-white" : "bg-gray-100 text-gray-600",
                ].join(" ")}
              >
                {locale}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              setHeroSlides((prev) => ({
                ...prev,
                [activeLocale]: [...(prev[activeLocale] ?? []), emptyHeroSlide(activeLocale)],
              }))
            }
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <Plus size={16} />
            新增 Hero 圖
          </button>
          <button
            type="button"
            onClick={() => setPreviewOpen((value) => !value)}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
          >
            <Eye size={16} />
            {previewOpen ? "關閉預覽" : "儲存前預覽"}
          </button>
          <button
            type="button"
            onClick={saveHeroSlides}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={16} />
            儲存 Hero
          </button>
        </div>

        {previewOpen && previewSlides.length > 0 && (
          <div className="mt-6 max-h-[min(560px,80vh)] overflow-auto rounded-3xl border border-gray-200">
            <HeroSlider locale={activeLocale} slides={previewSlides} autoplaySeconds={0} />
          </div>
        )}
        {previewOpen && previewSlides.length === 0 && (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            目前無法預覽：請至少為一張 Hero「上傳圖片」並填寫標題（未上傳圖的項目不會出現在預覽中）。
          </p>
        )}

        <div className="mt-6 space-y-5">
          {activeHeroSlides.map((slide, index) => (
            <article key={slide.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                <div>
                  <div className="relative h-36 w-full max-w-[220px] overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white">
                    {slide.imageUrl ? (
                      <Image
                        src={slide.imageUrl}
                        alt={slide.imageAlt || slide.title}
                        width={880}
                        height={480}
                        sizes="220px"
                        className="h-full w-full object-cover"
                        unoptimized={slide.imageUrl.endsWith(".svg")}
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImagePlus className="text-gray-300" size={40} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <label className="relative mt-3 flex min-h-[42px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                    <span className="pointer-events-none select-none">上傳 Hero 圖片</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 cursor-pointer opacity-0"
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];
                        input.value = "";
                        if (!file) return;
                        const url = await uploadImage(file, "hero");
                        if (url) updateHeroSlide(index, { imageUrl: url });
                        requestAnimationFrame(() => input.blur());
                      }}
                    />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Hero 標題"><input value={slide.title} onChange={(e) => updateHeroSlide(index, { title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                  <Field label="Hero 副標"><input value={slide.subtitle} onChange={(e) => updateHeroSlide(index, { subtitle: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                  <Field label="按鈕文字"><input value={slide.buttonLabel} onChange={(e) => updateHeroSlide(index, { buttonLabel: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                  <Field label="按鈕連結"><input value={slide.buttonHref} onChange={(e) => updateHeroSlide(index, { buttonHref: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                  <Field
                    label={
                      activeLocale === "en"
                        ? "Image tap link (https or /path, optional)"
                        : "大圖點擊連結（https 或站內 / 路徑，選填）"
                    }
                  >
                    <input
                      value={slide.imageHref}
                      onChange={(e) => updateHeroSlide(index, { imageHref: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="https://..."
                    />
                  </Field>
                  <Field label="圖片替代文字 alt"><input value={slide.imageAlt} onChange={(e) => updateHeroSlide(index, { imageAlt: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs text-gray-600">
                      X %
                      <input type="number" min={0} max={100} value={slide.textX} onChange={(e) => updateHeroSlide(index, { textX: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="text-xs text-gray-600">
                      Y %
                      <input type="number" min={0} max={100} value={slide.textY} onChange={(e) => updateHeroSlide(index, { textY: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                    </label>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={slide.isActive} onChange={(e) => updateHeroSlide(index, { isActive: e.target.checked })} />
                    啟用
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setHeroSlides((prev) => ({
                        ...prev,
                        [activeLocale]: (prev[activeLocale] ?? []).filter((_, i) => i !== index),
                      }))
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-100 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                    刪除
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-bold text-gray-950">小圖輪播</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setCarouselItems((prev) => ({
                    ...prev,
                    [activeLocale]: [...(prev[activeLocale] ?? []), emptyCarouselItem(activeLocale)],
                  }))
                }
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Plus size={16} />
                新增小圖
              </button>
              <button
                type="button"
                onClick={saveCarouselItems}
                disabled={isPending}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Save size={16} />
                儲存小圖輪播
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {activeCarouselItems.map((item, index) => (
              <article key={item.id} className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div>
                    <div className="relative h-28 w-full max-w-[160px] overflow-hidden rounded-xl border border-dashed border-gray-300 bg-white">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.imageAlt || item.title}
                          width={640}
                          height={360}
                          sizes="160px"
                          className="h-full w-full object-cover"
                          unoptimized={item.imageUrl.endsWith(".svg")}
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImagePlus className="text-gray-300" size={36} aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    <label className="relative mt-2 flex min-h-[40px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                      <span className="pointer-events-none select-none">上傳小圖</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={async (event) => {
                          const input = event.currentTarget;
                          const file = input.files?.[0];
                          input.value = "";
                          if (!file) return;
                          const url = await uploadImage(file, "carousel");
                          if (url) updateCarouselItem(index, { imageUrl: url });
                          requestAnimationFrame(() => input.blur());
                        }}
                      />
                    </label>
                  </div>
                  <div className="space-y-2">
                    <Field label="小圖標題"><input value={item.title} onChange={(e) => updateCarouselItem(index, { title: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                    <Field label="小圖描述"><input value={item.description} onChange={(e) => updateCarouselItem(index, { description: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                    <Field
                      label={
                        activeLocale === "en"
                          ? "Link when tapping the card (https or /path)"
                          : "點擊圖卡導向的連結（https 或站內 / 路徑）"
                      }
                    >
                      <input value={item.href} onChange={(e) => updateCarouselItem(index, { href: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" placeholder="https://..." />
                    </Field>
                    <Field label="圖片替代文字 alt"><input value={item.imageAlt} onChange={(e) => updateCarouselItem(index, { imageAlt: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" /></Field>
                    <div className="flex items-center justify-between gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={item.isActive} onChange={(e) => updateCarouselItem(index, { isActive: e.target.checked })} />
                        啟用
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setCarouselItems((prev) => ({
                            ...prev,
                            [activeLocale]: (prev[activeLocale] ?? []).filter((_, i) => i !== index),
                          }))
                        }
                        className="text-sm font-semibold text-red-600"
                      >
                        刪除
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
