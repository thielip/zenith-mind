"use client";

import RichTextEditor from "@/components/admin/Editor/RichTextEditor";

interface Props {
  htmlZh: string;
  htmlEn: string;
  onChangeZh: (html: string) => void;
  onChangeEn: (html: string) => void;
}

export default function LegalHtmlCmsEditor({
  htmlZh,
  htmlEn,
  onChangeZh,
  onChangeEn,
}: Props) {
  return (
    <div className="space-y-8">
      <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-bold text-gray-700">HTML 內容編輯器（繁中）</p>
        <RichTextEditor
          content={htmlZh}
          onChange={onChangeZh}
          placeholder="輸入隱私權政策或服務條款（繁中）…"
        />
      </div>
      <div className="space-y-3 rounded-xl border border-gray-100 bg-white p-4">
        <p className="text-xs font-bold text-gray-700">HTML 內容編輯器（英文）</p>
        <RichTextEditor
          content={htmlEn}
          onChange={onChangeEn}
          placeholder="Privacy policy or terms (English)…"
          modeLabels={{ visual: "Visual", source: "HTML source" }}
        />
      </div>
    </div>
  );
}
