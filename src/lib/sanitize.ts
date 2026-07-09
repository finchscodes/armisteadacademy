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
      "strong",
      "em",
      "u",
      "s",
      "h1",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "code",
      "pre",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    // Only allow safe URL schemes on links — blocks javascript:, data:, etc.
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow" }),
    },
  }).trim();
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
