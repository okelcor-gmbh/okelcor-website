"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import { useState, useCallback, useEffect, useRef, lazy, Suspense } from "react";
const MediaPickerModal = lazy(() => import("@/components/admin/media-picker-modal"));
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Minus,
  LinkIcon, ImageIcon, TableIcon,
  AlignLeft, AlignCenter, AlignRight,
  Undo2, Redo2,
  Code, Code2,
  Eye, Pen, FileCode,
} from "lucide-react";

// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeHtml(html: string): string {
  if (typeof window === "undefined") return html;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DOMPurify = require("dompurify") as { sanitize: (html: string, cfg?: Record<string, unknown>) => string };
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "p", "h1", "h2", "h3", "h4", "h5", "h6",
        "strong", "em", "u", "s", "code", "pre",
        "ul", "ol", "li", "blockquote",
        "table", "thead", "tbody", "tr", "th", "td",
        "a", "img", "br", "hr", "div", "span",
      ],
      ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "style", "target", "rel"],
      ALLOW_DATA_ATTR: false,
    });
  } catch {
    return html;
  }
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function ToolBtn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      disabled={disabled}
      title={title}
      className={[
        "flex h-7 w-7 items-center justify-center rounded-lg text-[0.75rem] transition",
        active
          ? "bg-[#E85C1A] text-white"
          : "text-[#5c5e62] hover:bg-[#f0f2f5] hover:text-[#1a1a1a]",
        disabled ? "pointer-events-none opacity-30" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px shrink-0 bg-black/[0.1]" />;
}

// ── Link dialog ───────────────────────────────────────────────────────────────

function LinkDialog({
  initialUrl,
  onConfirm,
  onRemove,
  onCancel,
}: {
  initialUrl: string;
  onConfirm: (url: string) => void;
  onRemove: () => void;
  onCancel: () => void;
}) {
  const [url, setUrl] = useState(initialUrl);
  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-72 rounded-xl border border-black/[0.1] bg-white p-3 shadow-xl">
      <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Insert Link</p>
      <input
        autoFocus
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onConfirm(url); } if (e.key === "Escape") onCancel(); }}
        placeholder="https://…"
        className="mb-2 h-8 w-full rounded-lg border border-black/[0.09] px-2.5 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
      />
      <div className="flex gap-2">
        <button type="button" onClick={() => onConfirm(url)}
          className="h-7 flex-1 rounded-lg bg-[#E85C1A] text-[0.78rem] font-semibold text-white transition hover:bg-[#d14f14]">
          Apply
        </button>
        {initialUrl && (
          <button type="button" onClick={onRemove}
            className="h-7 flex-1 rounded-lg border border-red-200 bg-red-50 text-[0.78rem] font-semibold text-red-600 transition hover:bg-red-100">
            Remove
          </button>
        )}
        <button type="button" onClick={onCancel}
          className="h-7 flex-1 rounded-lg border border-black/[0.09] bg-white text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Image dialog (URL + optional file upload) ─────────────────────────────────

