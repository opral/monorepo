import { useEffect } from "react";

/**
 * Renders pre-parsed markdown HTML inside the docs layout.
 *
 * @example
 * <MarkdownPage html="<h1>Hi from Lix</h1>" />
 */
export function MarkdownPage({
  html,
  imports,
}: {
  html: string;
  imports?: string[];
}) {
  useEffect(() => {
    import("./markdown-page.interactive.js");
  }, [html]);

  useEffect(() => {
    if (!imports || imports.length === 0) return;

    for (const url of imports) {
      if (!url) continue;
      const existing = document.querySelector(
        `script[data-mdwc-import="${url}"]`
      );
      if (existing) continue;

      const script = document.createElement("script");
      script.type = "module";
      script.src = url;
      script.setAttribute("data-mdwc-import", url);
      document.head.appendChild(script);
    }
  }, [imports]);

  return (
    <article
      className="markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
