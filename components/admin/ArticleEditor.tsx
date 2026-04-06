"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import CharacterCount from "@tiptap/extension-character-count";
import {
  Bold,
  Italic,
  UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Link2,
  ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  Highlighter,
  RemoveFormatting,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCallback, useRef } from "react";

interface ArticleEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

type Level = 1 | 2 | 3;

export function ArticleEditor({
  content,
  onChange,
  placeholder = "Start writing your article...",
}: ArticleEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full my-4" },
        allowBase64: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Highlight.configure({ multicolor: false }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-slate max-w-none dark:prose-invert focus:outline-none min-h-[400px] p-4",
      },
    },
  });

  const addImage = useCallback(
    (url: string, alt = "") => {
      if (editor && url) {
        editor.chain().focus().setImage({ src: url, alt }).run();
      }
    },
    [editor]
  );

  const handleImageUpload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "daily-news/articles");

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        addImage(data.url, data.altText || file.name);
      }
    },
    [addImage]
  );

  const handleFilePickerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleImageUpload(file);
    e.target.value = "";
  };

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href;
    const url = window.prompt("URL", prev);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  const toolbarButton = (
    active: boolean,
    onClick: () => void,
    children: React.ReactNode,
    title: string
  ) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "p-1.5 rounded text-sm transition-colors",
        active
          ? "bg-slate-800 text-white"
          : "hover:bg-slate-100 text-slate-700"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-2 border-b bg-slate-50">
        {/* History */}
        {toolbarButton(false, () => editor.chain().focus().undo().run(), <Undo className="h-4 w-4" />, "Undo")}
        {toolbarButton(false, () => editor.chain().focus().redo().run(), <Redo className="h-4 w-4" />, "Redo")}

        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Headings */}
        {([1, 2, 3] as Level[]).map((level) => {
          const icons = { 1: Heading1, 2: Heading2, 3: Heading3 };
          const Icon = icons[level];
          return toolbarButton(
            editor.isActive("heading", { level }),
            () => editor.chain().focus().toggleHeading({ level }).run(),
            <Icon className="h-4 w-4" />,
            `Heading ${level}`
          );
        })}

        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Inline formatting */}
        {toolbarButton(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), <Bold className="h-4 w-4" />, "Bold")}
        {toolbarButton(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), <Italic className="h-4 w-4" />, "Italic")}
        {toolbarButton(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon className="h-4 w-4" />, "Underline")}
        {toolbarButton(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), <Strikethrough className="h-4 w-4" />, "Strikethrough")}
        {toolbarButton(editor.isActive("highlight"), () => editor.chain().focus().toggleHighlight().run(), <Highlighter className="h-4 w-4" />, "Highlight")}
        {toolbarButton(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), <Code className="h-4 w-4" />, "Inline Code")}

        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Alignment */}
        {toolbarButton(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), <AlignLeft className="h-4 w-4" />, "Align Left")}
        {toolbarButton(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), <AlignCenter className="h-4 w-4" />, "Align Center")}
        {toolbarButton(editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), <AlignRight className="h-4 w-4" />, "Align Right")}

        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Lists & blocks */}
        {toolbarButton(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), <List className="h-4 w-4" />, "Bullet List")}
        {toolbarButton(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered className="h-4 w-4" />, "Ordered List")}
        {toolbarButton(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), <Quote className="h-4 w-4" />, "Blockquote")}
        {toolbarButton(false, () => editor.chain().focus().setHorizontalRule().run(), <Minus className="h-4 w-4" />, "Divider")}

        <div className="w-px h-5 bg-slate-300 mx-1" />

        {/* Link + Image */}
        {toolbarButton(editor.isActive("link"), setLink, <Link2 className="h-4 w-4" />, "Add Link")}
        <button
          type="button"
          title="Insert Image from URL"
          onClick={() => {
            const url = window.prompt("Image URL");
            if (url) addImage(url);
          }}
          className="p-1.5 rounded text-sm transition-colors hover:bg-slate-100 text-slate-700"
        >
          <ImageIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          title="Upload Image"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded text-sm transition-colors hover:bg-slate-100 text-slate-700"
        >
          <Upload className="h-4 w-4" />
        </button>

        <div className="w-px h-5 bg-slate-300 mx-1" />

        {toolbarButton(false, () => editor.chain().focus().clearNodes().unsetAllMarks().run(), <RemoveFormatting className="h-4 w-4" />, "Clear Formatting")}

        {/* Character count */}
        <span className="ml-auto text-xs text-muted-foreground px-2">
          {editor.storage.characterCount.words()} words
        </span>
      </div>

      {/* Editor body */}
      <EditorContent editor={editor} className="min-h-[400px]" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFilePickerChange}
      />
    </div>
  );
}
