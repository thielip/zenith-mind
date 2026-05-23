"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { SiteSettingsData } from "@/lib/site/types";
import LazyFacebookEmbed from "@/components/layout/LazyFacebookEmbed";

interface Props {
  settings: SiteSettingsData;
  locale: string;
}

function LazyInstagramEmbed({ embedUrl }: { embedUrl: string }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "240px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="min-h-[220px] w-full">
      {show ? (
        <iframe
          title="Instagram embed"
          src={embedUrl}
          height="220"
          className="w-full rounded-xl border border-gray-100"
          loading="lazy"
        />
      ) : null}
    </div>
  );
}

export default function SocialSidebar({ settings, locale }: Props) {
  const isEn = locale === "en";
  const { facebookPageUrl, youtubeChannelUrl, instagramUrl, lineUrl, lineLabel } =
    settings.socialLinks;
  const [lineQrCode, setLineQrCode] = useState("");
  const [visible, setVisible] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const hasSocial =
    settings.socialSidebarActive &&
    (facebookPageUrl || youtubeChannelUrl || instagramUrl || settings.instagramEmbedUrl || lineUrl);

  useEffect(() => {
    const el = asideRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "320px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible || !lineUrl) {
      setLineQrCode("");
      return;
    }
    let cancelled = false;
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(lineUrl, {
          margin: 1,
          width: 180,
          color: { dark: "#111827", light: "#ffffff" },
        })
      )
      .then((url) => {
        if (!cancelled) setLineQrCode(url);
      })
      .catch(() => {
        if (!cancelled) setLineQrCode("");
      });
    return () => {
      cancelled = true;
    };
  }, [lineUrl, visible]);

  if (!hasSocial) return null;

  return (
    <aside
      ref={asideRef}
      aria-label={isEn ? "Social channels" : "社群頻道"}
      className="mx-auto w-full max-w-6xl px-4 pb-10 xl:fixed xl:right-4 xl:top-36 xl:z-30 xl:w-72 xl:px-0 xl:pb-0"
    >
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white/95 shadow-xl shadow-gray-200/70 backdrop-blur">
        <div className="border-b border-gray-100 bg-gray-950 px-4 py-3 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
            {isEn ? "Follow Zenith" : "追蹤巔峰思維"}
          </p>
        </div>
        <div className="space-y-3 p-4">
          {facebookPageUrl ? <LazyFacebookEmbed pageUrl={facebookPageUrl} /> : null}

          {youtubeChannelUrl && (
            <a
              href={youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              YouTube
              <span className="mt-1 block text-xs font-normal text-red-800">
                {isEn ? "Visit the channel" : "前往頻道觀看最新內容"}
              </span>
            </a>
          )}

          {settings.instagramEmbedUrl ? (
            <LazyInstagramEmbed embedUrl={settings.instagramEmbedUrl} />
          ) : instagramUrl ? (
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-800 hover:bg-pink-100 focus:outline-none focus:ring-2 focus:ring-pink-400"
            >
              Instagram
              <span className="mt-1 block text-xs font-normal text-pink-800">
                {isEn ? "Open Instagram" : "查看 Instagram 最新貼文"}
              </span>
            </a>
          ) : null}

          {lineUrl && (
            <a
              href={lineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl border border-green-100 bg-green-50 px-4 py-3 text-center text-sm font-semibold text-green-800 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-400"
            >
              {lineQrCode ? (
                <Image
                  src={lineQrCode}
                  alt=""
                  width={180}
                  height={180}
                  unoptimized
                  className="mx-auto rounded-xl bg-white p-2"
                  aria-hidden
                />
              ) : (
                <span className="mx-auto flex h-40 items-center justify-center rounded-xl bg-white text-xs text-green-700">
                  LINE
                </span>
              )}
              <span className="mt-2 block">{lineLabel || (isEn ? "Official LINE" : "官方帳號")}</span>
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}
