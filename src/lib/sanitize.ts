import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes rich text HTML before it's stored. This is the actual security
 * boundary — the editor running in the browser can be bypassed entirely by
 * anyone sending a raw request, so nothing is trusted until it passes
 * through here. Strips scripts, event handlers, iframes, and any tag/attribute
 * not on the allowlist below.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "b",
      "strong",
      "em",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "hr",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "code",
      "pre",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel", "class", "data-mention-id", "data-mention-label", "data-mention-slug", "style"],
      span: ["style"],
    },
    // Only allow safe URL schemes on links — blocks javascript:, data:, etc.
    allowedSchemes: ["http", "https", "mailto"],
    // The only inline style we ever generate is text color (job/hall
    // palette, or a mention's job color) — restrict to hex values so this
    // can't become a vector for arbitrary CSS.
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,8}$/],
      },
    },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
    },
  }).trim();
}

/**
 * Strips any HTML tags but preserves line breaks and whitespace — for the
 * phone/texting board format, which is plain text (each line is its own
 * message, or a /action or /img line) rather than rich HTML like every
 * other board.
 */
export function sanitizePlainText(text: string): string {
  return sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} }).trim();
}

/** Roughly how long the plain text is, ignoring markup — used for length validation. */
export function richTextLength(html: string): number {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).length;
}

/** Strips all markup down to plain text — for previews/excerpts, not for display. */
export function stripToPlainText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Roughly the first N sentences of plain text — used for feed excerpts so a
 * long article or post doesn't take over the homepage. Falls back to a
 * character cap if there's no sentence-ending punctuation to split on (e.g.
 * one long run-on sentence).
 */
export function excerptBySentences(
  html: string,
  maxSentences = 3,
  maxChars = 400
): string {
  const plainText = stripToPlainText(html);
  if (plainText.length === 0) return "";

  const sentences = plainText.match(/[^.!?]+[.!?]+(\s|$)|[^.!?]+$/g) ?? [plainText];
  const taken = sentences.slice(0, maxSentences).join("").trim();
  const truncated = sentences.length > maxSentences;

  if (taken.length <= maxChars) {
    return truncated ? taken + "…" : taken;
  }
  return taken.slice(0, maxChars).trimEnd() + "…";
}
