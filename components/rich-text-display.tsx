/**
 * Renders stored rich text. Safe because everything passed to this was
 * already run through sanitizeRichText() (see src/lib/sanitize.ts) before it
 * was written to the database — this component trusts that, it doesn't
 * re-sanitize on render.
 */
export function RichTextDisplay({ html, className = "" }: { html: string; className?: string }) {
  return (
    <div
      className={`rich-text-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