function ImageDialog({
  onConfirmUrl,
  onUploadFile,
  onOpenMediaPicker,
  onCancel,
}: {
  onConfirmUrl: (url: string, alt: string) => void;
  onUploadFile?: (file: File, alt: string) => void;
  onOpenMediaPicker?: () => void;
  onCancel: () => void;
}) {
  const [tab, setTab] = useState<"url" | "upload">(onUploadFile ? "upload" : "url");
  const [url, setUrl] = useState("");
  const [alt, setAlt] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="absolute left-0 top-full z-50 mt-1 w-80 rounded-xl border border-black/[0.1] bg-white p-3 shadow-xl">
      <p className="mb-2 text-[0.72rem] font-bold uppercase tracking-[0.1em] text-[#5c5e62]">Insert Image</p>

      {/* Tab selector */}
      {onUploadFile && (
        <div className="mb-2 flex rounded-lg border border-black/[0.08] bg-[#f5f5f5] p-0.5">
          {(["upload", "url"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-md py-1 text-[0.75rem] font-semibold transition ${
                tab === t ? "bg-white shadow-sm text-[#1a1a1a]" : "text-[#5c5e62]"
              }`}
            >
              {t === "upload" ? "Upload file" : "Paste URL"}
            </button>
          ))}
        </div>
      )}

      {tab === "upload" && onUploadFile ? (
        <>
          <div
            onClick={() => fileRef.current?.click()}
            className="mb-2 flex h-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-black/[0.1] bg-[#fafafa] text-[0.78rem] font-semibold text-[#aaa] transition hover:border-[#E85C1A] hover:text-[#E85C1A]"
          >
            {file ? file.name : "Click to pick a file"}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </>
      ) : (
        <input
          autoFocus
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Image URL (https://…)"
          className="mb-2 h-8 w-full rounded-lg border border-black/[0.09] px-2.5 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
        />
      )}

      <input
        type="text"
        value={alt}
        onChange={(e) => setAlt(e.target.value)}
        placeholder="Alt text (for SEO and accessibility)"
        className="mb-2 h-8 w-full rounded-lg border border-black/[0.09] px-2.5 text-[0.83rem] text-[#1a1a1a] outline-none focus:border-[#E85C1A]"
      />

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (tab === "upload" && file && onUploadFile) {
              onUploadFile(file, alt.trim());
            } else if (tab === "url" && url.trim()) {
              onConfirmUrl(url.trim(), alt.trim());
            }
          }}
          disabled={tab === "upload" ? !file : !url.trim()}
          className="h-7 flex-1 rounded-lg bg-[#E85C1A] text-[0.78rem] font-semibold text-white transition hover:bg-[#d14f14] disabled:opacity-50"
        >
          Insert
        </button>
        <button type="button" onClick={onCancel}
          className="h-7 flex-1 rounded-lg border border-black/[0.09] bg-white text-[0.78rem] font-semibold text-[#5c5e62] transition hover:bg-[#f0f2f5]">
          Cancel
        </button>
      </div>

      {onOpenMediaPicker && (
        <button
          type="button"
          onClick={onOpenMediaPicker}
          className="mt-2 w-full rounded-lg border border-black/[0.08] bg-[#f5f5f5] py-1 text-[0.74rem] font-semibold text-[#5c5e62] transition hover:bg-[#ebebeb]"
        >
          Browse Media Library →
        </button>
      )}
    </div>
  );
}

// ── Toolbar ───────────────────────────────────────────────────────────────────

function Toolbar({
  editor,
  onToggleHtml,
  uploadBodyImage,
  onOpenMediaPicker,
}: {
  editor: Editor | null;
  onToggleHtml: () => void;
  uploadBodyImage?: (file: File) => Promise<string | null>;
  onOpenMediaPicker?: () => void;
}) {
  const [showLink,  setShowLink]  = useState(false);
  const [showImage, setShowImage] = useState(false);

  if (!editor) return null;

  const handleLinkConfirm = (url: string) => {
    if (!url.trim()) { editor.chain().focus().unsetLink().run(); }
    else { editor.chain().focus().extendMarkRange("link").setLink({ href: url, target: "_blank" }).run(); }
    setShowLink(false);
  };

  const handleImageConfirmUrl = (url: string, alt: string) => {
    editor.chain().focus().setImage({ src: url, alt }).run();
    setShowImage(false);
  };

  const handleImageUploadFile = async (file: File, alt: string) => {
    if (!uploadBodyImage) return;
    const url = await uploadBodyImage(file);
    if (url) editor.chain().focus().setImage({ src: url, alt }).run();
    setShowImage(false);
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="relative flex flex-wrap items-center gap-0.5 border-b border-black/[0.07] bg-[#fafafa] px-3 py-2">

      {/* Undo / Redo */}
      <ToolBtn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
        <Undo2 size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
        <Redo2 size={13} strokeWidth={2} />
      </ToolBtn>

      <Divider />

      {/* Headings */}
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Heading 1">
        <Heading1 size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
        <Heading2 size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
        <Heading3 size={13} strokeWidth={2} />
      </ToolBtn>

      <Divider />

      {/* Inline marks */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
        <Bold size={13} strokeWidth={2.5} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
        <Italic size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Underline">
        <UnderlineIcon size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Strikethrough">
        <Strikethrough size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
        <Code size={13} strokeWidth={2} />
      </ToolBtn>

      <Divider />

      {/* Lists */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
        <List size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
        <ListOrdered size={13} strokeWidth={2} />
      </ToolBtn>

      <Divider />

      {/* Block elements */}
      <ToolBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
        <Quote size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="Code block">
        <Code2 size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
        <Minus size={13} strokeWidth={2} />
      </ToolBtn>

      <Divider />

      {/* Alignment */}
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Align left">
        <AlignLeft size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Align center">
        <AlignCenter size={13} strokeWidth={2} />
      </ToolBtn>
      <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Align right">
        <AlignRight size={13} strokeWidth={2} />
      </ToolBtn>

      <Divider />

      {/* Link */}
      <div className="relative">
        <ToolBtn
          onClick={() => { setShowImage(false); setShowLink((v) => !v); }}
          active={editor.isActive("link") || showLink}
          title="Insert/edit link"
        >
          <LinkIcon size={13} strokeWidth={2} />
        </ToolBtn>
        {showLink && (
          <LinkDialog
            initialUrl={editor.getAttributes("link").href ?? ""}
            onConfirm={handleLinkConfirm}
            onRemove={() => { editor.chain().focus().unsetLink().run(); setShowLink(false); }}
            onCancel={() => setShowLink(false)}
          />
        )}
      </div>

      {/* Image */}
      <div className="relative">
        <ToolBtn
          onClick={() => { setShowLink(false); setShowImage((v) => !v); }}
          active={showImage}
          title="Insert image by URL"
        >
          <ImageIcon size={13} strokeWidth={2} />
        </ToolBtn>
        {showImage && (
          <ImageDialog
            onConfirmUrl={handleImageConfirmUrl}
            onUploadFile={uploadBodyImage ? handleImageUploadFile : undefined}
            onOpenMediaPicker={onOpenMediaPicker ? () => { setShowImage(false); onOpenMediaPicker(); } : undefined}
            onCancel={() => setShowImage(false)}
          />
        )}
      </div>

      {/* Table */}
      <ToolBtn onClick={insertTable} title="Insert table">
        <TableIcon size={13} strokeWidth={2} />
      </ToolBtn>

      {/* HTML/Source mode toggle */}
      <div className="ml-auto">
        <ToolBtn onClick={onToggleHtml} title="Edit raw HTML source">
          <FileCode size={13} strokeWidth={2} />
        </ToolBtn>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type EditorMode = "editor" | "preview" | "html";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  /** When provided, enables inline image upload via drag/drop, paste, and toolbar file picker. */
  articleId?: number;
};

export default function ArticleRichEditor({
  value,
  onChange,
  placeholder = "Write the article body…",
  minHeight = 320,
  articleId,
}: Props) {
  const [mode, setMode] = useState<EditorMode>("editor");
  const [htmlSource, setHtmlSource] = useState(value);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // Stable ref so ProseMirror handlers can always reach the latest upload fn
  const articleIdRef = useRef(articleId);
  articleIdRef.current = articleId;

  const uploadBodyImage = useCallback(async (file: File): Promise<string | null> => {
    const id = articleIdRef.current;
    if (!id) return null;
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`/api/admin/articles/${id}/body-image`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) return null;
      const json = await res.json();
      return (json.data?.url as string) ?? null;
    } catch {
      return null;
    }
  }, []);

  const editor = useEditor({
    extensions: [
      // StarterKit v3 bundles extension-link + extension-underline internally.
      // Disable them here so we can configure them ourselves below.
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener noreferrer" } }),
      Image.configure({ inline: false, allowBase64: false }),
      Table.configure({ resizable: false }),
      TableRow,
      TableHeader,
      TableCell,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    onUpdate({ editor }) {
      const html = editor.getHTML();
      onChange(html);
      setHtmlSource(html);
    },
    editorProps: {
      attributes: {
        class: "article-editor-content outline-none",
        style: `min-height:${minHeight}px`,
      },
      handleDrop(view, event, _slice, moved) {
        if (moved || !event.dataTransfer?.files?.length) return false;
        const file = event.dataTransfer.files[0];
        if (!file.type.startsWith("image/") || !articleIdRef.current) return false;
        event.preventDefault();
        const posInfo = view.posAtCoords({ left: event.clientX, top: event.clientY });
        const insertPos = posInfo?.pos ?? view.state.selection.from;
        uploadBodyImage(file).then((url) => {
          if (!url) return;
          const imageNode = view.state.schema.nodes.image?.create({ src: url, alt: "" });
          if (!imageNode) return;
          view.dispatch(view.state.tr.insert(insertPos, imageNode));
        });
        return true;
      },
      handlePaste(view, event) {
        const items = Array.from(event.clipboardData?.items ?? []);
        const imageItem = items.find((i) => i.type.startsWith("image/"));
        if (!imageItem || !articleIdRef.current) return false;
        const file = imageItem.getAsFile();
        if (!file) return false;
        const pos = view.state.selection.from;
        uploadBodyImage(file).then((url) => {
          if (!url) return;
          const imageNode = view.state.schema.nodes.image?.create({ src: url, alt: "" });
          if (!imageNode) return;
          view.dispatch(view.state.tr.insert(pos, imageNode));
        });
        return true;
      },
    },
    immediatelyRender: false,
  });

  // Sync value → editor when parent changes locale tab (e.g. EN → DE switch).
  useEffect(() => {
    if (!editor) return;
    if (editor.getHTML() !== value) {
      editor.commands.setContent(value);
      setHtmlSource(value);
    }
  // editor is intentionally omitted — it's stable after mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleHtmlBlur = useCallback(() => {
    if (!editor) return;
    editor.commands.setContent(htmlSource);
    onChange(htmlSource);
  }, [editor, htmlSource, onChange]);

  const handleToggleHtml = () => {
    if (mode === "html") {
      setMode("editor");
    } else {
      setHtmlSource(editor?.getHTML() ?? value);
      setMode("html");
    }
  };

  const previewHtml = sanitizeHtml(editor?.getHTML() ?? value);

  return (
    <div className="overflow-hidden rounded-xl border border-black/[0.09] bg-white transition focus-within:border-[#E85C1A] focus-within:ring-2 focus-within:ring-[#E85C1A]/10">

      {/* ── Mode tab bar ── */}
      <div className="flex items-center justify-between border-b border-black/[0.07] bg-[#fafafa] px-3 py-1.5">
        <div className="flex gap-1">
          {(["editor", "preview", "html"] as EditorMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                if (m === "html") { handleToggleHtml(); return; }
                if (mode === "html") {
                  editor?.commands.setContent(htmlSource);
                  onChange(htmlSource);
                }
                setMode(m);
              }}
              className={[
                "flex items-center gap-1.5 rounded-lg px-3 py-1 text-[0.75rem] font-semibold capitalize transition",
                mode === m
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#5c5e62] hover:text-[#1a1a1a]",
              ].join(" ")}
            >
              {m === "editor"  && <Pen      size={11} strokeWidth={2} />}
              {m === "preview" && <Eye      size={11} strokeWidth={2} />}
              {m === "html"    && <FileCode size={11} strokeWidth={2} />}
              {m === "editor" ? "Write" : m === "preview" ? "Preview" : "HTML"}
            </button>
          ))}
        </div>
        <span className="text-[0.68rem] text-[#aaa]">
          {mode === "preview" ? "Read-only preview" : mode === "html" ? "Raw HTML source" : "Rich text"}
        </span>
      </div>

      {/* ── Toolbar (editor mode only) ── */}
      {mode === "editor" && (
        <Toolbar
          editor={editor}
          onToggleHtml={handleToggleHtml}
          uploadBodyImage={articleId ? uploadBodyImage : undefined}
          onOpenMediaPicker={() => setShowMediaPicker(true)}
        />
      )}

      {/* ── Editor ── */}
      {mode === "editor" && (
        <div className="px-4 py-3 [&_.article-editor-content]:text-[0.9rem] [&_.article-editor-content]:leading-7 [&_.article-editor-content]:text-[#1a1a1a]
          [&_.article-editor-content_h1]:mt-4 [&_.article-editor-content_h1]:mb-2 [&_.article-editor-content_h1]:text-[1.5rem] [&_.article-editor-content_h1]:font-extrabold
          [&_.article-editor-content_h2]:mt-4 [&_.article-editor-content_h2]:mb-2 [&_.article-editor-content_h2]:text-[1.25rem] [&_.article-editor-content_h2]:font-bold
          [&_.article-editor-content_h3]:mt-3 [&_.article-editor-content_h3]:mb-1.5 [&_.article-editor-content_h3]:text-[1.05rem] [&_.article-editor-content_h3]:font-bold
          [&_.article-editor-content_p]:mb-3
          [&_.article-editor-content_ul]:mb-3 [&_.article-editor-content_ul]:ml-5 [&_.article-editor-content_ul]:list-disc
          [&_.article-editor-content_ol]:mb-3 [&_.article-editor-content_ol]:ml-5 [&_.article-editor-content_ol]:list-decimal
          [&_.article-editor-content_li]:mb-1
          [&_.article-editor-content_blockquote]:border-l-4 [&_.article-editor-content_blockquote]:border-[#E85C1A]/40 [&_.article-editor-content_blockquote]:pl-4 [&_.article-editor-content_blockquote]:italic [&_.article-editor-content_blockquote]:text-[#5c5e62] [&_.article-editor-content_blockquote]:mb-3
          [&_.article-editor-content_hr]:my-4 [&_.article-editor-content_hr]:border-black/[0.1]
          [&_.article-editor-content_code]:rounded [&_.article-editor-content_code]:bg-[#f0f2f5] [&_.article-editor-content_code]:px-1.5 [&_.article-editor-content_code]:py-0.5 [&_.article-editor-content_code]:font-mono [&_.article-editor-content_code]:text-[0.82rem]
          [&_.article-editor-content_pre]:rounded-xl [&_.article-editor-content_pre]:bg-[#1a1a1a] [&_.article-editor-content_pre]:p-4 [&_.article-editor-content_pre]:font-mono [&_.article-editor-content_pre]:text-[0.82rem] [&_.article-editor-content_pre]:text-[#e0e0e0] [&_.article-editor-content_pre]:mb-3 [&_.article-editor-content_pre]:overflow-x-auto
          [&_.article-editor-content_a]:text-[#E85C1A] [&_.article-editor-content_a]:underline
          [&_.article-editor-content_img]:max-w-full [&_.article-editor-content_img]:rounded-xl [&_.article-editor-content_img]:my-3
          [&_.article-editor-content_table]:w-full [&_.article-editor-content_table]:border-collapse [&_.article-editor-content_table]:mb-3
          [&_.article-editor-content_th]:border [&_.article-editor-content_th]:border-black/[0.12] [&_.article-editor-content_th]:bg-[#f5f5f5] [&_.article-editor-content_th]:px-3 [&_.article-editor-content_th]:py-2 [&_.article-editor-content_th]:text-left [&_.article-editor-content_th]:text-[0.82rem] [&_.article-editor-content_th]:font-bold
          [&_.article-editor-content_td]:border [&_.article-editor-content_td]:border-black/[0.09] [&_.article-editor-content_td]:px-3 [&_.article-editor-content_td]:py-2 [&_.article-editor-content_td]:text-[0.85rem]
          [&_.tiptap_p.is-editor-empty:first-child::before]:text-[#aaa] [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0">
          <EditorContent editor={editor} />
        </div>
      )}

      {/* ── Preview ── */}
      {mode === "preview" && (
        <div
          className="article-preview-body px-4 py-4 text-[0.9rem] leading-7 text-[#1a1a1a]
            [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-[1.5rem] [&_h1]:font-extrabold
            [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-[1.25rem] [&_h2]:font-bold
            [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:text-[1.05rem] [&_h3]:font-bold
            [&_p]:mb-3
            [&_ul]:mb-3 [&_ul]:ml-5 [&_ul]:list-disc
            [&_ol]:mb-3 [&_ol]:ml-5 [&_ol]:list-decimal
            [&_li]:mb-1
            [&_blockquote]:border-l-4 [&_blockquote]:border-[#E85C1A]/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-[#5c5e62] [&_blockquote]:mb-3
            [&_hr]:my-4 [&_hr]:border-black/[0.1]
            [&_code]:rounded [&_code]:bg-[#f0f2f5] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.82rem]
            [&_pre]:rounded-xl [&_pre]:bg-[#1a1a1a] [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[0.82rem] [&_pre]:text-[#e0e0e0] [&_pre]:mb-3 [&_pre]:overflow-x-auto
            [&_a]:text-[#E85C1A] [&_a]:underline
            [&_img]:max-w-full [&_img]:rounded-xl [&_img]:my-3
            [&_table]:w-full [&_table]:border-collapse [&_table]:mb-3
            [&_th]:border [&_th]:border-black/[0.12] [&_th]:bg-[#f5f5f5] [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:text-[0.82rem] [&_th]:font-bold
            [&_td]:border [&_td]:border-black/[0.09] [&_td]:px-3 [&_td]:py-2 [&_td]:text-[0.85rem]"
          style={{ minHeight: minHeight }}
          dangerouslySetInnerHTML={{ __html: previewHtml }}
        />
      )}

      {/* ── HTML source ── */}
      {mode === "html" && (
        <textarea
          value={htmlSource}
          onChange={(e) => setHtmlSource(e.target.value)}
          onBlur={handleHtmlBlur}
          spellCheck={false}
          className="w-full resize-y bg-[#1a1a1a] px-4 py-3 font-mono text-[0.78rem] leading-6 text-[#e0e0e0] outline-none"
          style={{ minHeight: minHeight }}
        />
      )}

      {/* ── Media picker modal ── */}
      {showMediaPicker && (
        <Suspense fallback={null}>
          <MediaPickerModal
            onSelect={(url, alt) => {
              editor?.chain().focus().setImage({ src: url, alt }).run();
              setShowMediaPicker(false);
            }}
            onClose={() => setShowMediaPicker(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
