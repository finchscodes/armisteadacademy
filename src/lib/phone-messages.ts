export type PhoneLine =
  | { type: "message"; text: string }
  | { type: "action"; text: string }
  | { type: "image"; url: string };

const IMAGE_URL_RE = /^https?:\/\/\S+$/i;
const CALL_TARGET_RE = /^\/call (\d+)$/;
const CALL_NAME_RE = /^\/callname (.+)$/;

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

/**
 * A "call" reply is a totally different shape from a text message — one
 * continuous narrative instead of line-separated bubbles. Its first line
 * marks who's being called (either an existing character, by id, or a
 * freeform name when no character record applies), and everything after
 * that is the narrative body.
 */
export type CallTarget = { calleeId: number; calleeName: null; body: string } | { calleeId: null; calleeName: string; body: string };

export function parseCallContent(raw: string): CallTarget | null {
  const lines = raw.split("\n");
  const first = (lines[0] ?? "").trim();
  const body = lines.slice(1).join("\n").trim();

  const byId = first.match(CALL_TARGET_RE);
  if (byId) return { calleeId: Number(byId[1]), calleeName: null, body };

  const byName = first.match(CALL_NAME_RE);
  if (byName) return { calleeId: null, calleeName: byName[1].trim(), body };

  return null;
}

export function formatCallContent(target: { calleeId: number | null; calleeName: string }, body: string): string {
  const marker = target.calleeId ? `/call ${target.calleeId}` : `/callname ${target.calleeName.trim()}`;
  return `${marker}\n${body.trim()}`;
}
