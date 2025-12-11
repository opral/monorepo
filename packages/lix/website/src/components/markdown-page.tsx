import "./markdown-page.style.css";
import { useEffect } from "react";

/**
 * Renders pre-parsed markdown HTML inside the docs layout.
 *
 * @example
 * <MarkdownPage html="<h1>Hi from Lix</h1>" />
 */
export function MarkdownPage({ html }: { html: string }) {
  useEffect(() => {
    import("./markdown-page.interactive.js");
  }, [html]);

  return (
    <article
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
