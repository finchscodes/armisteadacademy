"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={`text-xs px-2 py-1 rounded border transition-colors ${
        active
          ? "bg-brass-500/20 border-brass-500 text-brass-400"
          : "border-ink-600 text-parchment-100/80 hover:border-ink-400"
      }`}
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  name,
  initialValue,
  placeholder,
}: {
  name: string;
  initialValue?: string;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something..." }),
    ],
    content: initialValue ?? "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "rich-text-content min-h-[10rem] max-h-[28rem] overflow-y-auto rounded-b-md border border-t-0 border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none",
      },
    },
  });

  // Keep a hidden input in sync so this works inside a normal <form> submit.
  useEffect(() => {
    if (!editor) return;
    const input = document.getElementById(`richtext-${name}`) as HTMLInputElement | null;
    if (input) input.value = editor.getHTML();
  }, [editor?.state, editor, name]);

  if (!editor) {
    return (
      <div className="min-h-[10rem] rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-ink-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div>
      <input type="hidden" id={`richtext-${name}`} name={name} defaultValue={initialValue ?? ""} />
      <div className="flex flex-wrap gap-1 border border-ink-600 border-b-0 rounded-t-md bg-ink-800/60 px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <u>U</u>
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <s>S</s>
        </ToolbarButton>
        <span className="w-px bg-ink-600 mx-1" />
        <ToolbarButton
          label="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Subheading"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <span className="w-px bg-ink-600 mx-1" />
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          &bull; List
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          &ldquo;&rdquo;
        </ToolbarButton>
        <span className="w-px bg-ink-600 mx-1" />
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => {
            const url = window.prompt("Link URL");
            if (url) editor.chain().focus().setLink({ href: url }).run();
            else editor.chain().focus().unsetLink().run();
          }}
        >
          Link
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
