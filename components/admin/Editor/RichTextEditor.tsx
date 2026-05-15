// components/admin/Editor/RichTextEditor.tsx — Client Component
// Tiptap 富文本編輯器（可透過 ref 取得乾淨 HTML / ProseMirror JSON）

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
} from "lucide-react";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
} from "react";
import { convertMarkdownImagesToHtml } from "@/lib/markdown/images";

export interface RichTextEditorHandle {
  getHTML: () => string;
  getJSON: () => JSONContent;
}

interface Props {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

const RichTextEditor = forwardRef<RichTextEditorHandle, Props>(
  function RichTextEditor({ content, onChange, placeholder }, ref) {
    const normalizedContent = convertMarkdownImagesToHtml(content);
    const editor = useEditor({
      extensions: [
        StarterKit,
        ImageExt.configure({ inline: false }),
        LinkExt.configure({ openOnClick: false, autolink: true }),
        Placeholder.configure({ placeholder: placeholder ?? "開始輸入…" }),
        CharacterCount,
      ],
      content: normalizedContent,
      onUpdate: ({ editor: e }) => {
        const html = e.getHTML();
        const converted = convertMarkdownImagesToHtml(html);
        if (converted !== html) {
          e.commands.setContent(converted, false);
          onChange(converted);
          return;
        }
        onChange(html);
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
        getHTML: () => editor?.getHTML() ?? "",
        getJSON: () => editor?.getJSON() ?? { type: "doc", content: [] },
      }),
      [editor]
    );

    useEffect(() => {
      const nextContent = convertMarkdownImagesToHtml(content);
      if (editor && nextContent !== editor.getHTML()) {
        editor.commands.setContent(nextContent, false);
      }
    }, [editor, content]);

    const insertLink = useCallback(() => {
      if (!editor) return;
      const url = window.prompt("請輸入連結 URL");
      if (!url) return;
      editor.chain().focus().setLink({ href: url }).run();
    }, [editor]);

    const insertImage = useCallback(() => {
      if (!editor) return;
      const url = window.prompt("請輸入圖片 URL");
      if (!url) return;
      editor.chain().focus().setImage({ src: url }).run();
    }, [editor]);

    if (!editor) return null;

    const charCount = editor.storage.characterCount?.characters() ?? 0;

    return (
      <div className="overflow-hidden rounded-xl border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        <div
          role="toolbar"
          aria-label="文字格式工具列"
          className="flex flex-wrap gap-0.5 border-b border-gray-200 bg-gray-50 p-2"
        >
          {[
            {
              icon: Undo,
              label: "復原",
              action: () => editor.chain().focus().undo().run(),
              active: false,
            },
            {
              icon: Redo,
              label: "重做",
              action: () => editor.chain().focus().redo().run(),
              active: false,
            },
            {
              icon: Bold,
              label: "粗體",
              action: () => editor.chain().focus().toggleBold().run(),
              active: editor.isActive("bold"),
            },
            {
              icon: Italic,
              label: "斜體",
              action: () => editor.chain().focus().toggleItalic().run(),
              active: editor.isActive("italic"),
            },
            {
              icon: List,
              label: "無序列表",
              action: () =>
                editor.chain().focus().toggleBulletList().run(),
              active: editor.isActive("bulletList"),
            },
            {
              icon: ListOrdered,
              label: "有序列表",
              action: () =>
                editor.chain().focus().toggleOrderedList().run(),
              active: editor.isActive("orderedList"),
            },
            {
              icon: Quote,
              label: "引用",
              action: () =>
                editor.chain().focus().toggleBlockquote().run(),
              active: editor.isActive("blockquote"),
            },
            {
              icon: Code,
              label: "程式碼",
              action: () =>
                editor.chain().focus().toggleCodeBlock().run(),
              active: editor.isActive("codeBlock"),
            },
            {
              icon: LinkIcon,
              label: "插入連結",
              action: insertLink,
              active: editor.isActive("link"),
            },
            {
              icon: ImageIcon,
              label: "插入圖片",
              action: insertImage,
              active: false,
            },
          ].map(({ icon: Icon, label, action, active }) => (
            <button
              key={label}
              type="button"
              onClick={action}
              aria-label={label}
              aria-pressed={active}
              className={[
                "rounded-md p-1.5 text-gray-500 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
                active
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-gray-200 hover:text-gray-700",
              ].join(" ")}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          ))}
        </div>

        <EditorContent editor={editor} />

        <div className="border-t border-gray-100 bg-gray-50 px-4 py-1.5 text-right text-xs text-gray-400">
          {charCount.toLocaleString()} 字
        </div>
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";

export default RichTextEditor;
