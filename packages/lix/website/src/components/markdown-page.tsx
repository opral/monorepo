import "./markdown-page.style.css";

/**
 * Renders pre-parsed markdown HTML inside the docs layout.
 *
 * @example
 * <MarkdownPage html="<h1>Hi from Lix</h1>" />
 */
export function MarkdownPage({ html }: { html: string }) {
  return (
    <article
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
