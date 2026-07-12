"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Bold from "@tiptap/extension-bold";
import { Mark, mergeAttributes } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useEffect, useRef, useState } from "react";
import { CharacterMention } from "@/components/mention-extension";
import { ACTIVE_JOB_VALUES, JOB_META } from "@/lib/roles";
import { HALL_VALUES, HALL_META } from "@/lib/halls";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    strongCallout: {
      toggleStrongCallout: () => ReturnType;
    };
  }
}

// A second, visually distinct "strong" emphasis — separate from Bold. Bold
// renders as <b> (plain bold); this renders as <strong> and gets the
// small-caps callout treatment in CSS (see .rich-text-content strong).
const StrongCallout = Mark.create({
  name: "strongCallout",
  parseHTML() {
    return [{ tag: "strong" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["strong", mergeAttributes(HTMLAttributes), 0];
  },
  addCommands() {
    return {
      toggleStrongCallout:
        () =>
        ({ commands }) =>
          commands.toggleMark(this.name),
    };
  },
});

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
      data-tooltip={label}
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bold: false,
      }),
      Bold.extend({
        parseHTML() {
          return [{ tag: "b" }];
        },
        renderHTML({ HTMLAttributes }) {
          return ["b", mergeAttributes(HTMLAttributes), 0];
        },
      }),
      StrongCallout,
      Underline,
      TextStyle,
      Color,
      CharacterMention,
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something..." }),
    ],
    content: initialValue ?? "",
    immediatelyRender: false,
    // This is the actual sync into the plain <input> the form submits — fires
    // on every content change. A useEffect keyed on editor.state does NOT
    // reliably fire here (that was the bug: the hidden input kept its empty
    // initial value, so the server always saw an empty post).
    onUpdate: ({ editor }) => {
      if (inputRef.current) inputRef.current.value = editor.getHTML();
    },
    editorProps: {
      attributes: {
        class:
          "rich-text-content min-h-[10rem] max-h-[28rem] overflow-y-auto rounded-b-md border border-t-0 border-ink-600 bg-ink-800 px-3 py-2 text-sm focus:outline-none",
      },
    },
  });

  // Cover the case where content was set programmatically (e.g. initial load)
  // without going through onUpdate.
  useEffect(() => {
    if (editor && inputRef.current) {
      inputRef.current.value = editor.getHTML();
    }
  }, [editor]);

  if (!editor) {
    return (
      <div className="min-h-[10rem] rounded-md border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-ink-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="hidden"
        id={`richtext-${name}`}
        name={name}
        defaultValue={initialValue ?? ""}
      />
      <div className="flex flex-wrap gap-1 border border-ink-600 border-b-0 rounded-t-md bg-ink-800/60 px-2 py-1.5">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Strong (small-caps callout)"
          active={editor.isActive("strongCallout")}
          onClick={() => editor.chain().focus().toggleStrongCallout().run()}
        >
          <span className="callout" style={{ fontSize: "inherit" }}>
            St
          </span>
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
          label="Title"
          active={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        >
          H1
        </ToolbarButton>
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
        <ToolbarButton
          label="Small heading"
          active={editor.isActive("heading", { level: 4 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        >
          H4
        </ToolbarButton>
        <ToolbarButton
          label="Italic label"
          active={editor.isActive("heading", { level: 5 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        >
          H5
        </ToolbarButton>
        <ToolbarButton
          label="Fine print heading"
          active={editor.isActive("heading", { level: 6 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        >
          H6
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
        <ToolbarButton
          label="Divider"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          &mdash;
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
        <span className="w-px bg-ink-600 mx-1" />
        <div className="relative">
          <ToolbarButton
            label="Text color"
            active={editor.isActive("textStyle") && Boolean(editor.getAttributes("textStyle").color)}
            onClick={() => setShowColorPicker((v) => !v)}
          >
            <span className="inline-flex items-center gap-1">
              <span
                className="w-3 h-3 rounded-full border border-ink-500 inline-block"
                style={{ backgroundColor: editor.getAttributes("textStyle").color || "#f6efdc" }}
              />
              Color
            </span>
          </ToolbarButton>
          {showColorPicker && (
            <div className="absolute left-0 top-full mt-1 z-20 w-56 bg-ink-900 border border-ink-600 rounded-md shadow-xl p-2">
              <p className="text-[10px] uppercase tracking-wider text-ink-400 px-1 mb-1">Jobs</p>
              <div className="grid grid-cols-6 gap-1 mb-2">
                {ACTIVE_JOB_VALUES.filter((j) => j !== "none" && JOB_META[j].color).map((j) => (
                  <button
                    key={j}
                    type="button"
                    data-tooltip={JOB_META[j].label}
                    onClick={() => {
                      editor.chain().focus().setColor(JOB_META[j].color as string).run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border border-ink-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: JOB_META[j].color ?? undefined }}
                  />
                ))}
              </div>
              <p className="text-[10px] uppercase tracking-wider text-ink-400 px-1 mb-1">Halls</p>
              <div className="grid grid-cols-6 gap-1 mb-2">
                {HALL_VALUES.map((h) => (
                  <button
                    key={h}
                    type="button"
                    data-tooltip={HALL_META[h].label}
                    onClick={() => {
                      editor.chain().focus().setColor(HALL_META[h].color).run();
                      setShowColorPicker(false);
                    }}
                    className="w-6 h-6 rounded-full border border-ink-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: HALL_META[h].color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetColor().run();
                  setShowColorPicker(false);
                }}
                className="w-full text-xs text-ink-400 hover:text-parchment-100 transition-colors text-left px-1 py-1"
              >
                Clear color
              </button>
            </div>
          )}
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
