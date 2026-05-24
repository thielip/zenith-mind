// components/admin/Editor/RichTextEditor.tsx — Client Component
// Tiptap 富文本編輯器（視覺編輯 / HTML 原始碼雙模式）

"use client";

import {
  useEditor,
  EditorContent,
  type JSONContent,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import LinkExt from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  Undo,
  Redo,
  Eye,
  FileCode,
} from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { convertMarkdownImagesToHtml } from "@/lib/markdown/images";

export interface RichTextEditorHandle {
  getHTML: () => string;
  getJSON: () => JSONContent;
}

type EditorMode = "visual" | "source";

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** 視覺／原始碼按鈕文案（英文編輯器可傳入英文） */
  modeLabels?: { visual: string; source: string };
}

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor({ content, onChange, placeholder, modeLabels }, ref) {
    const normalizedContent = convertMarkdownImagesToHtml(content);
    const [mode, setMode] = useState<EditorMode>("visual");
    const [sourceHtml, setSourceHtml] = useState(normalizedContent);
    const modeRef = useRef<EditorMode>(mode);
    modeRef.current = mode;

    const visualLabel = modeLabels?.visual ?? "視覺編輯";
    const sourceLabel = modeLabels?.source ?? "HTML 原始碼";

    const editor = useEditor({
      immediatelyRender: false,
      extensions: [
        StarterKit,
        ImageExt.configure({ inline: false }),
        LinkExt.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({ placeholder: placeholder ?? "開始輸入…" }),
        CharacterCount,
      ],
      content: normalizedContent,
      onUpdate: ({ editor: e }) => {
        if (modeRef.current !== "visual") return;
        const html = e.getHTML();
        const converted = convertMarkdownImagesToHtml(html);
        if (converted !== html) {
          e.commands.setContent(converted, false);
          onChange(converted);
          setSourceHtml(converted);
          return;
        }
        onChange(html);
        setSourceHtml(html);
      },
      editorProps: {
        attributes: {
          class:
            "prose prose-gray max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
          "aria-label": "文章內容編輯區",
          "aria-multiline": "true",
          role: "textbox",
        },
      },
    });

    useImperativeHandle(
      ref,
      () => ({
        getHTML: () =>
          mode === "source"
            ? convertMarkdownImagesToHtml(sourceHtml)
            : editor?.getHTML() ?? sourceHtml,
        getJSON: () => editor?.getJSON() ?? { type: "doc", content: [] },
      }),
      [editor, mode, sourceHtml]
    );

    useEffect(() => {
      const nextContent = convertMarkdownImagesToHtml(content);
      setSourceHtml(nextContent);
      if (mode === "visual" && editor && nextContent !== editor.getHTML()) {
        editor.commands.setContent(nextContent, false);
      }
    }, [editor, content, mode]);

    const switchToVisual = useCallback(() => {
      if (!editor) {
        setMode("visual");
        return;
      }
      const html = convertMarkdownImagesToHtml(sourceHtml);
      editor.commands.setContent(html, false);
      onChange(html);
      setSourceHtml(html);
      setMode("visual");
    }, [editor, sourceHtml, onChange]);

    const switchToSource = useCallback(() => {
      const html = convertMarkdownImagesToHtml(editor?.getHTML() ?? sourceHtml);
      setSourceHtml(html);
      onChange(html);
      setMode("source");
    }, [editor, sourceHtml, onChange]);

    const insertLink = useCallback(() => {
      if (!editor || mode !== "visual") return;
      const url = window.prompt("請輸入連結 URL");
      if (!url) return;
      editor.chain().focus().setLink({ href: url }).run();
    }, [editor, mode]);

    const insertImage = useCallback(() => {
      if (!editor || mode !== "visual") return;
      const url = window.prompt("請輸入圖片 URL");
      if (!url) return;
      editor.chain().focus().setImage({ src: url }).run();
    }, [editor, mode]);

    if (!editor) return null;

    const charCount =
      mode === "source"
        ? sourceHtml.length
        : (editor.storage.characterCount?.characters() ?? 0);

    const formatButtons = [
      {
        icon: Undo,
        label: "復原",
        action: () => editor.chain().focus().undo().run(),
        active: false,
        disabled: mode !== "visual",
      },
      {
        icon: Redo,
        label: "重做",
        action: () => editor.chain().focus().redo().run(),
        active: false,
        disabled: mode !== "visual",
      },
      {
        icon: Bold,
        label: "粗體",
        action: () => editor.chain().focus().toggleBold().run(),
        active: editor.isActive("bold"),
        disabled: mode !== "visual",
      },
      {
        icon: Italic,
        label: "斜體",
        action: () => editor.chain().focus().toggleItalic().run(),
        active: editor.isActive("italic"),
        disabled: mode !== "visual",
      },
      {
        icon: List,
        label: "無序列表",
        action: () => editor.chain().focus().toggleBulletList().run(),
        active: editor.isActive("bulletList"),
        disabled: mode !== "visual",
      },
      {
        icon: ListOrdered,
        label: "有序列表",
        action: () => editor.chain().focus().toggleOrderedList().run(),
        active: editor.isActive("orderedList"),
        disabled: mode !== "visual",
      },
      {
        icon: Quote,
        label: "引用",
        action: () => editor.chain().focus().toggleBlockquote().run(),
        active: editor.isActive("blockquote"),
        disabled: mode !== "visual",
      },
      {
        icon: Code,
        label: "程式碼",
        action: () => editor.chain().focus().toggleCodeBlock().run(),
        active: editor.isActive("codeBlock"),
        disabled: mode !== "visual",
      },
      {
        icon: LinkIcon,
        label: "插入連結",
        action: insertLink,
        active: editor.isActive("link"),
        disabled: mode !== "visual",
      },
      {
        icon: ImageIcon,
        label: "插入圖片",
        action: insertImage,
        active: false,
        disabled: mode !== "visual",
      },
    ] as const;

    return (
      <div className="overflow-hidden rounded-xl border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <div
          role="toolbar"
          aria-label="文字格式工具列"
          className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 p-2"
        >
          {formatButtons.map(({ icon: Icon, label, action, active, disabled }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              disabled={disabled}
              aria-label={label}
              aria-pressed={active}
              className={[
                "rounded-md p-1.5 text-gray-500 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                "disabled:cursor-not-allowed disabled:opacity-40",
                active
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-200 hover:text-gray-700",
              ].join(" ")}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          ))}

          <span className="mx-1 h-5 w-px bg-gray-300" aria-hidden="true" />

          <button
            type="button"
            onClick={switchToVisual}
            aria-pressed={mode === "visual"}
            aria-label={`${visualLabel}模式`}
            className={[
              "inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              mode === "visual"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            <Eye size={14} aria-hidden="true" />
            {visualLabel}
          </button>
          <button
            type="button"
            onClick={switchToSource}
            aria-pressed={mode === "source"}
            aria-label={`${sourceLabel}模式`}
            className={[
              "inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              mode === "source"
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-200",
            ].join(" ")}
          >
            <FileCode size={14} aria-hidden="true" />
            {sourceLabel}
          </button>
        </div>

        {mode === "visual" ? (
          <EditorContent editor={editor} />
        ) : (
          <textarea
            value={sourceHtml}
            onChange={(e) => {
              const html = e.target.value;
              setSourceHtml(html);
              onChange(html);
            }}
            spellCheck={false}
            aria-label="HTML 原始碼編輯區"
            className="min-h-[400px] w-full resize-y border-0 bg-gray-950 px-4 py-3 font-mono text-sm leading-relaxed text-emerald-100 focus:outline-none"
            placeholder={placeholder ?? "貼上或編輯 HTML…"}
          />
        )}

        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-1.5 text-xs text-gray-400">
          <span>{mode === "visual" ? visualLabel : sourceLabel}</span>
          <span>{charCount.toLocaleString()} 字</span>
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
