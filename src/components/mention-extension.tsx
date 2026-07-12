import Mention from "@tiptap/extension-mention";
import { mergeAttributes } from "@tiptap/core";
import { searchCharactersForMentionAction, type MentionCandidate } from "@/actions/mini-profile";

/**
 * Renders as a colored link to the character's profile — the color comes
 * from their job at the time the mention was inserted (baked into the
 * HTML, not live — same tradeoff as everywhere else names get colored).
 */
export const CharacterMention = Mention.extend({
  name: "mention",

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-mention-id"),
        renderHTML: (attrs) => ({ "data-mention-id": attrs.id }),
      },
      label: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-mention-label") ?? el.textContent,
        renderHTML: (attrs) => ({ "data-mention-label": attrs.label }),
      },
      slug: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-mention-slug"),
        renderHTML: (attrs) => ({ "data-mention-slug": attrs.slug }),
      },
      color: {
        default: null,
        parseHTML: (el) => (el as HTMLElement).style.color || null,
        renderHTML: (attrs) => (attrs.color ? { style: `color:${attrs.color}` } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "a.mention" }];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      "a",
      mergeAttributes({ href: `/c/${node.attrs.slug}`, class: "mention" }, HTMLAttributes),
      node.attrs.label,
    ];
  },

  renderText({ node }) {
    return node.attrs.label;
  },
}).configure({
  HTMLAttributes: { class: "mention" },
  suggestion: {
    char: "@",
    items: async ({ query }: { query: string }): Promise<MentionCandidate[]> => {
      if (!query) return [];
      return searchCharactersForMentionAction(query);
    },
    command: ({ editor, range, props }) => {
      const item = props as unknown as MentionCandidate;
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: "mention",
            attrs: {
              id: item.id,
              label: `${item.firstName} ${item.lastName}`,
              slug: item.slug,
              color: item.color,
            },
          },
          { type: "text", text: " " },
        ])
        .run();
    },
    render: () => {
      let popup: HTMLDivElement | null = null;
      let items: MentionCandidate[] = [];
      let selectedIndex = 0;
      let command: ((item: MentionCandidate) => void) | null = null;

      function paint() {
        if (!popup) return;
        popup.innerHTML = "";
        if (items.length === 0) {
          const empty = document.createElement("div");
          empty.textContent = "No matches";
          empty.className = "px-3 py-1.5 text-xs text-ink-400";
          popup.appendChild(empty);
          return;
        }
        items.forEach((item, i) => {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.textContent = `${item.firstName} ${item.lastName}`;
          btn.className = `w-full flex items-center text-left px-3 py-1 text-sm transition-colors ${
            i === selectedIndex ? "bg-ink-700" : "hover:bg-ink-700"
          }`;
          btn.style.color = item.color ?? "#f6efdc";
          btn.addEventListener("mousedown", (e) => {
            e.preventDefault();
            command?.(item);
          });
          popup!.appendChild(btn);
        });
      }

      function position(rect: DOMRect | null) {
        if (!rect || !popup) return;
        popup.style.top = `${rect.bottom + 4}px`;
        popup.style.left = `${rect.left}px`;
      }

      return {
        onStart: (props) => {
          items = props.items as MentionCandidate[];
          command = props.command as unknown as (item: MentionCandidate) => void;
          selectedIndex = 0;
          popup = document.createElement("div");
          popup.className =
            "fixed z-[9999] bg-ink-800 border border-ink-600 rounded-md shadow-xl shadow-black/40 max-h-56 overflow-y-auto min-w-[160px] py-1";
          document.body.appendChild(popup);
          position(props.clientRect?.() ?? null);
          paint();
        },
        onUpdate: (props) => {
          items = props.items as MentionCandidate[];
          command = props.command as unknown as (item: MentionCandidate) => void;
          selectedIndex = 0;
          position(props.clientRect?.() ?? null);
          paint();
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            popup?.remove();
            popup = null;
            return true;
          }
          if (props.event.key === "ArrowDown") {
            if (items.length > 0) selectedIndex = (selectedIndex + 1) % items.length;
            paint();
            return true;
          }
          if (props.event.key === "ArrowUp") {
            if (items.length > 0) selectedIndex = (selectedIndex - 1 + items.length) % items.length;
            paint();
            return true;
          }
          if (props.event.key === "Enter") {
            if (items[selectedIndex]) command?.(items[selectedIndex]);
            return true;
          }
          return false;
        },
        onExit: () => {
          popup?.remove();
          popup = null;
        },
      };
    },
  },
});
