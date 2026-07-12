export type PhoneLine =
  | { type: "message"; text: string }
  | { type: "action"; text: string }
  | { type: "image"; url: string };

const IMAGE_URL_RE = /^https?:\/\/\S+$/i;

/**
 * Phone/texting boards store plain text, one line per message — this is the
 * same string that goes in `posts.content`, just interpreted differently at
 * render time. A line starting with "/action " is out-of-band context (e.g.
 * "message delivered"), shown without a bubble. A line starting with
 * "/img " is a photo the sender attached. Everything else is an ordinary
 * message bubble.
 */
export function parsePhoneContent(raw: string): PhoneLine[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line): PhoneLine => {
      if (line.startsWith("/action ")) {
        return { type: "action", text: line.slice("/action ".length).trim() };
      }
      if (line.startsWith("/img ")) {
        const url = line.slice("/img ".length).trim();
        if (IMAGE_URL_RE.test(url)) return { type: "image", url };
        // Malformed/unsafe URL — fall back to showing it as a plain message
        // rather than dropping it silently.
        return { type: "message", text: line };
      }
      return { type: "message", text: line };
    });
}

export function formatActionLine(text: string): string {
  return `/action ${text.trim()}`;
}

export function formatImageLine(url: string): string {
  return `/img ${url.trim()}`;
}
